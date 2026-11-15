"use client";
import { useEffect, useRef, useState } from "react";
import { lookupMpesa } from "@/app/actions/payments";
import { looksLikeCode, parseMpesaSms } from "@/lib/mpesa-sms";
import type { CodeLookup } from "@/lib/mpesa";

export type PayRow = { method: string; amount: number; tendered?: number | null; reference?: string; payerName?: string | null; smsText?: string | null; lookup?: CodeLookup | "loading" | null; touched?: boolean };

const META: Record<string, { label: string }> = {
  MPESA: { label: "M-Pesa" },
  CASH: { label: "Cash" },
  CARD: { label: "Card" },
  BANK: { label: "Bank" },
};

export function PaymentRows({ initialCode, due, methods, requireVerified, currency, onChange }: { due: number; methods: string[]; requireVerified: boolean; currency: string; onChange: (rows: PayRow[], ok: boolean) => void; initialCode?: string }) {
  const first = methods.includes("MPESA") ? "MPESA" : methods[0];
  const [rows, setRows] = useState<PayRow[]>([initialCode ? { method: "MPESA", amount: due, reference: initialCode } : { method: first, amount: due }]);
  const fmt = (n: number) => `${currency} ${Math.round(n * 100) / 100 === Math.round(n) ? Math.round(n).toLocaleString() : n.toLocaleString()}`;

  // Keep a single untouched row equal to the amount due.
  useEffect(() => {
    setRows((r) => (r.length === 1 && !r[0].touched ? [{ ...r[0], amount: due }] : r));
  }, [due]);

  const paid = rows.reduce((t, r) => t + (Number(r.amount) || 0), 0);
  const remaining = Math.round((due - paid) * 100) / 100;
  const blocked = rows.some((r) => {
    if (r.method !== "MPESA") return false;
    if (!looksLikeCode(r.reference ?? "") || r.lookup === "loading") return true;
    const st = r.lookup?.status;
    return st === "used" || (st === "not_found" && requireVerified);
  });
  const cashShort = rows.some((r) => r.method === "CASH" && r.tendered && r.tendered < r.amount);
  const ok = Math.abs(remaining) <= 0.5 && !blocked && !cashShort;
  const okRef = useRef(onChange);
  okRef.current = onChange;
  useEffect(() => okRef.current(rows, ok), [rows, ok]);

  useEffect(() => {
    if (initialCode) check(0, initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (i: number, patch: Partial<PayRow>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function check(i: number, code: string) {
    if (!looksLikeCode(code)) return update(i, { lookup: null });
    update(i, { lookup: "loading" });
    const res = await lookupMpesa(code);
    setRows((rs) =>
      rs.map((r, j) => {
        if (j !== i || (r.reference ?? "").toUpperCase() !== code.toUpperCase()) return r;
        if (res.status === "verified" || res.status === "unverified") {
          const others = rs.reduce((t, x, k) => (k === i ? t : t + (Number(x.amount) || 0)), 0);
          return { ...r, lookup: res, payerName: res.payerName, amount: Math.min(res.amount, Math.max(due - others, 0)), touched: true };
        }
        return { ...r, lookup: res };
      }),
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r, i) => {
        const M = META[r.method] ?? META.CASH;
        const lk = r.lookup && r.lookup !== "loading" ? r.lookup : null;
        return (
          <div key={i} className="border-t-2 border-ink py-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1.5">
                {methods.map((m) => {
                  return (
                    <button type="button" key={m} onClick={() => update(i, { method: m, lookup: null, reference: "", payerName: null, smsText: null, tendered: null })}
                      className={`btn btn-sm ${r.method === m ? "border-ink bg-ink text-paper" : "border-ink/30 text-ink hover:border-ink"}`}>
                      {META[m]?.label ?? m}
                    </button>
                  );
                })}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500">{currency}</span>
                <input type="number" min={0} value={r.amount} onChange={(e) => update(i, { amount: Number(e.target.value), touched: true })} className="input w-32 text-right font-display text-lg font-bold" aria-label={`${M.label} amount`} />
                {rows.length > 1 && <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="label-caps text-muted hover:text-ink" aria-label="Remove payment">Remove</button>}
              </div>
            </div>

            {r.method === "MPESA" && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input value={r.reference ?? ""} placeholder="M-Pesa code, e.g. SKF3H7XQ2P" className="input font-mono uppercase" aria-label="M-Pesa code"
                    onChange={(e) => { const v = e.target.value.toUpperCase().replace(/\s/g, ""); update(i, { reference: v, lookup: null, payerName: null, smsText: null }); if (looksLikeCode(v)) check(i, v); }} />
                  {r.lookup === "loading" && <span className="label-caps self-center text-muted">Checking…</span>}
                </div>
                {lk?.status === "verified" && (
                  <p className="flex items-start gap-2 rounded-none bg-emerald-50 px-3 py-2 text-sm text-emerald-900"><span><b>Confirmed by Safaricom</b> · {lk.payerName ?? "Unknown"} · {fmt(lk.amount)}{lk.when ? ` · ${lk.when}` : ""}</span></p>
                )}
                {lk?.status === "unverified" && (
                  <p className="flex items-start gap-2 rounded-none bg-amber-50 px-3 py-2 text-sm text-amber-900"><span>{lk.payerName ?? "Unknown"} · {fmt(lk.amount)}. Recorded from an SMS, <b>not verified</b> by Safaricom.</span></p>
                )}
                {lk?.status === "used" && <p className="flex items-center gap-2 rounded-none bg-rose-50 px-3 py-2 text-sm text-rose-800">Already used on {lk.usedOn}.</p>}
                {lk?.status === "not_found" && (
                  requireVerified ? (
                    <p className="flex items-center justify-between gap-2 rounded-none bg-rose-50 px-3 py-2 text-sm text-rose-800">
                      <span className="flex items-center gap-2">Not received from Safaricom yet.</span>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => check(i, r.reference ?? "")}>Check again</button>
                    </p>
                  ) : (
                    <p className="rounded-none bg-stone-100 px-3 py-2 text-sm text-stone-700">Not in your M-Pesa records. It will be saved as <b>unverified</b>.{r.payerName ? ` Payer: ${r.payerName}.` : ""}</p>
                  )
                )}
                {!requireVerified && !(lk && (lk.status === "verified" || lk.status === "unverified")) && (
                  <details className="text-sm" open={!!r.smsText}>
                    <summary className="flex cursor-pointer items-center gap-1.5 underline underline-offset-4 decoration-1 hover:opacity-60">Paste the M-Pesa SMS instead</summary>
                    <textarea rows={3} className="input mt-2" placeholder="SKF3H7XQ2P Confirmed. Ksh1,500.00 received from JOHN DOE 0712345678 on…" value={r.smsText ?? ""}
                      onChange={(e) => {
                        const text = e.target.value;
                        const p = parseMpesaSms(text);
                        if (!p) return update(i, { smsText: text });
                        update(i, { smsText: text, reference: p.code, payerName: p.payerName, amount: p.amount, touched: true, lookup: null });
                        check(i, p.code);
                      }} />
                    {r.smsText && !parseMpesaSms(r.smsText) && <p className="mt-1 text-xs text-rose-600">Couldn&apos;t read a code and amount from that message.</p>}
                    {r.smsText && parseMpesaSms(r.smsText) && <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700">Read {parseMpesaSms(r.smsText)!.code}{r.payerName ? ` from ${r.payerName}` : ""}</p>}
                  </details>
                )}
              </div>
            )}

            {r.method === "CASH" && (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-2 text-stone-600">Cash received
                  <input type="number" min={0} value={r.tendered ?? ""} onChange={(e) => update(i, { tendered: e.target.value ? Number(e.target.value) : null })} className="input w-28" placeholder={String(r.amount)} />
                </label>
                {r.tendered != null && r.tendered >= r.amount && <span className="rounded-none bg-petal/40 px-2.5 py-1 font-semibold">Change: {fmt(r.tendered - r.amount)}</span>}
                {r.tendered != null && r.tendered > 0 && r.tendered < r.amount && <span className="text-rose-600">Less than the cash amount</span>}
              </div>
            )}
            {(r.method === "CARD" || r.method === "BANK") && (
              <input value={r.reference ?? ""} onChange={(e) => update(i, { reference: e.target.value })} placeholder="Reference (optional)" className="input mt-3" />
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {methods.length > 1 && (
          <button type="button" className="btn-secondary btn-sm" onClick={() => setRows([...rows.map((r) => ({ ...r, touched: true })), { method: rows.some((r) => r.method === "CASH") ? first : "CASH", amount: Math.max(remaining, 0), touched: true }])}>
            Split payment
          </button>
        )}
        <p className={`text-sm font-semibold ${Math.abs(remaining) <= 0.5 ? "text-emerald-700" : "text-rose-600"}`}>
          {Math.abs(remaining) <= 0.5 ? "Fully paid" : remaining > 0 ? `${fmt(remaining)} still to pay` : `${fmt(-remaining)} more than due`}
        </p>
      </div>
    </div>
  );
}
