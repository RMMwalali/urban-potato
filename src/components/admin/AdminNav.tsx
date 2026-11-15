"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/businesses", label: "Salons & trials" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/api-keys", label: "API keys" },
  { href: "/admin/seo", label: "SEO & meta" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/audit", label: "Audit log" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
      {items.map(({ href, label }) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`label-caps relative py-1 transition-colors duration-500 ${active ? "text-ink" : "text-muted hover:text-ink"}`}>
            {label}
            <span className={`absolute -bottom-0.5 left-0 h-px bg-ink transition-all duration-700 ${active ? "w-full" : "w-0"}`} />
          </Link>
        );
      })}
    </nav>
  );
}
