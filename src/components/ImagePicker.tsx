"use client";
import { useEffect, useRef, useState } from "react";
import { prepareImage, type Prepared } from "@/lib/image-client";

export type ExistingImage = { id: string; url: string };
type Item = { key: string; existing?: ExistingImage; added?: Prepared };

/**
 * Photo field for server-action forms. Submits `${name}` (files), `${name}Thumbs`, `${name}Dims` and
 * `${name}Keep` (ids of existing photos, in order). The first photo is the cover.
 */
export function ImagePicker({ name, existing = [], required = false, max = 8, label = "Photos", hint, transparent = false }: { name: string; existing?: ExistingImage[]; required?: boolean; max?: number; label?: string; hint?: string; transparent?: boolean }) {
  const [items, setItems] = useState<Item[]>(existing.map((e) => ({ key: e.id, existing: e })));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const filesRef = useRef<HTMLInputElement>(null);
  const thumbsRef = useRef<HTMLInputElement>(null);
  const guardRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);

  // mirror the prepared files into real file inputs so the form submits them
  useEffect(() => {
    const added = items.filter((i) => i.added).map((i) => i.added!);
    const set = (el: HTMLInputElement | null, files: File[]) => {
      if (!el) return;
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      el.files = dt.files;
    };
    set(filesRef.current, added.map((a) => a.main));
    set(thumbsRef.current, added.map((a) => a.thumb));
    guardRef.current?.setCustomValidity(required && items.length === 0 ? "Add at least one photo of this service." : "");
  }, [items, required]);

  async function add(list: FileList | File[]) {
    setErr("");
    const files = [...list].filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, max - items.length));
    if (!files.length) { if (items.length >= max) setErr(`Up to ${max} photos.`); return; }
    setBusy(true);
    try {
      const prepared: Item[] = [];
      for (const f of files) prepared.push({ key: `n${Math.random().toString(36).slice(2)}`, added: await prepareImage(f, { max: transparent ? 800 : 1600, transparent }) });
      setItems((cur) => [...cur, ...prepared]);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  const move = (i: number, to: number) => setItems((cur) => { const n = [...cur]; const [x] = n.splice(i, 1); n.splice(to, 0, x); return n; });
  const remove = (i: number) => setItems((cur) => cur.filter((_, j) => j !== i));
  const added = items.filter((i) => i.added);

  return (
    <div>
      <span className="label">{label}{required && <span className="text-pink"> *</span>}</span>
      <input type="file" ref={filesRef} name={name} multiple hidden aria-hidden />
      <input type="file" ref={thumbsRef} name={`${name}Thumbs`} multiple hidden aria-hidden />
      <input type="hidden" name={`${name}Dims`} value={JSON.stringify(added.map((a) => ({ w: a.added!.width, h: a.added!.height })))} />
      <input type="hidden" name={`${name}Keep`} value={JSON.stringify(items.filter((i) => i.existing).map((i) => i.existing!.id))} />
      <input ref={guardRef} tabIndex={-1} aria-hidden className="pointer-events-none absolute h-px w-px opacity-0" value={items.length ? "1" : ""} onChange={() => {}} required={required} />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((it, i) => (
          <figure key={it.key} className="group relative aspect-[4/5] overflow-hidden border border-ink/20 bg-panel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.existing?.url ?? it.added!.preview} alt="" className={`h-full w-full ${transparent ? "object-contain p-3" : "object-cover"}`} />
            {i === 0 && max > 1 && <span className="absolute left-1.5 top-1.5 bg-ink px-1.5 py-0.5 text-[10px] uppercase tracking-[0.06em] text-paper">Cover</span>}
            <figcaption className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/80 px-1.5 py-1 text-[11px] uppercase tracking-[0.04em] text-paper">
              {i > 0 ? <button type="button" onClick={() => move(i, 0)} className="hover:opacity-60">Cover</button> : <span />}
              <button type="button" onClick={() => remove(i)} className="hover:opacity-60">Remove</button>
            </figcaption>
          </figure>
        ))}
        {items.length < max && (
          <button type="button" onClick={() => pickRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
            className={`flex aspect-[4/5] flex-col items-center justify-center border border-dashed px-2 text-center text-[12px] uppercase tracking-[0.06em] transition-colors ${drag ? "border-ink bg-panel" : "border-ink/40 hover:border-ink"}`}>
            {busy ? "Preparing…" : items.length ? "+ Add more" : "+ Add photos"}
          </button>
        )}
      </div>
      <input ref={pickRef} type="file" accept="image/*" multiple={max > 1} hidden onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
      {err && <p className="mt-2 text-[13px] text-pink">{err}</p>}
      {hint && <p className="mt-2 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}
