import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { accessState } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const noindex = new Set((await db.seoPage.findMany({ where: { noIndex: true } })).map((p) => p.path));
  const pages = ["/", "/signup", "/login"].filter((p) => !noindex.has(p)).map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.6 }));
  if (noindex.has("/book/*")) return pages;
  const salons = await db.business.findMany({ where: { bookingEnabled: true }, select: { slug: true, status: true, trialEndsAt: true, paidUntil: true, createdAt: true } });
  return [...pages, ...salons.filter((s) => accessState(s).ok).map((s) => ({ url: `${base}/book/${s.slug}`, lastModified: s.createdAt, priority: 0.5 }))];
}
