import { redirect } from "next/navigation";
import { adminLogin } from "@/app/actions/admin";
import { getAdmin } from "@/lib/admin-auth";
import { ActionForm } from "@/components/ActionForm";

export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLogin() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="flex min-h-screen flex-col justify-between bg-paper px-5 py-8 sm:px-8">
      <p className="label-caps">Platform admin</p>
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-12 text-[clamp(44px,7vw,88px)] leading-[0.85] uppercase">Sign<br />in</h1>
        <ActionForm action={adminLogin} submit="Sign in" submitClass="btn-primary w-full" className="space-y-8">
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" required autoComplete="username" /></div>
          <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" className="input" required autoComplete="current-password" /></div>
        </ActionForm>
      </div>
      <p className="label-caps text-muted">Administrators only</p>
    </main>
  );
}
