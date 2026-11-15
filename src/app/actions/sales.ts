"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { upsertClient } from "./appointments";

export type SaleState = { error?: string } | undefined;

const Item = z.object({
  serviceId: z.string().optional().nullable(),
  staffId: z.string().optional().nullable(),
  name: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
});

const PaymentIn = z.object({
  method: z.enum(["CASH", "MPESA", "CARD", "BANK", "OTHER"]),
  amount: z.coerce.number().min(0),
  tendered: z.coerce.number().min(0).optional().nullable(),
  reference: z.string().trim().optional().nullable(),
  payerName: z.string().trim().optional().nullable(),
  smsText: z.string().optional().nullable(),
});

const SaleInput = z.object({
  appointmentId: z.string().optional(),
  clientId: z.string().optional(),
  clientName: z.string().trim().optional(),
  clientPhone: z.string().trim().optional(),
  items: z.string().transform((s, ctx) => {
    const r = z.array(Item).min(1).safeParse(JSON.parse(s || "[]"));
    if (!r.success) {
      ctx.addIssue({ code: "custom", message: "Add at least one item with a name and price" });
      return z.NEVER;
    }
    return r.data;
  }),
  payments: z.string().transform((s, ctx) => {
    const r = z.array(PaymentIn).safeParse(JSON.parse(s || "[]"));
    if (!r.success) {
      ctx.addIssue({ code: "custom", message: "Check the payment details" });
      return z.NEVER;
    }
    return r.data.filter((p) => p.amount > 0);
  }),
  discount: z.coerce.number().min(0).default(0),
  tip: z.coerce.number().min(0).default(0),
  tipStaffId: z.string().optional(),
});

const LABEL: Record<string, string> = { CASH: "Cash", MPESA: "M-Pesa", CARD: "Card", BANK: "Bank transfer", OTHER: "Other" };

