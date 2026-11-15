import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Hero } from "@/components/site/Hero";
import { FeatureList, type Feature } from "@/components/site/FeatureList";
import { Lines, Reveal } from "@/components/motion/Reveal";

export async function generateMetadata() {
  const { seo } = await getSettings();
  return pageMetadata("/", { title: seo.defaultTitle, description: seo.description });
}

const FEATURES: Feature[] = [
  { title: "Online booking", body: "A booking link for your Instagram, TikTok and WhatsApp bios. Clients book themselves, any hour.", detail: "No app download and no account to create. Only staff who perform the service are offered, and every slot is re-checked before it's confirmed." },
  { title: "M-Pesa checkout", body: "Type the M-Pesa code and the payer's name and amount fill in, confirmed by Safaricom.", detail: "Split any bill across cash and M-Pesa, with change worked out. Each code can be used once, so the same payment can't be recorded twice." },
  { title: "Reminders", body: "Confirmations and reminders by SMS or WhatsApp, with a log of every message sent.", detail: "Every message carries a link that lets clients reschedule or cancel within your policy, so gaps are filled instead of missed." },
  { title: "Client records", body: "History, allergies, preferences and notes, owned by the salon, not by whoever is on shift.", detail: "Clients are matched by phone number, so there are no duplicates. Export everything to CSV whenever you like." },
  { title: "Deposits", body: "Ask for an M-Pesa deposit when clients book online. It comes off the bill automatically.", detail: "Repeat no-shows are flagged on the client's profile before you confirm their next visit." },
  { title: "Reports & payroll", body: "Daily takings by method, staff commission and tips, and a till sheet for the end of the day.", detail: "Each stylist can see their own services, commission and tips for the month." },
];

const WHY = [
  "Zero commission on your clients",
  "Money goes straight to your own till",
  "Real people on WhatsApp, not a chatbot",
  "Works on the phone you already have",
  "Your data exports any time, no lock-in",
  "One flat price, unlimited staff",
];

// Paraphrased from public reviews (Trustpilot, ProductReview, Capterra) and Reddit threads; see docs/RESEARCH.md.
const COMPLAINTS = [
  { said: "“New client” fees on clients who found the salon on its own Instagram", where: "Reviews", answer: "No commission. Every client is yours." },
  { said: "Payouts held for weeks while the account is “reviewed”", where: "Reviews", answer: "Payments land in your own M-Pesa till." },
  { said: "No-show fees fail because the client's card expired", where: "Reddit", answer: "M-Pesa deposits at booking, no card needed." },
  { said: "Reminders silently stop sending", where: "Reddit", answer: "A delivery log for every message." },
  { said: "Clients forced to create an account just to book", where: "Reddit", answer: "Name and phone number. That's it." },
  { said: "Leaving means losing years of client history", where: "Reviews", answer: "CSV export, any time." },
];

