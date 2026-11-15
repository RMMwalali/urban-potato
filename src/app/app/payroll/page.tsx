import Link from "next/link";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { MANAGERS, requireUser } from "@/lib/auth";
import { fmtDate, money, num } from "@/lib/format";
import { addAdvance, createPayRun, deleteAdvance } from "@/app/actions/payroll";
import { ActionForm, ConfirmButton } from "@/components/ActionForm";
import { Empty, PageHeader } from "@/components/ui";

export const metadata = { title: "Payroll" };

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ start?: string; end?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser(MANAGERS);
  const b = user.business;
  const tz = b.timezone;
  const now = DateTime.now().setZone(tz);
  const presets = [
    { label: "This month", s: now.startOf("month"), e: now.endOf("month") },
    { label: "Last month", s: now.minus({ months: 1 }).startOf("month"), e: now.minus({ months: 1 }).endOf("month") },
    { label: "This week", s: now.startOf("week"), e: now.endOf("week") },
    { label: "Last week", s: now.minus({ weeks: 1 }).startOf("week"), e: now.minus({ weeks: 1 }).endOf("week") },
  ];
  const start = sp.start ?? presets[0].s.toISODate()!;
  const end = sp.end ?? presets[0].e.toISODate()!;
  const [runs, staff, advances] = await Promise.all([
    db.payRun.findMany({ where: { businessId: b.id }, orderBy: { periodStart: "desc" }, include: { payslips: { select: { net: true, paidAt: true } } }, take: 50 }),
    db.user.findMany({ where: { businessId: b.id, active: true }, orderBy: { name: "asc" } }),
    db.staffAdvance.findMany({ where: { businessId: b.id, payslipId: null }, include: { user: true }, orderBy: { date: "desc" } }),
  ]);
  const STATUS = { DRAFT: "Draft", APPROVED: "Approved · to pay", PAID: "Paid" } as const;

  return (
    <div className="space-y-16">
      <PageHeader title="Payroll" label="Staff" sub="Commission and tips come from recorded sales. Salaries, advances and deductions are added for you.">
        <Link href="/app/payroll/settings" className="btn-secondary">Deductions settings</Link>
      </PageHeader>

      <section data-tour="payroll-new">
        <p className="label-caps mb-4">New pay run</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {presets.map((p) => (
            <Link key={p.label} href={`?start=${p.s.toISODate()}&end=${p.e.toISODate()}`} className={`btn btn-sm ${start === p.s.toISODate() && end === p.e.toISODate() ? "border-ink bg-ink text-paper" : "border-ink/30"}`}>{p.label}</Link>
          ))}
        </div>
        <ActionForm action={createPayRun} submit="Calculate pay" className="flex flex-wrap items-end gap-4">
          <div className="min-w-[140px] flex-1"><label className="label">From</label><input type="date" name="start" defaultValue={start} key={`s${start}`} className="input" required /></div>
          <div className="min-w-[140px] flex-1"><label className="label">To (inclusive)</label><input type="date" name="end" defaultValue={end} key={`e${end}`} className="input" required /></div>
          <div className="min-w-[200px] flex-[2]"><label className="label">Note (optional)</label><input name="note" className="input" placeholder="e.g. November pay" /></div>
        </ActionForm>
      </section>

      <section>
        <p className="label-caps mb-4">Pay runs</p>
        <div className="border-t-2 border-ink">
          {runs.length === 0 ? <Empty title="No pay runs yet">Choose a period above and calculate pay.</Empty> : (
            <ul>
              {runs.map((r) => {
                const total = r.payslips.reduce((t, s) => t + Math.max(0, num(s.net)), 0);
                return (
                  <li key={r.id} className="border-b border-ink/30">
                    <Link href={`/app/payroll/${r.id}`} className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-4 transition-colors duration-500 hover:bg-panel sm:grid-cols-[1fr_auto_auto]">
                      <span><span className="block text-[18px]">{fmtDate(r.periodStart, tz)} – {fmtDate(new Date(r.periodEnd.getTime() - 1), tz)}</span><span className="label-caps text-muted">{r.note ?? `${r.payslips.length} staff`}</span></span>
                      <span className="text-[17px] tabular-nums">{money(total, b.currency)}</span>
                      <span className={`label-caps ${r.status === "PAID" ? "text-muted" : r.status === "APPROVED" ? "text-pink" : "text-azure-600"}`}>{STATUS[r.status]}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2" data-tour="payroll-advances">
        <div>
          <p className="label-caps mb-4">Record a salary advance</p>
          <ActionForm action={addAdvance} submit="Record advance" submitClass="btn-secondary" className="space-y-5">
            <div><label className="label">Staff</label><select name="userId" className="input" required defaultValue=""><option value="" disabled>Choose…</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Amount</label><input name="amount" type="number" min={1} className="input" required /></div>
              <div><label className="label">Date</label><input name="date" type="date" defaultValue={now.toISODate()!} className="input" /></div>
            </div>
            <div><label className="label">Note</label><input name="note" className="input" placeholder="e.g. school fees" /></div>
          </ActionForm>
        </div>
        <div>
          <p className="label-caps mb-4">Outstanding advances</p>
          <div className="border-t-2 border-ink">
            {advances.length === 0 ? <p className="py-6 text-[14px] text-muted">None. Advances are deducted automatically in the next pay run.</p> : (
              <ul>
                {advances.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-4 border-b border-ink/30 py-3 text-[15px]">
                    <span>{a.user.name}<span className="label-caps block text-muted">{fmtDate(a.date, tz)}{a.note ? ` · ${a.note}` : ""}</span></span>
                    <span className="flex items-center gap-3"><span className="tabular-nums">{money(a.amount, b.currency)}</span><form action={deleteAdvance.bind(null, a.id)}><ConfirmButton message="Delete this advance?" className="label-caps text-muted hover:text-pink">Delete</ConfirmButton></form></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
