import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { accessState, getSettings } from "@/lib/platform";
import { displayPhone, fmtDate, fmtDateTime, money, num } from "@/lib/format";
import { adminSetRole, adminSetUserPassword, adminToggleUser, deleteBusiness, extendTrial, impersonate, resetTrial, saveBusinessNotes, setBusinessStatus } from "@/app/actions/admin";
import { ActionForm, ConfirmButton } from "@/components/ActionForm";
import { Alert, BUSINESS_STATUS_STYLE, PageHeader, Stat } from "@/components/ui";

export default async function BusinessDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const b = await db.business.findUnique({ where: { id }, include: { users: { orderBy: { createdAt: "asc" } }, _count: { select: { clients: true, appointments: true, services: true, messages: true } } } });
  if (!b) notFound();
  const [revenue, settings, history] = await Promise.all([
    db.sale.aggregate({ where: { businessId: b.id }, _sum: { total: true } }),
    getSettings(),
    db.auditLog.findMany({ where: { targetType: "business", targetId: b.id }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);
  const s = accessState(b);
  const tz = b.timezone;

  return (
    <div className="max-w-6xl">
      <Link href="/admin/businesses" className="text-sm text-stone-500 hover:text-ink">← All salons</Link>
      <div className="mt-2" />
      <PageHeader title={b.name} sub={<>/book/{b.slug} · joined {fmtDate(b.createdAt, tz)} {b.phone && `· ${b.phone}`} {b.email && `· ${b.email}`}</>}>
        <span className={`badge text-sm ${BUSINESS_STATUS_STYLE[b.status]}`}>{b.status.replace("_", " ")}</span>
        <a href={`/book/${b.slug}`} target="_blank" className="btn-secondary btn-sm">Booking page</a>
        <form action={impersonate.bind(null, b.id)}><button className="btn-dark btn-sm">Open as owner</button></form>
      </PageHeader>
      {error === "confirm" && <div className="mb-4"><Alert tone="error">Type the salon link exactly to confirm deletion.</Alert></div>}
      {error === "noowner" && <div className="mb-4"><Alert tone="error">This salon has no active owner to open as.</Alert></div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat tone={s.ok ? "lime" : "dark"} label="Access" value={s.ok ? (s.reason === "trial" ? `${s.daysLeft} days` : "Active") : "Locked"} sub={s.reason === "trial" ? `Trial ends ${fmtDate(b.trialEndsAt, tz)}` : s.reason.replace("_", " ")} />
        <Stat tone="plain" label="Revenue recorded" value={money(num(revenue._sum.total), b.currency)} />
        <Stat tone="plain" label="Clients" value={b._count.clients} sub={`${b._count.services} services`} />
        <Stat tone="plain" label="Bookings" value={b._count.appointments} sub={`${b._count.messages} messages sent`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card space-y-4 p-5">
          <h2 className="section-title">Free trial</h2>
          <p className="text-sm text-stone-600">
            {b.status === "TRIAL" ? <>Trial {s.daysLeft > 0 ? "ends" : "ended"} <b>{fmtDateTime(b.trialEndsAt, tz)}</b>.</> : <>Not on trial (status {b.status.toLowerCase()}).</>}
          </p>
          <form action={resetTrial.bind(null, b.id)}>
            <button className="btn-bold w-full">Reset to a fresh {settings.general.trialDays}-day trial</button>
          </form>
          <form action={extendTrial} className="flex gap-2">
            <input type="hidden" name="businessId" value={b.id} />
            <input name="days" type="number" min={1} max={365} defaultValue={7} className="input w-24" />
            <button className="btn-secondary flex-1">Extend by days</button>
          </form>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="section-title">Subscription status</h2>
          <form action={setBusinessStatus} className="space-y-3">
            <input type="hidden" name="businessId" value={b.id} />
            <input type="hidden" name="status" value="ACTIVE" />
            <div className="flex gap-2">
              <select name="months" className="input" defaultValue="1">
                <option value="1">1 month</option><option value="3">3 months</option><option value="6">6 months</option><option value="12">12 months</option><option value="0">No end date</option>
              </select>
              <button className="btn-primary">Activate</button>
            </div>
            {b.paidUntil && <p className="text-xs text-stone-500">Paid until {fmtDate(b.paidUntil, tz)}</p>}
          </form>
          <div className="flex flex-wrap gap-2">
            {(["PAST_DUE", "SUSPENDED", "CANCELLED"] as const).map((st) => (
              <form key={st} action={setBusinessStatus}>
                <input type="hidden" name="businessId" value={b.id} /><input type="hidden" name="status" value={st} />
                <ConfirmButton message={`Set ${b.name} to ${st.replace("_", " ").toLowerCase()}? They will lose access.`}>{st.replace("_", " ").toLowerCase()}</ConfirmButton>
              </form>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="section-title mb-3">Internal notes</h2>
          <form action={saveBusinessNotes} className="space-y-3">
            <input type="hidden" name="businessId" value={b.id} />
            <div><label className="label">Plan</label><input name="plan" defaultValue={b.plan} className="input" /></div>
            <textarea name="adminNotes" defaultValue={b.adminNotes ?? ""} rows={4} className="input" placeholder="Onboarding call notes, payment arrangements…" />
            <button className="btn-secondary btn-sm">Save notes</button>
          </form>
        </section>
      </div>

      <section className="card mt-6 overflow-x-auto">
        <h2 className="section-title border-b border-stone-100 px-5 py-4">Users</h2>
        <table className="table">
          <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Set new password</th><th /></tr></thead>
          <tbody>
            {b.users.map((u) => (
              <tr key={u.id}>
                <td><span className="font-semibold">{u.name}</span><span className="block text-xs text-stone-500">{u.email}{u.phone && ` · ${displayPhone(u.phone)}`}</span></td>
                <td>
                  <form action={adminSetRole} className="flex gap-1">
                    <input type="hidden" name="userId" value={u.id} />
                    <select name="role" defaultValue={u.role} className="input py-1.5 text-xs"><option>OWNER</option><option>MANAGER</option><option>STAFF</option></select>
                    <button className="btn-ghost btn-sm">Save</button>
                  </form>
                </td>
                <td>{u.active ? <span className="badge bg-emerald-100 text-emerald-800">Active</span> : <span className="badge bg-stone-200 text-stone-600">Disabled</span>}</td>
                <td>
                  <ActionForm action={adminSetUserPassword} submit="Set" submitClass="btn-secondary btn-sm" className="flex flex-wrap items-center gap-1">
                    <input type="hidden" name="userId" value={u.id} />
                    <input name="password" type="text" minLength={8} placeholder="New password" className="input w-40 py-1.5 text-xs" autoComplete="off" />
                  </ActionForm>
                </td>
                <td className="text-right"><form action={adminToggleUser.bind(null, u.id)}><button className="btn-ghost btn-sm">{u.active ? "Disable" : "Enable"}</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="section-title mb-3">Admin history</h2>
          {history.length === 0 ? <p className="text-sm text-stone-500">No admin actions yet.</p> : (
            <ul className="space-y-2 text-sm">{history.map((h) => <li key={h.id} className="flex justify-between gap-2"><span><b>{h.action}</b> by {h.actor}</span><span className="text-xs text-stone-500">{fmtDateTime(h.createdAt, tz)}</span></li>)}</ul>
          )}
        </section>
        <section className="card border-rose-200 p-5">
          <h2 className="section-title mb-1 text-rose-700">Danger zone</h2>
          <p className="mb-3 text-sm text-stone-600">Permanently deletes the salon, its users, clients, bookings, sales and messages. This cannot be undone.</p>
          <form action={deleteBusiness} className="flex gap-2">
            <input type="hidden" name="businessId" value={b.id} />
            <input name="confirm" placeholder={`Type "${b.slug}"`} className="input" autoComplete="off" />
            <button className="btn-danger">Delete</button>
          </form>
        </section>
      </div>
    </div>
  );
}
