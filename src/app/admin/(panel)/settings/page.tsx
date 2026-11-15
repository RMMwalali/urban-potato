import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getSettings } from "@/lib/platform";
import { fmtDateTime } from "@/lib/format";
import { addAdmin, changeOwnAdminPassword, removeAdmin, saveSettingsGroup } from "@/app/actions/admin";
import { ActionForm, ConfirmButton } from "@/components/ActionForm";
import { Alert, PageHeader } from "@/components/ui";

export default async function PlatformSettings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const me = await requireAdmin();
  const [{ general }, admins] = await Promise.all([getSettings(), db.platformAdmin.findMany({ orderBy: { createdAt: "asc" } })]);
  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Platform settings" />
      {saved && <Alert tone="success">Settings saved.</Alert>}
      <section className="card p-5">
        <h2 className="section-title mb-4">General</h2>
        <form action={saveSettingsGroup} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="group" value="general" />
          <div><label className="label">Platform name</label><input name="siteName" defaultValue={general.siteName} className="input" /></div>
          <div><label className="label">Free trial length (days)</label><input name="trialDays" type="number" min={1} max={90} defaultValue={general.trialDays} className="input" /></div>
          <div><label className="label">Monthly price</label><input name="monthlyPrice" type="number" min={0} defaultValue={general.monthlyPrice} className="input" /></div>
          <div><label className="label">Annual price</label><input name="annualPrice" type="number" min={0} defaultValue={general.annualPrice} className="input" /></div>
          <div><label className="label">Lifetime price (one-time)</label><input name="lifetimePrice" type="number" min={0} defaultValue={general.lifetimePrice} className="input" /></div>
          <div><label className="label">Lifetime places</label><input name="lifetimeLimit" type="number" min={0} defaultValue={general.lifetimeLimit} className="input" /></div>
          <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="lifetimeEnabled" defaultChecked={general.lifetimeEnabled} /> Offer the lifetime plan</label>
          <div><label className="label">Currency</label><input name="currency" defaultValue={general.currency} className="input" /></div>
          <div><label className="label">Support email</label><input name="supportEmail" type="email" defaultValue={general.supportEmail} className="input" /></div>
          <div><label className="label">Support phone</label><input name="supportPhone" defaultValue={general.supportPhone} className="input" /></div>
          <div><label className="label">Support WhatsApp (e.g. 254712345678)</label><input name="supportWhatsApp" defaultValue={general.supportWhatsApp} className="input" /></div>
          <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="signupEnabled" defaultChecked={general.signupEnabled} className="accent-brand-600" /> Allow new salons to sign up</label>
          <div className="border-t border-ink pt-4 sm:col-span-2">
            <p className="label-caps mb-1">Founding offer</p>
            <p className="mb-4 text-[13px] text-muted">The first salons that actually subscribe (not free trials) get a discount for a set number of months. It&apos;s applied automatically when you activate a salon.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="label">Places</label><input name="foundingSlots" type="number" min={0} defaultValue={general.foundingSlots} className="input" /></div>
              <div><label className="label">Discount %</label><input name="foundingPercent" type="number" min={0} max={100} defaultValue={general.foundingPercent} className="input" /></div>
              <div><label className="label">Months</label><input name="foundingMonths" type="number" min={0} max={36} defaultValue={general.foundingMonths} className="input" /></div>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" name="foundingOfferEnabled" defaultChecked={general.foundingOfferEnabled} /> Offer is open</label>
          </div>
          <div className="sm:col-span-2"><button className="btn-primary">Save settings</button></div>
        </form>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="section-title mb-3">Platform admins</h2>
          <ul className="mb-4 divide-y divide-stone-100">
            {admins.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                <span><b>{a.name}</b><span className="block text-xs text-stone-500">{a.email} · last login {a.lastLoginAt ? fmtDateTime(a.lastLoginAt, "Africa/Nairobi") : "never"}</span></span>
                {a.id !== me.id && <form action={removeAdmin.bind(null, a.id)}><ConfirmButton message={`Remove admin ${a.email}?`}>Delete</ConfirmButton></form>}
              </li>
            ))}
          </ul>
          <ActionForm action={addAdmin} submit="Add admin" submitClass="btn-secondary" className="space-y-3">
            <input name="name" placeholder="Name" className="input" />
            <input name="email" type="email" placeholder="Email" className="input" required />
            <input name="password" type="password" placeholder="Password (12+ characters)" className="input" required autoComplete="new-password" />
          </ActionForm>
        </section>
        <section className="card p-5">
          <h2 className="section-title mb-3">Change your password</h2>
          <ActionForm action={changeOwnAdminPassword} submit="Change password" submitClass="btn-secondary" className="space-y-3">
            <input name="current" type="password" placeholder="Current password" className="input" required autoComplete="current-password" />
            <input name="password" type="password" placeholder="New password (12+ characters)" className="input" required autoComplete="new-password" />
          </ActionForm>
        </section>
      </div>
    </div>
  );
}
