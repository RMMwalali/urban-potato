import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { Clock, MapPin, Phone, Sparkles } from "lucide-react";
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

  return (
    <main className="min-h-screen bg-canvas">
      <header className="relative overflow-hidden bg-plum-950 px-4 pt-10 pb-24 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(240,25,122,0.45),transparent_60%)]" />
        <div className="relative">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-coral-500 font-display text-2xl font-extrabold shadow-xl shadow-brand-600/40">{b.name[0]}</span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{b.name}</h1>
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-white/70">
            {b.address && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{b.address}</span>}
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{b.openTime}–{b.closeTime}</span>
            {b.phone && <a href={`tel:${b.phone}`} className="flex items-center gap-1.5 hover:text-white"><Phone className="h-4 w-4" />{b.phone}</a>}
          </div>
        </div>
      </header>
      <div className="relative mx-auto -mt-14 max-w-xl px-4 pb-12">
        {!available ? (
          <div className="card p-8 text-center text-stone-600">Online booking is currently unavailable.{b.phone && ` Please call ${b.phone}.`}</div>
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
        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-stone-400"><Sparkles className="h-3.5 w-3.5" /> Powered by SpaDesk</p>
      </div>
    </main>
  );
}
