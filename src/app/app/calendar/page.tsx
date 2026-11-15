import Link from "next/link";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dayRange, fmtTime, todayIso } from "@/lib/format";

export const metadata = { title: "Calendar" };
const HOUR_PX = 72;

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const b = user.business;
  const tz = b.timezone;
  const iso = sp.date && DateTime.fromISO(sp.date).isValid ? sp.date : todayIso(tz);
  const { start, end, dt } = dayRange(iso, tz);

  const [staff, appts] = await Promise.all([
    db.user.findMany({ where: { businessId: b.id, active: true, bookable: true }, orderBy: { name: "asc" } }),
    db.appointment.findMany({
      where: { businessId: b.id, startAt: { gte: start, lt: end }, status: { not: "CANCELLED" } },
      include: { client: true, service: true, sale: { select: { id: true } } },
      orderBy: { startAt: "asc" },
    }),
  ]);

  const openH = Number(b.openTime.split(":")[0]);
  const closeH = Math.ceil(Number(b.closeTime.replace(":", ".")));
  const firstH = Math.min(openH, ...appts.map((a) => DateTime.fromJSDate(a.startAt).setZone(tz).hour));
  const lastH = Math.max(closeH, ...appts.map((a) => DateTime.fromJSDate(a.endAt).setZone(tz).hour + 1));
  const hours = Array.from({ length: lastH - firstH }, (_, i) => firstH + i);

  const columns: { id: string | null; name: string; color: string }[] = staff.map((s) => ({ id: s.id, name: s.name, color: s.color }));
  if (appts.some((a) => !a.staffId || !staff.find((s) => s.id === a.staffId)))
    columns.push({ id: null, name: "Unassigned", color: "#a8a29e" });

  const top = (d: Date) => {
    const l = DateTime.fromJSDate(d).setZone(tz);
    return ((l.hour - firstH) * 60 + l.minute) * (HOUR_PX / 60);
  };
  const nav = (n: number) => dt.plus({ days: n }).toISODate();
  const closed = !b.openDays.includes(dt.weekday);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{dt.toFormat("cccc d LLLL")}</h1>
          <p className="text-sm text-stone-500">
            {appts.length} appointments{closed && " · closed day"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`?date=${nav(-1)}`} className="btn-secondary">←</Link>
          <Link href="?" className="btn-secondary">Today</Link>
          <Link href={`?date=${nav(1)}`} className="btn-secondary">→</Link>
          <form>
            <input type="date" name="date" defaultValue={iso} className="input w-auto" />
          </form>
          <Link href={`/app/appointments/new?date=${iso}`} className="btn-primary">+ New</Link>
        </div>
      </div>

      {columns.length === 0 ? (
        <div className="card p-6 text-sm text-stone-500">
          Add bookable staff on the <Link href="/app/staff" className="underline">Staff page</Link> to see the calendar.
        </div>
      ) : (
        <div className="card overflow-x-auto" data-tour="calendar-grid">
          <div className="flex min-w-fit">
            <div className="w-14 shrink-0 border-r border-stone-200">
              <div className="h-11 border-b border-stone-200" />
              {hours.map((h) => (
                <div key={h} style={{ height: HOUR_PX }} className="pr-2 text-right text-xs text-stone-400">
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>
            {columns.map((col) => (
              <div key={col.id ?? "none"} className="w-48 shrink-0 border-r border-stone-100 last:border-r-0 sm:flex-1">
                <div className="flex h-11 items-center gap-2 border-b border-stone-200 px-3 text-sm font-medium">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                  <span className="truncate">{col.name}</span>
                </div>
                <div className="relative">
                  {hours.map((h) => (
                    <Link
                      key={h}
                      href={`/app/appointments/new?date=${iso}&time=${String(h).padStart(2, "0")}:00${col.id ? `&staffId=${col.id}` : ""}`}
                      style={{ height: HOUR_PX }}
                      className="block border-b border-stone-100 hover:bg-brand-50/60"
                      aria-label={`Book ${col.name} at ${h}:00`}
                    />
                  ))}
                  {appts
                    .filter((a) => (col.id ? a.staffId === col.id : !a.staffId || !staff.find((s) => s.id === a.staffId)))
                    .map((a) => {
                      const t = top(a.startAt);
                      const h = Math.max(top(a.endAt) - t, 24);
                      const faded = a.status === "NO_SHOW" || a.status === "COMPLETED";
                      return (
                        <Link
                          key={a.id}
                          href={`/app/appointments/${a.id}`}
                          className={`absolute inset-x-1 overflow-hidden rounded-md border-l-4 px-2 py-1 text-xs ${faded ? "opacity-60" : ""}`}
                          style={{ top: t + 1, height: h - 2, borderColor: col.color, background: `${col.color}22` }}
                        >
                          <p className="font-semibold">{a.client.name}</p>
                          <p className="truncate text-stone-600">
                            {fmtTime(a.startAt, tz)} · {a.service.name}
                          </p>
                          {a.sale ? <p className="text-emerald-700">Paid</p> : a.status === "NO_SHOW" ? <p className="text-rose-700">No-show</p> : null}
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
