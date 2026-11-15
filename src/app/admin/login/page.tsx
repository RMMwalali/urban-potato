import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { adminLogin } from "@/app/actions/admin";
import { getAdmin } from "@/lib/admin-auth";
import { ActionForm } from "@/components/ActionForm";

export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLogin() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="flex min-h-screen items-center justify-center bg-plum-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-white">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-glow text-plum-950"><ShieldCheck className="h-6 w-6" /></span>
          <h1 className="font-display text-2xl font-bold">SpaDesk HQ</h1>
          <p className="text-sm text-white/50">Platform administrators only</p>
        </div>
        <div className="card p-6">
          <ActionForm action={adminLogin} submit="Sign in" submitClass="btn-dark w-full" className="space-y-4">
            <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" required autoComplete="username" /></div>
            <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" className="input" required autoComplete="current-password" /></div>
          </ActionForm>
        </div>
      </div>
    </main>
  );
}
