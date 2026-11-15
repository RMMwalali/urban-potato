import "server-only";
import { appUrl } from "@/lib/url";
import type { Metadata } from "next";
import { db } from "./db";
import { getSettings } from "./platform";

const baseUrl = () => appUrl();

/** Root metadata from admin-managed SEO settings. */
export async function rootMetadata(): Promise<Metadata> {
  const { seo, general } = await getSettings();
  return {
    metadataBase: new URL(seo.canonicalUrl || baseUrl()),
    title: { default: seo.defaultTitle, template: seo.titleTemplate || `%s · ${general.siteName}` },
    description: seo.description,
    keywords: seo.keywords ? seo.keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
    applicationName: general.siteName,
    openGraph: { type: "website", siteName: general.siteName, title: seo.defaultTitle, description: seo.description, images: seo.ogImage ? [seo.ogImage] : undefined },
    twitter: { card: seo.ogImage ? "summary_large_image" : "summary", site: seo.twitterHandle || undefined, title: seo.defaultTitle, description: seo.description, images: seo.ogImage ? [seo.ogImage] : undefined },
    verification: seo.googleVerification ? { google: seo.googleVerification } : undefined,
  };
}

/**
 * Metadata for a public page: admin override for `path` (or a wildcard like "/book/*") wins,
 * otherwise the page's own fallback.
 */
export async function pageMetadata(path: string, fallback: { title?: string; description?: string }, wildcard?: string): Promise<Metadata> {
  const find = (p: string) => db.seoPage.findUnique({ where: { path: p } }).catch(() => null);
  const row = (await find(path)) ?? (wildcard ? await find(wildcard) : null);
  const vars = (s?: string | null) => s?.replace(/\{name\}/g, fallback.title ?? "");
  const title = vars(row?.title) || fallback.title;
  const description = vars(row?.description) || fallback.description;
  return {
    ...(title ? { title: path === "/" ? { absolute: title } : title } : {}),
    ...(description ? { description } : {}),
    ...(row?.keywords ? { keywords: row.keywords.split(",").map((k) => k.trim()) } : {}),
    alternates: { canonical: path.includes("*") ? undefined : path },
    openGraph: { ...(title ? { title } : {}), ...(description ? { description } : {}), ...(row?.ogImage ? { images: [row.ogImage] } : {}) },
    ...(row?.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
