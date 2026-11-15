import Link from "next/link";
import { login } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () => pageMetadata("/login", { title: "Log in", description: "Log in to your salon dashboard." });

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Welcome back</h1>
      <p className="mt-1 mb-8 text-stone-500">Log in to your salon dashboard.</p>
      <AuthForm
        action={login}
        submit="Log in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      />
      <p className="mt-6 text-sm text-stone-600">
        New here? <Link href="/signup" className="font-semibold text-brand-600">Start a free trial</Link>
      </p>
    </>
  );
}
