import Link from "next/link";
import { requireUser, MANAGERS } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-stone-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-56 md:shrink-0 md:flex-col md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <Link href="/app" className="text-lg font-semibold text-brand-700">SpaDesk</Link>
            <p className="truncate text-xs text-stone-500">{user.business.name}</p>
          </div>
        </div>
        <div className="md:flex-1">
          <Nav isManager={MANAGERS.includes(user.role)} />
        </div>
        <div className="hidden border-t border-stone-200 px-5 py-4 md:block">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-xs text-stone-500 capitalize">{user.role.toLowerCase()}</p>
          <form action={logout}><button className="mt-2 text-xs text-stone-500 hover:text-brand-700">Log out</button></form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
