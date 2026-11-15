"use client";
import { keepValues } from "./useKeepForm";
import { useActionState, useState } from "react";
import { createSale, type SaleState } from "@/app/actions/sales";

type Svc = { id: string; name: string; price: number };
type Staff = { id: string; name: string };
type Row = { serviceId: string | null; staffId: string | null; name: string; quantity: number; unitPrice: number };

export function CheckoutForm(props: {
  services: Svc[];
  staff: Staff[];
  currency: string;
  initialItems: Row[];
  appointmentId?: string;
  client?: { id: string; name: string } | null;
  deposit?: { amount: number; ref: string | null } | null;
}) {
  const [state, action, pending] = useActionState<SaleState, FormData>(createSale, undefined);
  const [items, setItems] = useState<Row[]>(props.initialItems);
  const [discount, setDiscount] = useState(0);
  const [tip, setTip] = useState(0);
  const [method, setMethod] = useState("MPESA");

  const subtotal = items.reduce((t, i) => t + i.unitPrice * i.quantity, 0);
  const total = Math.max(subtotal - discount, 0) + tip;
  const depositAmt = props.deposit?.amount ?? 0;
  const due = Math.max(total - depositAmt, 0);
  const tipStaffDefault = props.initialItems.find((i) => i.staffId)?.staffId ?? "";
  const fmt = (n: number) => `${props.currency} ${n.toLocaleString()}`;
  const update = (i: number, patch: Partial<Row>) => setItems(items.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <form onSubmit={keepValues(action)} className="card max-w-3xl space-y-5 p-5">
      {props.appointmentId && <input type="hidden" name="appointmentId" value={props.appointmentId} />}
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      {props.client ? (
        <p className="text-sm">Client: <b>{props.client.name}</b><input type="hidden" name="clientId" value={props.client.id} /></p>
      ) : !props.appointmentId ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Client phone (optional)</label><input name="clientPhone" className="input" inputMode="tel" /></div>
          <div><label className="label">Client name</label><input name="clientName" className="input" /></div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-2 text-sm font-semibold">Items</h2>
        <div className="space-y-2">
          {items.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <select
                className="input col-span-12 sm:col-span-5"
                value={r.serviceId ?? ""}
                onChange={(e) => {
                  const s = props.services.find((x) => x.id === e.target.value);
                  update(i, s ? { serviceId: s.id, name: s.name, unitPrice: s.price } : { serviceId: null });
                }}
              >
                <option value="">Custom item / product…</option>
                {props.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {!r.serviceId && (
                <input className="input col-span-12 sm:col-span-5" placeholder="Item name" value={r.name} onChange={(e) => update(i, { name: e.target.value })} />
              )}
              <select className={`input col-span-6 ${r.serviceId ? "sm:col-span-3" : "sm:col-span-12"}`} value={r.staffId ?? ""} onChange={(e) => update(i, { staffId: e.target.value || null })}>
                <option value="">No staff</option>
                {props.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="number" min={0} className="input col-span-4 sm:col-span-3" value={r.unitPrice} onChange={(e) => update(i, { unitPrice: Number(e.target.value) })} />
              <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="col-span-2 sm:col-span-1 text-stone-400 hover:text-rose-600" aria-label="Remove">✕</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-secondary btn-sm mt-2" onClick={() => setItems([...items, { serviceId: null, staffId: null, name: "", quantity: 1, unitPrice: 0 }])}>
          + Add item
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Discount</label><input name="discount" type="number" min={0} className="input" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
        <div><label className="label">Tip</label><input name="tip" type="number" min={0} className="input" value={tip} onChange={(e) => setTip(Number(e.target.value))} /></div>
        {tip > 0 && (
          <div className="sm:col-span-2">
            <label className="label">Tip goes to</label>
            <select name="tipStaffId" className="input" defaultValue={tipStaffDefault}>
              <option value="">The salon (shared)</option>
              {props.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Payment method</label>
          <select name="method" className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="MPESA">M-Pesa</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="BANK">Bank transfer</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        {method !== "CASH" && (due > 0 || method !== "MPESA") && (
          <div>
            <label className="label">{method === "MPESA" ? "M-Pesa code" : "Reference"}</label>
            <input name="reference" className="input uppercase" placeholder={method === "MPESA" ? "e.g. SKF3H7XQ2P" : ""} required={method === "MPESA"} />
          </div>
        )}
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
        {discount > 0 && <div className="flex justify-between"><span>Discount</span><span>−{fmt(Math.min(discount, subtotal))}</span></div>}
        {tip > 0 && <div className="flex justify-between"><span>Tip</span><span>{fmt(tip)}</span></div>}
        <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-semibold"><span>Total</span><span>{fmt(total)}</span></div>
        {depositAmt > 0 && <div className="flex justify-between text-emerald-700"><span>Deposit paid{props.deposit?.ref ? ` (${props.deposit.ref})` : ""}</span><span>−{fmt(depositAmt)}</span></div>}
        {depositAmt > 0 && <div className="flex justify-between font-display text-lg font-bold"><span>Due now</span><span>{fmt(due)}</span></div>}
      </div>

      {state?.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      <button className="btn-primary w-full sm:w-auto" disabled={pending || items.length === 0}>{pending ? "Saving…" : `Record payment · ${fmt(due)}`}</button>
    </form>
  );
}
