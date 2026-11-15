import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getSettings } from "@/lib/platform";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { general } = await getSettings();
  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-2">
      <div className="flex flex-col justify-between px-5 py-8 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Logo name={general.siteName} className="text-[26px]" />
        </Link>
        <div className="mx-auto w-full max-w-md py-16">{children}</div>
        <p className="label-caps text-muted">{general.trialDays} days free · no card · no commission</p>
      </div>
      <div className="hidden flex-col justify-between border-l border-ink bg-panel p-8 lg:flex">
        <p className="label-caps">Salon &amp; spa software</p>
        <p className="text-[clamp(48px,5.4vw,96px)] leading-[0.85] uppercase">Not a website.<br />A booking<br />engine.</p>
        <ul className="label-caps space-y-2 border-t border-ink pt-6">
          <li>Bookings from every channel in one calendar</li>
          <li>M-Pesa, cash &amp; card with receipts</li>
          <li>Reminders that actually send</li>
        </ul>
      </div>
    </main>
  );
}
