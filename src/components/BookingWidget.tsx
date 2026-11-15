"use client";
import { keepValues } from "./useKeepForm";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { publicBook, type BookState } from "@/app/actions/booking";
import { SlotPicker } from "./SlotPicker";
import { BookingReceipt } from "./BookingReceipt";
import { PrintReceipt } from "./PrintReceipt";

const ME_KEY = "darling.client";
type Photo = { url: string; thumb: string; alt: string };
type Style = { id: string; name: string; price: number | null; durationMin: number | null; photo: Photo | null };
type Svc = { id: string; name: string; category: string; durationMin: number; price: number; description: string | null; photos: Photo[]; styles: Style[] };
type Staff = { id: string; name: string; title: string | null; serviceIds: string[] };
type Mpesa = { type: string; number: string; account: string | null } | null;

export function BookingWidget(props: { slug: string; currency: string; timezone: string; services: Svc[]; staff: Staff[]; days: string[]; depositPercent: number; mpesa: Mpesa; policy: string | null; initialService?: string }) {
  const [state, action, pending] = useActionState<BookState, FormData>(publicBook, undefined);
  const [serviceId, setServiceId] = useState(props.services.some((s) => s.id === props.initialService) ? props.initialService! : "");
  const [styleId, setStyleId] = useState("");
  const [cat, setCat] = useState("All");
  // remembered on this phone only (never looked up on the server), so returning clients don't retype
  const [me, setMe] = useState<{ name: string; phone: string } | null>(null);
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem(ME_KEY) ?? "null"); if (v?.name && v?.phone) setMe(v); } catch {} }, []);
  const typed = useRef<{ name: string; phone: string } | null>(null);
  useEffect(() => { if (state?.done && typed.current?.name && typed.current.phone) try { localStorage.setItem(ME_KEY, JSON.stringify(typed.current)); } catch {} }, [state?.done]);
  const railRef = useRef<HTMLDivElement>(null);
  const [staffId, setStaffId] = useState("");
  const [start, setStart] = useState("");
  const service = props.services.find((s) => s.id === serviceId);
  const style = service?.styles.find((x) => x.id === styleId);
  const price = style?.price ?? service?.price ?? 0;
  const shown = props.services.filter((s) => cat === "All" || s.category === cat);
  const pick = (id: string) => { setServiceId(id); setStyleId(""); setStaffId(""); setStart(""); };
  const staffForService = props.staff.filter((s) => !s.serviceIds.length || s.serviceIds.includes(serviceId));
  const categories = useMemo(() => [...new Set(props.services.map((s) => s.category))], [props.services]);
  const deposit = service && props.mpesa && props.depositPercent > 0 ? Math.round((price * props.depositPercent) / 100) : 0;
  const money = (n: number) => `${props.currency} ${n.toLocaleString()}`;

  if (state?.done)
    return state.done.slip ? (
      <PrintReceipt label="Print booking slip" staff={false}><BookingReceipt slip={state.done.slip} /></PrintReceipt>
    ) : (
      <div className="card p-6 text-center">
        <h2 className="text-2xl">You&apos;re booked!</h2>
        <p className="mt-2">{state.done.service} · {state.done.when}</p>
        <Link href={state.done.manage} className="btn-secondary mt-4">Change or cancel</Link>
      </div>
    );

  const step = (n: number, title: string) => (
    <h2 className="mb-4 flex items-center gap-3 font-display text-lg font-bold">
      <span className="flex h-8 w-8 items-center justify-center rounded-none bg-ink text-sm text-white">{n}</span>{title}
    </h2>
  );

  return (
    <form onSubmit={(e) => { const f = new FormData(e.currentTarget); typed.current = { name: String(f.get("name") ?? "").trim(), phone: String(f.get("phone") ?? "").trim() }; keepValues(action)(e); }} className="space-y-5">
      <input type="hidden" name="slug" value={props.slug} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="styleId" value={styleId} />
      <input type="hidden" name="staffId" value={staffId} />
      <input type="hidden" name="start" value={start} />
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />

      <section>
        {step(1, "Choose a service")}
        {categories.length > 1 && (
          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {["All", ...categories].map((c) => (
              <button type="button" key={c} onClick={() => setCat(c)} className={`btn btn-sm shrink-0 ${cat === c ? "border-ink bg-ink text-paper" : "border-ink/30"}`}>{c}</button>
            ))}
          </div>
        )}
        <div className="relative">
          <div ref={railRef} className="svc-rail -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-5 pb-3 sm:mx-0 sm:px-0">
            {shown.map((s) => {
              const on = serviceId === s.id;
              return (
                <button type="button" key={s.id} onClick={() => pick(s.id)} aria-pressed={on}
                  className={`group relative w-[64%] shrink-0 snap-start overflow-hidden border text-left transition-all duration-500 sm:w-[44%] ${on ? "border-ink ring-2 ring-ink" : "border-ink/20 hover:border-ink"}`}>
                  <span className="block aspect-[4/5] overflow-hidden bg-panel">
                    {s.photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photos[0].thumb} alt={s.photos[0].alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" style={{ transitionTimingFunction: "cubic-bezier(.19,1,.22,1)" }} />
                    ) : (
                      <span className="flex h-full items-end p-3 text-[28px] uppercase leading-none text-ink/20">{s.name}</span>
                    )}
                  </span>
                  <span className="block bg-white p-3">
                    <span className="block truncate font-semibold">{s.name}</span>
                    <span className="flex justify-between gap-2 text-xs text-stone-500"><span>{s.durationMin} min{s.styles.length ? ` · ${s.styles.length} styles` : ""}</span><span className="font-semibold text-ink">{s.styles.some((x) => x.price != null && x.price !== s.price) ? "from " : ""}{money(Math.min(s.price, ...s.styles.map((x) => x.price ?? s.price)))}</span></span>
                  </span>
                </button>
              );
            })}
          </div>
          {shown.length > 2 && (
            <div className="mt-2 hidden justify-end gap-2 sm:flex">
              <button type="button" aria-label="Previous services" onClick={() => railRef.current?.scrollBy({ left: -railRef.current.clientWidth * 0.8, behavior: "smooth" })} className="btn btn-sm border-ink/30">←</button>
              <button type="button" aria-label="More services" onClick={() => railRef.current?.scrollBy({ left: railRef.current.clientWidth * 0.8, behavior: "smooth" })} className="btn btn-sm border-ink/30">→</button>
            </div>
          )}
        </div>

        {service && (
          <motion.div key={service.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-4 border-t-2 border-ink pt-4">
            <p className="text-[20px]">{service.name}</p>
            {service.description && <p className="mt-1 text-sm text-stone-600">{service.description}</p>}
            {service.photos.length > 1 && (
              <div className="-mx-5 mt-3 flex snap-x gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
                {service.photos.map((ph) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={ph.url} src={ph.url} alt={ph.alt} loading="lazy" className="h-48 w-auto shrink-0 snap-start object-cover" />
                ))}
              </div>
            )}
            {service.styles.length > 0 && (
              <div className="mt-4">
                <p className="label-caps mb-2">Choose a style</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {service.styles.map((st) => {
                    const on = styleId === st.id;
                    return (
                      <button type="button" key={st.id} onClick={() => { setStyleId(st.id); setStart(""); }} aria-pressed={on}
                        className={`overflow-hidden border text-left transition-colors ${on ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-ink"}`}>
                        {st.photo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={st.photo.thumb} alt={st.photo.alt} loading="lazy" className="aspect-square w-full object-cover" />
                        )}
                        <span className="block px-3 py-2 text-sm">{st.name}<span className={`block text-xs ${on ? "text-paper/70" : "text-stone-500"}`}>{money(st.price ?? service.price)} · {st.durationMin ?? service.durationMin} min</span></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </section>

      {service && (!service.styles.length || style) && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          {step(2, "Pick a day & time")}
          {staffForService.length > 1 && (
            <select value={staffId} onChange={(e) => { setStaffId(e.target.value); setStart(""); }} className="input mb-4">
              <option value="">Any available staff</option>
              {staffForService.map((s) => <option key={s.id} value={s.id}>{s.name}{s.title ? ` (${s.title})` : ""}</option>)}
            </select>
          )}
          <SlotPicker days={props.days} timezone={props.timezone} value={start} onChange={setStart}
            query={new URLSearchParams({ slug: props.slug, serviceId, staffId, styleId }).toString()} refreshKey={state?.error} />
        </motion.section>
      )}

      {start && service && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4 p-5">
          {step(3, "Your details")}
          {me && (
            <p className="flex justify-between gap-3 text-[13px] text-stone-600">
              <span>Welcome back, {me.name.split(" ")[0]}.</span>
              <button type="button" className="underline underline-offset-4" onClick={() => { try { localStorage.removeItem(ME_KEY); } catch {} setMe(null); }}>Not you?</button>
            </p>
          )}
          <div key={me ? "me" : "new"} className="space-y-4">
            <div><label className="label">Full name</label><input name="name" className="input" required autoComplete="name" defaultValue={me?.name} /></div>
            <div><label className="label">Phone number</label><input name="phone" className="input" required inputMode="tel" autoComplete="tel" placeholder="0712 345 678" defaultValue={me?.phone} /></div>
          </div>
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
            {pending ? "Booking…" : `Confirm booking · ${money(price)}`}
          </button>
        </motion.section>
      )}
    </form>
  );
}