export async function createSale(_: SaleState, fd: FormData): Promise<SaleState> {
  const user = await requireUser();
  const b = user.business;
  const p = SaleInput.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;

  let clientId = d.clientId || null;
  let appointmentId: string | null = null;
  let depositApplied = 0;
  if (d.appointmentId) {
    const a = await db.appointment.findFirst({ where: { id: d.appointmentId, businessId: b.id }, include: { sale: true } });
    if (!a) return { error: "Appointment not found" };
    if (a.sale) return { error: "This appointment has already been paid" };
    appointmentId = a.id;
    clientId = a.clientId;
    depositApplied = Number(a.depositAmount);
  } else if (!clientId && d.clientPhone) {
    try {
      clientId = (await upsertClient(b, d.clientName || "Walk-in client", d.clientPhone)).id;
    } catch (e) {
      return { error: (e as Error).message };
    }
  } else if (clientId && !(await db.client.findFirst({ where: { id: clientId, businessId: b.id } }))) {
    return { error: "Client not found" };
  }

  const staffIds = [...new Set(d.items.map((i) => i.staffId).filter(Boolean) as string[])];
  const staff = await db.user.findMany({ where: { id: { in: staffIds }, businessId: b.id } });
  const rate = (id?: string | null) => Number(staff.find((s) => s.id === id)?.commissionRate ?? 0);
  const serviceIds = d.items.map((i) => i.serviceId).filter(Boolean) as string[];
  const validServices = new Set((await db.service.findMany({ where: { id: { in: serviceIds }, businessId: b.id }, select: { id: true } })).map((s) => s.id));

  const subtotal = d.items.reduce((t, i) => t + i.unitPrice * i.quantity, 0);
  const discount = Math.min(d.discount, subtotal);
  // total = full value of the visit; any booking deposit was collected earlier and is recorded separately.
  const total = subtotal - discount + d.tip;
  const due = Math.max(total - depositApplied, 0);
  const factor = subtotal > 0 ? (subtotal - discount) / subtotal : 0;

  /* ----- payments ----- */
  for (const pay of d.payments) {
    if (!b.paymentMethods.includes(pay.method) && pay.method !== "OTHER") return { error: `${LABEL[pay.method]} isn't enabled for this salon` };
    if (pay.method === "CASH" && pay.tendered != null && pay.tendered > 0 && pay.tendered < pay.amount) return { error: "Cash received is less than the cash amount" };
  }
  const paid = d.payments.reduce((t, x) => t + x.amount, 0);
  if (Math.abs(paid - due) > 0.5) return { error: `Payments add up to ${b.currency} ${paid.toLocaleString()} but ${b.currency} ${due.toLocaleString()} is due` };

  type Resolved = { method: (typeof d.payments)[number]["method"]; amount: number; tendered: number | null; reference: string | null; payerName: string | null; verified: boolean; txId?: string; newTx?: { code: string; amount: number; payerName: string | null; source: "SMS" | "MANUAL"; raw?: object } };
  const resolved: Resolved[] = [];
  const seen = new Set<string>();
  for (const pay of d.payments) {
    if (pay.method !== "MPESA") {
      resolved.push({ method: pay.method, amount: pay.amount, tendered: pay.method === "CASH" ? (pay.tendered || null) : null, reference: pay.reference || null, payerName: null, verified: false });
      continue;
    }
    const code = (pay.reference ?? "").toUpperCase().replace(/\s/g, "");
    if (!/^[A-Z0-9]{8,12}$/.test(code)) return { error: "Enter a valid M-Pesa code for each M-Pesa payment" };
    if (seen.has(code)) return { error: `${code} is entered twice` };
    seen.add(code);
    const tx = await db.mpesaTransaction.findUnique({ where: { businessId_code: { businessId: b.id, code } } });
    if (tx?.claimedAt) return { error: `${code} has already been used for another payment` };
    if (tx) {
      if (pay.amount > Number(tx.amount) + 0.5) return { error: `${code} was for ${b.currency} ${Number(tx.amount).toLocaleString()}, less than the ${b.currency} ${pay.amount.toLocaleString()} applied` };
      resolved.push({ method: "MPESA", amount: pay.amount, tendered: null, reference: code, payerName: tx.payerName, verified: tx.source === "C2B", txId: tx.id });
    } else {
      if (b.requireVerifiedMpesa) return { error: `Safaricom hasn't confirmed ${code} yet. Wait a few seconds and try again, or check the code.` };
      resolved.push({ method: "MPESA", amount: pay.amount, tendered: null, reference: code, payerName: pay.payerName || null, verified: false, newTx: { code, amount: pay.amount, payerName: pay.payerName || null, source: pay.smsText ? "SMS" : "MANUAL", raw: pay.smsText ? { sms: pay.smsText } : undefined } });
    }
  }
  const methods = [...new Set(resolved.map((r) => r.method))];
  const saleMethod = methods.length === 1 ? methods[0] : methods.length === 0 ? (depositApplied > 0 ? "MPESA" : "CASH") : "SPLIT";

  const tipStaffId = d.tip > 0 && d.tipStaffId ? (await db.user.findFirst({ where: { id: d.tipStaffId, businessId: b.id }, select: { id: true } }))?.id ?? null : null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const sale = await db.$transaction(async (tx) => {
        const last = await tx.sale.findFirst({ where: { businessId: b.id }, orderBy: { number: "desc" }, select: { number: true } });
        const s = await tx.sale.create({
          data: {
            businessId: b.id,
            number: (last?.number ?? 0) + 1,
            clientId,
            appointmentId,
            subtotal,
            discount,
            tip: d.tip,
            tipStaffId,
            depositApplied,
            total,
            method: saleMethod,
            reference: resolved.find((r) => r.method === "MPESA")?.reference ?? resolved[0]?.reference ?? null,
            createdById: user.id,
            items: {
              create: d.items.map((i) => ({
                serviceId: i.serviceId && validServices.has(i.serviceId) ? i.serviceId : null,
                staffId: i.staffId && staff.some((s) => s.id === i.staffId) ? i.staffId : null,
                name: i.name,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                commission: Math.round(i.unitPrice * i.quantity * factor * rate(i.staffId)) / 100,
              })),
            },
          },
        });
        for (const r of resolved) {
          let txId = r.txId;
          if (r.newTx) txId = (await tx.mpesaTransaction.create({ data: { businessId: b.id, ...r.newTx, raw: r.newTx.raw ?? undefined } })).id;
          if (txId) {
            // Atomic claim: fails if someone else used the code a moment ago.
            const claimed = await tx.mpesaTransaction.updateMany({ where: { id: txId, claimedAt: null }, data: { claimedAt: new Date(), usedFor: "SALE" } });
            if (!claimed.count) throw new Error(`CODE_USED:${r.reference}`);
          }
          await tx.payment.create({ data: { saleId: s.id, method: r.method, amount: r.amount, tendered: r.tendered, reference: r.reference, payerName: r.payerName, verified: r.verified, mpesaTxId: txId } });
        }
        if (appointmentId) await tx.appointment.update({ where: { id: appointmentId }, data: { status: "COMPLETED" } });
        return s;
      });
      revalidatePath("/app");
      redirect(`/app/sales/${sale.id}`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("CODE_USED:")) return { error: `${e.message.slice(10)} has already been used for another payment` };
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  return { error: "Could not save sale, please try again" };
}
