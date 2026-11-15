import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Hero } from "@/components/site/Hero";
import { FeatureList, type Feature } from "@/components/site/FeatureList";
import { Lines, Reveal } from "@/components/motion/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import { GUIDES } from "@/content/guides";
import { appUrl } from "@/lib/url";
import { foundingOffer, plans as getPlans } from "@/lib/offer";
import { homepageData } from "@/lib/homepage";
import { LogoMarquee } from "@/components/site/Marquees";

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

// Paraphrased from public reviews (Trustpilot, ProductReview, Capterra) and Reddit threads; see docs/RESEARCH.md.
const COMPLAINTS = [
  { said: "“New client” fees on clients who found the salon on its own Instagram", where: "Reviews", answer: "No commission. Every client is yours." },
  { said: "Payouts held for weeks while the account is “reviewed”", where: "Reviews", answer: "Payments land in your own M-Pesa till." },
  { said: "No-show fees fail because the client's card expired", where: "Reddit", answer: "M-Pesa deposits at booking, no card needed." },
  { said: "Reminders silently stop sending", where: "Reddit", answer: "A delivery log for every message." },
  { said: "Clients forced to create an account just to book", where: "Reddit", answer: "Name and phone number. That's it." },
  { said: "Leaving means losing years of client history", where: "Reviews", answer: "CSV export, any time." },
];

const FAQ = [
  { q: "Do I need a website for my salon?", a: "Not to take bookings. Darling gives your salon a booking link for Instagram, TikTok and WhatsApp, so clients see your services and free times and book themselves." },
  { q: "Does Darling work with M-Pesa?", a: "Yes. Record M-Pesa, cash, card and split payments. Connect a till or paybill and payments arrive automatically with the payer's name and amount; codes can only be used once. Pochi la Biashara payments can be added from the SMS." },
  { q: "Do you take commission on my clients?", a: "No. Darling is a flat price (monthly, annual, or pay once for lifetime access) with unlimited staff, clients and bookings. Payments go straight to your own M-Pesa." },
  { q: "Is there a one-time payment option?", a: "Yes, while places last. The lifetime plan is a single payment for permanent access, including updates. Monthly and annual plans are also available, and annual works out cheaper than paying monthly." },
  { q: "How does Darling reduce no-shows?", a: "Automatic SMS or WhatsApp confirmations and reminders, optional M-Pesa deposits when clients book online, a link for clients to reschedule or cancel within your policy, and no-show tracking on each client." },
  { q: "Can my staff see their own earnings?", a: "Yes. Each stylist sees their services, commission and tips for the month, and the owner gets a daily summary and reports." },
  { q: "Can I export my data?", a: "Yes. Export clients, bookings and sales to a spreadsheet at any time." },
  { q: "Is there a launch discount?", a: "Yes, while places last: the first salons that subscribe get a founding discount on their first months. The pricing section shows the current offer and how many places are left." },
];

