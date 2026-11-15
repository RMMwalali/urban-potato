"use client";
import { keepValues } from "./useKeepForm";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { publicBook, type BookState } from "@/app/actions/booking";
import { SlotPicker } from "./SlotPicker";

type Svc = { id: string; name: string; category: string; durationMin: number; price: number; description: string | null };
type Staff = { id: string; name: string; title: string | null; serviceIds: string[] };
type Mpesa = { type: string; number: string; account: string | null } | null;

export function BookingWidget(props: { slug: string; currency: string; timezone: string; services: Svc[]; staff: Staff[]; days: string[]; depositPercent: number; mpesa: Mpesa; policy: string | null }) {
  const [state, action, pending] = useActionState<BookState, FormData>(publicBook, undefined);
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [start, setStart] = useState("");
  const service = props.services.find((s) => s.id === serviceId);
  const staffForService = props.staff.filter((s) => !s.serviceIds.length || s.serviceIds.includes(serviceId));
  const categories = useMemo(() => [...new Set(props.services.map((s) => s.category))], [props.services]);
  const deposit = service && props.mpesa && props.depositPercent > 0 ? Math.round((service.price * props.depositPercent) / 100) : 0;
  const money = (n: number) => `${props.currency} ${n.toLocaleString()}`;

  if (state?.done)
    return (
      <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 90, damping: 14 }} style={{ transformPerspective: 1000 }}
        className="card overflow-hidden text-center">
        <div className="bg-ink px-6 py-8 text-white">
                    <h2 className="mt-3 font-display text-2xl font-bold">You&apos;re booked!</h2>
        </div>
        <div className="space-y-1 p-6">
          <p className="font-semibold">{state.done.service}{state.done.staff ? ` with ${state.done.staff}` : ""}</p>
          <p className="font-display text-xl font-bold">{state.done.when}</p>
          {state.done.deposit > 0 && <p className="text-sm text-stone-500">Deposit of {money(state.done.deposit)} received. The salon will confirm it.</p>}
          <p className="pt-2 text-sm text-stone-500">We&apos;ve sent a confirmation to your phone.</p>
          <Link href={state.done.manage} className="btn-secondary mt-4">Change or cancel</Link>
        </div>
      </motion.div>
    );

  const step = (n: number, title: string) => (
    <h2 className="mb-4 flex items-center gap-3 font-display text-lg font-bold">
      <span className="flex h-8 w-8 items-center justify-center rounded-none bg-ink text-sm text-white">{n}</span>{title}
    </h2>
  );

  return (
    <form onSubmit={keepValues(action)} className="space-y-5">
      <input type="hidden" name="slug" value={props.slug} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="staffId" value={staffId} />
      <input type="hidden" name="start" value={start} />
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />

      <section className="card p-5">
        {step(1, "Choose a service")}
        {categories.map((c) => (
          <div key={c} className="mb-4 last:mb-0">
            <p className="mb-2 text-[11px] font-bold tracking-widest text-stone-400 uppercase">{c}</p>
            <div className="space-y-2">
              {props.services.filter((s) => s.category === c).map((s) => {
                const on = serviceId === s.id;
                return (
                  <button type="button" key={s.id} onClick={() => { setServiceId(s.id); setStaffId(""); setStart(""); }}
                    className={`flex w-full items-center justify-between gap-3 rounded-none border px-4 py-3 text-left transition ${on ? "border-brand-400 bg-brand-50 " : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"}`}>
                    <span>
                      <span className="block font-semibold">{s.name}</span>
                      <span className="flex items-center gap-1 text-xs text-stone-500">{s.durationMin} min{s.description ? ` · ${s.description}` : ""}</span>
                    </span>
                    <span className="shrink-0 font-display font-bold">{money(s.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {service && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          {step(2, "Pick a day & time")}
          {staffForService.length > 1 && (
            <select value={staffId} onChange={(e) => { setStaffId(e.target.value); setStart(""); }} className="input mb-4">
              <option value="">Any available staff</option>
              {staffForService.map((s) => <option key={s.id} value={s.id}>{s.name}{s.title ? ` (${s.title})` : ""}</option>)}
            </select>
          )}
          <SlotPicker days={props.days} timezone={props.timezone} value={start} onChange={setStart}
            query={new URLSearchParams({ slug: props.slug, serviceId, staffId }).toString()} refreshKey={state?.error} />
        </motion.section>
      )}

      {start && service && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4 p-5">
          {step(3, "Your details")}
          <div><label className="label">Full name</label><input name="name" className="input" required autoComplete="name" /></div>
          <div><label className="label">Phone number</label><input name="phone" className="input" required inputMode="tel" autoComplete="tel" placeholder="0712 345 678" /></div>
          <div><label className="label">Anything we should know? (optional)</label><textarea name="notes" rows={2} className="input" placeholder="Allergies, hair length, inspiration…" /></div>
          {deposit > 0 && props.mpesa && (
            <div className="rounded-none bg-petal/30 p-4 ring-lime-500/30">
              <p className="flex items-center gap-2 font-semibold">Deposit: {money(deposit)}</p>
              <p className="mt-1 text-sm text-stone-700">
                Pay via M-Pesa to {props.mpesa.type === "PAYBILL" ? <>Paybill <b>{props.mpesa.number}</b>, account <b>{props.mpesa.account || "your name"}</b></> : props.mpesa.type === "TILL" ? <>Buy Goods Till <b>{props.mpesa.number}</b></> : <><b>{props.mpesa.number}</b></>}, then enter the confirmation code. It comes off your final bill.
              </p>
              <input name="depositRef" className="input mt-3 uppercase" placeholder="M-Pesa code, e.g. SKF3H7XQ2P" required />
            </div>
          )}
          {props.policy && <p className="text-[13px] text-muted">{props.policy}</p>}
          {state?.error && <p className="rounded-none bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
          <button className="btn-bold w-full py-3.5 text-base" disabled={pending}>
            {pending ? "Booking…" : `Confirm booking · ${money(service.price)}`}
          </button>
        </motion.section>
      )}
    </form>
  );
}
