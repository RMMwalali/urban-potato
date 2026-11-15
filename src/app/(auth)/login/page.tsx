import Link from "next/link";
import { login } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";
export const metadata = { title: "Log in" };
export default function LoginPage() {
  return (
    <>
      <h1 className="mb-5 text-lg font-semibold">Log in</h1>
      <AuthForm
        action={login}
        submit="Log in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      />
      <p className="mt-5 text-center text-sm text-stone-600">
        New here? <Link href="/signup" className="font-medium text-brand-700">Create a salon account</Link>
      </p>
    </>
  );
}
