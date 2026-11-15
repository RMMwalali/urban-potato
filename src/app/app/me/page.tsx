import Link from "next/link";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtDateTime, money, num } from "@/lib/format";
import { PageHeader, Stat } from "@/components/ui";

export const metadata = { title: "My earnings" };

export default async function MyEarnings({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const b = user.business;
  const month = (sp.month && DateTime.fromISO(`${sp.month}-01`, { zone: b.timezone }).isValid ? DateTime.fromISO(`${sp.month}-01`, { zone: b.timezone }) : DateTime.now().setZone(b.timezone)).startOf("month");
  const range = { gte: month.toJSDate(), lt: month.plus({ months: 1 }).toJSDate() };
  const payslips = await db.payslip.findMany({ where: { userId: user.id, payRun: { businessId: b.id, status: { not: "DRAFT" } } }, include: { payRun: true }, orderBy: { payRun: { periodStart: "desc" } }, take: 12 });
  const [items, tips] = await Promise.all([
    db.saleItem.findMany({ where: { staffId: user.id, sale: { businessId: b.id, createdAt: range } }, include: { sale: { include: { client: true } } }, orderBy: { sale: { createdAt: "desc" } } }),
    db.sale.aggregate({ where: { businessId: b.id, tipStaffId: user.id, createdAt: range }, _sum: { tip: true } }),
  ]);
  const services = items.reduce((t, i) => t + num(i.unitPrice) * i.quantity, 0);
  const commission = items.reduce((t, i) => t + num(i.commission), 0);
  const tipTotal = num(tips._sum.tip);
  const c = b.currency;

  return (
    <div className="max-w-5xl">
      <PageHeader title="My earnings" sub={`${month.toFormat("LLLL yyyy")} · ${num(user.commissionRate)}% commission`}>
        <form><input type="month" name="month" defaultValue={month.toFormat("yyyy-LL")} className="input w-auto" /></form>
      </PageHeader>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-tour="my-earnings">
        <Stat tone="brand" label="You earned" value={money(commission + tipTotal, c)} sub="commission + tips" />
        <Stat tone="plain" label="Commission" value={money(commission, c)} />
        <Stat tone="lime" label="Tips" value={money(tipTotal, c)} />
        <Stat tone="dark" label="Services done" value={items.length} sub={money(services, c)} />
      </div>
      <section className="card mt-6 overflow-x-auto">
        <table className="table">
          <thead><tr><th>Date</th><th>Client</th><th>Service</th><th className="text-right">Price</th><th className="text-right">Your commission</th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={5} className="text-center text-stone-500">No services recorded for you this month.</td></tr>}
            {items.map((i) => (
              <tr key={i.id}><td className="whitespace-nowrap">{fmtDateTime(i.sale.createdAt, b.timezone)}</td><td>{i.sale.client?.name ?? "Walk-in"}</td><td>{i.name}</td><td className="text-right">{money(num(i.unitPrice) * i.quantity, c)}</td><td className="text-right font-semibold">{money(i.commission, c)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="mt-12">
        <p className="label-caps mb-4">My payslips</p>
        <ul className="border-t-2 border-ink">
          {payslips.length === 0 && <li className="py-6 text-[14px] text-muted">No payslips yet. They appear here once your salon approves a pay run.</li>}
          {payslips.map((p) => (
            <li key={p.id} className="border-b border-ink/30">
              <Link href={`/app/payslips/${p.id}`} className="flex items-baseline justify-between gap-4 py-4 transition-colors duration-500 hover:bg-panel">
                <span>{fmtDate(p.payRun.periodStart, b.timezone)} – {fmtDate(new Date(p.payRun.periodEnd.getTime() - 1), b.timezone)}<span className="label-caps block text-muted">{p.paidAt ? "Paid" : "Approved · not paid yet"}</span></span>
                <span className="text-[18px] tabular-nums">{money(p.net, c)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
