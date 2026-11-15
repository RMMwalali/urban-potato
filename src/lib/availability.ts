import { DateTime } from "luxon";
import { db } from "./db";
import type { Business } from "@prisma/client";

export type Slot = { start: string; staffIds: string[] }; // start is ISO (UTC)

const BLOCKING = ["BOOKED", "CONFIRMED", "ARRIVED", "COMPLETED"] as const;

/**
 * Free start times for a service on a given local date.
 * If staffId is given, only that staff member is considered; otherwise any bookable staff.
 */
export async function getSlots(opts: {
  business: Business;
  serviceId: string;
  isoDate: string;
  staffId?: string | null;
  excludeAppointmentId?: string;
  durationMin?: number; // a style (or an existing booking) can take longer or shorter than the service
}): Promise<Slot[]> {
  const { business, isoDate } = opts;
  const tz = business.timezone;
  const day = DateTime.fromISO(isoDate, { zone: tz }).startOf("day");
  if (!day.isValid || !business.openDays.includes(day.weekday)) return [];

  const service = await db.service.findFirst({ where: { id: opts.serviceId, businessId: business.id, active: true } });
  if (!service) return [];
  const dur = opts.durationMin && opts.durationMin > 0 ? opts.durationMin : service.durationMin;

  const staff = await db.user.findMany({
    where: {
      businessId: business.id,
      active: true,
      bookable: true,
      ...(opts.staffId ? { id: opts.staffId } : {}),
      OR: [{ services: { none: {} } }, { services: { some: { id: service.id } } }],
    },
    select: { id: true },
  });
  if (!staff.length) return [];

  const [oh, om] = business.openTime.split(":").map(Number);
  const [ch, cm] = business.closeTime.split(":").map(Number);
  const open = day.set({ hour: oh, minute: om });
  const close = day.set({ hour: ch, minute: cm });

  const appts = await db.appointment.findMany({
    where: {
      businessId: business.id,
      staffId: { in: staff.map((s) => s.id) },
      status: { in: [...BLOCKING] },
      startAt: { lt: close.toJSDate() },
      endAt: { gt: open.toJSDate() },
      ...(opts.excludeAppointmentId ? { id: { not: opts.excludeAppointmentId } } : {}),
    },
    select: { staffId: true, startAt: true, endAt: true },
  });

  const now = DateTime.now();
  const slots: Slot[] = [];
  for (let t = open; t.plus({ minutes: dur }) <= close; t = t.plus({ minutes: business.slotMinutes })) {
    if (t < now) continue;
    const s = t.toJSDate();
    // Buffer (clean-up time) is kept free after every appointment, including the new one.
    const buf = business.bufferMinutes * 60_000;
    const e = new Date(t.plus({ minutes: dur }).toMillis() + buf);
    const free = staff
      .filter((st) => !appts.some((a) => a.staffId === st.id && a.startAt < e && a.endAt.getTime() + buf > s.getTime()))
      .map((st) => st.id);
    if (free.length) slots.push({ start: s.toISOString(), staffIds: free });
  }
  return slots;
}

/** True if staff member has no overlapping active appointment in [start, end). */
export async function staffIsFree(businessId: string, staffId: string, start: Date, end: Date, excludeId?: string) {
  const clash = await db.appointment.findFirst({
    where: {
      businessId,
      staffId,
      status: { in: [...BLOCKING] },
      startAt: { lt: end },
      endAt: { gt: start },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return !clash;
}
