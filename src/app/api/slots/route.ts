import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSlots } from "@/lib/availability";

// Public: free slots for the booking page. ?slug=&serviceId=&date=YYYY-MM-DD&staffId=
export async function GET(req: Request) {
  const u = new URL(req.url);
  const business = await db.business.findUnique({ where: { slug: u.searchParams.get("slug") ?? "" } });
  if (!business || !business.bookingEnabled) return NextResponse.json({ slots: [] });
  const slots = await getSlots({
    business,
    serviceId: u.searchParams.get("serviceId") ?? "",
    isoDate: u.searchParams.get("date") ?? "",
    staffId: u.searchParams.get("staffId") || null,
  });
  return NextResponse.json({ slots: slots.map((s) => s.start) });
}
