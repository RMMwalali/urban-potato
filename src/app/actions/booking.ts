"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSlots } from "@/lib/availability";
import { notifyAppointment } from "@/lib/messaging";
import { fmtDateTime } from "@/lib/format";
import { upsertClient } from "./appointments";
import { accessState } from "@/lib/platform";
import { bookingSlip, type Slip } from "@/lib/slip";

export type BookState = { error?: string; done?: { when: string; service: string; staff: string | null; manage: string; deposit: number; slip: Slip | null } } | undefined;

const Input = z.object({
  slug: z.string(),
  serviceId: z.string().min(1, "Choose a service"),
  styleId: z.string().optional(),
  staffId: z.string().optional(),
  start: z.string().min(1, "Choose a time"),
  name: z.string().trim().min(2, "Enter your name"),
  phone: z.string().trim().min(9, "Enter your phone number"),
  notes: z.string().trim().max(500).optional(),
  depositRef: z.string().trim().optional(),
  website: z.string().optional(), // honeypot
});

export async function publicBook(_: BookState, fd: FormData): Promise<BookState> {
  const p = Input.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  if (d.website) return { error: "Something went wrong" };

  const business = await db.business.findUnique({ where: { slug: d.slug } });
  if (!business || !business.bookingEnabled || !accessState(business).ok) return { error: "Online booking is not available" };
  const service = await db.service.findFirst({ where: { id: d.serviceId, businessId: business.id, active: true, onlineBooking: true } });
  if (!service) return { error: "Service not available" };
  const style = d.styleId ? await db.serviceStyle.findFirst({ where: { id: d.styleId, serviceId: service.id, active: true } }) : null;
  if (d.styleId && !style) return { error: "That style is no longer available. Please choose another." };
  const price = style?.price != null ? Number(style.price) : Number(service.price);
  const durationMin = style?.durationMin ?? service.durationMin;
  const label = `${service.name}${style ? ` (${style.name})` : ""}`;

  const deposit = business.depositPercent > 0 && business.mpesaNumber ? Math.round((price * business.depositPercent) / 100) : 0;
  const depositRef = d.depositRef?.toUpperCase().replace(/\s/g, "");
  if (deposit > 0 && !/^[A-Z0-9]{8,12}$/.test(depositRef ?? "")) return { error: "Enter the M-Pesa confirmation code for your deposit (e.g. SKF3H7XQ2P)" };

  // M-Pesa deposit: match against Safaricom-confirmed payments when available.
  let depositTx: { id: string; source: string } | null = null;
  if (deposit > 0 && depositRef) {
    const tx = await db.mpesaTransaction.findUnique({ where: { businessId_code: { businessId: business.id, code: depositRef } } });
    if (tx?.claimedAt) return { error: "That M-Pesa code has already been used." };
    if (tx && Number(tx.amount) + 0.5 < deposit) return { error: `That payment was ${business.currency} ${Number(tx.amount).toLocaleString()}, but the deposit is ${business.currency} ${deposit.toLocaleString()}.` };
    if (!tx && business.requireVerifiedMpesa) return { error: "We haven't received that payment yet. Wait a few seconds after paying, then try again." };
    if (tx) depositTx = { id: tx.id, source: tx.source };
  }

  const start = new Date(d.start);
  if (isNaN(start.getTime())) return { error: "Choose a time" };
  const isoDate = new Intl.DateTimeFormat("en-CA", { timeZone: business.timezone }).format(start);
  // Re-check availability on the server: the slot may have been taken since the page loaded.
  const slots = await getSlots({ business, serviceId: service.id, isoDate, staffId: d.staffId || null, durationMin });
  const slot = slots.find((s) => s.start === start.toISOString());
  if (!slot) return { error: "Sorry, that time was just taken. Please pick another." };

  let client;
  try {
    client = await upsertClient(business, d.name, d.phone);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const staffId = d.staffId || slot.staffIds[0];
  const appt = await db.appointment.create({
    data: {
      businessId: business.id,
      clientId: client.id,
      serviceId: service.id,
      staffId,
      startAt: start,
      endAt: new Date(start.getTime() + durationMin * 60000),
      price,
      styleId: style?.id ?? null,
      styleName: style?.name ?? null,
      source: "ONLINE",
      notes: d.notes || null,
      depositAmount: deposit,
      depositRef: deposit > 0 ? depositRef : null,
      depositVerified: depositTx?.source === "C2B",
    },
    include: { staff: true },
  });
  if (deposit > 0 && depositRef) {
    try {
      if (depositTx) {
        await db.mpesaTransaction.update({ where: { id: depositTx.id }, data: { claimedAt: new Date(), usedFor: "DEPOSIT", appointmentId: appt.id } });
      } else {
        // Unverified for now; if Safaricom's confirmation arrives later it marks the deposit verified.
        await db.mpesaTransaction.create({ data: { businessId: business.id, code: depositRef, amount: deposit, payerName: d.name, source: "MANUAL", claimedAt: new Date(), usedFor: "DEPOSIT", appointmentId: appt.id } });
      }
    } catch {
      await db.appointment.delete({ where: { id: appt.id } });
      return { error: "That M-Pesa code has already been used." };
    }
  }
  await notifyAppointment("CONFIRMATION", appt.id);
  return { done: { when: fmtDateTime(start, business.timezone), service: label, staff: appt.staff?.name ?? null, manage: `/b/${appt.manageToken}`, deposit, slip: await bookingSlip(appt.id) } };
}

/* ---------- Client self-service (link in confirmation/reminder) ---------- */

async function byToken(token: string) {
  return db.appointment.findUnique({ where: { manageToken: token }, include: { business: true, service: true } });
}

export async function clientCancel(token: string): Promise<BookState> {
  const a = await byToken(token);
  if (!a || !["BOOKED", "CONFIRMED"].includes(a.status)) return { error: "This appointment can no longer be changed." };
  if (a.startAt.getTime() - Date.now() < a.business.cancelPolicyHours * 3600_000)
    return { error: `Online cancellation closes ${a.business.cancelPolicyHours}h before your appointment. Please call the salon.` };
  await db.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED", cancelledBy: "CLIENT" } });
  await notifyAppointment("CANCELLATION", a.id);
  return undefined;
}

export async function clientReschedule(_: BookState, fd: FormData): Promise<BookState> {
  const a = await byToken(String(fd.get("token")));
  if (!a || !["BOOKED", "CONFIRMED"].includes(a.status)) return { error: "This appointment can no longer be changed." };
  if (a.startAt.getTime() - Date.now() < a.business.cancelPolicyHours * 3600_000)
    return { error: `Online changes close ${a.business.cancelPolicyHours}h before your appointment. Please call the salon.` };
  const start = new Date(String(fd.get("start")));
  if (isNaN(start.getTime())) return { error: "Choose a new time" };
  const isoDate = new Intl.DateTimeFormat("en-CA", { timeZone: a.business.timezone }).format(start);
  const dur = Math.round((a.endAt.getTime() - a.startAt.getTime()) / 60000); // keeps a style's length
  const slots = await getSlots({ business: a.business, serviceId: a.serviceId, isoDate, staffId: a.staffId, excludeAppointmentId: a.id, durationMin: dur });
  const slot = slots.find((s) => s.start === start.toISOString());
  if (!slot) return { error: "Sorry, that time isn't available any more." };
  const updated = await db.appointment.update({
    where: { id: a.id },
    data: { startAt: start, endAt: new Date(start.getTime() + dur * 60000), staffId: a.staffId ?? slot.staffIds[0], reminderSentAt: null },
    include: { staff: true },
  });
  await notifyAppointment("CONFIRMATION", a.id);
  return { done: { when: fmtDateTime(start, a.business.timezone), service: a.service.name, staff: updated.staff?.name ?? null, manage: `/b/${a.manageToken}`, deposit: 0, slip: null } };
}
