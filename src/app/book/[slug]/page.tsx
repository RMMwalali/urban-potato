import { getSession } from "@/lib/auth";
import { bookingBlockers } from "@/lib/booking-status";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { num } from "@/lib/format";
import { accessState } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";
import { openDays, policyText } from "@/lib/policy";
import { BookingWidget } from "@/components/BookingWidget";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const b = await db.business.findUnique({ where: { slug } });
  if (!b) return { title: "Booking" };
  if (b.isShowcase) return { title: b.name, robots: { index: false, follow: false } };
  return pageMetadata(`/book/${slug}`, { title: b.name, description: `Book your next appointment at ${b.name} online${b.address ? ` · ${b.address}` : ""}.` }, "/book/*");
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await db.business.findUnique({ where: { slug } });
  if (!b) notFound();
  const [services, staff] = await Promise.all([
    db.service.findMany({ where: { businessId: b.id, active: true, onlineBooking: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    db.user.findMany({ where: { businessId: b.id, active: true, bookable: true }, orderBy: { name: "asc" }, select: { id: true, name: true, title: true, services: { select: { id: true } } } }),
  ]);
  const days = openDays(b, DateTime.now().setZone(b.timezone).startOf("day"));
  const available = b.bookingEnabled && services.length > 0 && staff.length > 0 && accessState(b).ok;
  // The salon's own team sees exactly what's missing; clients just see that booking is unavailable.
  const session = available ? null : await getSession();
  const blockers = session?.businessId === b.id ? await bookingBlockers(b) : [];

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink px-5 pt-12 pb-10 sm:px-8">
        <div>
          <p className="label-caps text-muted">Book online</p>
          <h1 className="mt-4 text-[clamp(40px,7vw,96px)] leading-[0.88] uppercase">{b.name}</h1>
          <div className="label-caps mt-6 flex flex-wrap gap-x-6 gap-y-1 text-muted">
            {b.address && <span>{b.address}</span>}
            <span>{b.openTime}–{b.closeTime}</span>
            {b.phone && <a href={`tel:${b.phone}`} className="hover:text-ink">{b.phone}</a>}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-xl px-5 py-12">
        {!available ? (
          blockers.length ? (
            <div className="border-t-2 border-ink pt-6">
              <p className="label-caps text-pink">Only your team sees this</p>
              <p className="mt-3 text-[22px] leading-tight">Your booking page isn&apos;t taking bookings yet</p>
              <ul className="mt-6 border-t border-ink/30">
                {blockers.map((x) => (
                  <li key={x.reason} className="border-b border-ink/30 py-4">
                    <p className="text-[16px]">{x.reason}</p>
                    <a href={x.href} className="mt-1 inline-block text-[14px] underline decoration-1 underline-offset-4 hover:opacity-60">{x.fix} ↗</a>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[13px] text-muted">Clients currently see: “Online booking is currently unavailable.”</p>
            </div>
          ) : (
            <div className="card p-8 text-center text-stone-600">Online booking is currently unavailable.{b.phone && ` Please call ${b.phone}.`}</div>
          )
        ) : (
          <BookingWidget
            slug={b.slug}
            currency={b.currency}
            timezone={b.timezone}
            days={days}
            staff={staff.map((s) => ({ id: s.id, name: s.name, title: s.title, serviceIds: s.services.map((x) => x.id) }))}
            services={services.map((s) => ({ id: s.id, name: s.name, category: s.category, durationMin: s.durationMin, price: num(s.price), description: s.description }))}
            depositPercent={b.depositPercent}
            mpesa={b.mpesaNumber && b.mpesaType ? { type: b.mpesaType, number: b.mpesaNumber, account: b.mpesaAccount } : null}
            policy={policyText(b)}
          />
        )}
        <p className="label-caps mt-12 text-center text-muted">Powered by Darling</p>
      </div>
    </main>
  );
}
