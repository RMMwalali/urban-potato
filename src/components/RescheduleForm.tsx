"use client";
import { useActionState } from "react";
import { reschedule, type ApptState } from "@/app/actions/appointments";

export function RescheduleForm(props: { id: string; date: string; time: string; staffId: string; staff: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ApptState, FormData>(reschedule, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={props.id} />
      <div className="grid grid-cols-2 gap-2">
        <input type="date" name="date" defaultValue={props.date} className="input" required />
        <input type="time" name="time" step={300} defaultValue={props.time} className="input" required />
      </div>
      <select name="staffId" defaultValue={props.staffId} className="input">
        <option value="">Unassigned</option>
        {props.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
      <button className="btn-secondary w-full" disabled={pending}>{pending ? "Saving…" : "Move appointment"}</button>
    </form>
  );
}
