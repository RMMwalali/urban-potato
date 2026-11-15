"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/calendar", label: "Calendar" },
  { href: "/app/clients", label: "Clients" },
  { href: "/app/sales", label: "Sales" },
  { href: "/app/finance", label: "Finance" },
  { href: "/app/messages", label: "Messages" },
  { href: "/app/me", label: "My earnings" },
  { href: "/app/notifications", label: "Notifications" },
  { href: "/app/services", label: "Services", manager: true },
  { href: "/app/staff", label: "Staff", manager: true },
  { href: "/app/payroll", label: "Payroll", manager: true },
  { href: "/app/reports", label: "Reports", manager: true },
  { href: "/app/settings", label: "Settings", manager: true },
  { href: "/app/billing", label: "Plan & billing", manager: true },
];

export function Nav({ isManager }: { isManager: boolean }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const on = (e: Event) => setUnread((e as CustomEvent<number>).detail);
    window.addEventListener("darling:unread", on);
    return () => window.removeEventListener("darling:unread", on);
  }, []);
  useEffect(() => setOpen(false), [path]);
  const visible = items.filter((i) => !i.manager || isManager);
  const isActive = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));
  const current = visible.find((i) => isActive(i.href))?.label ?? "Menu";

  return (
    <>
      {/* Phones: one row with the current page; tap to open the full list */}
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="mx-5 mb-4 flex w-[calc(100%-2.5rem)] items-center justify-between border-y border-ink py-3 md:hidden">
        <span className="label-caps flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-pink" />{current}</span>
        <span className="label-caps flex items-center gap-2">{unread > 0 && !open && <span className="bg-pink px-1.5 text-[10px] leading-5 text-white">{unread}</span>}{open ? "Close" : "Menu"}</span>
      </button>
      <nav className={`${open ? "block" : "hidden"} px-5 pb-4 md:block md:pb-0`}>
        <ul className="md:space-y-0">
          {visible.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <li key={href} className="border-b border-ink/15 md:border-0">
                <Link href={href} className={`label-caps group flex items-center gap-2 py-3 transition-colors duration-500 md:py-1.5 ${active ? "text-ink" : "text-muted hover:text-ink"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${active ? "bg-pink" : "bg-transparent group-hover:bg-ink/30"}`} />
                  {label}
                  {href === "/app/notifications" && unread > 0 && <span className="ml-auto min-w-5 bg-pink px-1.5 text-center text-[10px] leading-5 text-white" aria-label={`${unread} unread`}>{unread > 99 ? "99+" : unread}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
