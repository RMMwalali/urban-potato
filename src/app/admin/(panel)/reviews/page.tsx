import { db } from "@/lib/db";
import { getSettings, accessState } from "@/lib/platform";
import { appUrl } from "@/lib/url";
import { askForReview, deleteReview, saveGoogleReviewUrl, setReviewStatus } from "@/app/actions/reviews";
import { reviewStats } from "@/lib/reviews";
import { PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ActionForm";

export const metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

export default async function ReviewsAdmin({ searchParams }: { searchParams: Promise<{ asked?: string; saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const [{ general }, reviews, stats, salons] = await Promise.all([
    getSettings(),
    db.review.findMany({ orderBy: { createdAt: "desc" } }),
    reviewStats(),
    db.business.findMany({ where: { isShowcase: false }, select: { id: true, name: true, phone: true, status: true, trialEndsAt: true, paidUntil: true, createdAt: true, _count: { select: { appointments: true } } }, orderBy: { createdAt: "asc" } }),
  ]);
  const reviewed = new Set(reviews.map((r) => r.businessId));
  const toAsk = salons.filter((s) => !reviewed.has(s.id) && accessState(s).ok && (s._count.appointments >= 10 || Date.now() - s.createdAt.getTime() > 7 * 86400_000));
  const wa = (phone: string, name: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "254")}?text=${encodeURIComponent(`Hi ${name} team, it's the Laazizi team. Could you spare two minutes to rate Laazizi? Honest feedback, good or bad, helps us improve: ${appUrl()}/app/review`)}`;
  return (
    <div className="max-w-5xl space-y-12">
      <PageHeader title="Reviews" label={stats.count ? `${stats.count} review${stats.count === 1 ? "" : "s"} · average ${stats.average}/5` : "No reviews yet"} sub="Reviews come only from salons using Laazizi. They appear on the website only with the salon's consent and your approval; the average shown counts every review." />
      {sp.asked && <p className="border-l-2 border-ink bg-panel px-4 py-3 text-[14px]">Asked. They&apos;ll see it in their notifications.</p>}
      {sp.saved && <p className="border-l-2 border-ink bg-panel px-4 py-3 text-[14px]">Saved.</p>}
      {sp.error && <p className="border-l-2 border-pink bg-panel px-4 py-3 text-[14px]">The Google link must start with https://</p>}

      <section>
        <p className="label-caps mb-4">All reviews</p>
        <ul className="border-t-2 border-ink">
          {reviews.length === 0 && <li className="py-5 text-[14px] text-muted">None yet. Ask salons below once they&apos;ve used Laazizi for a while.</li>}
          {reviews.map((r) => (
            <li key={r.id} className="grid gap-3 border-b border-ink/20 py-4 sm:grid-cols-[64px_1fr_auto]">
              <span className="text-[32px] leading-none tabular-nums">{r.rating}<span className="text-[14px] text-muted">/5</span></span>
              <div>
                <p className="text-[15px]">“{r.body}”</p>
                <p className="mt-1 text-[13px] text-muted">{r.authorName}{r.authorRole ? `, ${r.authorRole}` : ""} · {r.salonName}{r.city ? `, ${r.city}` : ""} · {r.consent ? "may be published" : "private (no consent)"} · {r.status.toLowerCase()}</p>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                {r.status !== "APPROVED" && r.consent && <form action={setReviewStatus.bind(null, r.id, "APPROVED")}><button className="btn-primary btn-sm">Publish</button></form>}
                {r.status === "APPROVED" && <form action={setReviewStatus.bind(null, r.id, "HIDDEN")}><button className="btn-secondary btn-sm">Unpublish</button></form>}
                <form action={deleteReview.bind(null, r.id)}><ConfirmButton message="Delete this review?">Delete</ConfirmButton></form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="label-caps mb-4">Ask for a review · {toAsk.length} salon{toAsk.length === 1 ? "" : "s"} ready</p>
        <ul className="border-t-2 border-ink">
          {toAsk.length === 0 && <li className="py-5 text-[14px] text-muted">No salons are ready yet. Salons can be asked once they&apos;ve used Laazizi for a week or taken 10 bookings.</li>}
          {toAsk.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/20 py-3 text-[14px]">
              <span>{s.name}<span className="block text-[12px] text-muted">{s._count.appointments} bookings</span></span>
              <span className="flex gap-2">
                <form action={askForReview.bind(null, s.id)}><button className="btn-secondary btn-sm">Ask in the app</button></form>
                {s.phone && <a href={wa(s.phone, s.name)} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">Ask on WhatsApp</a>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <form action={saveGoogleReviewUrl} className="space-y-4 border-t-2 border-ink pt-5">
        <p className="label-caps">Settings</p>
        <div><label className="label" htmlFor="g">Google review link (from your Google Business Profile → “Ask for reviews”)</label><input id="g" name="googleReviewUrl" defaultValue={general.googleReviewUrl} className="input" placeholder="https://g.page/r/…/review" /></div>
        <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" name="homeReviewsEnabled" defaultChecked={general.homeReviewsEnabled} /> Show published reviews on the landing page</label>
        <p className="text-[12px] text-muted">Everyone who reviews is offered the Google link, whatever their rating: asking only happy customers breaks Google&apos;s rules.</p>
        <button className="btn-secondary btn-sm">Save</button>
      </form>
    </div>
  );
}
