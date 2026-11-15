import Link from "next/link";
import { ArrowRight, BarChart3, BellRing, CalendarDays, Check, Download, HeartHandshake, Link2, ShieldCheck, Smartphone, Sparkles, Users, Wallet, Zap } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { FlipCard } from "@/components/motion/FlipCard";
import { TiltCard } from "@/components/motion/Tilt";
import { Reveal } from "@/components/motion/Reveal";

export async function generateMetadata() {
  const { seo } = await getSettings();
  return pageMetadata("/", { title: seo.defaultTitle, description: seo.description });
}

// Pain points distilled from real reviews of salon software (Trustpilot, ProductReview, Capterra, Reddit).
const PAINS = [
  { pain: "“New client” fees of up to 20% on clients who found you on your own Instagram.", fix: "Zero commission. Every client is yours, however they found you. One flat monthly price." },
  { pain: "Payouts held for weeks while the platform “reviews” your account.", fix: "Money goes straight to your own M-Pesa till or Pochi. We never hold your funds." },
  { pain: "No-show fees that fail because the client’s card expired.", fix: "Deposits by M-Pesa when booking, plus no-show tracking on every client profile." },
  { pain: "Reminders that silently don’t send, then the chair sits empty.", fix: "SMS & WhatsApp reminders with a delivery log, so you can see every message that went out." },
  { pain: "Support is a chatbot that never answers.", fix: "Real people on WhatsApp and phone, and help setting up your menu during the trial." },
  { pain: "Leaving means losing years of client history.", fix: "Export clients, bookings and sales to CSV any time. No lock-in." },
];

const FEATURES = [
  { icon: CalendarDays, title: "One calendar for every channel", body: "WhatsApp, Instagram, calls and walk-ins land in one staff calendar. Double-bookings are blocked." },
  { icon: Link2, title: "Your booking link", body: "Clients book 24/7 from your bio. No app download, no account to create." },
  { icon: Wallet, title: "M-Pesa first checkout", body: "Record M-Pesa codes, cash and card, issue receipts, track tips per stylist and reconcile the till daily." },
  { icon: BellRing, title: "Automatic reminders", body: "Confirmations and reminders by SMS or WhatsApp. Clients can cancel or reschedule themselves." },
  { icon: Users, title: "Client records that stay", body: "History, allergies, preferences and notes, owned by the salon, not the stylist." },
  { icon: BarChart3, title: "Reports & commission", body: "Daily takings, staff commission, top services and where your bookings come from." },
];

