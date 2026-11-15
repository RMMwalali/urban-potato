import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { accessState } from "@/lib/platform";
import { appUrl } from "@/lib/url";
import { GUIDES } from "@/content/guides";
import { mediaUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const noindex = new Set((await db.seoPage.findMany({ where: { noIndex: true } }).catch(() => [])).map((p) => p.path));
  const now = new Date();
  const all: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1, lastModified: now },
    { url: `${base}/guides`, changeFrequency: "weekly", priority: 0.9, lastModified: now },
    ...GUIDES.map((g) => ({ url: `${base}/guides/${g.slug}`, changeFrequency: "monthly" as const, priority: 0.8, lastModified: new Date(g.updated) })),
    { url: `${base}/signup`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.3 },
  ];
  const pages = all.filter((p) => !noindex.has(p.url.replace(base, "") || "/"));
  if (noindex.has("/book/*")) return pages;
  const salons = (await db.business.findMany({ where: { bookingEnabled: true, isShowcase: false }, select: { id: true, slug: true, status: true, trialEndsAt: true, paidUntil: true, createdAt: true } }).catch(() => [])).filter((s) => accessState(s).ok);
  // Image sitemap entries: every service photo, so search engines find them through the salon pages.
  const photos = await db.media.findMany({
    where: { kind: "service", businessId: { in: salons.map((s) => s.id) }, service: { active: true, onlineBooking: true } },
    select: { id: true, alt: true, mime: true, businessId: true, createdAt: true }, orderBy: { position: "asc" }, take: 20000,
  }).catch(() => []);
  const out: MetadataRoute.Sitemap = [...pages];
  for (const s of salons) {
    const imgs = photos.filter((p) => p.businessId === s.id);
    const updated = imgs.reduce((d, p) => (p.createdAt > d ? p.createdAt : d), s.createdAt);
    out.push({ url: `${base}/book/${s.slug}`, lastModified: updated, priority: 0.5, ...(imgs.length ? { images: imgs.slice(0, 50).map((p) => `${base}${mediaUrl(p)}`) } : {}) });
    if (imgs.length) out.push({ url: `${base}/book/${s.slug}/gallery`, lastModified: updated, priority: 0.5, images: imgs.slice(0, 1000).map((p) => `${base}${mediaUrl(p)}`) });
  }
  return out;
}
