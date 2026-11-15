import Link from "next/link";
import { Hourglass, LogOut, Sparkles } from "lucide-react";
import { requireUser, MANAGERS } from "@/lib/auth";
import { accessState } from "@/lib/platform";
import { logout } from "@/app/actions/auth";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(undefined, { allowLocked: true });
  const access = accessState(user.business);
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-plum-950 text-white md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-coral-500 shadow-lg shadow-brand-600/40"><Sparkles className="h-5 w-5" /></span>
          <div className="min-w-0">
            <Link href="/app" className="font-display text-lg font-bold">SpaDesk</Link>
            <p className="truncate text-xs text-white/50">{user.business.name}</p>
          </div>
        </div>
        <div className="md:flex-1 md:overflow-y-auto"><Nav isManager={MANAGERS.includes(user.role)} /></div>
        {access.reason === "trial" && (
          <Link href="/app/billing" className="mx-3 mb-3 hidden rounded-xl bg-white/5 p-3 ring-1 ring-white/10 hover:bg-white/10 md:block">
            <p className="flex items-center gap-2 text-xs font-semibold text-lime-glow"><Hourglass className="h-3.5 w-3.5" /> Free trial</p>
            <p className="mt-1 text-sm"><b>{access.daysLeft}</b> {access.daysLeft === 1 ? "day" : "days"} left</p>
            <div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-gradient-to-r from-brand-400 to-coral-500" style={{ width: `${Math.max(4, Math.min(100, (access.daysLeft / 14) * 100))}%` }} /></div>
          </Link>
        )}
        <div className="hidden items-center gap-3 border-t border-white/10 px-5 py-4 md:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold">{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-xs capitalize text-white/50">{user.role.toLowerCase()}</p>
          </div>
          <form action={logout}><button className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white" title="Log out" aria-label="Log out"><LogOut className="h-4 w-4" /></button></form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">
        {access.reason === "trial" && access.daysLeft <= 3 && (
          <Link href="/app/billing" className="mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-600 to-coral-500 px-4 py-3 text-sm text-white shadow-lg shadow-brand-500/20">
            <Hourglass className="h-5 w-5 shrink-0" />
            <span>Your free trial ends in <b>{access.daysLeft} {access.daysLeft === 1 ? "day" : "days"}</b>. Choose a plan to keep your bookings running.</span>
          </Link>
        )}
        {children}
      </main>
    </div>
  );
}
