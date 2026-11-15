import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { createFirstAdmin } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";

export const metadata = { title: "Admin setup", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// One-time setup for hosted deployments (e.g. Vercel) where you can't run `npm run admin:create`.
// Works only while no platform admin exists AND the ADMIN_SETUP_TOKEN env var is set and supplied.
export default async function AdminSetup({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if ((await db.platformAdmin.count()) > 0) redirect("/admin/login");
  const ok = !!process.env.ADMIN_SETUP_TOKEN && token === process.env.ADMIN_SETUP_TOKEN;
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-white">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-petal text-navy-950"><ShieldCheck className="h-6 w-6" /></span>
          <h1 className="font-display text-2xl font-bold">Create the first admin</h1>
        </div>
        <div className="card p-6">
          {!ok ? (
            <p className="text-sm text-stone-600">Set an <code>ADMIN_SETUP_TOKEN</code> environment variable, redeploy, then open <code>/admin/setup?token=YOUR_TOKEN</code>.</p>
          ) : (
            <ActionForm action={createFirstAdmin} submit="Create admin" submitClass="btn-dark w-full" className="space-y-4">
              <input type="hidden" name="token" value={token} />
              <div><label className="label">Name</label><input name="name" className="input" required /></div>
              <div><label className="label">Email</label><input name="email" type="email" className="input" required autoComplete="username" /></div>
              <div><label className="label">Password (12+ characters)</label><input name="password" type="password" minLength={12} className="input" required autoComplete="new-password" /></div>
            </ActionForm>
          )}
        </div>
      </div>
    </main>
  );
}
