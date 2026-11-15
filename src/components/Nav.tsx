"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, Wallet, BarChart3, CalendarDays, CreditCard, LayoutDashboard, MessageSquare, Receipt, Scissors, Settings, UserCog, Users } from "lucide-react";

const items = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/clients", label: "Clients", icon: Users },
  { href: "/app/sales", label: "Sales", icon: Receipt },
  { href: "/app/finance", label: "Finance", icon: Landmark },
  { href: "/app/messages", label: "Messages", icon: MessageSquare },
  { href: "/app/me", label: "My earnings", icon: Wallet },
  { href: "/app/services", label: "Services", icon: Scissors, manager: true },
  { href: "/app/staff", label: "Staff", icon: UserCog, manager: true },
  { href: "/app/reports", label: "Reports", icon: BarChart3, manager: true },
  { href: "/app/settings", label: "Settings", icon: Settings, manager: true },
  { href: "/app/billing", label: "Plan & billing", icon: CreditCard, manager: true },
];

export function Nav({ isManager }: { isManager: boolean }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
      {items
        .filter((i) => !i.manager || isManager)
        .map(({ href, label, icon: Icon }) => {
          const active = href === "/app" ? path === "/app" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {active && <span className="absolute top-2 bottom-2 left-0 hidden w-1 rounded-r bg-gradient-to-b from-azure-400 to-azure-400 md:block" />}
              <Icon className={`h-[18px] w-[18px] ${active ? "text-azure-400" : ""}`} />
              {label}
            </Link>
          );
        })}
    </nav>
  );
}
