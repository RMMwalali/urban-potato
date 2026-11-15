import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { adminLogout } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = { title: "Platform admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-plum-950 text-white md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-glow text-plum-950"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <Link href="/admin" className="font-display text-lg font-bold">SpaDesk HQ</Link>
            <p className="text-xs text-white/50">Platform admin</p>
          </div>
        </div>
        <div className="md:flex-1"><AdminNav /></div>
        <div className="hidden border-t border-white/10 px-5 py-4 md:block">
          <p className="truncate text-sm font-medium">{admin.name}</p>
          <p className="truncate text-xs text-white/50">{admin.email}</p>
          <form action={adminLogout}><button className="mt-3 flex items-center gap-2 text-xs text-white/60 hover:text-white"><LogOut className="h-3.5 w-3.5" /> Log out</button></form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 md:px-10">{children}</main>
    </div>
  );
}
