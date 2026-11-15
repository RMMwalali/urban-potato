import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { TitleIcon } from "@/components/ui";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { setStatus, sendReminderNow, verifyDeposit } from "@/app/actions/appointments";
import { displayPhone, fmtDate, fmtDateTime, fmtTime, inTz, money, num, SOURCE_LABEL, STATUS_LABEL, STATUS_STYLE } from "@/lib/format";
import { RescheduleForm } from "@/components/RescheduleForm";
import type { AppointmentStatus } from "@prisma/client";

export const metadata = { title: "Appointment" };

export default async function AppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const b = user.business;
  const a = await db.appointment.findFirst({
    where: { id, businessId: b.id },
    include: { client: true, service: true, staff: true, sale: true },
  });
  if (!a) notFound();
  const noShows = await db.appointment.count({ where: { clientId: a.clientId, status: "NO_SHOW" } });
  const [staff, messages] = await Promise.all([
    db.user.findMany({ where: { businessId: b.id, active: true, bookable: true }, orderBy: { name: "asc" } }),
    db.messageLog.findMany({ where: { appointmentId: a.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const tz = b.timezone;
  const open = !["CANCELLED", "NO_SHOW", "COMPLETED"].includes(a.status);
  const action = (s: AppointmentStatus) => setStatus.bind(null, a.id, s);

  return (
    <div className="max-w-4xl space-y-5">
      <Link href={`/app/calendar?date=${inTz(a.startAt, tz).toISODate()}`} className="text-sm text-stone-500">← Calendar</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-3"><TitleIcon icon={CalendarClock} />{a.service.name}</h1>
          <p className="text-stone-600">
            {fmtDate(a.startAt, tz)}, {fmtTime(a.startAt, tz)}–{fmtTime(a.endAt, tz)} · {a.staff?.name ?? "Unassigned"}
          </p>
        </div>
        <span className={`badge text-sm ${STATUS_STYLE[a.status]}`}>{STATUS_LABEL[a.status]}</span>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-5 md:col-span-2">
          <section className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/app/clients/${a.client.id}`} className="text-lg font-semibold hover:text-brand-700">{a.client.name}</Link>
                <p className="text-sm text-stone-600">{displayPhone(a.client.phone)}</p>
              </div>
              <div className="flex gap-2">
                <a className="btn-secondary btn-sm" href={`tel:+${a.client.phone}`}>Call</a>
                <a className="btn-secondary btn-sm" target="_blank" href={`https://wa.me/${a.client.phone}`}>WhatsApp</a>
              </div>
            </div>
            {noShows >= 2 && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"><b>Heads up:</b> {noShows} previous no-shows. Consider asking for a deposit.</p>}
            {num(a.depositAmount) > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-petal/30 px-3 py-2 text-sm">
                <span><b>Deposit {money(a.depositAmount, b.currency)}</b> · M-Pesa {a.depositRef ?? "-"} {a.depositVerified ? "· verified" : "· not yet checked"}</span>
                {!a.depositVerified && <form action={verifyDeposit.bind(null, a.id)}><button className="btn-secondary btn-sm">Mark verified</button></form>}
              </div>
            )}
            {a.client.allergies && (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800"><b>Allergies:</b> {a.client.allergies}</p>
            )}
            {a.client.preferences && <p className="mt-2 text-sm"><b>Preferences:</b> {a.client.preferences}</p>}
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-stone-500">Price</dt><dd className="font-medium">{money(a.price, b.currency)}</dd></div>
              <div><dt className="text-stone-500">Booked via</dt><dd>{SOURCE_LABEL[a.source]}</dd></div>
              <div><dt className="text-stone-500">Created</dt><dd>{fmtDateTime(a.createdAt, tz)}</dd></div>
              <div><dt className="text-stone-500">Reminder</dt><dd>{a.reminderSentAt ? `Sent ${fmtDateTime(a.reminderSentAt, tz)}` : "Not yet sent"}</dd></div>
            </dl>
            {a.notes && <p className="mt-3 text-sm text-stone-700"><b>Notes:</b> {a.notes}</p>}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Payment</h2>
            {a.sale ? (
              <p className="text-sm">
                Paid {money(a.sale.total, b.currency)}.{" "}
                <Link href={`/app/sales/${a.sale.id}`} className="text-brand-700 underline">View receipt #{a.sale.number}</Link>
              </p>
            ) : a.status === "CANCELLED" || a.status === "NO_SHOW" ? (
              <p className="text-sm text-stone-500">No payment, appointment {STATUS_LABEL[a.status].toLowerCase()}.</p>
            ) : (
              <Link href={`/app/sales/new?appointmentId=${a.id}`} className="btn-primary">Check out · {money(a.price, b.currency)}</Link>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Messages</h2>
            {messages.length === 0 ? (
              <p className="text-sm text-stone-500">No messages sent for this appointment.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {messages.map((m) => (
                  <li key={m.id} className="rounded-lg bg-stone-50 px-3 py-2">
                    <p className="text-xs text-stone-500">{m.kind} · {m.channel} · {fmtDateTime(m.createdAt, tz)} · {m.status}{m.error ? `: ${m.error}` : ""}</p>
                    <p>{m.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          {open && (
            <section className="card space-y-2 p-4">
              <h2 className="mb-1 text-sm font-semibold">Update status</h2>
              {a.status === "BOOKED" && <form action={action("CONFIRMED")}><button className="btn-secondary w-full">Mark confirmed</button></form>}
              {a.status !== "ARRIVED" && <form action={action("ARRIVED")}><button className="btn-secondary w-full">Client arrived</button></form>}
              <form action={action("COMPLETED")}><button className="btn-secondary w-full">Mark completed</button></form>
              <form action={action("NO_SHOW")}><button className="btn-danger w-full">No-show</button></form>
              <form action={action("CANCELLED")}><button className="btn-danger w-full">Cancel & notify client</button></form>
              <form action={sendReminderNow.bind(null, a.id)}><button className="btn-secondary w-full">Send reminder now</button></form>
            </section>
          )}
          {!open && !a.sale && (
            <section className="card p-4">
              <form action={action("BOOKED")}><button className="btn-secondary w-full">Re-open appointment</button></form>
            </section>
          )}
          {open && (
            <section className="card p-4">
              <h2 className="mb-3 text-sm font-semibold">Reschedule</h2>
              <RescheduleForm
                id={a.id}
                date={inTz(a.startAt, tz).toISODate()!}
                time={inTz(a.startAt, tz).toFormat("HH:mm")}
                staffId={a.staffId ?? ""}
                staff={staff.map((s) => ({ id: s.id, name: s.name }))}
              />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
