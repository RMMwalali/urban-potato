import { redirect } from "next/navigation";
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
    <main className="flex min-h-screen flex-col justify-between bg-paper px-5 py-8 sm:px-8">
      <p className="label-caps">Platform admin · first run</p>
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-12 text-[clamp(40px,6vw,80px)] leading-[0.85] uppercase">Create the<br />first admin</h1>
        {!ok ? (
          <p className="text-[15px] text-muted">Set an <code>ADMIN_SETUP_TOKEN</code> environment variable, redeploy, then open <code>/admin/setup?token=YOUR_TOKEN</code>.</p>
        ) : (
          <ActionForm action={createFirstAdmin} submit="Create admin" submitClass="btn-primary w-full" className="space-y-8">
            <input type="hidden" name="token" value={token} />
            <div><label className="label">Name</label><input name="name" className="input" required /></div>
            <div><label className="label">Email</label><input name="email" type="email" className="input" required autoComplete="username" /></div>
            <div><label className="label">Password (12+ characters)</label><input name="password" type="password" minLength={12} className="input" required autoComplete="new-password" /></div>
          </ActionForm>
        )}
      </div>
      <p className="label-caps text-muted">This page closes once an admin exists</p>
    </main>
  );
}
