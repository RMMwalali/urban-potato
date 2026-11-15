"use client";
import { keepValues } from "./useKeepForm";
import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";

export function AuthForm({
  action,
  fields,
  submit,
}: {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  fields: { name: string; label: string; type?: string; autoComplete?: string }[];
  submit: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form onSubmit={keepValues(formAction)} className="space-y-4">
      {fields.map((f) => (
        <div key={f.name}>
          <label className="label" htmlFor={f.name}>{f.label}</label>
          <input id={f.name} name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} required className="input" />
        </div>
      ))}
      {state?.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      <button className="btn-bold w-full py-3" disabled={pending}>{pending ? "Please wait…" : submit}</button>
    </form>
  );
}
