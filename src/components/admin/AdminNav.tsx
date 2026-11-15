"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Globe, History, KeyRound, LayoutDashboard, Settings, Users } from "lucide-react";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/businesses", label: "Salons & trials", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/api-keys", label: "API keys", icon: KeyRound },
  { href: "/admin/seo", label: "SEO & meta", icon: Globe },
  { href: "/admin/settings", label: "Platform settings", icon: Settings },
  { href: "/admin/audit", label: "Audit log", icon: History },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
            <Icon className={`h-[18px] w-[18px] ${active ? "text-lime-glow" : ""}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
