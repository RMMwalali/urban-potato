"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/calendar", label: "Calendar" },
  { href: "/app/clients", label: "Clients" },
  { href: "/app/sales", label: "Sales" },
  { href: "/app/finance", label: "Finance" },
  { href: "/app/messages", label: "Messages" },
  { href: "/app/me", label: "My earnings" },
  { href: "/app/services", label: "Services", manager: true },
  { href: "/app/staff", label: "Staff", manager: true },
  { href: "/app/reports", label: "Reports", manager: true },
  { href: "/app/settings", label: "Settings", manager: true },
  { href: "/app/billing", label: "Plan & billing", manager: true },
];

export function Nav({ isManager }: { isManager: boolean }) {
  const path = usePathname();
  return (
    <nav className="flex gap-x-5 gap-y-1 overflow-x-auto px-5 pb-4 md:flex-col md:overflow-visible md:pb-0">
      {items
        .filter((i) => !i.manager || isManager)
        .map(({ href, label }) => {
          const active = href === "/app" ? path === "/app" : path.startsWith(href);
          return (
            <Link key={href} href={href} className={`label-caps group flex shrink-0 items-center gap-2 py-1.5 transition-colors duration-500 ${active ? "text-ink" : "text-muted hover:text-ink"}`}>
              <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${active ? "bg-pink" : "bg-transparent group-hover:bg-ink/30"}`} />
              {label}
            </Link>
          );
        })}
    </nav>
  );
}
