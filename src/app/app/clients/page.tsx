import Link from "next/link";
import { Users } from "lucide-react";
import { TitleIcon } from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { displayPhone, fmtDate, normalizePhone } from "@/lib/format";
import { saveClient } from "@/app/actions/manage";

export const metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; new?: string }> }) {
  const { q = "", new: showNew } = await searchParams;
  const user = await requireUser();
  const b = user.business;
  const digits = q.replace(/\D/g, "");
  const clients = await db.client.findMany({
    where: {
      businessId: b.id,
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, ...(digits.length >= 3 ? [{ phone: { contains: digits.length >= 9 ? normalizePhone(q, b.countryCode) : digits } }] : [])] }
        : {}),
    },
    include: {
      _count: { select: { appointments: true } },
      appointments: { orderBy: { startAt: "desc" }, take: 1, select: { startAt: true } },
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="page-title flex items-center gap-3"><TitleIcon icon={Users} />Clients</h1>
        <div className="flex gap-2">
          <form><input name="q" defaultValue={q} placeholder="Search name or phone…" className="input w-64" /></form>
          {["OWNER", "MANAGER"].includes(user.role) && <a href="/app/export/clients" className="btn-secondary">Export CSV</a>}
          <Link href="?new=1" className="btn-primary">+ Add client</Link>
        </div>
      </div>

      {showNew && (
        <form action={saveClient} className="card grid gap-3 p-5 sm:grid-cols-3">
          <div><label className="label">Full name</label><input name="name" className="input" required /></div>
          <div><label className="label">Phone</label><input name="phone" className="input" required inputMode="tel" /></div>
          <div><label className="label">Email</label><input name="email" type="email" className="input" /></div>
          <div className="sm:col-span-3"><label className="label">Allergies / sensitivities</label><input name="allergies" className="input" /></div>
          <input type="hidden" name="marketingOk" value="on" />
          <div className="flex gap-2 sm:col-span-3"><button className="btn-primary">Save client</button><Link href="/app/clients" className="btn-secondary">Cancel</Link></div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Name</th><th>Phone</th><th>Visits</th><th>Last visit</th><th>Notes</th></tr></thead>
          <tbody>
            {clients.length === 0 && <tr><td colSpan={5} className="text-center text-stone-500">{q ? "No matching clients." : "No clients yet. They're added automatically when you book."}</td></tr>}
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-stone-50">
                <td><Link href={`/app/clients/${c.id}`} className="font-medium hover:text-brand-700">{c.name}</Link></td>
                <td className="whitespace-nowrap">{displayPhone(c.phone)}</td>
                <td>{c._count.appointments}</td>
                <td className="whitespace-nowrap">{c.appointments[0] ? fmtDate(c.appointments[0].startAt, b.timezone) : "-"}</td>
                <td className="max-w-xs truncate text-stone-500">{c.allergies ? <span className="text-rose-700">⚠ {c.allergies}</span> : c.preferences}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
