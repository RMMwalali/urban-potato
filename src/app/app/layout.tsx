import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requireUser, MANAGERS } from "@/lib/auth";
import { accessState, getSettings } from "@/lib/platform";
import { logout } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { Tour, TourButton } from "@/components/tour/Tour";
import { ownerSteps, staffSteps } from "@/components/tour/steps";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, { general }] = await Promise.all([requireUser(undefined, { allowLocked: true }), getSettings()]);
  const access = accessState(user.business);
  const isPlatformAdmin = !!(await db.platformAdmin.findUnique({ where: { email: user.email }, select: { id: true } }));
  return (
    <div className="min-h-screen bg-paper md:flex">
      <aside className="border-b border-ink print:hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-r md:border-b-0">
        <div className="flex items-start justify-between px-5 pt-6 pb-5">
          <div className="min-w-0">
          <Link href="/app" className="flex items-center gap-3">
            <Logo name={general.siteName} className="text-[22px]" />
          </Link>
          <p className="label-caps mt-4 truncate text-muted">{user.business.name}</p>
          </div>
          <form action={logout} className="md:hidden"><button className="label-caps pt-3 hover:opacity-50">Log out</button></form>
        </div>
        <div className="md:flex-1 md:overflow-y-auto" data-tour="nav">
          <Nav isManager={MANAGERS.includes(user.role)} />
          <div className="mx-5 mt-4 hidden border-t border-ink/30 pt-3 md:block"><TourButton /></div>
          {isPlatformAdmin && <Link href="/admin" className="label-caps mx-5 mt-4 mb-4 block border-t border-ink pt-3 hover:opacity-50 md:mb-0">Platform admin ↗</Link>}
        </div>
        {access.reason === "trial" && (
          <Link href="/app/billing" className="mx-5 mb-4 hidden border-t border-ink pt-3 md:block">
            <p className="label-caps text-muted">Free trial</p>
            <p className="mt-1 text-[15px]">{access.daysLeft} {access.daysLeft === 1 ? "day" : "days"} left</p>
            <div className="mt-2 h-px bg-ink/20"><div className="h-px bg-ink" style={{ width: `${Math.max(4, Math.min(100, (access.daysLeft / 14) * 100))}%` }} /></div>
          </Link>
        )}
        <div className="hidden items-center justify-between border-t border-ink px-5 py-4 md:flex">
          <div className="min-w-0">
            <p className="truncate text-[14px]">{user.name}</p>
            <p className="label-caps text-muted">{user.role.toLowerCase()}</p>
          </div>
          <form action={logout}><button className="label-caps hover:opacity-50">Log out</button></form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 md:px-12 md:py-12">
        {access.reason === "trial" && access.daysLeft <= 3 && (
          <Link href="/app/billing" className="mb-8 block border-l-2 border-pink bg-panel px-4 py-3 text-[14px]">
            Your free trial ends in <b className="font-medium">{access.daysLeft} {access.daysLeft === 1 ? "day" : "days"}</b>. Choose a plan to keep your bookings running →
          </Link>
        )}
        {children}
      </main>
      <Tour steps={MANAGERS.includes(user.role) ? ownerSteps(general.siteName) : staffSteps(general.siteName)} autoStart={!user.tourDoneAt} />
    </div>
  );
}
