import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/platform";
import { mediaUrl } from "@/lib/media";
import { saveHomepage } from "@/app/actions/admin";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Homepage" };
export const dynamic = "force-dynamic";

export default async function HomepageAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const [{ general }, salons] = await Promise.all([
    getSettings(),
    db.business.findMany({
      where: { isShowcase: false },
      orderBy: [{ featureConsent: "desc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, city: true, featureConsent: true, homeLogo: true, homeServices: true, logoId: true, _count: { select: { media: { where: { kind: "service" } } } } },
    }),
  ]);
  const logos = await db.media.findMany({ where: { id: { in: salons.map((s) => s.logoId).filter(Boolean) as string[] } }, select: { id: true, alt: true, mime: true } });
  const shownLogos = salons.filter((s) => s.homeLogo).length, shownSvc = salons.filter((s) => s.homeServices).length;

  return (
    <form action={saveHomepage} className="max-w-5xl space-y-12">
      <PageHeader title="Homepage" label="Website" sub="Choose which real salons appear on the landing page. Only salons that agreed in their Settings (Logo & sharing) can be picked; their own logos and service photos are used, nothing made up." />
      {saved && <p className="border-l-2 border-ink bg-panel px-4 py-3 text-[14px]">Saved. The landing page is updated.</p>}

      <section className="grid gap-4 border-t-2 border-ink pt-6 sm:grid-cols-2">
        <label className="flex items-start gap-3 border border-ink/25 p-4">
          <input type="checkbox" name="homeServicesEnabled" defaultChecked={general.homeServicesEnabled} className="mt-1" />
          <span><span className="block text-[17px]">Services carousel</span><span className="text-[13px] text-muted">Moving photos of featured salons&apos; services at the top of the landing page ({shownSvc} salon{shownSvc === 1 ? "" : "s"} picked). With none picked it shows moving service names instead.</span></span>
        </label>
        <label className="flex items-start gap-3 border border-ink/25 p-4">
          <input type="checkbox" name="homeLogosEnabled" defaultChecked={general.homeLogosEnabled} className="mt-1" />
          <span><span className="block text-[17px]">“Who we work with” logos</span><span className="text-[13px] text-muted">An animated band of salon logos ({shownLogos} picked). Hidden when switched off or when no logos are picked.</span></span>
        </label>
      </section>

      <section>
        <p className="label-caps mb-4">Salons</p>
        <div className="overflow-x-auto border-t-2 border-ink">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead><tr className="label-caps text-muted"><th className="py-3 font-normal">Salon</th><th className="font-normal">Logo</th><th className="font-normal">Photos</th><th className="font-normal">Agreed</th><th className="text-center font-normal">Show logo</th><th className="text-center font-normal">Show services</th></tr></thead>
            <tbody>
              {salons.length === 0 && <tr><td colSpan={6} className="py-4 text-muted">No salons yet.</td></tr>}
              {salons.map((s) => {
                const logo = logos.find((l) => l.id === s.logoId);
                return (
                  <tr key={s.id} className={`border-t border-ink/25 ${s.featureConsent ? "" : "opacity-50"}`}>
                    <td className="py-3 pr-4"><input type="hidden" name="salon" value={s.id} /><Link href={`/book/${s.slug}`} target="_blank" className="hover:opacity-60">{s.name}</Link>{s.city && <span className="block text-[12px] text-muted">{s.city}</span>}</td>
                    <td className="pr-4">
                      {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(logo, "thumb")} alt="" className="h-8 w-auto max-w-[96px] object-contain" />
                      ) : <span className="text-muted">None</span>}
                    </td>
                    <td className="pr-4 tabular-nums">{s._count.media}</td>
                    <td className="pr-4">{s.featureConsent ? "Yes" : "Not yet"}</td>
                    <td className="text-center"><input type="checkbox" name={`logo_${s.id}`} defaultChecked={s.homeLogo} disabled={!s.featureConsent || !logo} aria-label={`Show ${s.name} logo`} /></td>
                    <td className="text-center"><input type="checkbox" name={`svc_${s.id}`} defaultChecked={s.homeServices} disabled={!s.featureConsent || s._count.media === 0} aria-label={`Show ${s.name} services`} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-muted">Salons that haven&apos;t agreed can&apos;t be picked. If a salon later withdraws, it disappears from the landing page automatically.</p>
      </section>
      <button className="btn-primary">Save homepage</button>
    </form>
  );
}
