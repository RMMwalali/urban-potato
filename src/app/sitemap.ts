import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { accessState } from "@/lib/platform";
import { appUrl } from "@/lib/url";
import { GUIDES } from "@/content/guides";

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
  const salons = await db.business.findMany({ where: { bookingEnabled: true, isShowcase: false }, select: { slug: true, status: true, trialEndsAt: true, paidUntil: true, createdAt: true } }).catch(() => []);
  return [...pages, ...salons.filter((s) => accessState(s).ok).map((s) => ({ url: `${base}/book/${s.slug}`, lastModified: s.createdAt, priority: 0.4 }))];
}
