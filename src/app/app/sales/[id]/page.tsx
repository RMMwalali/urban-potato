import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateTime, METHOD_LABEL, money, num } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";

export const metadata = { title: "Receipt" };

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const b = user.business;
  const s = await db.sale.findFirst({
    where: { id, businessId: b.id },
    include: { items: { include: { staff: true } }, client: true, payments: true },
  });
  if (!s) notFound();
  const c = b.currency;
  const text = [
    `${b.name}: receipt #${s.number}`,
    fmtDateTime(s.createdAt, b.timezone),
    ...s.items.map((i) => `${i.name}: ${money(num(i.unitPrice) * i.quantity, c)}`),
    num(s.discount) ? `Discount: -${money(s.discount, c)}` : "",
    num(s.tip) ? `Tip: ${money(s.tip, c)}` : "",
    `Total: ${money(s.total, c)}`,
    ...s.payments.map((p) => `${METHOD_LABEL[p.method]}${p.reference ? ` ${p.reference}` : ""}: ${money(p.amount, c)}`),
    "Thank you!",
  ].filter(Boolean).join("\n");

  return (
    <div className="max-w-md space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/app/sales" className="text-sm text-stone-500">← Sales</Link>
        <div className="flex gap-2">
          {s.client && (
            <a className="btn-secondary btn-sm" target="_blank" href={`https://wa.me/${s.client.phone}?text=${encodeURIComponent(text)}`}>Send via WhatsApp</a>
          )}
          <PrintButton />
        </div>
      </div>
      <div className="card p-6 font-mono text-sm">
        <div className="text-center">
          <p className="text-base font-semibold">{b.name}</p>
          {b.address && <p className="text-[13px] text-muted">{b.address}</p>}
          {b.phone && <p className="text-[13px] text-muted">{b.phone}</p>}
          <p className="mt-3 text-xs">Receipt #{s.number} · {fmtDateTime(s.createdAt, b.timezone)}</p>
          {s.client && <p className="text-xs">Client: {s.client.name}</p>}
        </div>
        <div className="my-4 border-t border-dashed border-stone-300" />
        {s.items.map((i) => (
          <div key={i.id} className="flex justify-between gap-2 py-0.5">
            <span>{i.name}{i.staff ? <span className="text-stone-500"> ({i.staff.name.split(" ")[0]})</span> : null}</span>
            <span>{money(num(i.unitPrice) * i.quantity, c)}</span>
          </div>
        ))}
        <div className="my-3 border-t border-dashed border-stone-300" />
        {num(s.discount) > 0 && <div className="flex justify-between"><span>Discount</span><span>−{money(s.discount, c)}</span></div>}
        {num(s.tip) > 0 && <div className="flex justify-between"><span>Tip</span><span>{money(s.tip, c)}</span></div>}
        <div className="flex justify-between text-base font-semibold"><span>TOTAL</span><span>{money(s.total, c)}</span></div>
        {num(s.depositApplied) > 0 && <div className="flex justify-between"><span>Deposit paid earlier</span><span>−{money(s.depositApplied, c)}</span></div>}
        {num(s.depositApplied) > 0 && <div className="flex justify-between font-semibold"><span>Paid today</span><span>{money(Math.max(num(s.total) - num(s.depositApplied), 0), c)}</span></div>}
        <div className="mt-3 space-y-1 text-xs">
          {s.payments.map((p) => (
            <div key={p.id} className="flex justify-between gap-2">
              <span>{METHOD_LABEL[p.method]}{p.reference ? ` ${p.reference}` : ""}{p.payerName ? ` · ${p.payerName}` : ""}{p.method === "MPESA" ? (p.verified ? " ✓" : " (unverified)") : ""}{p.tendered && num(p.tendered) > num(p.amount) ? ` · received ${money(p.tendered, c)}, change ${money(num(p.tendered) - num(p.amount), c)}` : ""}</span>
              <span>{money(p.amount, c)}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-stone-500">Thank you for visiting!</p>
      </div>
    </div>
  );
}
