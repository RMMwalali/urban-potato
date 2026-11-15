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
    db.sale.findMany({ where: { businessId: b.id, createdAt: { gte: start, lt: end } }, include: { items: true, client: true }, orderBy: { createdAt: "asc" } }),
    db.user.findMany({ where: { businessId: b.id } }),
    db.appointment.findMany({ where: { businessId: b.id, createdAt: { gte: start, lt: end }, depositAmount: { gt: 0 } }, include: { client: true } }),
  ]);
  const c = b.currency;
  const paidToday = (s: (typeof sales)[number]) => Math.max(num(s.total) - num(s.depositApplied), 0);
  const byMethod = new Map<string, number>();
  sales.forEach((s) => byMethod.set(s.method, (byMethod.get(s.method) ?? 0) + paidToday(s)));
  const depositTotal = deposits.reduce((t, a) => t + num(a.depositAmount), 0);
  const perStaff = staff.map((st) => {
    const items = sales.flatMap((s) => s.items).filter((i) => i.staffId === st.id);
    return { st, services: items.reduce((t, i) => t + num(i.unitPrice) * i.quantity, 0), commission: items.reduce((t, i) => t + num(i.commission), 0), tips: sales.filter((s) => s.tipStaffId === st.id).reduce((t, s) => t + num(s.tip), 0), count: items.length };
  }).filter((x) => x.count || x.tips);
  const mpesa = sales.filter((s) => s.method === "MPESA" && s.reference && s.reference !== "DEPOSIT");

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
          <h2 className="section-title border-b border-stone-100 px-5 py-4">M-Pesa codes to check against the till statement</h2>
          <table className="table">
            <thead><tr><th>Time</th><th>Code</th><th>Client</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {mpesa.length + deposits.filter((d) => d.depositRef).length === 0 && <tr><td colSpan={4} className="text-center text-stone-500">No M-Pesa payments.</td></tr>}
              {mpesa.map((s) => <tr key={s.id}><td>{fmtTime(s.createdAt, tz)}</td><td className="font-mono">{s.reference}</td><td>{s.client?.name ?? "Walk-in"}</td><td className="text-right">{money(paidToday(s), c)}</td></tr>)}
              {deposits.filter((d) => d.depositRef).map((d) => <tr key={d.id}><td>{fmtTime(d.createdAt, tz)}</td><td className="font-mono">{d.depositRef} <span className="badge bg-lime-glow/50 text-plum-900">deposit</span></td><td>{d.client.name}</td><td className="text-right">{money(d.depositAmount, c)}</td></tr>)}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
