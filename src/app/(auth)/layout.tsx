import Link from "next/link";
import { BellRing, CalendarDays, Check, Sparkles, Wallet } from "lucide-react";
import { getSettings } from "@/lib/platform";
import { TiltCard } from "@/components/motion/Tilt";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { general } = await getSettings();
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 flex items-center gap-2.5 font-display text-xl font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-coral-500 text-white"><Sparkles className="h-5 w-5" /></span>
            {general.siteName}
          </Link>
          {children}
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-plum-950 lg:flex lg:items-center lg:justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(240,25,122,0.4),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(255,107,61,0.25),transparent_50%)]" />
        <div className="relative w-[420px]">
          <TiltCard max={12}>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur">
              <p className="font-display text-3xl leading-tight font-extrabold">Your whole salon, <span className="text-gradient">one screen.</span></p>
              <ul className="mt-6 space-y-4">
                {[[CalendarDays, "Bookings from every channel in one calendar"], [Wallet, "M-Pesa, cash & card with receipts"], [BellRing, "Reminders that actually send"]].map(([I, t]) => {
                  const Icon = I as typeof CalendarDays;
                  return <li key={t as string} className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Icon className="h-5 w-5 text-lime-glow" /></span>{t as string}</li>;
                })}
              </ul>
              <p className="mt-8 flex items-center gap-2 text-sm text-white/60"><Check className="h-4 w-4 text-lime-glow" /> {general.trialDays} days free · no card · no commission</p>
            </div>
          </TiltCard>
        </div>
      </div>
    </main>
  );
}
