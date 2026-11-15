"use client";
import { keepValues } from "./useKeepForm";
import { useActionState } from "react";

type S = { error?: string; ok?: string } | undefined;

/** Form wrapper that shows a server action's error/success message. */
export function ActionForm({ action, children, className = "", submit, submitClass = "btn-primary" }: { action: (s: S, fd: FormData) => Promise<S>; children: React.ReactNode; className?: string; submit: string; submitClass?: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form onSubmit={keepValues(formAction)} className={className}>
      {children}
      {state?.error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      {state?.ok && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.ok}</p>}
      <div><button className={submitClass} disabled={pending}>{pending ? "Saving…" : submit}</button></div>
    </form>
  );
}

/** Button that asks for confirmation before submitting. */
export function ConfirmButton({ children, message, className = "btn-danger btn-sm" }: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