export default async function Home() {
  const [session, { general }] = await Promise.all([getSession(), getSettings()]);
  const price = `${general.currency} ${general.monthlyPrice.toLocaleString()}`;
  const name = general.siteName;

  return (
    <main className="bg-paper">
      <SiteHeader name={name} signedIn={!!session} />
      <Hero />

      {/* Statement */}
      <section className="px-5 pt-24 sm:px-8 md:pt-32">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b-2 border-ink pb-6">
          <h2 className="text-[clamp(32px,5vw,72px)] leading-[0.95] uppercase">
            <Lines inView lines={["Show your styles on Instagram.", `Run your salon on ${name}.`]} />
          </h2>
          <Reveal><Link href="/signup" className="btn-secondary">Start free trial</Link></Reveal>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-5 pt-32 sm:px-8 md:pt-48">
        <p className="label-caps mb-10">What it does</p>
        <Reveal><FeatureList features={FEATURES} /></Reveal>
      </section>

      {/* Why */}
      <section id="why" className="px-5 pt-32 sm:px-8 md:pt-56">
        <div className="grid gap-10 md:grid-cols-2">
          <p className="label-caps">Why we do it better</p>
          <Reveal>
            <p className="text-[clamp(18px,1.6vw,22px)] leading-[1.45]">
              A website shows off your work; it doesn&apos;t fill your chairs. {name} replaces the paper diary and the scattered DMs with a booking engine and client records: every booking, client and payment in one place, built for how salons in Kenya actually take money.
            </p>
          </Reveal>
        </div>
        <ol className="mt-20 grid gap-x-10 gap-y-8 md:mt-28 md:grid-cols-2">
          {WHY.map((w, i) => (
            <li key={w}>
              <Reveal delay={(i % 2) * 0.08} className="flex gap-4 text-[clamp(16px,1.4vw,19px)] text-muted">
                <sup className="pt-2 text-[11px] text-ink">{i + 1}</sup>{w}
              </Reveal>
            </li>
          ))}
        </ol>
        <Reveal className="mt-20 flex justify-center md:mt-24"><Link href="/signup" className="btn-circle">Start free</Link></Reveal>
      </section>

      {/* Complaints table */}
      <section id="complaints" className="px-5 pt-32 sm:px-8 md:pt-56">
        <div className="grid gap-10 md:grid-cols-2">
          <p className="label-caps">Built from complaints</p>
          <Reveal>
            <p className="text-[15px] leading-relaxed md:max-w-md md:justify-self-end">
              We read what salon owners and stylists say about their booking software in reviews and on Reddit, then built the opposite. Paraphrased, with sources in our research notes.
            </p>
          </Reveal>
        </div>
        <div className="mt-16 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="text-[12px] uppercase tracking-[0.06em] text-muted">
                <th className="w-1/2 pb-4 font-normal">What owners said</th>
                <th className="pb-4 font-normal">Where</th>
                <th className="pb-4 text-right font-normal">With {name}</th>
              </tr>
            </thead>
            <tbody>
              {COMPLAINTS.map((c) => (
                <tr key={c.said} className="group border-t border-ink/40 transition-colors duration-500 hover:bg-panel">
                  <td className="py-5 pr-6 text-[clamp(16px,1.4vw,20px)]">{c.said}</td>
                  <td className="py-5 pr-6 text-[13px] uppercase text-muted">{c.where}</td>
                  <td className="py-5 text-right text-[15px]">{c.answer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-5 pt-32 pb-32 sm:px-8 md:pt-56 md:pb-48">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <p className="label-caps">Pricing</p>
          <div>
            <div className="border-t-2 border-ink pt-10 md:pt-16">
              <div className="flex flex-wrap items-center justify-between gap-10">
                <h2 className="text-[clamp(30px,3.6vw,52px)] leading-[1.02] uppercase">
                  <Lines inView lines={["One price.", "No commission."]} />
                </h2>
                <Reveal><Link href="/signup" className="btn-circle">Try it free</Link></Reveal>
              </div>
              <Reveal>
                <p className="mt-14 text-[clamp(56px,9vw,128px)] leading-none tracking-[-0.02em]">{price}<span className="text-[clamp(16px,1.6vw,22px)] tracking-normal text-muted"> / month</span></p>
                <p className="mt-4 text-[15px] text-muted">{general.trialDays} days free. No card needed. Unlimited staff, clients and bookings.</p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-ink px-5 pt-12 pb-8 sm:px-8">
        <div className="grid gap-10 text-[13px] uppercase tracking-[0.06em] sm:grid-cols-3">
          <ul className="space-y-2">
            <li className="text-muted">Product</li>
            <li><a href="#features" className="hover:opacity-50">Features</a></li>
            <li><a href="#pricing" className="hover:opacity-50">Pricing</a></li>
            <li><Link href="/signup" className="hover:opacity-50">Start free trial</Link></li>
          </ul>
          <ul className="space-y-2">
            <li className="text-muted">Account</li>
            <li><Link href="/login" className="hover:opacity-50">Log in</Link></li>
            <li><Link href="/signup" className="hover:opacity-50">Create a salon</Link></li>
          </ul>
          <ul className="space-y-2">
            <li className="text-muted">Contact</li>
            {general.supportWhatsApp && <li><a href={`https://wa.me/${general.supportWhatsApp}`} className="hover:opacity-50">WhatsApp</a></li>}
            {general.supportEmail && <li><a href={`mailto:${general.supportEmail}`} className="hover:opacity-50 normal-case">{general.supportEmail}</a></li>}
            {general.supportPhone && <li><a href={`tel:${general.supportPhone}`} className="hover:opacity-50">{general.supportPhone}</a></li>}
            {!general.supportWhatsApp && !general.supportEmail && !general.supportPhone && <li className="text-muted">Nairobi, Kenya</li>}
          </ul>
        </div>
        <p className="mt-20 text-[clamp(80px,24vw,360px)] leading-[0.78] font-medium tracking-[-0.05em] lowercase text-pink">{name}</p>
        <p className="mt-6 text-[12px] uppercase tracking-[0.06em] text-muted">© {new Date().getFullYear()} {name}</p>
      </footer>
    </main>
  );
}
