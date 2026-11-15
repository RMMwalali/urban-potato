"use server";
import { DateTime } from "luxon";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { normalizePhone } from "@/lib/format";
import { staffIsFree } from "@/lib/availability";
import { notifyAppointment } from "@/lib/messaging";
import type { AppointmentStatus, Business, BookingSource } from "@prisma/client";

export type ApptState = { error?: string } | undefined;

/** Find a client by phone within the business, or create them. */
export async function upsertClient(business: Business, name: string, phoneRaw: string, email?: string | null) {
  const phone = normalizePhone(phoneRaw, business.countryCode);
  if (phone.length < 9) throw new Error("Enter a valid phone number");
  const existing = await db.client.findUnique({ where: { businessId_phone: { businessId: business.id, phone } } });
  if (existing) return existing;
  return db.client.create({ data: { businessId: business.id, name: name.trim(), phone, email: email || null } });
}

const NewAppt = z.object({
  clientId: z.string().optional(),
  clientName: z.string().trim().optional(),
  clientPhone: z.string().trim().optional(),
  serviceId: z.string().min(1, "Choose a service"),
  staffId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time"),
  source: z.string().default("WALK_IN"),
  notes: z.string().optional(),
  sendConfirmation: z.string().optional(),
});

export async function createAppointment(_: ApptState, fd: FormData): Promise<ApptState> {
  const user = await requireUser();
  const b = user.business;
  const p = NewAppt.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;

  const service = await db.service.findFirst({ where: { id: d.serviceId, businessId: b.id } });
  if (!service) return { error: "Service not found" };

  let clientId = d.clientId;
  if (clientId) {
    if (!(await db.client.findFirst({ where: { id: clientId, businessId: b.id } }))) return { error: "Client not found" };
  } else {
    if (!d.clientName || !d.clientPhone) return { error: "Enter the client's name and phone number" };
    try {
      clientId = (await upsertClient(b, d.clientName, d.clientPhone)).id;
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  const start = DateTime.fromISO(`${d.date}T${d.time}`, { zone: b.timezone });
  if (!start.isValid) return { error: "Invalid date/time" };
  const end = start.plus({ minutes: service.durationMin });

  const staffId = d.staffId || null;
  if (staffId) {
    const st = await db.user.findFirst({ where: { id: staffId, businessId: b.id } });
    if (!st) return { error: "Staff member not found" };
    if (!(await staffIsFree(b.id, staffId, start.toJSDate(), end.toJSDate())))
      return { error: `${st.name} already has an appointment at that time` };
  }

  const appt = await db.appointment.create({
    data: {
      businessId: b.id,
      clientId: clientId!,
      serviceId: service.id,
      staffId,
      startAt: start.toJSDate(),
      endAt: end.toJSDate(),
      price: service.price,
      source: d.source as BookingSource,
      notes: d.notes || null,
    },
  });
  if (d.sendConfirmation) await notifyAppointment("CONFIRMATION", appt.id);
  revalidatePath("/app");
  redirect(`/app/calendar?date=${d.date}`);
}

async function ownAppointment(id: string) {
  const user = await requireUser();
  const a = await db.appointment.findFirst({ where: { id, businessId: user.businessId } });
  if (!a) throw new Error("Appointment not found");
  return { user, a };
}

export async function setStatus(id: string, status: AppointmentStatus) {
  const { a } = await ownAppointment(id);
  await db.appointment.update({ where: { id: a.id }, data: { status } });
  if (status === "CANCELLED") await notifyAppointment("CANCELLATION", a.id);
  revalidatePath(`/app/appointments/${id}`);
  revalidatePath("/app/calendar");
}

export async function sendReminderNow(id: string) {
  const { a } = await ownAppointment(id);
  await notifyAppointment("REMINDER", a.id);
  revalidatePath(`/app/appointments/${id}`);
}

export async function reschedule(_: ApptState, fd: FormData): Promise<ApptState> {
  const id = String(fd.get("id"));
  const { user, a } = await ownAppointment(id);
  const b = user.business;
  const date = String(fd.get("date"));
  const time = String(fd.get("time"));
  const staffId = String(fd.get("staffId") || "") || null;
  const start = DateTime.fromISO(`${date}T${time}`, { zone: b.timezone });
  if (!start.isValid) return { error: "Invalid date/time" };
  const dur = (a.endAt.getTime() - a.startAt.getTime()) / 60000;
  const end = start.plus({ minutes: dur });
  if (staffId && !(await staffIsFree(b.id, staffId, start.toJSDate(), end.toJSDate(), a.id)))
    return { error: "That staff member is busy at that time" };
  await db.appointment.update({
    where: { id: a.id },
    data: { startAt: start.toJSDate(), endAt: end.toJSDate(), staffId, reminderSentAt: null },
  });
  revalidatePath(`/app/appointments/${id}`);
  return { error: undefined };
}
