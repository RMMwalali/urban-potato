"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSlots } from "@/lib/availability";
import { notifyAppointment } from "@/lib/messaging";
import { fmtDateTime } from "@/lib/format";
import { upsertClient } from "./appointments";

export type BookState = { error?: string; done?: { when: string; service: string; staff: string | null } } | undefined;

const Input = z.object({
  slug: z.string(),
  serviceId: z.string().min(1, "Choose a service"),
  staffId: z.string().optional(),
  start: z.string().min(1, "Choose a time"),
  name: z.string().trim().min(2, "Enter your name"),
  phone: z.string().trim().min(9, "Enter your phone number"),
  notes: z.string().trim().max(500).optional(),
  website: z.string().optional(), // honeypot
});

export async function publicBook(_: BookState, fd: FormData): Promise<BookState> {
  const p = Input.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  if (d.website) return { error: "Something went wrong" };

  const business = await db.business.findUnique({ where: { slug: d.slug } });
  if (!business || !business.bookingEnabled) return { error: "Online booking is not available" };
  const service = await db.service.findFirst({ where: { id: d.serviceId, businessId: business.id, active: true, onlineBooking: true } });
  if (!service) return { error: "Service not available" };

  const start = new Date(d.start);
  if (isNaN(start.getTime())) return { error: "Choose a time" };
  const isoDate = new Intl.DateTimeFormat("en-CA", { timeZone: business.timezone }).format(start);
  // Re-check availability on the server: the slot may have been taken since the page loaded.
  const slots = await getSlots({ business, serviceId: service.id, isoDate, staffId: d.staffId || null });
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
      endAt: new Date(start.getTime() + service.durationMin * 60000),
      price: service.price,
      source: "ONLINE",
      notes: d.notes || null,
    },
    include: { staff: true },
  });
  await notifyAppointment("CONFIRMATION", appt.id);
  return { done: { when: fmtDateTime(start, business.timezone), service: service.name, staff: appt.staff?.name ?? null } };
}
