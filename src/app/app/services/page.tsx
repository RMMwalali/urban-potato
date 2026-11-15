import { db } from "@/lib/db";
import { MANAGERS, requireUser } from "@/lib/auth";
import { money, num } from "@/lib/format";
import Link from "next/link";
import { addServiceTemplate, toggleService } from "@/app/actions/manage";
import { mediaUrl } from "@/lib/media";
import { PageHeader } from "@/components/ui";
import { SERVICE_TEMPLATES } from "@/lib/templates";

export const metadata = { title: "Services" };

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser(MANAGERS);
  const b = user.business;
  const services = await db.service.findMany({ where: { businessId: b.id }, include: { media: { where: { styleId: null }, orderBy: { position: "asc" }, take: 1, select: { id: true, alt: true, mime: true } }, _count: { select: { styles: true, media: true } } }, orderBy: [{ active: "desc" }, { category: "asc" }, { name: "asc" }] });

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

      <div className="flex flex-wrap items-center justify-between gap-3" data-tour="services">
        <p className="text-[14px] text-muted">Every service needs at least one photo. Photos show on your booking page and gallery.</p>
        <Link href="/app/services/new" className="btn-primary">+ Add service</Link>
      </div>
      {sp.saved && <p className="border-l-2 border-ink bg-panel px-3 py-2 text-[14px]">Service saved.</p>}
      {services.some((s) => s.active && s.media.length === 0) && (
        <p className="border-l-2 border-pink bg-panel px-3 py-2 text-[14px]">{services.filter((s) => s.active && s.media.length === 0).length} service(s) still need a photo. Open each one and add at least one.</p>
      )}

      <ul className="border-t-2 border-ink">
        {services.map((s) => {
          const cover = s.media[0];
          return (
            <li key={s.id} className={`grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-ink/30 py-3 sm:grid-cols-[72px_2fr_1fr_1fr_auto] ${s.active ? "" : "opacity-50"}`}>
              <Link href={`/app/services/${s.id}`} className="block aspect-[4/5] overflow-hidden bg-panel">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(cover, "thumb")} alt={cover.alt} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full items-center justify-center px-1 text-center text-[10px] uppercase leading-tight text-pink">Needs photo</span>
                )}
              </Link>
              <Link href={`/app/services/${s.id}`} className="min-w-0 hover:opacity-60">
                <span className="block truncate text-[17px]">{s.name}</span>
                <span className="label-caps block truncate text-muted">{s.category} · {s._count.media} photo{s._count.media === 1 ? "" : "s"}{s._count.styles ? ` · ${s._count.styles} style${s._count.styles === 1 ? "" : "s"}` : ""}{s.onlineBooking ? "" : " · not online"}</span>
              </Link>
              <span className="hidden text-[15px] sm:block">{s.durationMin} min</span>
              <span className="hidden text-[15px] tabular-nums sm:block">{money(num(s.price), b.currency)}</span>
              <div className="flex items-center gap-3">
                <Link href={`/app/services/${s.id}`} className="btn-secondary btn-sm">Edit</Link>
                <form action={toggleService.bind(null, s.id)}><button className="label-caps text-muted hover:text-ink">{s.active ? "Archive" : "Restore"}</button></form>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-[13px] text-muted">Archived services stay on past records but can&apos;t be booked.</p>
    </div>
  );
}
