import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSlots } from "@/lib/availability";
import { accessState } from "@/lib/platform";

// Public: free slots for the booking page.
//   ?slug=&serviceId=&date=YYYY-MM-DD&staffId=      (new booking)
//   ?token=&date=YYYY-MM-DD                          (client rescheduling their own appointment)
export async function GET(req: Request) {
  const u = new URL(req.url);
  const date = u.searchParams.get("date") ?? "";
  const token = u.searchParams.get("token");
  if (token) {
    const a = await db.appointment.findUnique({ where: { manageToken: token }, include: { business: true } });
    if (!a || !accessState(a.business).ok) return NextResponse.json({ slots: [] });
    const slots = await getSlots({ business: a.business, serviceId: a.serviceId, isoDate: date, staffId: a.staffId, excludeAppointmentId: a.id, durationMin: Math.round((a.endAt.getTime() - a.startAt.getTime()) / 60000) });
    return NextResponse.json({ slots: slots.map((s) => s.start) });
  }
  const business = await db.business.findUnique({ where: { slug: u.searchParams.get("slug") ?? "" } });
  if (!business || !business.bookingEnabled || !accessState(business).ok) return NextResponse.json({ slots: [] });
  const serviceId = u.searchParams.get("serviceId") ?? "";
  const styleId = u.searchParams.get("styleId");
  const style = styleId ? await db.serviceStyle.findFirst({ where: { id: styleId, serviceId, active: true }, select: { durationMin: true } }) : null;
  const slots = await getSlots({ business, serviceId, isoDate: date, staffId: u.searchParams.get("staffId") || null, durationMin: style?.durationMin ?? undefined });
  return NextResponse.json({ slots: slots.map((s) => s.start) });
}
