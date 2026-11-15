import Link from "next/link";
import { db } from "@/lib/db";
import { accessState } from "@/lib/platform";
import { fmtDate } from "@/lib/format";
import { resetTrial } from "@/app/actions/admin";
import { Alert, BUSINESS_STATUS_STYLE, Empty, PageHeader } from "@/components/ui";
import type { Prisma } from "@prisma/client";

const FILTERS = [
  ["all", "All"],
  ["trial", "On trial"],
  ["expired", "Trial ended"],
  ["active", "Paying"],
  ["suspended", "Suspended"],
] as const;

export default async function BusinessesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; deleted?: string }> }) {
  const { q = "", status = "all", deleted } = await searchParams;
  const where: Prisma.BusinessWhereInput = q
    ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q.toLowerCase() } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }
    : {};
  const all = await db.business.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, clients: true, appointments: true } }, users: { where: { role: "OWNER" }, take: 1, select: { name: true, email: true } } },
  });
  const rows = all
    .map((b) => ({ b, s: accessState(b) }))
    .filter(({ b, s }) =>
      status === "trial" ? s.reason === "trial" : status === "expired" ? s.reason === "trial_over" || s.reason === "expired" : status === "active" ? s.reason === "active" : status === "suspended" ? b.status === "SUSPENDED" || b.status === "CANCELLED" : true,
    );

  return (
    <div>
      <PageHeader title="Salons & trials" sub={`${all.length} salons`}>
        <form className="relative w-full sm:w-auto">
                    <input name="q" defaultValue={q} placeholder="Name, link, email, phone…" className="input w-full sm:w-72" />
          <input type="hidden" name="status" value={status} />
        </form>
      </PageHeader>
      {deleted && <div className="mb-4"><Alert tone="success">Salon deleted.</Alert></div>}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(([k, label]) => (
          <Link key={k} href={`?status=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${status === k ? "bg-navy-900 text-white" : "bg-white text-stone-600 hover:"}`}>{label}</Link>
        ))}
      </div>
      <div className="card overflow-x-auto">
        {rows.length === 0 ? <Empty title="No salons here">{q ? "Try a different search." : "Salons appear here as soon as they sign up."}</Empty> : (
          <table className="table">
            <thead><tr><th>Salon</th><th>Owner</th><th>Status</th><th>Trial / plan</th><th>Usage</th><th /></tr></thead>
            <tbody>
              {rows.map(({ b, s }) => (
                <tr key={b.id} className="hover:bg-stone-50/60">
                  <td><Link href={`/admin/businesses/${b.id}`} className="font-semibold hover:text-brand-600">{b.name}</Link><span className="block text-xs text-stone-500">/book/{b.slug}</span></td>
                  <td className="text-xs">{b.users[0]?.name}<br /><span className="text-stone-500">{b.users[0]?.email}</span></td>
                  <td><span className={`badge ${BUSINESS_STATUS_STYLE[b.status]}`}>{b.status.replace("_", " ")}</span>{!s.ok && <span className="badge ml-1 text-pink">locked</span>}{b.foundingMember && <span className="badge ml-1 text-azure-600">founding</span>}{b.status === "ACTIVE" && <span className="badge ml-1">{b.plan === "annual" || b.plan === "lifetime" ? b.plan : "monthly"}</span>}</td>
                  <td className="text-xs whitespace-nowrap">
                    {b.status === "TRIAL" ? (s.daysLeft > 0 ? <><b>{s.daysLeft}</b> days left</> : <span className="text-rose-700">Ended {fmtDate(b.trialEndsAt, b.timezone)}</span>) : b.paidUntil ? `Paid until ${fmtDate(b.paidUntil, b.timezone)}` : b.plan}
                  </td>
                  <td className="text-xs text-stone-600">{b._count.users} staff · {b._count.clients} clients · {b._count.appointments} bookings</td>
                  <td className="text-right">
                    <form action={resetTrial.bind(null, b.id)}><button className="btn-secondary btn-sm" title="Restart the free trial from today">Reset trial</button></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
