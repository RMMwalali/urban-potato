"use client";
import { keepValues } from "./useKeepForm";
import { useActionState, useState, useTransition } from "react";
import { clientCancel, clientReschedule, type BookState } from "@/app/actions/booking";
import { SlotPicker } from "./SlotPicker";

export function ManageBooking({ token, days, timezone, canChange, policy }: { token: string; days: string[]; timezone: string; canChange: boolean; policy: string }) {
  const [mode, setMode] = useState<"idle" | "move" | "cancelled">("idle");
  const [start, setStart] = useState("");
  const [cancelErr, setCancelErr] = useState<string>();
  const [pendingCancel, startCancel] = useTransition();
  const [state, action, pending] = useActionState<BookState, FormData>(clientReschedule, undefined);

  if (mode === "cancelled")
    return <div className="card p-6 text-center"><p className="mt-2 font-display text-xl font-bold">Appointment cancelled</p><p className="text-sm text-stone-500">We&apos;ve let the salon know.</p></div>;
  if (state?.done)
    return <div className="card p-6 text-center"><p className="mt-2 font-display text-xl font-bold">Moved to {state.done.when}</p><p className="text-sm text-stone-500">A new confirmation is on its way.</p></div>;
  if (!canChange) return <p className="card p-5 text-sm text-stone-600">{policy} To change this appointment, please contact the salon.</p>;

  return (
    <div className="space-y-4">
      {mode === "idle" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={() => setMode("move")} className="btn-bold py-3">Reschedule</button>
          <button
            disabled={pendingCancel}
            onClick={() => {
              if (!confirm("Cancel this appointment?")) return;
              startCancel(async () => {
                const r = await clientCancel(token);
                if (r?.error) setCancelErr(r.error);
                else setMode("cancelled");
              });
            }}
            className="btn-danger py-3"
          >
            {pendingCancel ? "Cancelling…" : "Cancel appointment"}
          </button>
        </div>
      )}
      {cancelErr && <p className="rounded-none bg-rose-50 px-3 py-2 text-sm text-rose-700">{cancelErr}</p>}
      {mode === "move" && (
        <form onSubmit={keepValues(action)} className="card space-y-4 p-5">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="start" value={start} />
          <p className="font-display text-lg font-bold">Pick a new time</p>
          <SlotPicker days={days} timezone={timezone} value={start} onChange={setStart} query={`token=${token}`} refreshKey={state?.error} />
          {state?.error && <p className="rounded-none bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
          <div className="flex gap-2">
            <button className="btn-bold" disabled={!start || pending}>{pending ? "Saving…" : "Confirm new time"}</button>
            <button type="button" className="btn-ghost" onClick={() => setMode("idle")}>Back</button>
          </div>
        </form>
      )}
      <p className="text-xs text-stone-500">{policy}</p>
    </div>
  );
}
