import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MANAGERS, requireUser } from "@/lib/auth";
import { displayPhone, fmtDate, fmtDateTime, METHOD_LABEL, money, num } from "@/lib/format";
import { PAY_TYPE_LABEL } from "@/lib/payroll";
import { approvePayRun, deletePayRun, markSlipPaid, recalcPayRun, reopenPayRun, updateSlip } from "@/app/actions/payroll";
import { ConfirmButton } from "@/components/ActionForm";
import { PageHeader, Stat } from "@/components/ui";

export const metadata = { title: "Pay run" };

export default async function PayRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(MANAGERS);
  const b = user.business;
  const tz = b.timezone;
  const run = await db.payRun.findFirst({ where: { id, businessId: b.id }, include: { payslips: { include: { user: true }, orderBy: { user: { name: "asc" } } } } });
  if (!run) notFound();
  const c = b.currency;
  const slips = run.payslips;
  const sum = (k: "gross" | "tips" | "statutory" | "advances" | "commission") => slips.reduce((t, s) => t + num(s[k]), 0);
  const toPay = slips.reduce((t, s) => t + Math.max(0, num(s.net)), 0);
  const owed = slips.reduce((t, s) => t + Math.max(0, -num(s.net)), 0);
  const draft = run.status === "DRAFT";
  const anyPaid = slips.some((s) => s.paidAt);
  const title = `${fmtDate(run.periodStart, tz)} – ${fmtDate(new Date(run.periodEnd.getTime() - 1), tz)}`;
  const statusLabel = { DRAFT: "Draft: check and adjust, then approve", APPROVED: "Approved: pay each person and record it", PAID: "Paid" }[run.status];

  return (
    <div className="space-y-12">
      <Link href="/app/payroll" className="label-caps text-muted hover:text-ink">← Payroll</Link>
      <PageHeader title="Pay run" label={title} sub={statusLabel}>
        {draft && <form action={recalcPayRun.bind(null, run.id)}><button className="btn-secondary">Recalculate</button></form>}
        {draft && <form action={approvePayRun.bind(null, run.id)}><ConfirmButton message="Approve this pay run? Amounts are locked and advances are marked as recovered." className="btn-primary">Approve</ConfirmButton></form>}
        {run.status === "APPROVED" && !anyPaid && <form action={reopenPayRun.bind(null, run.id)}><button className="btn-secondary">Reopen</button></form>}
        <a href={`/app/payroll/${run.id}/export`} className="btn-secondary">Export CSV</a>
        {draft && <form action={deletePayRun.bind(null, run.id)}><ConfirmButton message="Delete this draft pay run?" className="btn-ghost">Delete</ConfirmButton></form>}
      </PageHeader>

      <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        <Stat label="To pay staff" value={money(toPay, c)} sub={`${slips.length} staff`} />
        <Stat label="Commission" value={money(sum("commission"), c)} sub={`gross pay ${money(sum("gross"), c)}`} />
        <Stat label="Tips" value={money(sum("tips"), c)} sub="paid out in full" />
        <Stat label="Deductions" value={money(sum("statutory") + sum("advances"), c)} sub={owed ? `chair rent due ${money(owed, c)}` : "statutory + advances"} />
      </div>

      <ul className="border-t-2 border-ink" data-tour="payroll-slips">
        {slips.map((s) => {
          const lines = (s.statutoryLines as { name: string; amount: number }[] | null) ?? [];
          const net = num(s.net);
          return (
            <li key={s.id} className="border-b border-ink/30 py-6">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="text-[22px] leading-tight">{s.user.name}</p>
                  <p className="label-caps text-muted">{PAY_TYPE_LABEL[s.payType]} · {s.services} services · {money(s.serviceRevenue, c)} revenue{s.user.statutory ? " · statutory on" : ""}</p>
                </div>
                <div className="text-right">
                  <p className="label-caps text-muted">{net < 0 ? "Owes the salon" : "Net pay"}</p>
                  <p className={`text-[28px] tabular-nums ${net < 0 ? "text-pink" : ""}`}>{money(Math.abs(net), c)}</p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[14px] sm:grid-cols-4 lg:grid-cols-8">
                {[
                  ["Base", s.base], ["Commission", s.commission], ["Bonus", s.bonus], ["Tips", s.tips],
                  ["Statutory", s.statutory], ["Advances", s.advances], ["Other deductions", s.otherDeductions], ["Chair rent", s.chairRent],
                ].map(([k, v]) => (
                  <div key={k as string}><dt className="label-caps text-muted">{k as string}</dt><dd className="tabular-nums">{money(num(v as never), c)}</dd></div>
                ))}
              </dl>
              {lines.length > 0 && <p className="mt-2 text-[13px] text-muted">{lines.map((l) => `${l.name} ${money(l.amount, c)}`).join(" · ")}</p>}
              {s.note && <p className="mt-2 text-[13px]">Note: {s.note}</p>}

              {draft && (
                <form action={updateSlip} className="mt-4 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="slipId" value={s.id} />
                  <div className="w-28"><label className="label">Base</label><input name="base" type="number" min={0} step="0.01" defaultValue={num(s.base)} className="input" /></div>
                  <div className="w-28"><label className="label">Bonus</label><input name="bonus" type="number" min={0} step="0.01" defaultValue={num(s.bonus)} className="input" /></div>
                  <div className="w-36"><label className="label">Other deductions</label><input name="otherDeductions" type="number" min={0} step="0.01" defaultValue={num(s.otherDeductions)} className="input" /></div>
                  <div className="min-w-[160px] flex-1"><label className="label">Note</label><input name="note" defaultValue={s.note ?? ""} className="input" placeholder="e.g. damaged product" /></div>
                  <button className="btn-secondary btn-sm">Update</button>
                </form>
              )}

              {!draft && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link href={`/app/payslips/${s.id}`} className="btn-secondary btn-sm">Payslip</Link>
                  {s.paidAt ? (
                    <span className="label-caps text-muted">Paid {fmtDateTime(s.paidAt, tz)} · {s.paidMethod ? METHOD_LABEL[s.paidMethod] : ""}{s.paidRef ? ` ${s.paidRef}` : ""}</span>
                  ) : net > 0 ? (
                    <form action={markSlipPaid} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="slipId" value={s.id} />
                      <select name="method" className="input w-32 py-1.5 text-[13px]" defaultValue="MPESA"><option value="MPESA">M-Pesa</option><option value="CASH">Cash</option><option value="BANK">Bank</option><option value="OTHER">Other</option></select>
                      <input name="ref" placeholder="M-Pesa / bank ref" className="input w-40 py-1.5 text-[13px]" />
                      <button className="btn-primary btn-sm">Mark paid</button>
                      <span className="label-caps text-muted">{s.user.payoutPhone || s.user.phone ? `to ${displayPhone(s.user.payoutPhone || s.user.phone || "")}` : ""}</span>
                    </form>
                  ) : net < 0 ? <span className="label-caps text-pink">Collect {money(-net, c)} chair rent</span> : <span className="label-caps text-muted">Nothing to pay</span>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-[13px] text-muted">Commission is taken from each sale as recorded (after discounts). Tips assigned to a stylist are paid out in full and not taxed here. Statutory deductions only apply to staff marked as employees; check your rules in Deductions settings.</p>
    </div>
  );
}
