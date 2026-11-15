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
    <main className="min-h-screen bg-paper px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-lg space-y-10">
        <div>
          <p className="label-caps text-muted">{b.name} · {STATUS_LABEL[a.status]}</p>
          <h1 className="mt-4 text-[clamp(36px,9vw,64px)] leading-[0.9] uppercase">{a.service.name}</h1>
          <dl className="mt-8 border-t-2 border-ink text-[16px]">
            <div className="flex justify-between gap-4 border-b border-ink/20 py-3"><dt className="label-caps text-muted">Date</dt><dd>{fmtDate(a.startAt, b.timezone)}</dd></div>
            <div className="flex justify-between gap-4 border-b border-ink/20 py-3"><dt className="label-caps text-muted">Time</dt><dd className="tabular-nums">{fmtTime(a.startAt, b.timezone)}–{fmtTime(a.endAt, b.timezone)}</dd></div>
            <div className="flex justify-between gap-4 border-b border-ink/20 py-3"><dt className="label-caps text-muted">Price</dt><dd>{money(a.price, b.currency)}</dd></div>
            {a.staff && <div className="flex justify-between gap-4 border-b border-ink/20 py-3"><dt className="label-caps text-muted">With</dt><dd>{a.staff.name}</dd></div>}
            {b.address && <div className="flex justify-between gap-4 border-b border-ink/20 py-3"><dt className="label-caps text-muted">Where</dt><dd className="text-right">{b.address}</dd></div>}
          </dl>
        </div>
        {active ? <ManageBooking token={token} days={days} timezone={b.timezone} canChange={canChange} policy={policyText(b)} /> : <p className="border-l-2 border-ink bg-panel px-4 py-3 text-[14px]">This appointment can no longer be changed online.{b.phone && ` Call ${b.phone}.`}</p>}
      </div>
    </main>
  );
}
