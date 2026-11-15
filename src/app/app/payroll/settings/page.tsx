import Link from "next/link";
import { MANAGERS, requireUser } from "@/lib/auth";
import { parseConfig } from "@/lib/payroll";
import { loadKenyaTemplate, savePayrollRules } from "@/app/actions/payroll";
import { ConfirmButton } from "@/components/ActionForm";
import { Alert, PageHeader } from "@/components/ui";

export const metadata = { title: "Payroll deductions" };

export default async function PayrollSettings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = await requireUser(MANAGERS);
  const cfg = parseConfig(user.business.payrollConfig);
  return (
    <div className="max-w-3xl space-y-10">
      <Link href="/app/payroll" className="label-caps text-muted hover:text-ink">← Payroll</Link>
      <PageHeader title="Deductions" label="Payroll settings" sub="Statutory deductions apply only to staff marked as employees on the Staff page. Commission-only, casual and chair-rental stylists aren't affected." />
      {saved && <Alert tone="success">Deductions saved. Recalculate any draft pay runs to apply them.</Alert>}
      <Alert tone="warn">Rates change. Confirm current PAYE, SHIF, NSSF and housing levy rates with KRA or your accountant before paying staff. You are responsible for filing and remitting statutory deductions.</Alert>

      <form action={loadKenyaTemplate} className="flex flex-wrap items-center gap-4 border-t-2 border-ink pt-6">
        <p className="flex-1 text-[15px]">Start from the Kenya template: NSSF, SHIF, housing levy and PAYE bands with personal relief, based on 2025 published rates.</p>
        <ConfirmButton message="Replace your current rules with the Kenya template?" className="btn-secondary">Load Kenya template</ConfirmButton>
      </form>

      <form action={savePayrollRules} className="space-y-6">
        {cfg.note && <p className="text-[13px] text-muted">{cfg.note}</p>}
        {cfg.rules.length === 0 && <p className="border-t border-ink/30 py-6 text-[15px] text-muted">No deductions set. Employees will be paid gross.</p>}
        {cfg.rules.map((r) => (
          <fieldset key={r.id} className="border-t border-ink/30 pt-5">
            <div className="flex items-center justify-between gap-4">
              <legend className="text-[19px]">{r.name}<span className="label-caps ml-3 text-muted">{r.kind === "paye" ? "PAYE bands" : r.kind === "percent" ? `% of gross${"preTax" in r && r.preTax ? " · before PAYE" : ""}` : "fixed"}</span></legend>
              <label className="label-caps flex items-center gap-2"><input type="checkbox" name={`keep_${r.id}`} defaultChecked /> Keep</label>
            </div>
            {r.kind === "percent" && (
              <div className="mt-3 grid grid-cols-3 gap-4">
                <div><label className="label">Rate %</label><input name={`rate_${r.id}`} type="number" step="0.01" defaultValue={r.rate} className="input" /></div>
                <div><label className="label">Minimum / month</label><input name={`min_${r.id}`} type="number" step="0.01" defaultValue={r.min ?? ""} className="input" /></div>
                <div><label className="label">Maximum / month</label><input name={`max_${r.id}`} type="number" step="0.01" defaultValue={r.max ?? ""} className="input" /></div>
              </div>
            )}
            {r.kind === "fixed" && <div className="mt-3 w-40"><label className="label">Amount / month</label><input name={`amount_${r.id}`} type="number" step="0.01" defaultValue={r.amount} className="input" /></div>}
            {r.kind === "paye" && (
              <div className="mt-3 space-y-3">
                <div className="w-48"><label className="label">Personal relief / month</label><input name={`relief_${r.id}`} type="number" step="0.01" defaultValue={r.relief} className="input" /></div>
                {r.bands.map((b, i) => (
                  <div key={i} className="grid grid-cols-2 gap-4">
                    <div><label className="label">{b.upTo == null ? "Above previous band" : `Band ${i + 1}: up to`}</label>{b.upTo == null ? <p className="py-2.5 text-[15px] text-muted">no upper limit</p> : <input name={`band_${r.id}_${i}_upTo`} type="number" defaultValue={b.upTo} className="input" />}</div>
                    <div><label className="label">Rate %</label><input name={`band_${r.id}_${i}_rate`} type="number" step="0.01" defaultValue={b.rate} className="input" /></div>
                  </div>
                ))}
              </div>
            )}
          </fieldset>
        ))}
        <fieldset className="border-t border-ink/30 pt-5">
          <legend className="label-caps mb-3">Add a deduction</legend>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2"><label className="label">Name</label><input name="new_name" className="input" placeholder="e.g. Welfare fund" /></div>
            <div><label className="label">Type</label><select name="new_kind" className="input"><option value="percent">% of gross</option><option value="fixed">Fixed amount</option></select></div>
            <div><label className="label">Value</label><input name="new_value" type="number" step="0.01" className="input" /></div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-[14px]"><input type="checkbox" name="new_preTax" /> Deduct before PAYE</label>
        </fieldset>
        <button className="btn-primary">Save deductions</button>
      </form>
    </div>
  );
}
