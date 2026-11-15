import Link from "next/link";
import { Receipt } from "lucide-react";
import { TitleIcon } from "@/components/ui";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dayRange, fmtDateTime, METHOD_LABEL, money, num, todayIso } from "@/lib/format";

export const metadata = { title: "Sales" };

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const b = user.business;
  const tz = b.timezone;
  const to = sp.to ?? todayIso(tz);
  const from = sp.from ?? to;
  const start = dayRange(from, tz).start;
  const end = dayRange(to, tz).end;

  const sales = await db.sale.findMany({
    where: { businessId: b.id, createdAt: { gte: start, lt: end } },
    include: { client: true, items: true },
    orderBy: { createdAt: "desc" },
  });
  const byMethod = new Map<string, number>();
  sales.forEach((s) => byMethod.set(s.method, (byMethod.get(s.method) ?? 0) + num(s.total)));
  const total = sales.reduce((t, s) => t + num(s.total), 0);
  const label = from === to ? DateTime.fromISO(from).toFormat("ccc d LLL yyyy") : `${from} → ${to}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-3"><TitleIcon icon={Receipt} />Sales</h1>
          <p className="text-sm text-stone-500">{label}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <form className="flex items-end gap-2">
            <div><label className="label">From</label><input type="date" name="from" defaultValue={from} className="input" /></div>
            <div><label className="label">To</label><input type="date" name="to" defaultValue={to} className="input" /></div>
            <button className="btn-secondary">Show</button>
          </form>
          <Link href={`/app/sales/day?date=${to}`} className="btn-secondary">Daily summary</Link>
          {["OWNER", "MANAGER"].includes(user.role) && <a href="/app/export/sales" className="btn-secondary">Export CSV</a>}
          <Link href="/app/sales/new" className="btn-primary">+ Quick sale</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4"><p className="text-xs text-stone-500">Total</p><p className="text-xl font-semibold">{money(total, b.currency)}</p><p className="text-xs text-stone-500">{sales.length} sales</p></div>
        {[...byMethod].map(([m, v]) => (
          <div key={m} className="card p-4"><p className="text-xs text-stone-500">{METHOD_LABEL[m]}</p><p className="text-xl font-semibold">{money(v, b.currency)}</p></div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>#</th><th>Time</th><th>Client</th><th>Items</th><th>Method</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {sales.length === 0 && <tr><td colSpan={6} className="text-center text-stone-500">No sales in this period.</td></tr>}
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-stone-50">
                <td><Link className="text-brand-700" href={`/app/sales/${s.id}`}>{s.number}</Link></td>
                <td className="whitespace-nowrap">{fmtDateTime(s.createdAt, tz)}</td>
                <td>{s.client?.name ?? <span className="text-stone-400">Walk-in</span>}</td>
                <td className="text-stone-600">{s.items.map((i) => i.name).join(", ")}</td>
                <td>{METHOD_LABEL[s.method]}{s.reference && <span className="block text-xs text-stone-500">{s.reference}</span>}</td>
                <td className="text-right font-medium">{money(s.total, b.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
