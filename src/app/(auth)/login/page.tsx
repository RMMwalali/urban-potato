import Link from "next/link";
import { login } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () => pageMetadata("/login", { title: "Log in", description: "Log in to your salon dashboard." });

export default function LoginPage() {
  return (
    <>
      <h1 className="text-[clamp(44px,6vw,76px)] leading-[0.85] uppercase">Log in</h1>
      <p className="mt-4 mb-10 text-[15px] text-muted">Your salon dashboard.</p>
      <AuthForm
        action={login}
        submit="Log in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      />
      <p className="mt-6 text-sm text-stone-600">
        New here? <Link href="/signup" className="underline underline-offset-4 decoration-1 hover:opacity-60">Start a free trial</Link>
      </p>
    </>
  );
}
