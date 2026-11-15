import Link from "next/link";
import { signup } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";
export const metadata = { title: "Create account" };
export default function SignupPage() {
  return (
    <>
      <h1 className="mb-1 text-lg font-semibold">Create your salon account</h1>
      <p className="mb-5 text-sm text-stone-600">Takes a minute. We&apos;ll add a few starter services you can edit.</p>
      <AuthForm
        action={signup}
        submit="Create account"
        fields={[
          { name: "businessName", label: "Salon / spa name" },
          { name: "name", label: "Your name", autoComplete: "name" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password (8+ characters)", type: "password", autoComplete: "new-password" },
        ]}
      />
      <p className="mt-5 text-center text-sm text-stone-600">
        Already have an account? <Link href="/login" className="font-medium text-brand-700">Log in</Link>
      </p>
    </>
  );
}
