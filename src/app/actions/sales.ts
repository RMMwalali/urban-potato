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
  discount: z.coerce.number().min(0).default(0),
  tip: z.coerce.number().min(0).default(0),
  method: z.enum(["CASH", "MPESA", "CARD", "BANK", "OTHER"]),
  reference: z.string().trim().optional(),
});

export async function createSale(_: SaleState, fd: FormData): Promise<SaleState> {
  const user = await requireUser();
  const b = user.business;
  const p = SaleInput.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  if (d.method === "MPESA" && !d.reference) return { error: "Enter the M-Pesa confirmation code" };

  let clientId = d.clientId || null;
  let appointmentId: string | null = null;
  if (d.appointmentId) {
    const a = await db.appointment.findFirst({ where: { id: d.appointmentId, businessId: b.id }, include: { sale: true } });
    if (!a) return { error: "Appointment not found" };
    if (a.sale) return { error: "This appointment has already been paid" };
    appointmentId = a.id;
    clientId = a.clientId;
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
  const total = subtotal - discount + d.tip;
  // Commission is on the discounted service value, shared proportionally across items.
  const factor = subtotal > 0 ? (subtotal - discount) / subtotal : 0;

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
            total,
            method: d.method,
            reference: d.reference?.toUpperCase() || null,
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
        if (appointmentId) await tx.appointment.update({ where: { id: appointmentId }, data: { status: "COMPLETED" } });
        return s;
      });
      revalidatePath("/app");
      redirect(`/app/sales/${sale.id}`);
    } catch (e) {
      // Retry on receipt-number collision from concurrent checkouts.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  return { error: "Could not save sale, please try again" };
}
