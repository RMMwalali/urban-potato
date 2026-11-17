"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** Day strip + time grid. `query` is the slots API query minus the date. */
export function SlotPicker({ days, query, timezone, value, onChange, refreshKey }: { days: string[]; query: string; timezone: string; value: string; onChange: (iso: string) => void; refreshKey?: unknown }) {
  const [date, setDate] = useState(days[0]);
  const [slots, setSlots] = useState<string[] | null>(null);
  const fmt = useMemo(() => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: timezone }), [timezone]);

  useEffect(() => {
    if (!date) return;
    let live = true;
    setSlots(null);
    fetch(`/api/slots?${query}&date=${date}`).then((r) => r.json()).then((j) => live && setSlots(j.slots));
    return () => { live = false; };
  }, [date, query, refreshKey]);

  if (!days.length) return <p className="text-sm text-stone-500">No open days in the next few weeks.</p>;
  return (
    <div>
      <div data-days className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-2">
        {days.map((d) => {
          const dt = new Date(`${d}T12:00:00`);
          const on = date === d;
          return (
            <button type="button" key={d} onClick={() => { setDate(d); onChange(""); }}
              className={`shrink-0 rounded-none border px-3.5 py-2.5 text-center text-xs transition ${on ? "border-transparent bg-navy-900 text-white" : "border-stone-200 bg-white hover:border-stone-300"}`}>
              <span className={`block ${on ? "text-white/70" : "text-stone-500"}`}>{dt.toLocaleDateString("en-GB", { weekday: "short" })}</span>
              <span className="block font-display text-lg font-bold">{dt.getDate()}</span>
              <span className={`block ${on ? "text-white/70" : "text-stone-500"}`}>{dt.toLocaleDateString("en-GB", { month: "short" })}</span>
            </button>
          );
        })}
      </div>
      {slots === null ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-none bg-stone-100" />)}</div>
      ) : slots.length === 0 ? (
        <p className="rounded-none bg-stone-50 p-4 text-sm text-stone-500">No free times this day. Try another day.</p>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div key={date} initial={{ opacity: 0, rotateX: -20 }} animate={{ opacity: 1, rotateX: 0 }} transition={{ duration: 0.35 }} style={{ transformPerspective: 800 }} className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((s) => (
              <button type="button" key={s} onClick={() => onChange(s)}
                className={`rounded-none border py-2.5 text-sm font-semibold transition ${value === s ? "border-transparent bg-ink text-white" : "border-stone-200 bg-white hover:border-brand-400 hover:text-brand-600"}`}>
                {fmt.format(new Date(s))}
              </button>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
