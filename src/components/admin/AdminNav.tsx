"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Admin menu: four groups; pages inside a group are tabs at the top of the page.
export const GROUPS = [
  { label: "Overview", items: [{ href: "/admin", label: "Overview" }] },
  { label: "Salons", items: [{ href: "/admin/businesses", label: "Salons & trials" }, { href: "/admin/leads", label: "Leads" }, { href: "/admin/complaints", label: "Complaints" }, { href: "/admin/users", label: "Users" }, { href: "/admin/map", label: "Map" }] },
  { label: "Marketing", items: [{ href: "/admin/homepage", label: "Homepage" }, { href: "/admin/reviews", label: "Reviews" }, { href: "/admin/seo", label: "SEO & meta" }, { href: "/admin/reel", label: "Reel studio" }, { href: "/admin/brand", label: "Brand" }] },
  { label: "Platform", items: [{ href: "/admin/settings", label: "Settings" }, { href: "/admin/api-keys", label: "Connections" }, { href: "/admin/audit", label: "Audit log" }] },
];

const matches = (path: string, href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));
const groupOf = (path: string) => GROUPS.find((g) => g.items.some((i) => matches(path, i.href)));

export function AdminNav() {
  const path = usePathname();
  const current = groupOf(path);
  return (
    <nav className="flex flex-wrap items-center gap-x-7 gap-y-2" aria-label="Admin">
      {GROUPS.map((g) => {
        const active = current === g;
        return (
          <Link key={g.label} href={g.items[0].href} aria-current={active ? "page" : undefined} className={`label-caps relative py-1 transition-colors duration-500 ${active ? "text-ink" : "text-muted hover:text-ink"}`}>
            {g.label}
            <span className={`absolute -bottom-0.5 left-0 h-px bg-ink transition-all duration-700 ${active ? "w-full" : "w-0"}`} />
          </Link>
        );
      })}
    </nav>
  );
}

/** Tabs for the pages inside the current group (hidden for single-page groups). */
export function AdminSubNav() {
  const path = usePathname();
  const g = groupOf(path);
  if (!g || g.items.length < 2) return <div className="h-10 md:h-12" />;
  return (
    <div className="-mx-5 mb-10 overflow-x-auto border-b border-ink/30 px-5 pt-4 sm:-mx-8 sm:px-8">
      <nav className="flex min-w-max gap-1" aria-label={g.label}>
        {g.items.map((i) => {
          const on = matches(path, i.href);
          return (
            <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined}
              className={`-mb-px border-b-2 px-3 py-2.5 text-[13px] uppercase tracking-[0.06em] transition-colors ${on ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}>
              {i.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
