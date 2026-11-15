import { notFound } from "next/navigation";
import { Receipt } from "lucide-react";
import { TitleIcon } from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { num } from "@/lib/format";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function NewSale({ searchParams }: { searchParams: Promise<{ appointmentId?: string; clientId?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const b = user.business;
  const [services, staff] = await Promise.all([
    db.service.findMany({ where: { businessId: b.id, active: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { businessId: b.id, active: true }, orderBy: { name: "asc" } }),
  ]);
  const appt = sp.appointmentId
    ? await db.appointment.findFirst({ where: { id: sp.appointmentId, businessId: b.id }, include: { client: true, service: true } })
    : null;
  if (sp.appointmentId && !appt) notFound();
  const client = appt?.client ?? (sp.clientId ? await db.client.findFirst({ where: { id: sp.clientId, businessId: b.id } }) : null);

  return (
    <div className="space-y-5">
      <h1 className="page-title flex items-center gap-3"><TitleIcon icon={Receipt} />{appt ? "Check out appointment" : "Quick sale"}</h1>
      <CheckoutForm
        currency={b.currency}
        services={services.map((s) => ({ id: s.id, name: s.name, price: num(s.price) }))}
        staff={staff.map((s) => ({ id: s.id, name: s.name }))}
        appointmentId={appt?.id}
        client={client ? { id: client.id, name: client.name } : null}
        deposit={appt && num(appt.depositAmount) > 0 ? { amount: num(appt.depositAmount), ref: appt.depositRef } : null}
        initialItems={
          appt
            ? [{ serviceId: appt.serviceId, staffId: appt.staffId, name: appt.service.name, quantity: 1, unitPrice: num(appt.price) }]
            : [{ serviceId: null, staffId: null, name: "", quantity: 1, unitPrice: 0 }]
        }
      />
    </div>
  );
}
