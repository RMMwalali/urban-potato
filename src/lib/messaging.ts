import "server-only";
import { appUrl } from "@/lib/url";
import { db } from "./db";
import { fmtDateTime } from "./format";
import { accessState, getCredential } from "./platform";
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
  const [username, apiKey, sender] = await Promise.all([getCredential("AT_USERNAME"), getCredential("AT_API_KEY"), getCredential("AT_SENDER_ID")]);
  if (!username || !apiKey) return { ok: false, error: "Africa's Talking credentials not configured" };
  const params = new URLSearchParams({ username, to: `+${to}`, message: body });
  if (sender) params.set("from", sender);
  const host = username === "sandbox" ? "api.sandbox.africastalking.com" : "api.africastalking.com";
  const res = await fetch(`https://${host}/version1/messaging`, {
    method: "POST",
    headers: { apiKey, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const json = await res.json().catch(() => null);
  const r = json?.SMSMessageData?.Recipients?.[0];
  if (!res.ok || !r || r.statusCode >= 400) return { ok: false, error: r?.status ?? `HTTP ${res.status}` };
  return { ok: true, ref: r.messageId };
}

async function sendWhatsApp(to: string, body: string): Promise<SendResult> {
  const [token, phoneId] = await Promise.all([getCredential("WHATSAPP_TOKEN"), getCredential("WHATSAPP_PHONE_NUMBER_ID")]);
  if (!token || !phoneId) return { ok: false, error: "WhatsApp credentials not configured" };
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: json?.error?.message ?? `HTTP ${res.status}` };
  return { ok: true, ref: json?.messages?.[0]?.id };
}

async function deliver(to: string, body: string): Promise<SendResult> {
  try {
    switch (await getCredential("MESSAGE_PROVIDER")) {
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
  // The showcase salon (used to film reels) never contacts anyone; its messages are only logged.
  const r: SendResult = opts.business.isShowcase ? { ok: true, ref: "showcase" } : await deliver(opts.to, opts.body);
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
  const manage = `${appUrl()}/b/${a.manageToken}`;
  switch (kind) {
    case "CONFIRMATION":
      return `Hi ${first}, your ${a.service.name}${a.styleName ? ` (${a.styleName})` : ""}${withWho} at ${b.name} is booked for ${when}. Change or cancel: ${manage}`;
    case "REMINDER":
      return `Reminder: ${first}, see you at ${b.name} on ${when} for ${a.service.name}${a.styleName ? ` (${a.styleName})` : ""}${withWho}.${b.address ? ` ${b.address}.` : ""} Can't make it? ${manage}`;
    case "CANCELLATION":
      return `Hi ${first}, your ${a.service.name}${a.styleName ? ` (${a.styleName})` : ""} at ${b.name} on ${when} has been cancelled. ${b.phone ? `Call ${b.phone} to rebook.` : ""}`.trim();
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
  const businesses = (await db.business.findMany({ where: { isShowcase: false }, select: { id: true, reminderHours: true, status: true, trialEndsAt: true, paidUntil: true } })).filter((b) => accessState(b).ok);
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
