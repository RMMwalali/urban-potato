"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveServiceFull, type ServiceFormState } from "@/app/actions/services";
import { ImagePicker, type ExistingImage } from "./ImagePicker";
import { keepValues } from "./useKeepForm";

export type EditorService = {
  id?: string; name: string; category: string; description: string; durationMin: number; price: number | ""; onlineBooking: boolean;
  photos: ExistingImage[];
  styles: { id: string; name: string; price: number | ""; durationMin: number | ""; photos: ExistingImage[] }[];
};
type StyleRow = { key: string; id?: string; name: string; price: string; durationMin: string; photos: ExistingImage[] };

export function ServiceEditor({ service, categories, currency }: { service: EditorService; categories: string[]; currency: string }) {
  const [state, action, pending] = useActionState<ServiceFormState, FormData>(saveServiceFull, undefined);
  const [styles, setStyles] = useState<StyleRow[]>(service.styles.map((s) => ({ key: s.id, id: s.id, name: s.name, price: String(s.price), durationMin: String(s.durationMin), photos: s.photos })));
  const set = (i: number, patch: Partial<StyleRow>) => setStyles((cur) => cur.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const addStyle = () => setStyles((cur) => [...cur, { key: `n${Date.now().toString(36)}${cur.length}`, name: "", price: "", durationMin: "", photos: [] }]);

  return (
    <form onSubmit={keepValues(action)} className="space-y-12">
      {service.id && <input type="hidden" name="id" value={service.id} />}
      <input type="hidden" name="styles" value={JSON.stringify(styles.map(({ key, id, name, price, durationMin }) => ({ key, id, name, price, durationMin })))} />

      <section className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="name">Service name</label><input id="name" name="name" defaultValue={service.name} required className="input" placeholder="e.g. Knotless braids" /></div>
        <div><label className="label" htmlFor="category">Category</label><input id="category" name="category" defaultValue={service.category} required className="input" list="cats" /><datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label" htmlFor="durationMin">Minutes</label><input id="durationMin" name="durationMin" type="number" min={5} step={5} defaultValue={service.durationMin} required className="input" /></div>
          <div><label className="label" htmlFor="price">Price ({currency})</label><input id="price" name="price" type="number" min={0} defaultValue={service.price} required className="input" /></div>
        </div>
        <div className="sm:col-span-2"><label className="label" htmlFor="description">Description (optional)</label><textarea id="description" name="description" rows={2} defaultValue={service.description} className="input" placeholder="What's included, hair length, products used…" /></div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="onlineBooking" defaultChecked={service.onlineBooking} /> Clients can book this online</label>
      </section>

      <section className="border-t-2 border-ink pt-6">
        <ImagePicker name="photos" existing={service.photos} required label="Photos of this service" hint="At least one photo is required; the first is the cover. Photos appear on your booking page and gallery, where search engines can find them. Only upload photos you have the right to use, with your clients' permission." />
      </section>

      <section className="border-t-2 border-ink pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-caps">Styles (optional)</p>
            <p className="mt-2 max-w-xl text-[14px] text-muted">Variations clients can choose, such as Knotless, Bohemian or Jumbo. Leave price or minutes empty to use the service&apos;s.</p>
          </div>
          <button type="button" onClick={addStyle} className="btn-secondary btn-sm">+ Add style</button>
        </div>
        <div className="mt-6 space-y-6">
          {styles.map((s, i) => (
            <div key={s.key} className="border border-ink/25 p-4">
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
                <div><label className="label" htmlFor={`sn_${s.key}`}>Style name</label><input id={`sn_${s.key}`} value={s.name} onChange={(e) => set(i, { name: e.target.value })} required className="input" placeholder="e.g. Bohemian" /></div>
                <div><label className="label" htmlFor={`sp_${s.key}`}>Price</label><input id={`sp_${s.key}`} value={s.price} onChange={(e) => set(i, { price: e.target.value })} type="number" min={0} className="input" placeholder="Same" /></div>
                <div><label className="label" htmlFor={`sd_${s.key}`}>Minutes</label><input id={`sd_${s.key}`} value={s.durationMin} onChange={(e) => set(i, { durationMin: e.target.value })} type="number" min={5} step={5} className="input" placeholder="Same" /></div>
                <button type="button" onClick={() => setStyles((cur) => cur.filter((_, j) => j !== i))} className="label-caps pb-3 text-muted hover:text-ink">Remove</button>
              </div>
              <div className="mt-4"><ImagePicker name={`style_${s.key}`} existing={s.photos} max={4} label="Style photos (optional)" /></div>
            </div>
          ))}
          {styles.length === 0 && <p className="text-[14px] text-muted">No styles. Clients book the service as it is.</p>}
        </div>
      </section>

      {state?.error && <p className="border-l-2 border-pink bg-panel px-3 py-2 text-[14px] text-pink">{state.error}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save service"}</button>
        <Link href="/app/services" className="btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
