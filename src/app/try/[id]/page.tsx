import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/platform";
import { getAdmin } from "@/lib/admin-auth";
import { SERVICE_TEMPLATES } from "@/lib/templates";
import { Logo } from "@/components/Logo";

// A booking page made for one lead, from what we know about them (name, area, type), so the first WhatsApp
// message can say "I made this for you" instead of pitching. Not indexed; opening it is noted on the lead.

const MENU: Record<string, string[]> = { hair: ["hair"], braids: ["hair"], barber: ["barber"], nails: ["nails"], lashes: ["spa", "nails"], spa: ["spa"], mixed: ["hair", "nails", "spa"] };
const BOTS = /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|slackbot|discordbot|linkedinbot|bot\b|crawler|spider|preview/i;

async function getLead(id: string) {
  if (!/^[a-z0-9]{20,40}$/.test(id)) return null;
  const lead = await db.lead.findUnique({ where: { id } });
  return lead && lead.status !== "DO_NOT_CONTACT" ? lead : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const lead = await getLead((await params).id);
  const { general } = await getSettings();
  if (!lead) return { title: general.siteName, robots: { index: false, follow: false } };
  return {
    title: `${lead.name}: your booking page`,
    description: `A booking page made for ${lead.name}: clients pick a service and a time, pay a deposit by M-Pesa, and get reminders. Made with ${general.siteName}.`,
    robots: { index: false, follow: false },
    openGraph: { title: `${lead.name}: your booking page`, description: `Made for ${lead.name} by ${general.siteName}. Have a look.` },
  };
}

export default async function TryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();
  const [{ general }, h, admin] = await Promise.all([getSettings(), headers(), getAdmin().catch(() => null)]);

  // note the visit on the lead (not link-preview bots, not you checking it from admin, at most once every 6 hours)
  if (!admin && !BOTS.test(h.get("user-agent") ?? "")) {
    const recent = await db.leadActivity.findFirst({ where: { leadId: lead.id, kind: "viewed", at: { gte: new Date(Date.now() - 6 * 3600_000) } } });
    if (!recent) await db.leadActivity.create({ data: { leadId: lead.id, kind: "viewed", text: "Opened their booking page preview", actor: "lead" } }).catch(() => {});
  }

  const menus = MENU[lead.type ?? "mixed"] ?? MENU.mixed;
  const per = menus.length > 1 ? 3 : 6;
  const items = menus.flatMap((m) => (SERVICE_TEMPLATES[m]?.items ?? []).slice(0, per));
  const cur = general.currency;
  const where = [lead.area, lead.city].filter(Boolean).join(", ").replace(/\s*\(.*?\)/g, "");
  const days = Array.from({ length: 5 }, (_, i) => new Date(Date.now() + (i + 1) * 86400_000));
  const signup = `/signup?ref=lead_${lead.id}`;

  return (
    <main className="min-h-screen bg-paper px-5 pb-24 pt-6 sm:px-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-ink pb-4">
          <Logo name={general.siteName} className="text-[22px]" />
          <span className="label-caps text-muted">Preview</span>
        </div>
        <p className="mb-8 border-l-2 border-pink bg-panel px-4 py-3 text-[14px]">
          We made this booking page for <b>{lead.name}</b> to show what your clients would see. Services and prices are examples; you set your own.
        </p>

        <p className="label-caps text-muted">Book online</p>
        <h1 className="mt-2 text-[clamp(34px,8vw,56px)] uppercase leading-[0.95]">{lead.name}</h1>
        {where && <p className="mt-3 text-[15px] text-muted">{where}</p>}

        <section className="mt-10">
          <p className="label-caps mb-3"><span className="mr-2 inline-block bg-ink px-2 text-paper">1</span>Choose a service</p>
          <ul className="border-t-2 border-ink">
            {items.map(([name, mins, price], i) => (
              <li key={name} className={`flex items-baseline justify-between gap-4 border-b border-ink/30 py-3 ${i === 0 ? "bg-panel px-3" : ""}`}>
                <span><span className="text-[17px]">{name}</span><span className="ml-2 text-[13px] text-muted">{mins} min</span></span>
                <span className="whitespace-nowrap text-[15px]">{cur} {price.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10" aria-hidden>
          <p className="label-caps mb-3"><span className="mr-2 inline-block bg-ink px-2 text-paper">2</span>Pick a day and time</p>
          <div className="grid grid-cols-5 border border-ink text-center">
            {days.map((d, i) => (
              <div key={i} className={`border-r border-ink/30 py-2 last:border-r-0 ${i === 1 ? "bg-ink text-paper" : ""}`}>
                <span className="block text-[11px] uppercase">{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                <span className="block text-[20px]">{d.getDate()}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {["09:00", "10:30", "12:00", "14:30", "15:00", "16:30"].map((t, i) => <span key={t} className={`border px-2 py-2 text-center text-[14px] ${i === 3 ? "border-ink bg-ink text-paper" : "border-ink/40"}`}>{t}</span>)}
          </div>
        </section>

        <section className="mt-10 border-t-2 border-ink pt-6">
          <p className="label-caps mb-3"><span className="mr-2 inline-block bg-ink px-2 text-paper">3</span>Pay a deposit by M-Pesa</p>
          <p className="text-[15px] text-muted">Clients pay a small deposit to hold the slot, get a booking slip and a reminder the day before, and can move or cancel within your policy. You get a notification the moment they book.</p>
        </section>

        <div className="mt-12 space-y-3">
          <Link href={signup} className="btn-primary w-full justify-center">Make this page yours: free for {general.trialDays} days</Link>
          {general.supportWhatsApp && (
            <a href={`https://wa.me/${general.supportWhatsApp}?text=${encodeURIComponent(`Hi, I saw the booking page you made for ${lead.name}.`)}`} className="btn-secondary w-full justify-center">Ask the founder on WhatsApp</a>
          )}
          <p className="pt-2 text-center text-[13px] text-muted">No card needed. Set up with your real services and prices in about two minutes.</p>
        </div>
      </div>
    </main>
  );
}
