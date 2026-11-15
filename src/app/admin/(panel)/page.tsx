import Link from "next/link";
import { db } from "@/lib/db";
import { accessState, getSettings } from "@/lib/platform";
import { foundingOffer } from "@/lib/offer";
import { fmtDate } from "@/lib/format";
import { BUSINESS_STATUS_STYLE, PageHeader, Stat } from "@/components/ui";

export default async function AdminHome() {
  const week = new Date(Date.now() - 7 * 86400_000);
  const soon = new Date(Date.now() + 3 * 86400_000);
  const [businesses, users, appts7, sales7, credCount, settings] = await Promise.all([
    db.business.findMany({ where: { isShowcase: false }, orderBy: { createdAt: "desc" }, include: { _count: { select: { users: true, appointments: true } } } }),
    db.user.count({ where: { business: { isShowcase: false } } }),
    db.appointment.count({ where: { createdAt: { gte: week }, business: { isShowcase: false } } }),
    db.sale.count({ where: { createdAt: { gte: week }, business: { isShowcase: false } } }),
    db.apiCredential.count(),
    getSettings(),
  ]);
  const offer = await foundingOffer();
  const states = businesses.map((b) => ({ b, s: accessState(b) }));
  const trials = states.filter((x) => x.s.reason === "trial");
  const expiring = trials.filter((x) => x.b.trialEndsAt < soon);
  const paying = states.filter((x) => x.s.reason === "active");
  const locked = states.filter((x) => !x.s.ok);
  const newThisWeek = businesses.filter((b) => b.createdAt >= week).length;

  return (
    <div>
      <PageHeader title="Platform overview" sub={`${settings.general.siteName} · ${settings.general.trialDays}-day free trial`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Salons" value={businesses.length} sub={`${newThisWeek} new this week`} />
        <Stat label="On trial" value={trials.length} sub={`${expiring.length} ending in 3 days`} />
        <Stat label="Paying" value={paying.length} sub={`${locked.length} locked / expired · founding ${offer.used}/${offer.slots}`} />
        <Stat label="Users" value={users} sub={`${appts7} bookings · ${sales7} sales (7d)`} />
      </div>

      {credCount === 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-none border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p>No messaging credentials are configured, so SMS/WhatsApp reminders are only being logged. <Link href="/admin/api-keys" className="font-semibold underline">Add keys in Platform → Connections</Link>.</p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <h2 className="section-title">Trials ending soon</h2>
            <Link href="/admin/businesses?status=trial" className="text-sm underline underline-offset-4 decoration-1 hover:opacity-60">All trials</Link>
          </div>
          {expiring.length === 0 ? <p className="p-5 text-sm text-stone-500">No trials ending in the next 3 days.</p> : (
            <ul className="divide-y divide-stone-100">
              {expiring.map(({ b, s }) => (
                <li key={b.id}><Link href={`/admin/businesses/${b.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-stone-50">
                  <span className="font-medium">{b.name}</span><span className="badge bg-amber-100 text-amber-800">{s.daysLeft}d left</span>
                </Link></li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <h2 className="section-title">Newest salons</h2>
            <Link href="/admin/businesses" className="text-sm underline underline-offset-4 decoration-1 hover:opacity-60">All salons</Link>
          </div>
          {businesses.length === 0 ? <p className="p-5 text-sm text-stone-500">No salons have signed up yet.</p> : (
            <ul className="divide-y divide-stone-100">
              {businesses.slice(0, 8).map((b) => (
                <li key={b.id}><Link href={`/admin/businesses/${b.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-stone-50">
                  <span><span className="block font-medium">{b.name}</span><span className="text-xs text-stone-500">Joined {fmtDate(b.createdAt, b.timezone)} · {b._count.appointments} {b._count.users} staff</span></span>
                  <span className={`badge ${BUSINESS_STATUS_STYLE[b.status]}`}>{b.status.replace("_", " ")}</span>
                </Link></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
