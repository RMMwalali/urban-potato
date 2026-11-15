import { db } from "@/lib/db";
import { MANAGERS, requireUser } from "@/lib/auth";
import { money, num } from "@/lib/format";
import { addServiceTemplate, saveService, toggleService } from "@/app/actions/manage";
import { PageHeader } from "@/components/ui";
import { SERVICE_TEMPLATES } from "@/lib/templates";

export const metadata = { title: "Services" };

export default async function ServicesPage() {
  const user = await requireUser(MANAGERS);
  const b = user.business;
  const services = await db.service.findMany({ where: { businessId: b.id }, orderBy: [{ active: "desc" }, { category: "asc" }, { name: "asc" }] });
  const categories = [...new Set(services.map((s) => s.category))];

  return (
    <div className="space-y-5">
      <PageHeader title="Services & prices" sub="Your menu: what clients can book and what you charge" />
      {services.length === 0 && (
        <div className="card bg-ink p-6 text-white">
          <p className="flex items-center gap-2 font-display text-xl font-bold">Start from a template</p>
          <p className="mt-1 text-sm text-white/70">Add a typical menu in one click, then edit names, times and prices to match yours. Or add your own services below.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(SERVICE_TEMPLATES).map(([k, t]) => (
              <form key={k} action={addServiceTemplate.bind(null, k)}><button className="btn bg-white/10 text-white hover:bg-white/20">+ {t.label}</button></form>
            ))}
          </div>
        </div>
      )}

      <form action={saveService} className="card grid gap-3 p-4 sm:grid-cols-6">
        <div className="sm:col-span-2"><label className="label">Service name</label><input name="name" className="input" required placeholder="e.g. Knotless braids" /></div>
        <div><label className="label">Category</label><input name="category" className="input" list="cats" defaultValue="Hair" required /></div>
        <div><label className="label">Minutes</label><input name="durationMin" type="number" min={5} step={5} defaultValue={60} className="input" required /></div>
        <div><label className="label">Price ({b.currency})</label><input name="price" type="number" min={0} className="input" required /></div>
        <div className="flex items-end"><button className="btn-primary w-full">Add service</button></div>
        <input type="hidden" name="onlineBooking" value="on" />
        <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Service</th><th>Category</th><th>Duration</th><th>Price</th><th>Online</th><th /></tr></thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className={s.active ? "" : "opacity-50"}>
                <td colSpan={5} className="p-0">
                  <form action={saveService} className="grid grid-cols-[2fr_1fr_90px_110px_60px_auto] items-center gap-2 px-4 py-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input name="name" defaultValue={s.name} className="input" />
                    <input name="category" defaultValue={s.category} className="input" list="cats" />
                    <input name="durationMin" type="number" defaultValue={s.durationMin} className="input" />
                    <input name="price" type="number" defaultValue={num(s.price)} className="input" />
                    <input type="checkbox" name="onlineBooking" defaultChecked={s.onlineBooking} className="mx-auto accent-brand-600" title="Bookable online" />
                    {!s.active && <input type="hidden" name="active" value="off" />}
                    <button className="btn-secondary btn-sm">Save</button>
                  </form>
                </td>
                <td>
                  <form action={toggleService.bind(null, s.id)}>
                    <button className="btn-sm text-xs text-stone-500 hover:text-brand-700">{s.active ? "Archive" : "Restore"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[13px] text-muted">Archived services stay on past records but can&apos;t be booked.</p>
    </div>
  );
}
