import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { fmtDate, fmtTime, money, STATUS_LABEL } from "@/lib/format";
import { openDays, policyText } from "@/lib/policy";
import { ManageBooking } from "@/components/ManageBooking";

export const metadata = { title: "Your appointment", robots: { index: false, follow: false } };

export default async function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const a = await db.appointment.findUnique({ where: { manageToken: token }, include: { business: true, service: true, staff: true } });
  if (!a) notFound();
  const b = a.business;
  const active = ["BOOKED", "CONFIRMED"].includes(a.status) && a.startAt > new Date();
  const canChange = active && a.startAt.getTime() - Date.now() >= b.cancelPolicyHours * 3600_000;
  const days = openDays(b, DateTime.now().setZone(b.timezone).startOf("day"));

  return (
    <main className="min-h-screen bg-canvas px-4 py-10">
      <div className="mx-auto max-w-lg space-y-5">
        <div className="card overflow-hidden">
          <div className="bg-ink p-6 text-white">
            <p className="text-xs font-bold tracking-widest text-petal uppercase">{b.name}</p>
            <h1 className="mt-2 font-display text-2xl font-bold">{a.service.name}</h1>
            <span className="mt-2 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">{STATUS_LABEL[a.status]}</span>
          </div>
          <ul className="space-y-3 p-6 text-sm">
            <li className="flex items-center gap-3">{fmtDate(a.startAt, b.timezone)}</li>
            <li className="flex items-center gap-3">{fmtTime(a.startAt, b.timezone)}–{fmtTime(a.endAt, b.timezone)} · {money(a.price, b.currency)}</li>
            {a.staff && <li className="flex items-center gap-3">with {a.staff.name}</li>}
            {b.address && <li className="flex items-center gap-3">{b.address}</li>}
          </ul>
        </div>
        {active ? <ManageBooking token={token} days={days} timezone={b.timezone} canChange={canChange} policy={policyText(b)} /> : <p className="card p-5 text-sm text-stone-600">This appointment can no longer be changed online.{b.phone && ` Call ${b.phone}.`}</p>}
      </div>
    </main>
  );
}
