import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getSettings } from "@/lib/platform";
import { adminLogout } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = { title: "Platform admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, { general }] = await Promise.all([requireAdmin(), getSettings()]);
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-ink bg-paper/95 px-5 sm:px-8">
        <div className="flex h-20 items-center justify-between gap-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-[18px] font-medium text-paper">{general.siteName[0].toLowerCase()}</span>
            <span className="text-[22px] font-semibold tracking-[-0.03em] lowercase text-pink">{general.siteName}</span>
            <span className="label-caps hidden text-muted sm:inline">HQ</span>
          </Link>
          <div className="hidden lg:block"><AdminNav /></div>
          <div className="flex items-center gap-4">
            <span className="label-caps hidden text-muted xl:inline">{admin.email}</span>
            <form action={adminLogout}><button className="btn-secondary btn-sm">Log out</button></form>
          </div>
        </div>
        <div className="overflow-x-auto pb-3 lg:hidden"><AdminNav /></div>
      </header>
      <main className="px-5 py-12 sm:px-8 md:py-16">{children}</main>
    </div>
  );
}
