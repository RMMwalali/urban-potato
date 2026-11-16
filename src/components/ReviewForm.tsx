"use client";
import { useActionState, useState } from "react";
import { submitReview, type ReviewState } from "@/app/actions/reviews";
import { keepValues } from "./useKeepForm";

const WORDS = ["", "Not good", "Needs work", "OK", "Good", "Love it"];

export function ReviewForm({ initial, name, googleUrl }: { initial?: { rating: number; body: string; authorName: string; authorRole: string | null; consent: boolean } | null; name: string; googleUrl: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, undefined);
  const [rating, setRating] = useState(initial?.rating ?? 0);

  if (state?.done)
    return (
      <div className="space-y-5 border-t-2 border-ink pt-6">
        <p className="text-[clamp(26px,3vw,40px)] leading-tight">Thank you.</p>
        <p className="max-w-lg text-[15px] text-muted">{state.done.rating >= 4 ? "We're glad it's helping." : "We've read it and we'll be in touch about what to fix."} Your review is with the Darling team; it only appears on our website if you allowed it.</p>
        {googleUrl && (
          <div className="border-l-2 border-ink bg-panel px-4 py-3 text-[14px]">
            <p>Would you also share your honest experience on Google? It helps other salon owners decide.</p>
            <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm mt-3">Review Darling on Google</a>
          </div>
        )}
      </div>
    );

  return (
    <form onSubmit={keepValues(action)} className="max-w-xl space-y-8">
      <input type="hidden" name="rating" value={rating || ""} />
      <fieldset>
        <legend className="label">How would you rate Darling so far?</legend>
        <div className="mt-2 grid grid-cols-5 border border-ink" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} role="radio" aria-checked={rating === n} onClick={() => setRating(n)}
              className={`border-r border-ink/30 px-1 py-3 text-center last:border-r-0 transition-colors ${rating === n ? "bg-ink text-paper" : rating > n ? "bg-ink/10" : "hover:bg-panel"}`}>
              <span className="block text-[24px] leading-none">{n}</span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.04em] opacity-70">{WORDS[n]}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="body">What changed for your salon? What should we improve?</label>
        <textarea id="body" name="body" rows={5} required defaultValue={initial?.body} className="input" placeholder="e.g. Clients book themselves from our Instagram link, and M-Pesa codes fill in by themselves…" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div><label className="label" htmlFor="authorName">Your name</label><input id="authorName" name="authorName" required defaultValue={initial?.authorName ?? name} className="input" /></div>
        <div><label className="label" htmlFor="authorRole">Role (optional)</label><input id="authorRole" name="authorRole" defaultValue={initial?.authorRole ?? "Owner"} className="input" /></div>
      </div>
      <label className="flex items-start gap-3 text-[14px]"><input type="checkbox" name="consent" defaultChecked={initial?.consent ?? false} className="mt-1" /> <span>Darling may show my review, first name, role and salon name on its website.</span></label>
      {state?.error && <p className="border-l-2 border-pink bg-panel px-3 py-2 text-[14px] text-pink">{state.error}</p>}
      <button className="btn-primary" disabled={pending || !rating}>{pending ? "Sending…" : "Send review"}</button>
    </form>
  );
}
