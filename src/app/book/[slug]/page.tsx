import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { num } from "@/lib/format";
import { BookingWidget } from "@/components/BookingWidget";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const b = await db.business.findUnique({ where: { slug: (await params).slug } });
  return { title: b ? `Book at ${b.name}` : "Booking" };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await db.business.findUnique({ where: { slug } });
  if (!b) notFound();
  const [services, staff] = await Promise.all([
    db.service.findMany({ where: { businessId: b.id, active: true, onlineBooking: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    db.user.findMany({ where: { businessId: b.id, active: true, bookable: true }, orderBy: { name: "asc" }, select: { id: true, name: true, title: true, services: { select: { id: true } } } }),
  ]);
  const today = DateTime.now().setZone(b.timezone).startOf("day");
  const days = Array.from({ length: 21 }, (_, i) => today.plus({ days: i })).filter((d) => b.openDays.includes(d.weekday)).map((d) => d.toISODate()!);

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-stone-50 px-4 py-8">
      <div className="mx-auto max-w-xl">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">{b.name}</h1>
          {b.address && <p className="text-sm text-stone-600">{b.address}</p>}
          <p className="text-sm text-stone-500">Open {b.openTime}–{b.closeTime}{b.phone && ` · ${b.phone}`}</p>
        </header>
        {!b.bookingEnabled || services.length === 0 ? (
          <div className="card p-6 text-center text-stone-600">Online booking is currently unavailable.{b.phone && ` Please call ${b.phone}.`}</div>
        ) : (
          <BookingWidget
            slug={b.slug}
            currency={b.currency}
            timezone={b.timezone}
            days={days}
            staff={staff.map((s) => ({ id: s.id, name: s.name, title: s.title, serviceIds: s.services.map((x) => x.id) }))}
            services={services.map((s) => ({ id: s.id, name: s.name, category: s.category, durationMin: s.durationMin, price: num(s.price), description: s.description }))}
          />
        )}
        <p className="mt-8 text-center text-xs text-stone-400">Powered by SpaDesk</p>
      </div>
    </main>
  );
}
