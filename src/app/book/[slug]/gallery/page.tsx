import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/url";
import { mediaUrl } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";
import { publicCatalog } from "@/lib/catalog";
import { JsonLd } from "@/components/JsonLd";

async function load(slug: string) {
  const b = await db.business.findUnique({ where: { slug } });
  if (!b) return null;
  const services = await publicCatalog(b.id);
  const styleShots = await db.media.findMany({
    where: { businessId: b.id, kind: "service", styleId: { not: null }, service: { active: true, onlineBooking: true } },
    orderBy: [{ position: "asc" }], select: { id: true, alt: true, mime: true, width: true, height: true, serviceId: true, style: { select: { name: true, price: true } } },
  });
  const items = services.flatMap((s) => [
    ...s.photos.map((p) => ({ ...p, serviceId: s.id, caption: s.name, price: s.price, category: s.category })),
    ...styleShots.filter((m) => m.serviceId === s.id).map((m) => ({ url: mediaUrl(m), thumb: mediaUrl(m, "thumb"), alt: m.alt, width: m.width, height: m.height, serviceId: s.id, caption: `${s.name} · ${m.style?.name ?? ""}`, price: m.style?.price != null ? Number(m.style.price) : s.price, category: s.category })),
  ]);
  return { b, services, items };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const data = await load((await params).slug);
  if (!data) return { title: "Gallery" };
  const { b, services, items } = data;
  if (b.isShowcase) return { title: `${b.name} gallery`, robots: { index: false, follow: false } };
  const where = [b.city, b.region].filter(Boolean).join(", ");
  const names = [...new Set(services.map((s) => s.name))].slice(0, 5).join(", ");
  const meta = await pageMetadata(`/book/${b.slug}/gallery`, { title: `${b.name} photos${where ? ` · ${where}` : ""}`, description: `${items.length} photos of ${names || "our work"} at ${b.name}${where ? ` in ${where}` : ""}. See prices and book online.` });
  return items[0] ? { ...meta, openGraph: { ...meta.openGraph, images: [items[0].url] } } : meta;
}

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await load((await params).slug);
  if (!data) notFound();
  const { b, items } = data;
  const base = appUrl();
  const cats = [...new Set(items.map((i) => i.category))];
  return (
    <main className="min-h-screen bg-paper">
      {!b.isShowcase && (
        <JsonLd data={{
          "@context": "https://schema.org", "@type": "ImageGallery", name: `${b.name} gallery`, url: `${base}/book/${b.slug}/gallery`,
          about: { "@type": "BeautySalon", name: b.name, url: `${base}/book/${b.slug}` },
          associatedMedia: items.slice(0, 60).map((i) => ({ "@type": "ImageObject", contentUrl: `${base}${i.url}`, thumbnailUrl: `${base}${i.thumb}`, name: i.caption, description: i.alt, width: i.width, height: i.height, creditText: b.name, copyrightHolder: { "@type": "Organization", name: b.name } })),
        }} />
      )}
      <header className="border-b border-ink px-5 pt-12 pb-10 sm:px-8">
        <Link href={`/book/${b.slug}`} className="label-caps text-muted hover:text-ink">← Book at {b.name}</Link>
        <h1 className="mt-4 text-[clamp(40px,7vw,96px)] leading-[0.88] uppercase">{b.name}<br />gallery</h1>
        {cats.length > 0 && <p className="label-caps mt-6 text-muted">{cats.join(" · ")}</p>}
      </header>
      <div className="px-5 py-10 sm:px-8">
        {items.length === 0 ? (
          <p className="text-[15px] text-muted">No photos yet.</p>
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
            {items.map((i) => (
              <figure key={i.url} className="group mb-3 break-inside-avoid">
                <Link href={`/book/${b.slug}?service=${i.serviceId}`} className="block overflow-hidden bg-panel">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.url} alt={i.alt} width={i.width} height={i.height} loading="lazy" decoding="async" className="h-auto w-full transition-transform duration-[1.2s] group-hover:scale-[1.04]" style={{ transitionTimingFunction: "cubic-bezier(.19,1,.22,1)" }} />
                </Link>
                <figcaption className="mt-2 flex justify-between gap-2 text-[13px]"><span>{i.caption}</span><span className="tabular-nums text-muted">{b.currency} {i.price.toLocaleString()}</span></figcaption>
              </figure>
            ))}
          </div>
        )}
        <p className="mt-12 text-center"><Link href={`/book/${b.slug}`} className="btn-primary">Book an appointment</Link></p>
      </div>
    </main>
  );
}
