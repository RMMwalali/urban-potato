import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/platform";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

/** Shared shell for public marketing pages (guides etc.). */
export async function SitePage({ children }: { children: React.ReactNode }) {
  const [session, { general }] = await Promise.all([getSession(), getSettings()]);
  return (
    <main className="bg-paper">
      <SiteHeader name={general.siteName} signedIn={!!session} />
      <div className="px-5 pt-32 sm:px-8 md:pt-40">{children}</div>
      <SiteFooter />
    </main>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="label-caps mb-8 flex flex-wrap gap-2 text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex gap-2">
          {i > 0 && <span aria-hidden>/</span>}
          {it.href ? <Link href={it.href} className="hover:text-ink">{it.label}</Link> : <span className="text-ink">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
