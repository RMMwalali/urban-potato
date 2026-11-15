import Link from "next/link";
import { mapData, PIN_STATUS } from "@/lib/customers";
import { CustomerGlobe } from "@/components/admin/CustomerGlobe";

export const metadata = { title: "Customer map" };
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const { pins, visitors, funnel, abandoned, topPlaces } = await mapData();
  const rate = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");
  return (
    <div className="space-y-14">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ink pb-6">
        <div>
          <p className="label-caps mb-4 text-muted">Customers</p>
          <h1 className="page-title">Where they are</h1>
        </div>
        <p className="max-w-md text-[14px] text-muted">Salons are placed by the county or region they gave at sign-up, or by their network location. Visitors are people who opened the sign-up page but have no account yet.</p>
      </div>

      <div className="-mx-5 sm:-mx-8">
        <CustomerGlobe pins={pins} visitors={visitors} legend={PIN_STATUS} />
      </div>

      <section>
        <p className="label-caps mb-6">Sign-up funnel · last 30 days</p>
        <div className="grid grid-cols-1 border-t-2 border-ink sm:grid-cols-3">
          {[
            { k: "Visited sign-up", v: funnel.visitors, sub: "unique visitors" },
            { k: "Tried to sign up", v: funnel.attempted, sub: `${rate(funnel.attempted, funnel.visitors)} of visitors` },
            { k: "Created an account", v: funnel.created, sub: `${rate(funnel.created, funnel.visitors)} of visitors` },
          ].map((s, i) => (
            <div key={s.k} className={`border-b border-ink/30 py-6 sm:border-b-0 ${i ? "sm:border-l sm:pl-6" : ""}`}>
              <p className="label-caps text-muted">{s.k}</p>
              <p className="mt-3 text-[clamp(36px,4vw,56px)] leading-none">{s.v}</p>
              <p className="mt-2 text-[13px] text-muted">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-14 lg:grid-cols-[1fr_2fr]">
        <section>
          <p className="label-caps mb-4">Top places</p>
          <ol className="border-t-2 border-ink">
            {topPlaces.length === 0 && <li className="py-4 text-[14px] text-muted">No salons yet.</li>}
            {topPlaces.map(([place, n]) => (
              <li key={place} className="flex justify-between gap-4 border-b border-ink/30 py-3 text-[15px]"><span>{place}</span><span className="tabular-nums">{n}</span></li>
            ))}
          </ol>
        </section>
        <section>
          <p className="label-caps mb-4">Sign-ups that didn&apos;t go through</p>
          <div className="overflow-x-auto border-t-2 border-ink">
            {abandoned.length === 0 ? (
              <p className="py-4 text-[14px] text-muted">None in the last 90 days.</p>
            ) : (
              <table className="w-full min-w-[620px] text-left text-[14px]">
                <thead><tr className="label-caps text-muted"><th className="py-3 font-normal">When</th><th className="font-normal">Who</th><th className="font-normal">Where</th><th className="font-normal">What went wrong</th></tr></thead>
                <tbody>
                  {abandoned.map((a) => (
                    <tr key={a.id} className="border-t border-ink/30 align-top">
                      <td className="py-3 pr-4 whitespace-nowrap text-muted">{new Date(a.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" })}</td>
                      <td className="py-3 pr-4"><a href={`mailto:${a.email}`} className="underline decoration-1 underline-offset-4 hover:opacity-60">{a.email}</a>{a.businessName && <span className="block text-muted">{a.businessName}</span>}</td>
                      <td className="py-3 pr-4">{a.place || "–"}</td>
                      <td className="py-3">{a.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="mt-3 text-[12px] text-muted">Use these to help people finish signing up. Delete them if someone asks.</p>
        </section>
      </div>
      <p className="text-[13px] text-muted">Showcase salons used for reels are left off the map. <Link href="/admin/businesses" className="underline decoration-1 underline-offset-4">All salons</Link></p>
    </div>
  );
}
