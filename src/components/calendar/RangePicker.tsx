"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DateTime } from "luxon";

/** Pick a date range on a calendar: click a start day, then an end day. */
export function RangePicker({ from, to, today, extra }: { from?: string; to?: string; today: string; extra: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(DateTime.fromISO(from ?? today).startOf("month"));
  const [a, setA] = useState<string | null>(from ?? null);
  const [b, setB] = useState<string | null>(to ?? null);
  const [hover, setHover] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const go = (f: string, t: string) => { setOpen(false); router.push(`?view=range&from=${f}&to=${t}${extra}`); };
  const click = (d: string) => {
    if (!a || b) { setA(d); setB(null); return; }
    const [f, t] = d < a ? [d, a] : [a, d];
    setB(t); setA(f);
    go(f, t);
  };
  const T = DateTime.fromISO(today);
  const presets: [string, string, string][] = [
    ["This week", T.startOf("week").toISODate()!, T.endOf("week").toISODate()!],
    ["Next 7 days", T.toISODate()!, T.plus({ days: 6 }).toISODate()!],
    ["This month", T.startOf("month").toISODate()!, T.endOf("month").toISODate()!],
    ["Last 30 days", T.minus({ days: 29 }).toISODate()!, T.toISODate()!],
    ["This year", T.startOf("year").toISODate()!, T.endOf("year").toISODate()!],
  ];
  const lo = a && (b ?? hover) ? (a < (b ?? hover)! ? a : (b ?? hover)!) : a;
  const hi = a && (b ?? hover) ? (a < (b ?? hover)! ? (b ?? hover)! : a) : a;
  const gridStart = month.startOf("week");
  const days = Array.from({ length: 42 }, (_, i) => gridStart.plus({ days: i }));

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="btn-secondary" aria-expanded={open}>
        {from && to ? `${DateTime.fromISO(from).toFormat("d LLL")} – ${DateTime.fromISO(to).toFormat("d LLL yyyy")}` : "Pick dates"}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(340px,calc(100vw-2.5rem))] border border-ink bg-white p-4 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setMonth(month.minus({ months: 1 }))} className="btn btn-sm border-ink/30" aria-label="Previous month">←</button>
            <p className="text-[15px]">{month.toFormat("LLLL yyyy")}</p>
            <button type="button" onClick={() => setMonth(month.plus({ months: 1 }))} className="btn btn-sm border-ink/30" aria-label="Next month">→</button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] uppercase text-muted">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="py-1">{d}</span>)}</div>
          <div className="grid grid-cols-7" onMouseLeave={() => setHover(null)}>
            {days.map((d) => {
              const iso = d.toISODate()!;
              const inRange = lo && hi && iso >= lo && iso <= hi;
              const edge = iso === lo || iso === hi;
              return (
                <button type="button" key={iso} onClick={() => click(iso)} onMouseEnter={() => setHover(iso)}
                  className={`h-10 text-[13px] tabular-nums transition-colors ${d.month !== month.month ? "text-muted/60" : ""} ${edge ? "bg-ink text-paper" : inRange ? "bg-ink/10" : "hover:bg-panel"} ${iso === today && !edge ? "underline underline-offset-4" : ""}`}>
                  {d.day}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] text-muted">{a && !b ? "Now pick the last day." : "Pick the first day, then the last day."}</p>
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink/20 pt-3">
            {presets.map(([label, f, t]) => <button type="button" key={label} onClick={() => go(f, t)} className="btn btn-sm border-ink/30">{label}</button>)}
          </div>
        </div>
      )}
    </div>
  );
}
