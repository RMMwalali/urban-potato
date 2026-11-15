import { DateTime } from "luxon";
import { BarChart3 } from "lucide-react";
import { TitleIcon } from "@/components/ui";
import { db } from "@/lib/db";
import { MANAGERS, requireUser } from "@/lib/auth";
import { dayRange, METHOD_LABEL, money, num, SOURCE_LABEL, todayIso } from "@/lib/format";

export const metadata = { title: "Reports" };

function Bars({ rows, currency }: { rows: { label: string; value: number; sub?: string }[]; currency?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-sm text-stone-500">No data for this period.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex justify-between gap-2">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 font-medium">{currency ? money(r.value, currency) : r.value}{r.sub && <span className="ml-1 text-xs font-normal text-stone-500">{r.sub}</span>}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser(MANAGERS);
  const b = user.business;
  const tz = b.timezone;
  const to = sp.to ?? todayIso(tz);
  const from = sp.from ?? DateTime.fromISO(to).minus({ days: 29 }).toISODate()!;
  const range = { gte: dayRange(from, tz).start, lt: dayRange(to, tz).end };

  const [sales, items, appts, staff] = await Promise.all([
    db.sale.findMany({ where: { businessId: b.id, createdAt: range }, include: { client: true } }),
    db.saleItem.findMany({ where: { sale: { businessId: b.id, createdAt: range } } }),
    db.appointment.findMany({ where: { businessId: b.id, startAt: range }, select: { status: true, source: true } }),
    db.user.findMany({ where: { businessId: b.id } }),
  ]);

  const sum = <T,>(xs: T[], key: (x: T) => string | null, val: (x: T) => number) => {
    const m = new Map<string, number>();
    xs.forEach((x) => { const k = key(x); if (k) m.set(k, (m.get(k) ?? 0) + val(x)); });
    return [...m].sort((a, b) => b[1] - a[1]);
  };

  const revenue = sales.reduce((t, s) => t + num(s.total), 0);
  const tips = sales.reduce((t, s) => t + num(s.tip), 0);
  const avg = sales.length ? revenue / sales.length : 0;
  const finished = appts.filter((a) => ["COMPLETED", "NO_SHOW"].includes(a.status));
  const noShowRate = finished.length ? (appts.filter((a) => a.status === "NO_SHOW").length / finished.length) * 100 : 0;

  // daily revenue series
  const days: { label: string; value: number }[] = [];
  for (let d = DateTime.fromISO(from); d <= DateTime.fromISO(to); d = d.plus({ days: 1 })) days.push({ label: d.toISODate()!, value: 0 });
  sales.forEach((s) => { const k = DateTime.fromJSDate(s.createdAt).setZone(tz).toISODate(); const r = days.find((x) => x.label === k); if (r) r.value += num(s.total); });
  const maxDay = Math.max(1, ...days.map((d) => d.value));

  const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? "Unknown";
  const byStaff = sum(items, (i) => i.staffId, (i) => num(i.unitPrice) * i.quantity);
  const commission = new Map(sum(items, (i) => i.staffId, (i) => num(i.commission)));
  const tipsBy = new Map(sum(sales, (s) => s.tipStaffId, (s) => num(s.tip)));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="page-title flex items-center gap-3"><TitleIcon icon={BarChart3} />Reports</h1>
        <form className="flex items-end gap-2">
          <div><label className="label">From</label><input type="date" name="from" defaultValue={from} className="input" /></div>
          <div><label className="label">To</label><input type="date" name="to" defaultValue={to} className="input" /></div>
          <button className="btn-secondary">Update</button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4"><p className="text-xs text-stone-500">Revenue</p><p className="text-xl font-semibold">{money(revenue, b.currency)}</p><p className="text-xs text-stone-500">incl. {money(tips, b.currency)} tips</p></div>
        <div className="card p-4"><p className="text-xs text-stone-500">Sales</p><p className="text-xl font-semibold">{sales.length}</p><p className="text-xs text-stone-500">avg {money(Math.round(avg), b.currency)}</p></div>
        <div className="card p-4"><p className="text-xs text-stone-500">Appointments</p><p className="text-xl font-semibold">{appts.length}</p><p className="text-xs text-stone-500">{appts.filter((a) => a.status === "CANCELLED").length} cancelled</p></div>
        <div className="card p-4"><p className="text-xs text-stone-500">No-show rate</p><p className={`text-xl font-semibold ${noShowRate > 10 ? "text-rose-700" : ""}`}>{noShowRate.toFixed(1)}%</p><p className="text-xs text-stone-500">reminders help bring this down</p></div>
      </div>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Daily revenue</h2>
        <div className="flex h-40 items-end gap-0.5">
          {days.map((d) => (
            <div key={d.label} className="group relative flex-1">
              <div className="rounded-t bg-brand-500/80 hover:bg-brand-600" style={{ height: `${(d.value / maxDay) * 150}px`, minHeight: d.value ? 2 : 0 }} />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white group-hover:block">
                {DateTime.fromISO(d.label).toFormat("d LLL")}: {money(d.value, b.currency)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-stone-400"><span>{DateTime.fromISO(from).toFormat("d LLL")}</span><span>{DateTime.fromISO(to).toFormat("d LLL")}</span></div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Staff performance & commission</h2>
          <Bars currency={b.currency} rows={byStaff.map(([id, v]) => ({ label: staffName(id), value: v, sub: `· ${money(commission.get(id) ?? 0, b.currency)} comm. · ${money(tipsBy.get(id) ?? 0, b.currency)} tips` }))} />
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Top services</h2>
          <Bars currency={b.currency} rows={sum(items, (i) => i.name, (i) => num(i.unitPrice) * i.quantity).slice(0, 8).map(([label, value]) => ({ label, value }))} />
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Where bookings come from</h2>
          <Bars rows={sum(appts, (a) => a.source, () => 1).map(([k, v]) => ({ label: SOURCE_LABEL[k], value: v }))} />
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Payment methods</h2>
          <Bars currency={b.currency} rows={sum(sales, (s) => s.method, (s) => num(s.total)).map(([k, v]) => ({ label: METHOD_LABEL[k], value: v }))} />
        </section>
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Top clients</h2>
          <Bars currency={b.currency} rows={sum(sales, (s) => s.client?.name ?? null, (s) => num(s.total)).slice(0, 10).map(([label, value]) => ({ label, value }))} />
        </section>
      </div>
    </div>
  );
}