export default async function Home() {
  const [session, { general }] = await Promise.all([getSession(), getSettings()]);
  const name = general.siteName;
  const base = appUrl();
  const [offer, plans, home] = await Promise.all([foundingOffer(), getPlans(), homepageData()]);
  const cur = plans.currency;
  const PLANS = [
    { name: "Monthly", price: plans.monthly.price, per: "/ month", note: "Pay as you go. Stop any time.", open: true },
    { name: "Annual", price: plans.annual.price, per: "/ year", note: `${cur} ${plans.annual.perMonth.toLocaleString()} a month, billed yearly.${plans.annual.saving > 0 ? ` Save ${cur} ${plans.annual.saving.toLocaleString()}.` : ""}`, open: true },
    { name: "Lifetime", price: plans.lifetime.price, per: "once", note: plans.lifetime.enabled ? `Pay once, own it forever. ${plans.lifetime.left} of ${plans.lifetime.limit} places left.` : "Pay once, own it forever. Currently sold out.", open: plans.lifetime.enabled },
  ];
  const { seo } = await getSettings();
  const sameAs = (seo.sameAs || "").split(/[\s,]+/).filter((u: string) => u.startsWith("http"));

  return (
    <main className="bg-paper">
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "Organization", name, url: base, ...(sameAs.length ? { sameAs } : {}), ...(general.supportEmail ? { email: general.supportEmail } : {}), areaServed: "KE" },
          { "@context": "https://schema.org", "@type": "WebSite", name, url: base },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name,
            url: base,
            applicationCategory: "BusinessApplication",
            applicationSubCategory: "Salon and spa management software",
            operatingSystem: "Web browser (Android, iOS, Windows, macOS)",
            description: seo.description,
            offers: [
              { "@type": "Offer", name: "Monthly", price: plans.monthly.price, priceCurrency: cur, description: `Monthly subscription, ${general.trialDays}-day free trial` },
              { "@type": "Offer", name: "Annual", price: plans.annual.price, priceCurrency: cur, description: "Annual subscription, two months free" },
              ...(plans.lifetime.enabled ? [{ "@type": "Offer", name: "Lifetime", price: plans.lifetime.price, priceCurrency: cur, description: "One-time payment, lifetime access", availability: "https://schema.org/LimitedAvailability" }] : []),
            ],
            featureList: FEATURES.map((f) => f.title).join(", "),
          },
          { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q.replace(/Darling/g, name), acceptedAnswer: { "@type": "Answer", text: f.a.replace(/Darling/g, name) } })) },
        ]}
      />
      <SiteHeader name={name} signedIn={!!session} />
      <Hero cards={home.cards} />
      <LogoMarquee logos={home.logos} />

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


      {/* Complaints table */}
      <section id="complaints" className="px-5 pt-32 sm:px-8 md:pt-56">
        <div className="grid gap-10 md:grid-cols-2">
          <p className="label-caps">Built from complaints</p>
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

      {/* Guides */}
      <section id="guides" className="px-5 pt-32 sm:px-8 md:pt-56">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <p className="label-caps">Guides</p>
          <div>
            <ul className="border-t-2 border-ink">
              {GUIDES.slice(0, 5).map((g) => (
                <li key={g.slug} className="border-b border-ink/40">
                  <Link href={`/guides/${g.slug}`} className="group flex items-center justify-between gap-6 py-4 text-[clamp(18px,1.8vw,24px)] leading-tight">
                    {g.title}<span className="shrink-0 transition-transform duration-700 group-hover:rotate-45">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Reveal className="mt-8"><Link href="/guides" className="btn-secondary">All {GUIDES.length} guides</Link></Reveal>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-5 pt-32 sm:px-8 md:pt-56">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <p className="label-caps">Pricing</p>
          <div>
            <div className="border-t-2 border-ink pt-10 md:pt-16">
              <div className="flex flex-wrap items-center justify-between gap-10">
                <h2 className="text-[clamp(30px,3.6vw,52px)] leading-[1.02] uppercase">
                  <Lines inView lines={["Three ways to pay.", "No commission."]} />
                </h2>
                <Reveal><Link href="/signup" className="btn-circle">Try it free</Link></Reveal>
              </div>
              <Reveal>
                <div className="mt-14 grid border-t border-ink md:grid-cols-3">
                  {PLANS.map((p, i) => (
                    <div key={p.name} className={`border-b border-ink/40 py-8 md:border-b-0 ${i > 0 ? "md:border-l md:pl-8" : ""} md:pr-8 ${p.open ? "" : "opacity-45"}`}>
                      <p className="label-caps">{p.name}{p.name === "Annual" && <span className="text-azure-600"> · 2 months free</span>}</p>
                      <p className="mt-6 whitespace-nowrap text-[clamp(34px,3.2vw,52px)] leading-none tracking-[-0.02em]">{cur} {p.price.toLocaleString()}</p>
                      <p className="mt-2 text-[14px] text-muted">{p.per}</p>
                      <p className="mt-5 text-[15px] leading-snug">{p.note}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-8 text-[15px] text-muted">Every plan: {general.trialDays} days free first, no card needed. Unlimited staff, clients and bookings.</p>
                {offer.enabled && (
                  <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-ink pt-6">
                    <div>
                      <p className="label-caps text-pink">Founding offer · {offer.left} of {offer.slots} places left</p>
                      <p className="mt-3 text-[clamp(22px,2.4vw,32px)] leading-tight">{offer.percent}% off for your first {offer.months} months: {offer.currency} {offer.offerPrice.toLocaleString()} a month.</p>
                      <p className="mt-2 text-[14px] text-muted">For the first {offer.slots} salons that subscribe monthly or annually. Places count when you subscribe, not when you start the trial. Not combined with lifetime.</p>
                    </div>
                  </div>
                )}
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-5 pt-32 sm:px-8 md:pt-48">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <p className="label-caps">Questions</p>
          <dl className="border-t-2 border-ink">
            {FAQ.map((f) => (
              <div key={f.q} className="border-b border-ink/40 py-5">
                <dt className="text-[clamp(18px,1.6vw,22px)] leading-snug">{f.q.replace(/Darling/g, name)}</dt>
                <dd className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{f.a.replace(/Darling/g, name)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
