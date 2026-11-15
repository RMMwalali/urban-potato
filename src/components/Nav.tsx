"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/calendar", label: "Calendar" },
  { href: "/app/clients", label: "Clients" },
  { href: "/app/sales", label: "Sales" },
  { href: "/app/messages", label: "Messages" },
  { href: "/app/services", label: "Services", manager: true },
  { href: "/app/staff", label: "Staff", manager: true },
  { href: "/app/reports", label: "Reports", manager: true },
  { href: "/app/settings", label: "Settings", manager: true },
];

export function Nav({ isManager }: { isManager: boolean }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:flex-col md:overflow-visible md:pb-0">
      {items
        .filter((i) => !i.manager || isManager)
        .map((i) => {
          const active = i.href === "/app" ? path === "/app" : path.startsWith(i.href);
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
                active ? "bg-brand-100 text-brand-700" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {i.label}
            </Link>
          );
        })}
    </nav>
  );
}
