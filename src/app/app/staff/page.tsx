import Link from "next/link";
import { UserCog } from "lucide-react";
import { TitleIcon } from "@/components/ui";
import { db } from "@/lib/db";
import { MANAGERS, requireUser } from "@/lib/auth";
import { displayPhone, num } from "@/lib/format";
import { saveStaff, toggleStaff } from "@/app/actions/manage";

export const metadata = { title: "Staff" };

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ edit?: string; new?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser(MANAGERS);
  const [staff, allServices] = await Promise.all([
    db.user.findMany({ where: { businessId: user.businessId }, include: { services: { select: { id: true, name: true } } }, orderBy: [{ active: "desc" }, { name: "asc" }] }),
    db.service.findMany({ where: { businessId: user.businessId, active: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ]);
  const editing = sp.edit ? staff.find((s) => s.id === sp.edit) : null;
  const showForm = sp.new || editing;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <h1 className="page-title flex items-center gap-3"><TitleIcon icon={UserCog} />Staff</h1>
        <Link href="?new=1" className="btn-primary">+ Add staff member</Link>
      </div>

      {showForm && (
        <form action={saveStaff} className="card grid gap-3 p-5 sm:grid-cols-3">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div><label className="label">Name</label><input name="name" defaultValue={editing?.name} className="input" required /></div>
          <div><label className="label">Email (used to log in)</label><input name="email" type="email" defaultValue={editing?.email} className="input" required /></div>
          <div><label className="label">Phone</label><input name="phone" defaultValue={editing?.phone ? displayPhone(editing.phone) : ""} className="input" /></div>
          <div><label className="label">Job title</label><input name="title" defaultValue={editing?.title ?? ""} className="input" placeholder="e.g. Nail technician" /></div>
          <div>
            <label className="label">Access</label>
            <select name="role" defaultValue={editing?.role ?? "STAFF"} className="input">
              <option value="STAFF">Staff: calendar, clients, checkout</option>
              <option value="MANAGER">Manager: plus services, staff, reports</option>
              {user.role === "OWNER" && <option value="OWNER">Owner: everything</option>}
            </select>
          </div>
          <div><label className="label">Commission %</label><input name="commissionRate" type="number" min={0} max={100} step="0.5" defaultValue={editing ? num(editing.commissionRate) : 0} className="input" /></div>
          <div><label className="label">{editing ? "New password (leave blank to keep)" : "Temporary password"}</label><input name="password" type="password" minLength={8} className="input" required={!editing} /></div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="bookable" defaultChecked={editing?.bookable ?? true} className="accent-brand-600" /> Takes appointments</label>
          <fieldset className="sm:col-span-3">
            <legend className="label">Services they perform <span className="font-normal text-stone-400">(none ticked = all services)</span></legend>
            <div className="grid gap-1.5 sm:grid-cols-3">
              {allServices.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="serviceIds" value={s.id} defaultChecked={editing?.services.some((x) => x.id === s.id)} className="accent-brand-600" />
                  {s.name} <span className="text-xs text-stone-400">{s.category}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2 sm:col-span-3"><button className="btn-primary">Save</button><Link href="/app/staff" className="btn-secondary">Cancel</Link></div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Name</th><th>Role</th><th>Contact</th><th>Commission</th><th>Bookable</th><th /></tr></thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className={s.active ? "" : "opacity-50"}>
                <td>
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                    <span><span className="font-medium">{s.name}</span><span className="block text-xs text-stone-500">{s.title}</span></span>
                  </span>
                </td>
                <td className="capitalize">{s.role.toLowerCase()}</td>
                <td className="text-xs">{s.email}<br />{s.phone && displayPhone(s.phone)}</td>
                <td>{num(s.commissionRate)}%</td>
                <td>{s.bookable ? "Yes" : "No"}<span className="block text-xs text-stone-500">{s.services.length ? `${s.services.length} services` : "All services"}</span></td>
                <td className="whitespace-nowrap text-right">
                  <Link href={`?edit=${s.id}`} className="btn-secondary btn-sm">Edit</Link>{" "}
                  {s.id !== user.id && (
                    <form action={toggleStaff.bind(null, s.id)} className="inline">
                      <button className="btn-sm text-xs text-stone-500 hover:text-brand-700">{s.active ? "Deactivate" : "Reactivate"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
