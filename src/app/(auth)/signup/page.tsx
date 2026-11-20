import { db } from "@/lib/db";
import Link from "next/link";
import { signup } from "@/app/actions/auth";
import { headers } from "next/headers";
import { SignupForm } from "@/components/SignupForm";
import { COUNTRIES, KENYA_COUNTIES, geoFromHeaders } from "@/lib/geo";
import { getSettings } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const { general } = await getSettings();
  return pageMetadata("/signup", { title: "Start your free trial", description: `Create your salon account and try everything free for ${general.trialDays} days. No card needed.` });
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const [{ general }, h] = await Promise.all([getSettings(), headers()]);
  // coming from a lead's preview page: start with their salon's name and area filled in
  const leadId = ref && /^lead_[\w-]{5,40}$/.test(ref) ? ref.slice(5) : null;
  const lead = leadId ? await db.lead.findUnique({ where: { id: leadId }, select: { name: true, area: true } }).catch(() => null) : null;
  const net = geoFromHeaders(h);
  const country = COUNTRIES.some((c) => c.code === net.country) ? net.country! : "KE";
  // Vercel reports Kenyan regions as ISO codes (e.g. "30" = Nairobi), so only prefill a county from a matching city name.
  const county = country === "KE" ? KENYA_COUNTIES.find((c) => c.name.toLowerCase() === (net.city ?? "").toLowerCase())?.name : undefined;
  return (
    <>
      <h1 className="text-[clamp(40px,5.4vw,70px)] leading-[0.85] uppercase">Start your<br />free trial</h1>
      <p className="mt-4 mb-10 text-[15px] text-muted">{general.trialDays} days free, no card needed. Setup takes about two minutes.</p>
      {general.signupEnabled ? (
        <SignupForm
          action={signup}
          countries={COUNTRIES.map(({ code, name }) => ({ code, name }))}
          counties={KENYA_COUNTIES.map((c) => c.name)}
          defaultCountry={country}
          refCode={ref && /^lead_[\w-]{5,40}$/.test(ref) ? ref : undefined}
          defaultRegion={county}
          defaultCity={lead?.area?.replace(/\s*\(.*?\)/g, "") || (county ? undefined : country === net.country ? net.city : undefined)}
          defaultBusinessName={lead?.name}
        />
      ) : (
        <p className="rounded-none bg-amber-50 p-4 text-sm text-amber-900">New sign-ups are paused right now. Please check back soon.</p>
      )}
      <p className="mt-6 text-sm text-stone-600">
        Already have an account? <Link href="/login" className="underline underline-offset-4 decoration-1 hover:opacity-60">Log in</Link>
      </p>
    </>
  );
}