export default async function Home() {
  const [session, { general }] = await Promise.all([getSession(), getSettings()]);
  const price = `${general.currency} ${general.monthlyPrice.toLocaleString()}`;
  return (
    <main className="overflow-x-hidden bg-canvas">
      {/* HERO */}
      <section className="relative bg-plum-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(240,25,122,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(255,107,61,0.2),transparent_50%)]" />
        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-coral-500"><Sparkles className="h-5 w-5" /></span>
            {general.siteName}
          </Link>
          <nav className="flex items-center gap-2">
            <a href="#pricing" className="btn-ghost hidden text-white/70 hover:bg-white/10 hover:text-white sm:inline-flex">Pricing</a>
            {session ? (
              <Link href="/app" className="btn-bold">Dashboard <ArrowRight className="h-4 w-4" /></Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-white/80 hover:bg-white/10 hover:text-white">Log in</Link>
                <Link href="/signup" className="btn-bold">Start free</Link>
              </>
            )}
          </nav>
        </header>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-16 lg:pb-28">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15"><Zap className="h-3.5 w-3.5 text-lime-glow" /> {general.trialDays}-day free trial · no card needed</p>
            <h1 className="font-display text-5xl leading-[1.02] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Ditch the paper book. <span className="text-gradient">Fill every chair.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              Bookings, client records, M-Pesa checkout and automatic reminders for salons, barbershops and spas, all in one place instead of the notebook and fifty WhatsApp chats.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-bold px-6 py-3.5 text-base">Start your free trial <ArrowRight className="h-5 w-5" /></Link>
              <a href="#how" className="btn px-6 py-3.5 text-base text-white ring-1 ring-white/20 hover:bg-white/10">See how it works</a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              {["0% commission on clients", "M-Pesa built in", "Cancel any time"].map((t) => <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-lime-glow" />{t}</li>)}
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* PAINS → FIXES */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-widest text-brand-600 uppercase">Built from real complaints</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">We read what salon owners hate about their software.</h2>
          <p className="mt-4 text-lg text-stone-600">Then we built the opposite. Hover or tap a card to flip it.</p>
        </Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PAINS.map((p, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <FlipCard
                className="h-56"
                front={
                  <div className="flex h-full flex-col justify-between rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-200">
                    <span className="text-xs font-bold tracking-widest text-rose-500 uppercase">The complaint</span>
                    <p className="font-display text-xl leading-snug font-bold">{p.pain}</p>
                    <span className="text-xs text-stone-400">Flip for the fix →</span>
                  </div>
                }
                back={
                  <div className="flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br from-plum-900 to-brand-700 p-6 text-white shadow-xl">
                    <span className="text-xs font-bold tracking-widest text-lime-glow uppercase">How we fix it</span>
                    <p className="text-lg leading-snug font-semibold">{p.fix}</p>
                    <Check className="h-6 w-6 text-lime-glow" />
                  </div>
                }
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Everything the front desk needs. <span className="text-gradient">Nothing it doesn’t.</span></h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.05}>
                <TiltCard max={7} className="rounded-3xl">
                  <div className="h-full rounded-3xl border border-stone-200 bg-canvas p-7">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-plum-900 text-lime-glow"><Icon className="h-6 w-6" /></span>
                    <h3 className="mt-5 font-display text-xl font-bold">{title}</h3>
                    <p className="mt-2 text-stone-600">{body}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">One price. <span className="text-gradient">No surprises.</span></h2>
            <p className="mt-4 text-lg text-stone-600">No per-stylist fees, no commission on clients, no &quot;boost&quot; charges, no payment holds. Try everything free for {general.trialDays} days.</p>
            <ul className="mt-6 space-y-3">
              {[[ShieldCheck, "Your money goes straight to your own M-Pesa"], [Download, "Export all your data whenever you want"], [HeartHandshake, "Real human support on WhatsApp"], [Smartphone, "Works on the phone you already have"]].map(([Icon, t]) => {
                const I = Icon as typeof ShieldCheck;
                return <li key={t as string} className="flex items-center gap-3 font-medium"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><I className="h-5 w-5" /></span>{t as string}</li>;
              })}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <TiltCard max={8} className="rounded-[2rem]">
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-plum-950 via-plum-900 to-brand-700 p-10 text-white shadow-2xl shadow-brand-900/30">
                <div className="animate-spin-slow absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[conic-gradient(from_0deg,rgba(240,25,122,0.5),rgba(255,107,61,0.4),rgba(212,255,90,0.3),rgba(240,25,122,0.5))] blur-3xl" />
                <p className="relative text-xs font-bold tracking-widest text-lime-glow uppercase">Standard</p>
                <p className="relative mt-4 font-display text-6xl font-extrabold">{price}<span className="text-xl font-semibold text-white/60">/mo</span></p>
                <p className="relative mt-2 text-white/70">Unlimited staff, clients and bookings.</p>
                <Link href="/signup" className="relative mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-plum-950 hover:bg-lime-glow">Start {general.trialDays}-day free trial <ArrowRight className="h-5 w-5" /></Link>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      <footer className="bg-plum-950 py-10 text-center text-sm text-white/50">
        © {new Date().getFullYear()} {general.siteName}
        {general.supportEmail && <> · <a href={`mailto:${general.supportEmail}`} className="hover:text-white">{general.supportEmail}</a></>}
        {general.supportWhatsApp && <> · <a href={`https://wa.me/${general.supportWhatsApp}`} className="hover:text-white">WhatsApp</a></>}
      </footer>
    </main>
  );
}
