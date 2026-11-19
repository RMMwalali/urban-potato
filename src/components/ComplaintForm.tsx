"use client";
import { useActionState } from "react";
import { submitComplaint, type ComplaintState } from "@/app/actions/complaints";
import { COMPLAINT_CATEGORIES } from "@/lib/complaints";
import { keepValues } from "./useKeepForm";

export function ComplaintForm({ name, email, phone }: { name: string; email: string; phone?: string | null }) {
  const [state, action, pending] = useActionState<ComplaintState, FormData>(submitComplaint, undefined);

  if (state?.done)
    return (
      <div className="max-w-xl space-y-4 border-t-2 border-ink pt-6">
        <p className="label-caps text-pink">Reference {state.done.ref}</p>
        <p className="text-[clamp(26px,3vw,40px)] leading-tight">Thank you. We&apos;ve got it.</p>
        <p className="text-[15px] text-muted">
          Your complaint is with the Darling HQ team and someone will get back to you as soon as possible.
          {state.done.replied ? <> We&apos;ve emailed a copy to <b className="text-ink">{state.done.email}</b>; reply to that email to add anything.</> : <> Keep the reference above in case you need to follow up.</>}
        </p>
        <a href="/app/complaints" className="btn-secondary btn-sm">Send another</a>
      </div>
    );

  return (
    <form onSubmit={keepValues(action)} className="max-w-xl space-y-8">
      <div>
        <label className="label" htmlFor="category">What is it about?</label>
        <select id="category" name="category" required className="input" defaultValue="">
          <option value="" disabled>Choose one</option>
          {COMPLAINT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="subject">Subject</label>
        <input id="subject" name="subject" required maxLength={120} className="input" placeholder="e.g. M-Pesa payment didn't match a client" />
      </div>
      <div>
        <label className="label" htmlFor="message">Tell us what happened</label>
        <textarea id="message" name="message" rows={7} required maxLength={4000} className="input" placeholder="What happened, when, and what you expected instead. Include the client, booking or receipt number if it's about one." />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div><p className="label">From</p><p className="py-2 text-[15px]">{name}<br /><span className="text-muted">{email}</span></p></div>
        <div><label className="label" htmlFor="phone">Phone (optional, if you&apos;d like a call)</label><input id="phone" name="phone" defaultValue={phone ?? ""} inputMode="tel" className="input" placeholder="0712 345 678" /></div>
      </div>
      {state?.error && <p className="border-l-2 border-pink bg-panel px-3 py-2 text-[14px] text-pink">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Sending…" : "Send to the Darling HQ team"}</button>
    </form>
  );
}
