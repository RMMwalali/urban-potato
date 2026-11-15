import Link from "next/link";
import { DateTime } from "luxon";
import { ListChecks } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dayRange, fmtTime, METHOD_LABEL, money, num, todayIso } from "@/lib/format";
import { PageHeader, Stat } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";

export const metadata = { title: "Daily summary" };

/** End-of-day sheet: check M-Pesa codes against the till statement, cash in the drawer, and what each stylist earned. */
export default async function DaySummary({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const b = user.business;
  const tz = b.timezone;
  const iso = sp.date && DateTime.fromISO(sp.date).isValid ? sp.date : todayIso(tz);
  const { start, end, dt } = dayRange(iso, tz);
  const [sales, staff, deposits] = await Promise.all([
    db.sale.findMany({ where: { businessId: b.id, createdAt: { gte: start, lt: end } }, include: { items: true, client: true, payments: true }, orderBy: { createdAt: "asc" } }),
    db.user.findMany({ where: { businessId: b.id } }),
    db.appointment.findMany({ where: { businessId: b.id, createdAt: { gte: start, lt: end }, depositAmount: { gt: 0 } }, include: { client: true } }),
  ]);
  const c = b.currency;
  const byMethod = new Map<string, number>();
  sales.forEach((s) => s.payments.forEach((p) => byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + num(p.amount))));
  const depositTotal = deposits.reduce((t, a) => t + num(a.depositAmount), 0);
  const perStaff = staff.map((st) => {
    const items = sales.flatMap((s) => s.items).filter((i) => i.staffId === st.id);
    return { st, services: items.reduce((t, i) => t + num(i.unitPrice) * i.quantity, 0), commission: items.reduce((t, i) => t + num(i.commission), 0), tips: sales.filter((s) => s.tipStaffId === st.id).reduce((t, s) => t + num(s.tip), 0), count: items.length };
  }).filter((x) => x.count || x.tips);
  const mpesa = sales.flatMap((s) => s.payments.filter((p) => p.method === "MPESA").map((p) => ({ ...p, sale: s })));
  const unverified = mpesa.filter((p) => !p.verified).length;

  return (
    <div className="max-w-5xl">
      <PageHeader title="Daily summary" sub={dt.toFormat("cccc d LLLL yyyy")} icon={ListChecks}>
        <form className="print:hidden"><input type="date" name="date" defaultValue={iso} className="input w-auto" /></form>
        <Link href={`?date=${dt.minus({ days: 1 }).toISODate()}`} className="btn-secondary btn-sm print:hidden">Previous day</Link>
        <PrintButton />
      </PageHeader>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat tone="brand" label="Collected today" value={money([...byMethod.values()].reduce((a, v) => a + v, 0) + depositTotal, c)} sub={`${sales.length} sales`} />
        {[...byMethod].map(([m, v]) => <Stat key={m} tone="plain" label={METHOD_LABEL[m]} value={money(v, c)} />)}
        {depositTotal > 0 && <Stat tone="lime" label="Online deposits" value={money(depositTotal, c)} sub={`${deposits.length} bookings`} />}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card overflow-x-auto">
          <h2 className="section-title border-b border-stone-100 px-5 py-4">Staff for the day</h2>
          <table className="table">
            <thead><tr><th>Staff</th><th>Services</th><th>Commission</th><th>Tips</th></tr></thead>
            <tbody>
              {perStaff.length === 0 && <tr><td colSpan={4} className="text-center text-stone-500">No sales yet.</td></tr>}
              {perStaff.map(({ st, services, commission, tips, count }) => (
                <tr key={st.id}><td className="font-semibold">{st.name}<span className="block text-xs font-normal text-stone-500">{count} services</span></td><td>{money(services, c)}</td><td>{money(commission, c)}</td><td>{money(tips, c)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card overflow-x-auto">
          <h2 className="section-title border-b border-stone-100 px-5 py-4">M-Pesa codes to check against the till statement{unverified > 0 && <span className="badge ml-2 bg-amber-100 text-amber-800">{unverified} unverified</span>}</h2>
          <table className="table">
            <thead><tr><th>Time</th><th>Code</th><th>Payer</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {mpesa.length + deposits.filter((d) => d.depositRef).length === 0 && <tr><td colSpan={4} className="text-center text-stone-500">No M-Pesa payments.</td></tr>}
              {mpesa.map((p) => <tr key={p.id}><td>{fmtTime(p.createdAt, tz)}</td><td className="font-mono">{p.reference} {p.verified ? <span className="badge bg-emerald-100 text-emerald-800">verified</span> : <span className="badge bg-amber-100 text-amber-800">check</span>}</td><td>{p.payerName ?? p.sale.client?.name ?? "Walk-in"}</td><td className="text-right">{money(p.amount, c)}</td></tr>)}
              {deposits.filter((d) => d.depositRef).map((d) => <tr key={d.id}><td>{fmtTime(d.createdAt, tz)}</td><td className="font-mono">{d.depositRef} <span className="badge bg-petal/50 text-navy-900">deposit</span></td><td>{d.client.name}</td><td className="text-right">{money(d.depositAmount, c)}</td></tr>)}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
