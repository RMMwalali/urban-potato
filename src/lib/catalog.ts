import "server-only";
import type { Business } from "@prisma/client";
import { db } from "./db";
import { num } from "./format";
import { mediaUrl } from "./media";
import { countryName } from "./geo";

const sel = { id: true, alt: true, mime: true, width: true, height: true } as const;

/** A salon's bookable services with photos and styles, as the public pages show them. */
export async function publicCatalog(businessId: string) {
  const services = await db.service.findMany({
    where: { businessId, active: true, onlineBooking: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { media: { where: { styleId: null }, orderBy: { position: "asc" }, select: sel }, styles: { where: { active: true }, orderBy: { position: "asc" }, include: { media: { orderBy: { position: "asc" }, select: sel, take: 1 } } } },
  });
  const photo = (m: { id: string; alt: string; mime: string; width: number; height: number }) => ({ url: mediaUrl(m), thumb: mediaUrl(m, "thumb"), alt: m.alt, width: m.width, height: m.height });
  return services.map((s) => ({
    id: s.id, name: s.name, category: s.category, durationMin: s.durationMin, price: num(s.price), description: s.description,
    photos: s.media.map(photo),
    styles: s.styles.map((st) => ({ id: st.id, name: st.name, price: st.price == null ? null : num(st.price), durationMin: st.durationMin, photo: st.media[0] ? photo(st.media[0]) : null })),
  }));
}
export type Catalog = Awaited<ReturnType<typeof publicCatalog>>;

/** schema.org data for a salon page: who, where, photos and a priced menu. */
export function salonJsonLd(b: Business, services: Catalog, base: string, logo?: string | null) {
  const abs = (u: string) => (u.startsWith("http") ? u : `${base}${u}`);
  const images = services.flatMap((s) => s.photos).slice(0, 20).map((p) => abs(p.url));
  const prices = services.flatMap((s) => [s.price, ...s.styles.map((x) => x.price ?? s.price)]);
  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: b.name,
    url: `${base}/book/${b.slug}`,
    ...(images.length ? { image: images } : {}),
    ...(logo ? { logo: abs(logo) } : {}),
    ...(b.phone ? { telephone: b.phone } : {}),
    address: { "@type": "PostalAddress", ...(b.address ? { streetAddress: b.address } : {}), ...(b.city ? { addressLocality: b.city } : {}), ...(b.region ? { addressRegion: b.region } : {}), addressCountry: b.country ?? "KE" },
    ...(b.latitude != null && b.locationSource === "county" ? {} : b.latitude != null ? { geo: { "@type": "GeoCoordinates", latitude: b.latitude, longitude: b.longitude } } : {}),
    ...(prices.length ? { priceRange: `${b.currency} ${Math.min(...prices).toLocaleString()} – ${Math.max(...prices).toLocaleString()}` } : {}),
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: b.openDays.map((d) => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][d - 1]), opens: b.openTime, closes: b.closeTime }],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        price: s.price,
        priceCurrency: b.currency,
        itemOffered: { "@type": "Service", name: s.name, ...(s.description ? { description: s.description } : {}), ...(s.photos[0] ? { image: abs(s.photos[0].url) } : {}) },
      })),
    },
    areaServed: [b.city, b.region, countryName(b.country)].filter(Boolean).join(", ") || undefined,
  };
}
