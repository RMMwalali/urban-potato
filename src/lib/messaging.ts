import "server-only";
import { db } from "./db";
import { fmtDateTime } from "./format";
import type { Appointment, Business, Channel, Client, Service, User } from "@prisma/client";

/**
 * Pluggable messaging. Set MESSAGE_PROVIDER to:
 *  - "console"        : log only (default, for development)
 *  - "africastalking" : SMS via Africa's Talking
 *  - "whatsapp"       : WhatsApp via Meta Cloud API (needs approved templates for
 *                       business-initiated messages outside the 24h window; see README)
 * Every attempt is recorded in MessageLog so salons can see what was sent.
 */
type SendResult = { ok: true; ref?: string } | { ok: false; error: string };

async function sendAfricasTalking(to: string, body: string): Promise<SendResult> {
  const params = new URLSearchParams({ username: process.env.AT_USERNAME!, to: `+${to}`, message: body });
  if (process.env.AT_SENDER_ID) params.set("from", process.env.AT_SENDER_ID);
  const host = process.env.AT_USERNAME === "sandbox" ? "api.sandbox.africastalking.com" : "api.africastalking.com";
  const res = await fetch(`https://${host}/version1/messaging`, {
    method: "POST",
    headers: { apiKey: process.env.AT_API_KEY!, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const json = await res.json().catch(() => null);
  const r = json?.SMSMessageData?.Recipients?.[0];
  if (!res.ok || !r || r.statusCode >= 400) return { ok: false, error: r?.status ?? `HTTP ${res.status}` };
  return { ok: true, ref: r.messageId };
}

async function sendWhatsApp(to: string, body: string): Promise<SendResult> {
  const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: json?.error?.message ?? `HTTP ${res.status}` };
  return { ok: true, ref: json?.messages?.[0]?.id };
}

async function deliver(to: string, body: string): Promise<SendResult> {
  try {
    switch (process.env.MESSAGE_PROVIDER) {
      case "africastalking":
        return await sendAfricasTalking(to, body);
      case "whatsapp":
        return await sendWhatsApp(to, body);
      default:
        console.log(`[message → +${to}] ${body}`);
        return { ok: true, ref: "console" };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function sendMessage(opts: {
  business: Business;
  to: string;
  body: string;
  kind: string;
  clientId?: string;
  appointmentId?: string;
  channel?: Channel;
}) {
  const channel = opts.channel ?? opts.business.messageChannel;
  const r = await deliver(opts.to, opts.body);
  return db.messageLog.create({
    data: {
      businessId: opts.business.id,
      clientId: opts.clientId,
      appointmentId: opts.appointmentId,
      channel,
      to: opts.to,
      kind: opts.kind,
      body: opts.body,
      status: r.ok ? "SENT" : "FAILED",
      providerRef: r.ok ? r.ref : undefined,
      error: r.ok ? undefined : r.error,
    },
  });
}

type FullAppt = Appointment & { client: Client; service: Service; staff: User | null };

export function appointmentText(kind: "CONFIRMATION" | "REMINDER" | "CANCELLATION", a: FullAppt, b: Business) {
  const when = fmtDateTime(a.startAt, b.timezone);
  const first = a.client.name.split(" ")[0];
  const withWho = a.staff ? ` with ${a.staff.name.split(" ")[0]}` : "";
  switch (kind) {
    case "CONFIRMATION":
      return `Hi ${first}, your ${a.service.name}${withWho} at ${b.name} is booked for ${when}. ${b.phone ? `Call ${b.phone} to change.` : ""}`.trim();
    case "REMINDER":
      return `Reminder: ${first}, see you at ${b.name} on ${when} for ${a.service.name}${withWho}.${b.address ? ` ${b.address}.` : ""}`;
    case "CANCELLATION":
      return `Hi ${first}, your ${a.service.name} at ${b.name} on ${when} has been cancelled. ${b.phone ? `Call ${b.phone} to rebook.` : ""}`.trim();
  }
}

export async function notifyAppointment(kind: "CONFIRMATION" | "REMINDER" | "CANCELLATION", appointmentId: string) {
  const a = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { client: true, service: true, staff: true, business: true },
  });
  if (!a) return;
  await sendMessage({
    business: a.business,
    to: a.client.phone,
    body: appointmentText(kind, a, a.business),
    kind,
    clientId: a.clientId,
    appointmentId: a.id,
  });
  if (kind === "REMINDER") await db.appointment.update({ where: { id: a.id }, data: { reminderSentAt: new Date() } });
}

/** Send due reminders for all businesses. Called by /api/cron/reminders. */
export async function sendDueReminders() {
  const businesses = await db.business.findMany({ select: { id: true, reminderHours: true } });
  let sent = 0;
  for (const b of businesses) {
    const due = await db.appointment.findMany({
      where: {
        businessId: b.id,
        status: { in: ["BOOKED", "CONFIRMED"] },
        reminderSentAt: null,
        startAt: { gt: new Date(), lte: new Date(Date.now() + b.reminderHours * 3600_000) },
      },
      select: { id: true },
    });
    for (const a of due) {
      await notifyAppointment("REMINDER", a.id);
      sent++;
    }
  }
  return sent;
}
