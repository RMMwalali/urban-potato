import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { appUrl } from "@/lib/url";
import { dayRange, fmtTime, money, num, STATUS_LABEL, todayIso } from "@/lib/format";
import { Empty, Stat } from "@/components/ui";
import { Reveal } from "@/components/motion/Reveal";
import { CopyButton } from "@/components/CopyButton";
import { bookingBlockers } from "@/lib/booking-status";
import { reviewEligible } from "@/lib/reviews";

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
  const blockers = await bookingBlockers(b);
  const askReview = ["OWNER", "MANAGER"].includes(user.role) && (await reviewEligible(b));
  const bookingUrl = `${appUrl()}/book/${b.slug}`;
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
    <div className="space-y-16">
      {sp.denied && <p className="border-l-2 border-pink bg-panel px-4 py-3 text-[14px]">Only owners and managers can open that page.</p>}

      <div className="border-b border-ink pb-6">
        <p className="label-caps mb-4 text-muted">{greeting}, {user.name.split(" ")[0]}</p>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h1 className="page-title">{b.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/appointments/new?walkin=1" className="btn-secondary">Walk-in</Link>
            <Link href="/app/sales/new" className="btn-secondary">Quick sale</Link>
            <Link href="/app/appointments/new" className="btn-primary" data-tour="new-appointment">New appointment</Link>
          </div>
        </div>
      </div>

      {isManager && doneCount < steps.length && (
        <Reveal>
          <section data-tour="setup">
            <div className="mb-4 flex items-baseline justify-between">
              <p className="label-caps">Get set up</p>
              <p className="label-caps text-muted">{doneCount} / {steps.length}</p>
            </div>
            <ol className="border-t-2 border-ink">
              {steps.map((s, i) => (
                <li key={s.label} className="border-b border-ink/30">
                  <Link href={s.href} className={`group flex items-center gap-5 py-4 transition-opacity duration-500 ${s.done ? "opacity-35" : "hover:opacity-60"}`}>
                    <sup className="text-[11px]">{i + 1}</sup>
                    <span className={`flex-1 text-[clamp(17px,1.6vw,22px)] ${s.done ? "line-through" : ""}`}>{s.label}</span>
                    <span className="label-caps">{s.done ? "Done" : "↗"}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>
      )}

      {askReview && (
        <Link href="/app/review" className="group flex flex-wrap items-center justify-between gap-4 border-y border-ink py-4 transition-colors hover:bg-panel">
          <span><span className="label-caps block text-muted">Two minutes</span><span className="text-[clamp(18px,1.8vw,24px)]">How is Laazizi HQ working for you?</span></span>
          <span className="btn-secondary btn-sm">Rate Laazizi HQ</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        <Stat label="Today's bookings" value={active.length} sub={`${active.filter((a) => a.source !== "WALK_IN").length} booked ahead`} />
        <Stat label="Today's takings" value={money(todaySales._sum.total, b.currency)} sub={`${todaySales._count} sales`} />
        <Stat label="Last 7 days" value={money(weekSales._sum.total, b.currency)} sub={`${newClients} new clients`} />
        <Stat label="Upcoming" value={upcoming} sub="bookings after today" />
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <p className="label-caps">Today&apos;s schedule</p>
            <Link href="/app/calendar" className="label-caps hover:opacity-50">Calendar ↗</Link>
          </div>
          <div className="border-t-2 border-ink">
            {appts.length === 0 ? (
              <Empty title="Nothing booked today yet">Share your booking link or add a walk-in.</Empty>
            ) : (
              <ul>
                {appts.map((a) => (
                  <li key={a.id} className="border-b border-ink/30">
                    <Link href={`/app/appointments/${a.id}`} className="grid grid-cols-[64px_1fr_auto] items-baseline gap-4 py-4 transition-colors duration-500 hover:bg-panel sm:grid-cols-[80px_1fr_auto_auto]">
                      <span className="text-[20px] tabular-nums">{fmtTime(a.startAt, b.timezone)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-[17px]">{a.client.name}</span>
                        <span className="label-caps block truncate text-muted">{a.service.name} · {a.staff?.name ?? "Unassigned"}</span>
                      </span>
                      <span className="hidden text-[15px] tabular-nums sm:block">{money(num(a.price), b.currency)}</span>
                      <span className="label-caps">{a.sale ? "Paid" : STATUS_LABEL[a.status]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="bg-ink p-7 text-paper" data-tour="booking-link">
          <p className="label-caps text-paper/60">Your booking link</p>
          <p className="mt-6 text-[clamp(22px,2vw,28px)] leading-tight">Put it in your Instagram, TikTok and WhatsApp bios. Clients book themselves, no app needed.</p>
          <p className="mt-8 break-all border-t border-paper/30 pt-4 font-mono text-[13px]">{bookingUrl}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <CopyButton text={bookingUrl} className="btn btn-sm border-paper bg-paper text-ink hover:bg-transparent hover:text-paper">Copy link</CopyButton>
            <a className="btn btn-sm border-paper text-paper hover:bg-paper hover:text-ink" target="_blank" href={`https://wa.me/?text=${encodeURIComponent(`Book your next appointment at ${b.name}: ${bookingUrl}`)}`}>Share on WhatsApp</a>
          </div>
          {blockers.length > 0 && (
            <div className="mt-6 border-t border-paper/30 pt-4">
              <p className="label-caps text-[#f9b4d3]">Not taking bookings yet</p>
              <ul className="mt-2 space-y-2 text-[14px]">
                {blockers.map((x) => <li key={x.reason}>{x.reason} <Link href={x.href} className="underline decoration-1 underline-offset-4 hover:opacity-60">{x.fix}</Link></li>)}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
