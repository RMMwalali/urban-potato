"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { publicBook, type BookState } from "@/app/actions/booking";

type Svc = { id: string; name: string; category: string; durationMin: number; price: number; description: string | null };
type Staff = { id: string; name: string; title: string | null; serviceIds: string[] };

export function BookingWidget(props: { slug: string; currency: string; timezone: string; services: Svc[]; staff: Staff[]; days: string[] }) {
  const [state, action, pending] = useActionState<BookState, FormData>(publicBook, undefined);
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(props.days[0]);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [start, setStart] = useState("");
  const service = props.services.find((s) => s.id === serviceId);
  const staffForService = props.staff.filter((s) => !s.serviceIds.length || s.serviceIds.includes(serviceId));
  const categories = useMemo(() => [...new Set(props.services.map((s) => s.category))], [props.services]);
  const timeFmt = useMemo(() => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: props.timezone }), [props.timezone]);

  useEffect(() => {
    if (!serviceId) return;
    setSlots(null);
    setStart("");
    const q = new URLSearchParams({ slug: props.slug, serviceId, date, staffId });
    fetch(`/api/slots?${q}`).then((r) => r.json()).then((j) => setSlots(j.slots));
  }, [serviceId, staffId, date, props.slug, state?.error]);

  if (state?.done)
    return (
      <div className="card p-6 text-center">
        <p className="text-3xl">✓</p>
        <h2 className="mt-2 text-lg font-semibold">You&apos;re booked!</h2>
        <p className="mt-2 text-stone-600">{state.done.service}{state.done.staff ? ` with ${state.done.staff}` : ""}</p>
        <p className="font-medium">{state.done.when}</p>
        <p className="mt-3 text-sm text-stone-500">We&apos;ve sent a confirmation to your phone.</p>
      </div>
    );

  const step = (n: number, title: string) => (
    <h2 className="mb-3 flex items-center gap-2 font-semibold">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white">{n}</span>{title}
    </h2>
  );

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="slug" value={props.slug} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="staffId" value={staffId} />
      <input type="hidden" name="start" value={start} />
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <section className="card p-4">
        {step(1, "Choose a service")}
        {categories.map((c) => (
          <div key={c} className="mb-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone-500">{c}</p>
            <div className="space-y-2">
              {props.services.filter((s) => s.category === c).map((s) => (
                <button type="button" key={s.id} onClick={() => { setServiceId(s.id); setStaffId(""); }}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm ${serviceId === s.id ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-stone-200 hover:border-stone-300"}`}>
                  <span><span className="block font-medium">{s.name}</span><span className="text-xs text-stone-500">{s.durationMin} min{s.description ? ` · ${s.description}` : ""}</span></span>
                  <span className="shrink-0 font-medium">{props.currency} {s.price.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {service && (
        <section className="card p-4">
          {step(2, "Pick a day & time")}
          {staffForService.length > 1 && (
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="input mb-3">
              <option value="">Any available staff</option>
              {staffForService.map((s) => <option key={s.id} value={s.id}>{s.name}{s.title ? ` (${s.title})` : ""}</option>)}
            </select>
          )}
          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {props.days.map((d) => {
              const dt = new Date(`${d}T12:00:00`);
              return (
                <button type="button" key={d} onClick={() => setDate(d)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-center text-xs ${date === d ? "border-brand-500 bg-brand-600 text-white" : "border-stone-200 bg-white"}`}>
                  <span className="block">{dt.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                  <span className="block text-base font-semibold">{dt.getDate()}</span>
                  <span className="block">{dt.toLocaleDateString("en-GB", { month: "short" })}</span>
                </button>
              );
            })}
          </div>
          {slots === null ? <p className="text-sm text-stone-500">Loading times…</p> : slots.length === 0 ? (
            <p className="text-sm text-stone-500">No free times this day. Try another day.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slots.map((s) => (
                <button type="button" key={s} onClick={() => setStart(s)}
                  className={`rounded-lg border py-2 text-sm ${start === s ? "border-brand-500 bg-brand-600 text-white" : "border-stone-200 hover:border-brand-500"}`}>
                  {timeFmt.format(new Date(s))}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {start && (
        <section className="card space-y-3 p-4">
          {step(3, "Your details")}
          <div><label className="label">Full name</label><input name="name" className="input" required autoComplete="name" /></div>
          <div><label className="label">Phone number</label><input name="phone" className="input" required inputMode="tel" autoComplete="tel" placeholder="0712 345 678" /></div>
          <div><label className="label">Anything we should know? (optional)</label><textarea name="notes" rows={2} className="input" /></div>
          {state?.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
          <button className="btn-primary w-full py-3 text-base" disabled={pending}>
            {pending ? "Booking…" : `Confirm booking · ${props.currency} ${service?.price.toLocaleString()}`}
          </button>
        </section>
      )}
    </form>
  );
}
