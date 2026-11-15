import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizePhone } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Staff-only client lookup for autofill (signed-in salon team, own salon only).
 * Returns contact details, care notes and the last visit, never payment data.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ clients: [] }, { status: 401 });
  const u = await db.user.findFirst({ where: { id: session.userId, businessId: session.businessId, active: true }, select: { business: { select: { id: true, countryCode: true } } } });
  if (!u) return NextResponse.json({ clients: [] }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  const digits = q.replace(/\D/g, "");
  if (q.length < 2) return NextResponse.json({ clients: [] });
  const phoneLike = digits.length >= 3 ? [digits, normalizePhone(digits, u.business.countryCode)].map((d) => d.replace(/^0/, "")) : [];
  const clients = await db.client.findMany({
    where: {
      businessId: u.business.id,
      OR: [{ name: { contains: q, mode: "insensitive" } }, ...phoneLike.map((d) => ({ phone: { contains: d } }))],
    },
    take: 6,
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, phone: true, email: true, allergies: true, preferences: true, notes: true,
      appointments: { orderBy: { startAt: "desc" }, take: 1, where: { status: { not: "CANCELLED" } }, select: { serviceId: true, staffId: true, startAt: true, service: { select: { name: true } }, staff: { select: { name: true } } } },
      _count: { select: { appointments: { where: { status: "COMPLETED" } } } },
    },
  });
  const noShows = await db.appointment.groupBy({ by: ["clientId"], where: { clientId: { in: clients.map((c) => c.id) }, status: "NO_SHOW" }, _count: true });
  return NextResponse.json({
    clients: clients.map((c) => ({
      id: c.id, name: c.name, phone: c.phone, email: c.email, allergies: c.allergies, preferences: c.preferences, notes: c.notes?.slice(0, 160) ?? null,
      visits: c._count.appointments, noShows: noShows.find((n) => n.clientId === c.id)?._count ?? 0,
      last: c.appointments[0] ? { serviceId: c.appointments[0].serviceId, service: c.appointments[0].service.name, staffId: c.appointments[0].staffId, staff: c.appointments[0].staff?.name ?? null, at: c.appointments[0].startAt } : null,
    })),
    exactPhone: digits.length >= 9 ? normalizePhone(digits, u.business.countryCode) : null,
  });
}
