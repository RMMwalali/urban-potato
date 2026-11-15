import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateTime, METHOD_LABEL, money, num } from "@/lib/format";
import { PrintReceipt } from "@/components/PrintReceipt";
import { SaleReceipt } from "@/components/SaleReceipt";
import { mediaUrl } from "@/lib/media";

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
  const logo = b.logoId ? await db.media.findUnique({ where: { id: b.logoId }, select: { id: true, alt: true, mime: true } }) : null;
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
        </div>
      </div>
      <PrintReceipt>
        <SaleReceipt r={{
          salon: b.name, logo: logo ? mediaUrl(logo, "thumb") : null, address: [b.address, b.city].filter(Boolean).join(", ") || null, phone: b.phone,
          number: s.number, date: fmtDateTime(s.createdAt, b.timezone), client: s.client?.name ?? null, currency: c,
          items: s.items.map((i) => ({ name: i.name, staff: i.staff?.name.split(" ")[0] ?? null, qty: i.quantity, amount: num(i.unitPrice) * i.quantity })),
          subtotal: num(s.subtotal), discount: num(s.discount), tip: num(s.tip), total: num(s.total), depositApplied: num(s.depositApplied),
          payments: s.payments.map((p) => ({
            label: METHOD_LABEL[p.method] ?? p.method,
            detail: [p.reference, p.payerName].filter(Boolean).join(" · ") || null,
            amount: num(p.amount),
            change: p.tendered && num(p.tendered) > num(p.amount) ? num(p.tendered) - num(p.amount) : null,
            verified: p.method === "MPESA" ? p.verified : null,
          })),
        }} />
      </PrintReceipt>
    </div>
  );
}
