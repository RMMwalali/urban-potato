import Link from "next/link";
import { signup } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";
import { getSettings } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const { general } = await getSettings();
  return pageMetadata("/signup", { title: "Start your free trial", description: `Create your salon account and try everything free for ${general.trialDays} days. No card needed.` });
}

export default async function SignupPage() {
  const { general } = await getSettings();
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Start your {general.trialDays}-day free trial</h1>
      <p className="mt-1 mb-8 text-stone-500">No card needed. Set up takes about two minutes.</p>
      {general.signupEnabled ? (
        <AuthForm
          action={signup}
          submit="Create my salon account"
          fields={[
            { name: "businessName", label: "Salon / spa name" },
            { name: "name", label: "Your name", autoComplete: "name" },
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Password (8+ characters)", type: "password", autoComplete: "new-password" },
          ]}
        />
      ) : (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">New sign-ups are paused right now. Please check back soon.</p>
      )}
      <p className="mt-6 text-sm text-stone-600">
        Already have an account? <Link href="/login" className="font-semibold text-azure-600">Log in</Link>
      </p>
    </>
  );
}
