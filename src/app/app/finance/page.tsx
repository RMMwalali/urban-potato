import Link from "next/link";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dayRange, fmtDateTime, METHOD_LABEL, money, num, todayIso } from "@/lib/format";
import { addFromSms } from "@/app/actions/payments";
import { ActionForm } from "@/components/ActionForm";
import { Empty, PageHeader, Stat } from "@/components/ui";

export const metadata = { title: "Finance" };

const SOURCE: Record<string, { label: string; cls: string }> = {
  C2B: { label: "Verified by Safaricom", cls: "bg-emerald-100 text-emerald-800" },
  SMS: { label: "From SMS", cls: "bg-amber-100 text-amber-800" },
  MANUAL: { label: "Typed code", cls: "bg-stone-200 text-stone-700" },
};

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; show?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const b = user.business;
  const tz = b.timezone;
  const to = sp.to ?? todayIso(tz);
  const from = sp.from ?? DateTime.fromISO(to).minus({ days: 6 }).toISODate()!;
  const range = { gte: dayRange(from, tz).start, lt: dayRange(to, tz).end };
  const unmatchedOnly = sp.show === "unmatched";

  const [txns, payments, deposits] = await Promise.all([
    db.mpesaTransaction.findMany({
      where: { businessId: b.id, createdAt: range, ...(unmatchedOnly ? { claimedAt: null } : {}) },
      include: { payment: { include: { sale: { select: { id: true, number: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    db.payment.findMany({ where: { sale: { businessId: b.id, createdAt: range } }, select: { method: true, amount: true, verified: true } }),
    db.appointment.aggregate({ where: { businessId: b.id, createdAt: range, depositAmount: { gt: 0 } }, _sum: { depositAmount: true } }),
  ]);
  const apptIds = txns.map((t) => t.appointmentId).filter(Boolean) as string[];
  const appts = new Map((await db.appointment.findMany({ where: { id: { in: apptIds } }, include: { client: true } })).map((a) => [a.id, a]));

  const byMethod = new Map<string, number>();
  payments.forEach((p) => byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + num(p.amount)));
  const mpesaPaid = payments.filter((p) => p.method === "MPESA");
  const verifiedShare = mpesaPaid.length ? Math.round((mpesaPaid.filter((p) => p.verified).length / mpesaPaid.length) * 100) : 0;
  const unmatched = txns.filter((t) => !t.claimedAt);
  const unmatchedTotal = unmatched.reduce((t, x) => t + num(x.amount), 0);
  const connected = !!b.c2bRegisteredAt || (await db.mpesaTransaction.count({ where: { businessId: b.id, source: "C2B" } })) > 0;
  const q = (extra: Record<string, string>) => `?${new URLSearchParams({ from, to, ...extra })}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Finance" sub="Every M-Pesa, cash and card payment, matched to receipts">
        <form className="flex items-end gap-2">
          <div><label className="label">From</label><input type="date" name="from" defaultValue={from} className="input" /></div>
          <div><label className="label">To</label><input type="date" name="to" defaultValue={to} className="input" /></div>
          {unmatchedOnly && <input type="hidden" name="show" value="unmatched" />}
          <button className="btn-secondary">Show</button>
        </form>
      </PageHeader>

      {!connected && (
        <div className="flex flex-wrap items-center gap-3 rounded-none border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="flex-1"><b>Automatic M-Pesa verification is off.</b> Connect your till or paybill so payments appear here as they arrive, with the payer&apos;s name and amount filled in when you type a code at checkout.</p>
          {["OWNER", "MANAGER"].includes(user.role) && <Link href="/app/settings#payments" className="btn-secondary btn-sm">Connect M-Pesa</Link>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat tone="brand" label="M-Pesa (sales)" value={money(byMethod.get("MPESA") ?? 0, b.currency)} sub={`${verifiedShare}% verified by Safaricom`} />
        <Stat tone="dark" label="Cash" value={money(byMethod.get("CASH") ?? 0, b.currency)} />
        <Stat tone="plain" label="Card & bank" value={money((byMethod.get("CARD") ?? 0) + (byMethod.get("BANK") ?? 0), b.currency)} sub={`+ ${money(deposits._sum.depositAmount ?? 0, b.currency)} deposits`} />
        <Stat tone={unmatched.length ? "lime" : "plain"} label="Unmatched M-Pesa" value={money(unmatchedTotal, b.currency)} sub={`${unmatched.length} payments without a receipt`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card overflow-x-auto lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-5 py-4">
            <h2 className="section-title">M-Pesa payments received</h2>
            <div className="flex gap-1.5 text-sm">
              <Link href={q({})} className={`rounded-full px-3 py-1 font-semibold ${!unmatchedOnly ? "bg-navy-900 text-white" : "bg-stone-100"}`}>All</Link>
              <Link href={q({ show: "unmatched" })} className={`rounded-full px-3 py-1 font-semibold ${unmatchedOnly ? "bg-navy-900 text-white" : "bg-stone-100"}`}>Unmatched</Link>
            </div>
          </div>
          {txns.length === 0 ? (
            <Empty title="No M-Pesa payments in this period">{connected ? "Payments to your till appear here automatically." : "Payments appear here when recorded at checkout or pasted from an SMS."}</Empty>
          ) : (
            <table className="table">
              <thead><tr><th>Time</th><th>Code</th><th>Payer</th><th className="text-right">Amount</th><th>Matched to</th></tr></thead>
              <tbody>
                {txns.map((t) => {
                  const appt = t.appointmentId ? appts.get(t.appointmentId) : null;
                  return (
                    <tr key={t.id}>
                      <td className="text-xs whitespace-nowrap">{fmtDateTime(t.transTime ?? t.createdAt, tz)}</td>
                      <td><span className="font-mono font-semibold">{t.code}</span><div className="mt-1"><span className={`badge whitespace-nowrap ${SOURCE[t.source].cls}`}>{SOURCE[t.source].label}</span></div></td>
                      <td>{t.payerName ?? <span className="text-stone-400">Unknown</span>}{t.phone && <span className="block text-xs text-stone-500">{t.phone}</span>}</td>
                      <td className="text-right font-semibold">{money(t.amount, b.currency)}</td>
                      <td className="text-sm">
                        {t.payment ? <Link href={`/app/sales/${t.payment.sale.id}`} className="flex items-center gap-1 text-emerald-700 hover:underline">Receipt #{t.payment.sale.number}</Link>
                          : appt ? <Link href={`/app/appointments/${appt.id}`} className="flex items-center gap-1 text-emerald-700 hover:underline">Deposit · {appt.client.name}</Link>
                          : <Link href={`/app/sales/new?mpesa=${t.code}`} className="btn-secondary btn-sm">Record sale</Link>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="section-title">Add from SMS</h2>
            <p className="mb-3 text-sm text-stone-500">Using Pochi la Biashara or a personal number? Paste the M-Pesa message and we&apos;ll read the code, name and amount.</p>
            <ActionForm action={addFromSms} submit="Add payment" submitClass="btn-secondary" className="space-y-3">
              <textarea name="sms" rows={4} className="input" placeholder="SKF3H7XQ2P Confirmed. Ksh1,500.00 received from JOHN DOE 0712345678 on 15/11/26 at 10:31 AM…" required />
            </ActionForm>
          </section>
          <section className="card p-5">
            <h2 className="section-title mb-3">Takings by method</h2>
            {byMethod.size === 0 ? <p className="text-sm text-stone-500">No sales in this period.</p> : (
              <ul className="space-y-2 text-sm">{[...byMethod].sort((a, z) => z[1] - a[1]).map(([m, v]) => <li key={m} className="flex justify-between"><span>{METHOD_LABEL[m]}</span><b>{money(v, b.currency)}</b></li>)}</ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
