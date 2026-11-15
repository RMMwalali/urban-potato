import Link from "next/link";
import { ArrowRight, CalendarDays, CalendarPlus, Check, CircleCheck, Copy, Footprints, Link2, MessageSquare, Receipt, TrendingUp, Users, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dayRange, fmtTime, money, num, STATUS_LABEL, STATUS_STYLE, todayIso } from "@/lib/format";
import { Empty, Stat } from "@/components/ui";
import { TiltCard } from "@/components/motion/Tilt";
import { Reveal } from "@/components/motion/Reveal";
import { CopyButton } from "@/components/CopyButton";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const b = user.business;
  const { start, end } = dayRange(todayIso(b.timezone), b.timezone);
  const weekAgo = new Date(start.getTime() - 6 * 86400_000);

  const [appts, todaySales, weekSales, newClients, upcoming, serviceCount, staffCount, apptCount] = await Promise.all([
    db.appointment.findMany({ where: { businessId: b.id, startAt: { gte: start, lt: end } }, include: { client: true, service: true, staff: true, sale: { select: { id: true } } }, orderBy: { startAt: "asc" } }),
    db.sale.aggregate({ where: { businessId: b.id, createdAt: { gte: start, lt: end } }, _sum: { total: true }, _count: true }),
    db.sale.aggregate({ where: { businessId: b.id, createdAt: { gte: weekAgo, lt: end } }, _sum: { total: true } }),
    db.client.count({ where: { businessId: b.id, createdAt: { gte: weekAgo } } }),
    db.appointment.count({ where: { businessId: b.id, startAt: { gte: end }, status: { in: ["BOOKED", "CONFIRMED"] } } }),
    db.service.count({ where: { businessId: b.id, active: true } }),
    db.user.count({ where: { businessId: b.id, active: true } }),
    db.appointment.count({ where: { businessId: b.id } }),
  ]);

  const active = appts.filter((a) => a.status !== "CANCELLED");
  const bookingUrl = `${process.env.APP_URL ?? ""}/book/${b.slug}`;
  const isManager = ["OWNER", "MANAGER"].includes(user.role);
  const steps = [
    { done: serviceCount > 0, label: "Add your services & prices", href: "/app/services" },
    { done: staffCount > 1, label: "Add your team (or skip if it's just you)", href: "/app/staff" },
    { done: !!b.mpesaNumber, label: "Add your M-Pesa till for payments & deposits", href: "/app/settings" },
    { done: !!(b.phone && b.address), label: "Add your phone number & location", href: "/app/settings" },
    { done: apptCount > 0, label: "Take your first booking", href: "/app/appointments/new" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: b.timezone }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {sp.denied && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Only owners and managers can open that page.</div>}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-600">{greeting}, {user.name.split(" ")[0]}</p>
          <h1 className="page-title mt-1">{b.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/appointments/new?walkin=1" className="btn-secondary"><Footprints className="h-4 w-4" /> Walk-in</Link>
          <Link href="/app/sales/new" className="btn-secondary"><Receipt className="h-4 w-4" /> Quick sale</Link>
          <Link href="/app/appointments/new" className="btn-bold"><CalendarPlus className="h-4 w-4" /> New appointment</Link>
        </div>
      </div>

      {isManager && doneCount < steps.length && (
        <Reveal>
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-plum-950 to-plum-800 px-6 py-5 text-white">
              <div>
                <p className="font-display text-xl font-bold">Get set up in 5 steps</p>
                <p className="text-sm text-white/60">{doneCount} of {steps.length} done</p>
              </div>
              <div className="h-2 w-48 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-lime-glow to-emerald-400" style={{ width: `${(doneCount / steps.length) * 100}%` }} /></div>
            </div>
            <ul className="divide-y divide-stone-100">
              {steps.map((s) => (
                <li key={s.label}>
                  <Link href={s.href} className="flex items-center gap-4 px-6 py-3.5 hover:bg-stone-50">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full ${s.done ? "bg-emerald-500 text-white" : "border-2 border-stone-300"}`}>{s.done && <Check className="h-4 w-4" />}</span>
                    <span className={`flex-1 text-sm font-medium ${s.done ? "text-stone-400 line-through" : ""}`}>{s.label}</span>
                    {!s.done && <ArrowRight className="h-4 w-4 text-stone-400" />}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TiltCard max={8}><Stat tone="brand" label="Today's bookings" value={active.length} sub={`${active.filter((a) => a.source !== "WALK_IN").length} booked ahead`} icon={CalendarDays} /></TiltCard>
        <TiltCard max={8}><Stat tone="dark" label="Today's takings" value={money(todaySales._sum.total, b.currency)} sub={`${todaySales._count} sales`} icon={Wallet} /></TiltCard>
        <TiltCard max={8}><Stat tone="lime" label="Last 7 days" value={money(weekSales._sum.total, b.currency)} sub={`${newClients} new clients`} icon={TrendingUp} /></TiltCard>
        <TiltCard max={8}><Stat tone="plain" label="Upcoming" value={upcoming} sub="bookings after today" icon={Users} /></TiltCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <h2 className="section-title">Today&apos;s schedule</h2>
            <Link href="/app/calendar" className="flex items-center gap-1 text-sm font-semibold text-brand-600">Calendar <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {appts.length === 0 ? (
            <Empty icon={CalendarDays} title="Nothing booked today yet">Share your booking link or add a walk-in.</Empty>
          ) : (
            <ul className="divide-y divide-stone-100">
              {appts.map((a) => (
                <li key={a.id}>
                  <Link href={`/app/appointments/${a.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50">
                    <span className="w-14 font-display text-lg font-bold">{fmtTime(a.startAt, b.timezone)}</span>
                    <span className="h-10 w-1.5 rounded-full" style={{ background: a.staff?.color ?? "#d6d3d1" }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{a.client.name}</span>
                      <span className="block truncate text-xs text-stone-500">{a.service.name} · {a.staff?.name ?? "Unassigned"}</span>
                    </span>
                    <span className="hidden text-sm font-semibold sm:block">{money(num(a.price), b.currency)}</span>
                    <span className={`badge ${a.sale ? "bg-emerald-100 text-emerald-800" : STATUS_STYLE[a.status]}`}>{a.sale ? <><CircleCheck className="h-3 w-3" /> Paid</> : STATUS_LABEL[a.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <TiltCard max={6} className="rounded-2xl">
          <section className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-coral-500 p-6 text-white shadow-xl shadow-brand-500/30">
            <Link2 className="absolute -right-6 -bottom-6 h-36 w-36 opacity-15" />
            <h2 className="font-display text-xl font-bold">Your booking link</h2>
            <p className="mt-1 text-sm text-white/80">Put it in your Instagram, TikTok and Facebook bios and your WhatsApp Business profile. Clients book themselves, no app needed.</p>
            <code className="mt-4 block break-all rounded-xl bg-black/20 px-3 py-2.5 text-xs">{bookingUrl}</code>
            <div className="relative mt-4 flex flex-wrap gap-2">
              <CopyButton text={bookingUrl} className="btn btn-sm bg-white text-brand-700 hover:bg-lime-glow"><Copy className="h-3.5 w-3.5" /> Copy</CopyButton>
              <a className="btn btn-sm bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25" target="_blank" href={`https://wa.me/?text=${encodeURIComponent(`Book your next appointment at ${b.name}: ${bookingUrl}`)}`}><MessageSquare className="h-3.5 w-3.5" /> Share on WhatsApp</a>
            </div>
            {!b.bookingEnabled && <p className="relative mt-3 text-xs text-white/90">Online booking is switched off in Settings.</p>}
          </section>
        </TiltCard>
      </div>
    </div>
  );
}
