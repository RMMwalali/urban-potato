import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dayRange, fmtTime, money, num, STATUS_LABEL, STATUS_STYLE, todayIso } from "@/lib/format";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ welcome?: string; denied?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const b = user.business;
  const { start, end } = dayRange(todayIso(b.timezone), b.timezone);
  const weekAgo = new Date(start.getTime() - 6 * 86400_000);

  const [appts, todaySales, weekSales, newClients, upcoming] = await Promise.all([
    db.appointment.findMany({
      where: { businessId: b.id, startAt: { gte: start, lt: end } },
      include: { client: true, service: true, staff: true, sale: { select: { id: true } } },
      orderBy: { startAt: "asc" },
    }),
    db.sale.aggregate({ where: { businessId: b.id, createdAt: { gte: start, lt: end } }, _sum: { total: true }, _count: true }),
    db.sale.aggregate({ where: { businessId: b.id, createdAt: { gte: weekAgo, lt: end } }, _sum: { total: true } }),
    db.client.count({ where: { businessId: b.id, createdAt: { gte: weekAgo } } }),
    db.appointment.count({ where: { businessId: b.id, startAt: { gte: end }, status: { in: ["BOOKED", "CONFIRMED"] } } }),
  ]);

  const active = appts.filter((a) => a.status !== "CANCELLED");
  const online = appts.filter((a) => a.source !== "WALK_IN").length;
  const bookingUrl = `${process.env.APP_URL ?? ""}/book/${b.slug}`;

  const stats = [
    { label: "Today's appointments", value: active.length, sub: `${online} booked ahead` },
    { label: "Today's takings", value: money(todaySales._sum.total, b.currency), sub: `${todaySales._count} sales` },
    { label: "Last 7 days", value: money(weekSales._sum.total, b.currency), sub: `${newClients} new clients` },
    { label: "Upcoming bookings", value: upcoming, sub: "after today" },
  ];

  return (
    <div className="space-y-6">
      {sp.welcome && (
        <div className="card border-brand-200 bg-brand-50 p-4 text-sm">
          <p className="font-medium">Welcome to SpaDesk 🎉</p>
          <p className="mt-1 text-stone-600">
            Next steps: check your <Link className="underline" href="/app/services">services & prices</Link>, add your{" "}
            <Link className="underline" href="/app/staff">staff</Link>, and set your{" "}
            <Link className="underline" href="/app/settings">opening hours</Link>. Then share your booking link on Instagram, WhatsApp and Facebook.
          </p>
        </div>
      )}
      {sp.denied && <div className="card bg-amber-50 p-3 text-sm text-amber-800">Only owners and managers can open that page.</div>}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Good day, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-stone-500">Here&apos;s how {b.name} is doing today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/appointments/new" className="btn-primary">+ New appointment</Link>
          <Link href="/app/sales/new" className="btn-secondary">Quick sale</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-stone-500">{s.label}</p>
            <p className="mt-1 text-xl font-semibold">{s.value}</p>
            <p className="text-xs text-stone-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
            <h2 className="font-semibold">Today&apos;s schedule</h2>
            <Link href="/app/calendar" className="text-sm text-brand-700">Open calendar →</Link>
          </div>
          {appts.length === 0 ? (
            <p className="p-6 text-sm text-stone-500">No appointments today yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {appts.map((a) => (
                <li key={a.id}>
                  <Link href={`/app/appointments/${a.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-stone-50">
                    <span className="w-12 font-mono text-sm text-stone-600">{fmtTime(a.startAt, b.timezone)}</span>
                    <span className="h-8 w-1 rounded" style={{ background: a.staff?.color ?? "#d6d3d1" }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{a.client.name}</span>
                      <span className="block truncate text-xs text-stone-500">
                        {a.service.name} · {a.staff?.name ?? "Unassigned"}
                      </span>
                    </span>
                    <span className="hidden text-sm sm:block">{money(num(a.price), b.currency)}</span>
                    <span className={`badge ${STATUS_STYLE[a.status]}`}>{a.sale ? "Paid" : STATUS_LABEL[a.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4">
          <h2 className="font-semibold">Your booking link</h2>
          <p className="mt-1 text-sm text-stone-600">
            Put this in your Instagram, TikTok and Facebook bios and your WhatsApp Business profile. Bookings go straight into your calendar.
          </p>
          <code className="mt-3 block break-all rounded-lg bg-stone-100 px-3 py-2 text-xs">{bookingUrl}</code>
          <div className="mt-3 flex gap-2">
            <a href={`/book/${b.slug}`} target="_blank" className="btn-secondary btn-sm">Preview</a>
            <a
              className="btn-secondary btn-sm"
              target="_blank"
              href={`https://wa.me/?text=${encodeURIComponent(`Book your next appointment at ${b.name}: ${bookingUrl}`)}`}
            >
              Share on WhatsApp
            </a>
          </div>
          {!b.bookingEnabled && <p className="mt-3 text-xs text-amber-700">Online booking is switched off in Settings.</p>}
        </section>
      </div>
    </div>
  );
}
