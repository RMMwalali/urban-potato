import { DateTime } from "luxon";
import { Banknote, Gift, Scissors, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateTime, money, num } from "@/lib/format";
import { PageHeader, Stat } from "@/components/ui";

export const metadata = { title: "My earnings" };

export default async function MyEarnings({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const b = user.business;
  const month = (sp.month && DateTime.fromISO(`${sp.month}-01`, { zone: b.timezone }).isValid ? DateTime.fromISO(`${sp.month}-01`, { zone: b.timezone }) : DateTime.now().setZone(b.timezone)).startOf("month");
  const range = { gte: month.toJSDate(), lt: month.plus({ months: 1 }).toJSDate() };
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
      <PageHeader title="My earnings" sub={`${month.toFormat("LLLL yyyy")} · ${num(user.commissionRate)}% commission`} icon={Wallet}>
        <form><input type="month" name="month" defaultValue={month.toFormat("yyyy-LL")} className="input w-auto" /></form>
      </PageHeader>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat tone="brand" label="You earned" value={money(commission + tipTotal, c)} sub="commission + tips" icon={Banknote} />
        <Stat tone="plain" label="Commission" value={money(commission, c)} />
        <Stat tone="lime" label="Tips" value={money(tipTotal, c)} icon={Gift} />
        <Stat tone="dark" label="Services done" value={items.length} sub={money(services, c)} icon={Scissors} />
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
    </div>
  );
}
