"use client";
import { useEffect, useId, useRef, useState } from "react";

export type FoundClient = {
  id: string; name: string; phone: string; email: string | null; allergies: string | null; preferences: string | null; notes: string | null;
  visits: number; noShows: number; last: { serviceId: string; service: string; staffId: string | null; staff: string | null; at: string } | null;
};

const show = (p: string) => (p.startsWith("254") && p.length === 12 ? `0${p.slice(3, 6)} ${p.slice(6, 9)} ${p.slice(9)}` : `+${p}`);

/**
 * Phone + name fields that recognise registered clients. Typing either one suggests matches; an exact phone
 * match fills in by itself. Picking a client fills name and phone and shows their care notes; `onPick` lets
 * the form preselect their usual service and stylist. Payment fields are never touched.
 */
export function ClientAutofill({ required = true, phoneLabel = "Phone number", nameLabel = "Full name", onPick }: { required?: boolean; phoneLabel?: string; nameLabel?: string; onPick?: (c: FoundClient | null) => void }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<FoundClient | null>(null);
  const [list, setList] = useState<FoundClient[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [field, setField] = useState<"phone" | "name">("phone");
  const lid = useId();
  const seq = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  const query = field === "phone" ? phone : name;
  useEffect(() => {
    if (picked) return;
    const q = query.trim();
    if (q.length < (field === "phone" ? 3 : 2)) { setList([]); return; }
    const n = ++seq.current;
    const t = setTimeout(async () => {
      const r = await fetch(`/api/clients/lookup?q=${encodeURIComponent(q)}`).then((x) => x.json()).catch(() => null);
      if (n !== seq.current || !r) return;
      setList(r.clients); setActive(0); setOpen(r.clients.length > 0);
      // exact phone match: fill in straight away
      const exact = r.exactPhone && r.clients.find((c: FoundClient) => c.phone === r.exactPhone);
      if (field === "phone" && exact) pick(exact);
    }, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, field, picked]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function pick(c: FoundClient) {
    setPicked(c); setName(c.name); setPhone(show(c.phone)); setOpen(false); onPick?.(c);
  }
  function clear() {
    setPicked(null); setName(""); setPhone(""); setList([]); onPick?.(null);
  }
  const key = (e: React.KeyboardEvent) => {
    if (!open || !list.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % list.length); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + list.length) % list.length); }
    if (e.key === "Enter") { e.preventDefault(); pick(list[active]); }
    if (e.key === "Escape") setOpen(false);
  };
  const combo = (f: "phone" | "name") => ({
    role: "combobox", "aria-expanded": open && field === f, "aria-controls": lid, "aria-autocomplete": "list" as const,
    onFocus: () => { setField(f); if (list.length && !picked) setOpen(true); }, onKeyDown: key, readOnly: !!picked, autoComplete: "off",
  });

  return (
    <div ref={box} className="relative">
      {picked && <input type="hidden" name="clientId" value={picked.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${lid}p`}>{phoneLabel}</label>
          <input id={`${lid}p`} name={picked ? undefined : "clientPhone"} value={phone} onChange={(e) => { setField("phone"); setPhone(e.target.value); }} className="input" placeholder="0712 345 678" inputMode="tel" required={required && !picked} {...combo("phone")} />
        </div>
        <div>
          <label className="label" htmlFor={`${lid}n`}>{nameLabel}</label>
          <input id={`${lid}n`} name={picked ? undefined : "clientName"} value={name} onChange={(e) => { setField("name"); setName(e.target.value); }} className="input" required={required && !picked} {...combo("name")} />
        </div>
      </div>

      {open && !picked && list.length > 0 && (
        <ul id={lid} role="listbox" className="absolute inset-x-0 z-20 mt-1 max-h-72 overflow-auto border border-ink bg-white shadow-[0_16px_40px_rgba(0,0,0,0.15)]">
          {list.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === active} onMouseDown={(e) => { e.preventDefault(); pick(c); }} onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-panel" : ""}`}>
              <span className="font-medium">{c.name}</span> <span className="text-stone-500">{show(c.phone)}</span>
              <span className="block text-xs text-stone-500">{c.visits} visit{c.visits === 1 ? "" : "s"}{c.last ? ` · last: ${c.last.service}${c.last.staff ? ` with ${c.last.staff.split(" ")[0]}` : ""}` : ""}</span>
            </li>
          ))}
        </ul>
      )}

      {picked ? (
        <div className="mt-3 space-y-1 border-l-2 border-ink bg-panel px-3 py-2 text-sm">
          <p className="flex flex-wrap items-baseline justify-between gap-2">
            <span>Returning client · {picked.visits} visit{picked.visits === 1 ? "" : "s"}{picked.last ? ` · last: ${picked.last.service}${picked.last.staff ? ` with ${picked.last.staff.split(" ")[0]}` : ""}` : ""}</span>
            <button type="button" onClick={clear} className="label-caps text-muted hover:text-ink">Different client</button>
          </p>
          {picked.allergies && <p className="text-pink">Allergies: {picked.allergies}</p>}
          {picked.preferences && <p className="text-stone-600">Prefers: {picked.preferences}</p>}
          {picked.noShows > 0 && <p className="text-stone-600">{picked.noShows} no-show{picked.noShows === 1 ? "" : "s"} before</p>}
        </div>
      ) : (
        <p className="mt-2 text-xs text-stone-500">Type a phone number or name: registered clients fill in automatically. New numbers create a new client.</p>
      )}
    </div>
  );
}
