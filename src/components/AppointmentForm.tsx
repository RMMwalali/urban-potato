"use client";
import { keepValues } from "./useKeepForm";
import { useActionState, useRef, useState } from "react";
import { ClientAutofill, type FoundClient } from "./ClientAutofill";
import { createAppointment, type ApptState } from "@/app/actions/appointments";
import { SOURCE_LABEL } from "@/lib/format";

type Opt = { id: string; name: string; extra?: string };

export function AppointmentForm(props: {
  services: (Opt & { category: string })[];
  staff: Opt[];
  client?: Opt | null;
  defaults: { date: string; time?: string; staffId?: string; source?: string };
}) {
  const [state, action, pending] = useActionState<ApptState, FormData>(createAppointment, undefined);
  const [newClient] = useState(!props.client);
  const categories = [...new Set(props.services.map((s) => s.category))];
  const svcRef = useRef<HTMLSelectElement>(null);
  const staffRef = useRef<HTMLSelectElement>(null);
  // a returning client: preselect their usual service and stylist, unless already chosen
  const onPick = (c: FoundClient | null) => {
    if (!c?.last) return;
    if (svcRef.current && !svcRef.current.value && props.services.some((s) => s.id === c.last!.serviceId)) svcRef.current.value = c.last.serviceId;
    if (staffRef.current && !staffRef.current.value && c.last.staffId && props.staff.some((s) => s.id === c.last!.staffId)) staffRef.current.value = c.last.staffId;
  };

  return (
    <form onSubmit={keepValues(action)} className="card max-w-2xl space-y-5 p-5">
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold">Client</legend>
        {props.client && !newClient ? (
          <div className="rounded-none bg-stone-100 px-3 py-2 text-sm">
            <input type="hidden" name="clientId" value={props.client.id} />
            <span className="font-medium">{props.client.name}</span> <span className="text-stone-500">{props.client.extra}</span>
          </div>
        ) : (
          <ClientAutofill onPick={onPick} />
        )}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Service</label>
          <select ref={svcRef} name="serviceId" className="input" required defaultValue="">
            <option value="" disabled>Choose a service…</option>
            {categories.map((c) => (
              <optgroup key={c} label={c}>
                {props.services.filter((s) => s.category === c).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.extra})</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Staff</label>
          <select ref={staffRef} name="staffId" className="input" defaultValue={props.defaults.staffId ?? ""}>
            <option value="">Unassigned</option>
            {props.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Booked via</label>
          <select name="source" className="input" defaultValue={props.defaults.source ?? "WALK_IN"}>
            {Object.entries(SOURCE_LABEL).filter(([k]) => k !== "ONLINE").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" name="date" className="input" defaultValue={props.defaults.date} required />
        </div>
        <div>
          <label className="label">Time</label>
          <input type="time" name="time" step={300} className="input" defaultValue={props.defaults.time} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes (optional)</label>
          <textarea name="notes" rows={2} className="input" placeholder="e.g. bringing own hair extensions" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="sendConfirmation" defaultChecked className="accent-brand-600" />
        Send booking confirmation to the client
      </label>

      {state?.error && <p className="rounded-none bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Book appointment"}</button>
    </form>
  );
}
