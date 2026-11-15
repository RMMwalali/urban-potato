import { DateTime } from "luxon";
import { CalendarPlus } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { displayPhone, money, todayIso } from "@/lib/format";
import { AppointmentForm } from "@/components/AppointmentForm";

export const metadata = { title: "New appointment" };

export default async function NewAppointment({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; time?: string; staffId?: string; clientId?: string; walkin?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireUser();
  const b = user.business;
  const [services, staff, client] = await Promise.all([
    db.service.findMany({ where: { businessId: b.id, active: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    db.user.findMany({ where: { businessId: b.id, active: true, bookable: true }, orderBy: { name: "asc" } }),
    sp.clientId ? db.client.findFirst({ where: { id: sp.clientId, businessId: b.id } }) : null,
  ]);
  return (
    <div className="space-y-5">
      <PageHeader title={sp.walkin ? "Walk-in" : "New appointment"} icon={CalendarPlus} />
      <AppointmentForm
        services={services.map((s) => ({ id: s.id, name: s.name, category: s.category, extra: `${s.durationMin} min · ${money(s.price, b.currency)}` }))}
        staff={staff.map((s) => ({ id: s.id, name: s.name }))}
        client={client ? { id: client.id, name: client.name, extra: displayPhone(client.phone) } : null}
        defaults={{
          date: sp.date ?? todayIso(b.timezone),
          time: sp.walkin ? DateTime.now().setZone(b.timezone).toFormat("HH:mm") : sp.time,
          staffId: sp.staffId,
          source: sp.walkin ? "WALK_IN" : undefined,
        }}
      />
    </div>
  );
}
