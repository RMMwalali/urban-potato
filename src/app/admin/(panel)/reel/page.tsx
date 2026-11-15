import Link from "next/link";
import { getSettings } from "@/lib/platform";
import { foundingOffer } from "@/lib/offer";
import { appUrl } from "@/lib/url";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ReelStudio } from "@/components/reel/ReelStudio";
import { REELS } from "@/components/reel/screen/reels";
import { findShowcase } from "@/lib/showcase";
import { prepareShowcase, removeShowcase, resetShowcase } from "@/app/actions/showcase";
import { ConfirmButton } from "@/components/ActionForm";

export const metadata = { title: "Reel studio" };

export default async function ReelPage() {
  const [{ general }, offer, showcase] = await Promise.all([getSettings(), foundingOffer(), findShowcase()]);
  const domain = appUrl().replace(/^https?:\/\//, "");
  const counts = showcase ? await db.business.findUnique({ where: { id: showcase.id }, select: { _count: { select: { clients: true, appointments: true, sales: true } } } }) : null;
  return (
    <div className="space-y-16">
      <PageHeader title="Reel studio" label="Marketing" sub="One video per feature, filmed on the real app: a cursor moves through the pages inside a 3D device while the camera follows. Opens on SAY NO MORE, scored with the built-in opera-style music." />

      <section className="grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="label-caps">Showcase salon</p>
          <p className="mt-4 text-[14px] text-muted">Reels are filmed on a fictional salon, “Amani Hair &amp; Beauty”, so no customer&apos;s data appears in your marketing. It never sends SMS or WhatsApp messages and is left out of stats, the map, the sitemap and search engines.</p>
        </div>
        <div className="border-t-2 border-ink pt-6">
          {showcase ? (
            <>
              <p className="text-[20px]">{showcase.name} <span className="text-[14px] text-muted">· {counts?._count.clients} clients · {counts?._count.appointments} bookings · {counts?._count.sales} sales</span></p>
              <p className="mt-1 text-[13px] text-muted">Filming adds bookings, sales and pay runs to it. Reset it to start clean.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <form action={resetShowcase}><button className="btn-secondary btn-sm">Reset data</button></form>
                <form action={removeShowcase}><ConfirmButton message="Delete the showcase salon and all of its data?">Delete showcase</ConfirmButton></form>
              </div>
            </>
          ) : (
            <form action={prepareShowcase}><button className="btn-primary">Create showcase salon</button></form>
          )}
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <p className="label-caps">Feature reels</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/studio?format=portrait" target="_blank" className="btn-primary">Open studio · 9:16</Link>
            <Link href="/admin/studio?format=landscape" target="_blank" className="btn-secondary">Open studio · 16:9</Link>
          </div>
        </div>
        <ol className="border-t-2 border-ink">
          {REELS.map((r, i) => (
            <li key={r.id} className="grid gap-2 border-b border-ink/30 py-4 sm:grid-cols-[48px_1fr_auto] sm:items-center">
              <sup className="text-[11px]">{String(i + 1).padStart(2, "0")}</sup>
              <span><span className="block text-[clamp(18px,1.6vw,22px)]">{r.title}</span><span className="text-[14px] text-muted">{r.line} {r.device === "phone" ? "· filmed on a phone" : ""}</span></span>
              <Link href={`/admin/studio?reel=${r.id}`} target="_blank" className="label-caps hover:opacity-50">Open ↗</Link>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[13px] text-muted">Record in Chrome or Edge on a computer. In the studio, pick a reel and press Record (or Record all), then choose “This tab”. Each reel downloads as its own MP4. A high-resolution screen gives the sharpest 9:16 video. Opening the studio signs this browser into the showcase salon; “Done” puts your own salon login back.</p>
      </section>

      <details className="border-t-2 border-ink pt-6">
        <summary className="label-caps cursor-pointer hover:opacity-60">Text-only promo (no screens)</summary>
        <div className="mt-8">
          <ReelStudio base={{ name: general.siteName, domain, currency: general.currency, price: general.monthlyPrice, trialDays: general.trialDays, offer: { enabled: offer.enabled, percent: offer.percent, months: offer.months, slots: offer.slots, left: offer.left } }} />
        </div>
      </details>
    </div>
  );
}
