import Link from "next/link";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtTime, money, num, STATUS_LABEL, todayIso } from "@/lib/format";
import { RangePicker } from "@/components/calendar/RangePicker";

export const metadata = { title: "Calendar" };
const HOUR_PX = 72;
const VIEWS = ["day", "week", "month", "year", "range"] as const;
type View = (typeof VIEWS)[number];
type SP = { view?: string; date?: string; from?: string; to?: string; staff?: string };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const b = user.business;
  const tz = b.timezone;
  const today = todayIso(tz);
  const view: View = (VIEWS as readonly string[]).includes(sp.view ?? "") ? (sp.view as View) : "day";
  const anchor = sp.date && DateTime.fromISO(sp.date, { zone: tz }).isValid ? DateTime.fromISO(sp.date, { zone: tz }) : DateTime.fromISO(today, { zone: tz });
  const staffFilter = sp.staff || "";

  // the period this view covers
  let from: DateTime, to: DateTime; // [from, to)
  if (view === "range") {
    const f = DateTime.fromISO(sp.from ?? "", { zone: tz }), t = DateTime.fromISO(sp.to ?? "", { zone: tz });
    from = f.isValid ? f.startOf("day") : anchor.startOf("week");
    to = (t.isValid && t >= from ? t : from.plus({ days: 6 })).startOf("day").plus({ days: 1 });
    if (to.diff(from, "days").days > 366) to = from.plus({ days: 366 });
  } else {
    const unit = view === "day" ? "day" : view === "week" ? "week" : view === "month" ? "month" : "year";
    from = anchor.startOf(unit);
    to = from.plus({ [`${unit}s`]: 1 });
  }
  const gridFrom = view === "month" ? from.startOf("week") : from;
  const gridTo = view === "month" ? to.minus({ days: 1 }).endOf("week").plus({ milliseconds: 1 }) : to;

  const [staff, appts] = await Promise.all([
    db.user.findMany({ where: { businessId: b.id, active: true, bookable: true }, orderBy: { name: "asc" } }),
    db.appointment.findMany({
      where: { businessId: b.id, startAt: { gte: gridFrom.toJSDate(), lt: gridTo.toJSDate() }, status: { not: "CANCELLED" }, ...(staffFilter ? { staffId: staffFilter } : {}) },
      include: { client: { select: { name: true } }, service: { select: { name: true } }, sale: { select: { id: true } } },
      orderBy: { startAt: "asc" },
      take: view === "year" || view === "range" ? 20000 : 3000,
    }),
  ]);
  const colorOf = (id: string | null) => staff.find((s) => s.id === id)?.color ?? "#a8a29e";
  const local = (d: Date) => DateTime.fromJSDate(d).setZone(tz);
  const dayKey = (d: Date) => local(d).toISODate()!;
  const byDay = new Map<string, typeof appts>();
  for (const a of appts) byDay.set(dayKey(a.startAt), [...(byDay.get(dayKey(a.startAt)) ?? []), a]);

  const q = (p: Partial<SP>) => {
    const u = new URLSearchParams();
    const merged = { view, date: anchor.toISODate()!, from: sp.from, to: sp.to, staff: staffFilter || undefined, ...p };
    for (const [k, v] of Object.entries(merged)) if (v) u.set(k, v);
    if (merged.view !== "range") { u.delete("from"); u.delete("to"); }
    return `?${u.toString()}`;
  };
  const step = (n: number) => {
    if (view === "range") { const len = Math.round(to.diff(from, "days").days); return q({ from: from.plus({ days: n * len }).toISODate()!, to: to.plus({ days: n * len - 1 }).toISODate()! }); }
    return q({ date: anchor.plus({ [`${view}s`]: n }).toISODate()! });
  };
  const title =
    view === "day" ? anchor.toFormat("cccc d LLLL") :
    view === "week" ? `${from.toFormat("d LLL")} – ${to.minus({ days: 1 }).toFormat("d LLL yyyy")}` :
    view === "month" ? from.toFormat("LLLL yyyy") :
    view === "year" ? from.toFormat("yyyy") :
    `${from.toFormat("d LLL yyyy")} – ${to.minus({ days: 1 }).toFormat("d LLL yyyy")}`;
  const inPeriod = appts.filter((a) => a.startAt >= from.toJSDate() && a.startAt < to.toJSDate());
  const revenue = inPeriod.filter((a) => a.status !== "NO_SHOW").reduce((t, a) => t + num(a.price), 0);
  const dayHref = (iso: string) => q({ view: "day", date: iso });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="text-sm text-stone-500">
            {inPeriod.length} appointment{inPeriod.length === 1 ? "" : "s"}{view !== "day" && ` · ${money(revenue, b.currency)} booked`}
            {view === "day" && !b.openDays.includes(anchor.weekday) && " · closed day"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={step(-1)} className="btn-secondary" aria-label="Previous">←</Link>
          <Link href={q({ date: today, from: undefined, to: undefined, view: view === "range" ? "day" : view })} className="btn-secondary">Today</Link>
          <Link href={step(1)} className="btn-secondary" aria-label="Next">→</Link>
          <form className="flex">
            <input type="hidden" name="view" value={view === "range" ? "day" : view} />
            {staffFilter && <input type="hidden" name="staff" value={staffFilter} />}
            <input type="date" name="date" defaultValue={anchor.toISODate()!} className="input w-auto" aria-label="Go to date" />
          </form>
          <RangePicker from={view === "range" ? from.toISODate()! : undefined} to={view === "range" ? to.minus({ days: 1 }).toISODate()! : undefined} today={today} extra={staffFilter ? `&staff=${staffFilter}` : ""} />
          <Link href={`/app/appointments/new?date=${view === "day" ? anchor.toISODate() : today}`} className="btn-primary">+ New</Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex border border-ink" aria-label="Calendar view">
          {VIEWS.map((v) => (
            <Link key={v} href={v === "range" ? q({ view: "range", from: from.toISODate()!, to: to.minus({ days: 1 }).toISODate()! }) : q({ view: v })} aria-current={v === view ? "page" : undefined}
              className={`px-3 py-1.5 text-[12px] uppercase tracking-[0.06em] transition-colors sm:px-4 ${v === view ? "bg-ink text-paper" : "hover:bg-panel"}`}>
              {v === "range" ? "Range" : v}
            </Link>
          ))}
        </nav>
        {staff.length > 1 && (
          <div className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1">
            <Link href={q({ staff: "" })} className={`btn btn-sm shrink-0 ${!staffFilter ? "border-ink bg-ink text-paper" : "border-ink/30"}`}>Everyone</Link>
            {staff.map((s) => (
              <Link key={s.id} href={q({ staff: s.id })} className={`btn btn-sm shrink-0 gap-1.5 ${staffFilter === s.id ? "border-ink bg-ink text-paper" : "border-ink/30"}`}>
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name.split(" ")[0]}
              </Link>
            ))}
          </div>
        )}
      </div>

      {view === "day" && <DayView />}
      {view === "week" && <WeekView />}
      {view === "month" && <MonthView />}
      {view === "year" && <YearView />}
      {view === "range" && <Agenda />}
    </div>
  );

  /* ---------- Day: staff columns by hour ---------- */
  function DayView() {
    const iso = anchor.toISODate()!;
    const shown = staffFilter ? staff.filter((s) => s.id === staffFilter) : staff;
    const columns: { id: string | null; name: string; color: string }[] = shown.map((s) => ({ id: s.id, name: s.name, color: s.color }));
    if (!staffFilter && appts.some((a) => !a.staffId || !staff.find((s) => s.id === a.staffId))) columns.push({ id: null, name: "Unassigned", color: "#a8a29e" });
    const { hours, top } = hourScale(appts);
    if (!columns.length)
      return <div className="card p-6 text-sm text-stone-500">Add bookable staff on the <Link href="/app/staff" className="underline">Staff page</Link> to see the calendar.</div>;
    return (
      <div className="card overflow-x-auto" data-tour="calendar-grid">
        <div className="flex min-w-fit">
          <HourRail hours={hours} />
          {columns.map((col) => (
            <div key={col.id ?? "none"} className="w-48 shrink-0 border-r border-stone-100 last:border-r-0 sm:flex-1">
              <div className="flex h-11 items-center gap-2 border-b border-stone-200 px-3 text-sm font-medium">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                <span className="truncate">{col.name}</span>
              </div>
              <div className="relative">
                {hours.map((h) => (
                  <Link key={h} href={`/app/appointments/new?date=${iso}&time=${String(h).padStart(2, "0")}:00${col.id ? `&staffId=${col.id}` : ""}`} style={{ height: HOUR_PX }}
                    className="block border-b border-stone-100 hover:bg-brand-50/60" aria-label={`Book ${col.name} at ${h}:00`} />
                ))}
                {appts.filter((a) => (col.id ? a.staffId === col.id : !a.staffId || !staff.find((s) => s.id === a.staffId))).map((a) => (
                  <Block key={a.id} a={a} top={top(a.startAt)} height={Math.max(top(a.endAt) - top(a.startAt), 24)} color={col.color} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------- Week: seven days by hour, coloured by stylist ---------- */
  function WeekView() {
    const days = Array.from({ length: 7 }, (_, i) => from.plus({ days: i }));
    const { hours, top } = hourScale(appts);
    return (
      <div className="card overflow-x-auto" data-tour="calendar-grid">
        <div className="flex min-w-[860px]">
          <HourRail hours={hours} />
          {days.map((d) => {
            const iso = d.toISODate()!;
            const list = byDay.get(iso) ?? [];
            const lanes = laneOf(list);
            const closed = !b.openDays.includes(d.weekday);
            return (
              <div key={iso} className={`flex-1 border-r border-stone-100 last:border-r-0 ${closed ? "bg-stone-50" : ""}`}>
                <Link href={dayHref(iso)} className={`flex h-11 items-center justify-between border-b border-stone-200 px-2 text-sm hover:bg-panel ${iso === today ? "font-semibold" : ""}`}>
                  <span>{d.toFormat("ccc d")}</span>{list.length > 0 && <span className="text-xs text-stone-500">{list.length}</span>}
                </Link>
                <div className="relative">
                  {hours.map((h) => (
                    <Link key={h} href={`/app/appointments/new?date=${iso}&time=${String(h).padStart(2, "0")}:00`} style={{ height: HOUR_PX }} className="block border-b border-stone-100 hover:bg-brand-50/60" aria-label={`Book ${d.toFormat("ccc d")} at ${h}:00`} />
                  ))}
                  {list.map((a) => {
                    const { lane, of } = lanes.get(a.id)!;
                    return <Block key={a.id} a={a} top={top(a.startAt)} height={Math.max(top(a.endAt) - top(a.startAt), 22)} color={colorOf(a.staffId)} left={`${(lane / of) * 100}%`} width={`${100 / of}%`} compact />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---------- Month: the month grid ---------- */
  function MonthView() {
    const cells: DateTime[] = [];
    for (let d = gridFrom; d < gridTo; d = d.plus({ days: 1 })) cells.push(d);
    return (
      <div className="card overflow-hidden" data-tour="calendar-grid">
        <div className="grid grid-cols-7 border-b border-stone-200 text-center text-[11px] uppercase tracking-[0.06em] text-stone-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d} className="py-2">{d}</span>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d) => {
            const iso = d.toISODate()!;
            const list = byDay.get(iso) ?? [];
            const other = d.month !== from.month;
            return (
              <div key={iso} className={`min-h-[72px] border-b border-r border-stone-100 p-1 sm:min-h-[118px] sm:p-1.5 ${other ? "bg-stone-50/70 text-stone-400" : ""}`}>
                <Link href={dayHref(iso)} className="flex items-center justify-between text-[12px] hover:opacity-60">
                  <span className={`flex h-6 w-6 items-center justify-center ${iso === today ? "bg-ink text-paper" : ""}`}>{d.day}</span>
                  {list.length > 0 && <span className="text-[11px] text-stone-500 sm:hidden">{list.length}</span>}
                </Link>
                {/* phones: dots; larger screens: the first bookings */}
                <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">{list.slice(0, 6).map((a) => <span key={a.id} className="h-1.5 w-1.5 rounded-full" style={{ background: colorOf(a.staffId) }} />)}</div>
                <ul className="mt-1 hidden space-y-0.5 sm:block">
                  {list.slice(0, 3).map((a) => (
                    <li key={a.id}>
                      <Link href={`/app/appointments/${a.id}`} className="block truncate border-l-2 px-1 text-[11px] leading-5 hover:bg-panel" style={{ borderColor: colorOf(a.staffId) }}>
                        <span className="tabular-nums">{fmtTime(a.startAt, tz)}</span> {a.client.name}
                      </Link>
                    </li>
                  ))}
                  {list.length > 3 && <li><Link href={dayHref(iso)} className="px-1 text-[11px] text-stone-500 hover:text-ink">+{list.length - 3} more</Link></li>}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---------- Year: twelve months, days shaded by how busy they are ---------- */
  function YearView() {
    const counts = [...byDay.values()].map((l) => l.length);
    const peak = Math.max(1, ...counts);
    const shade = (n: number) => (n === 0 ? "" : n / peak > 0.66 ? "bg-ink text-paper" : n / peak > 0.33 ? "bg-ink/55 text-paper" : "bg-ink/20");
    return (
      <div className="space-y-4" data-tour="calendar-grid">
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }, (_, m) => from.plus({ months: m })).map((mo) => {
            const start = mo.startOf("week");
            const cells = Array.from({ length: 42 }, (_, i) => start.plus({ days: i }));
            const total = cells.filter((d) => d.month === mo.month).reduce((t, d) => t + (byDay.get(d.toISODate()!)?.length ?? 0), 0);
            return (
              <section key={mo.month}>
                <Link href={q({ view: "month", date: mo.toISODate()! })} className="mb-2 flex items-baseline justify-between border-b border-ink pb-1 hover:opacity-60">
                  <span className="text-[15px]">{mo.toFormat("LLLL")}</span><span className="text-[12px] text-stone-500">{total}</span>
                </Link>
                <div className="grid grid-cols-7 gap-px text-center text-[11px] tabular-nums">
                  {cells.map((d) => {
                    const iso = d.toISODate()!;
                    const n = byDay.get(iso)?.length ?? 0;
                    if (d.month !== mo.month) return <span key={iso} />;
                    return (
                      <Link key={iso} href={dayHref(iso)} title={`${d.toFormat("ccc d LLL")}: ${n} appointment${n === 1 ? "" : "s"}`}
                        className={`flex h-7 items-center justify-center transition-transform hover:scale-110 ${shade(n)} ${iso === today ? "ring-1 ring-pink" : ""}`}>
                        {d.day}
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        <p className="flex items-center gap-3 text-[12px] text-stone-500">Fewer <span className="h-3 w-3 bg-ink/20" /><span className="h-3 w-3 bg-ink/55" /><span className="h-3 w-3 bg-ink" /> more bookings · busiest day: {peak}</p>
      </div>
    );
  }

  /* ---------- Range: every booking between two dates, day by day ---------- */
  function Agenda() {
    const days = [...byDay.entries()].filter(([iso]) => iso >= from.toISODate()! && iso < to.toISODate()!);
    const noShows = inPeriod.filter((a) => a.status === "NO_SHOW").length;
    const busiest = days.reduce<[string, number] | null>((m, [iso, l]) => (!m || l.length > m[1] ? [iso, l.length] : m), null);
    return (
      <div className="space-y-8" data-tour="calendar-grid">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t-2 border-ink pt-4 sm:grid-cols-4">
          <div><p className="label-caps text-stone-500">Appointments</p><p className="text-[28px] leading-tight">{inPeriod.length}</p></div>
          <div><p className="label-caps text-stone-500">Booked value</p><p className="text-[28px] leading-tight">{money(revenue, b.currency)}</p></div>
          <div><p className="label-caps text-stone-500">No-shows</p><p className="text-[28px] leading-tight">{noShows}</p></div>
          <div><p className="label-caps text-stone-500">Busiest day</p><p className="text-[18px] leading-tight">{busiest ? `${DateTime.fromISO(busiest[0]).toFormat("ccc d LLL")} · ${busiest[1]}` : "–"}</p></div>
        </div>
        {days.length === 0 && <p className="text-[15px] text-stone-500">No appointments in these dates.</p>}
        {days.map(([iso, list]) => (
          <section key={iso}>
            <Link href={dayHref(iso)} className="flex items-baseline justify-between border-b border-ink pb-2 hover:opacity-60">
              <span className="text-[18px]">{DateTime.fromISO(iso).toFormat("cccc d LLLL")}</span>
              <span className="text-[13px] text-stone-500">{list.length} · {money(list.filter((a) => a.status !== "NO_SHOW").reduce((t, a) => t + num(a.price), 0), b.currency)}</span>
            </Link>
            <ul>
              {list.map((a) => (
                <li key={a.id} className="border-b border-stone-100">
                  <Link href={`/app/appointments/${a.id}`} className="grid grid-cols-[56px_1fr_auto] items-baseline gap-3 py-2.5 hover:bg-panel sm:grid-cols-[64px_1.4fr_1fr_auto_auto]">
                    <span className="tabular-nums">{fmtTime(a.startAt, tz)}</span>
                    <span className="min-w-0 truncate">{a.client.name}<span className="block truncate text-[12px] text-stone-500 sm:hidden">{a.service.name}{a.styleName ? ` · ${a.styleName}` : ""}</span></span>
                    <span className="hidden truncate text-stone-600 sm:block">{a.service.name}{a.styleName ? ` · ${a.styleName}` : ""}</span>
                    <span className="hidden items-center gap-1.5 text-[13px] sm:flex"><span className="h-2 w-2 rounded-full" style={{ background: colorOf(a.staffId) }} />{staff.find((s) => s.id === a.staffId)?.name.split(" ")[0] ?? "–"}</span>
                    <span className="text-right text-[12px] uppercase tracking-[0.04em] text-stone-500">{a.sale ? "Paid" : STATUS_LABEL[a.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  /* ---------- shared pieces ---------- */
  function hourScale(list: typeof appts) {
    const openH = Number(b.openTime.split(":")[0]);
    const closeH = Math.ceil(Number(b.closeTime.replace(":", ".")));
    const firstH = Math.min(openH, ...list.map((a) => local(a.startAt).hour));
    const lastH = Math.max(closeH, ...list.map((a) => local(a.endAt).hour + 1));
    const hours = Array.from({ length: Math.max(1, lastH - firstH) }, (_, i) => firstH + i);
    const top = (d: Date) => { const l = local(d); return ((l.hour - firstH) * 60 + l.minute) * (HOUR_PX / 60); };
    return { hours, top };
  }
}

function HourRail({ hours }: { hours: number[] }) {
  return (
    <div className="w-14 shrink-0 border-r border-stone-200">
      <div className="h-11 border-b border-stone-200" />
      {hours.map((h) => <div key={h} style={{ height: HOUR_PX }} className="pr-2 text-right text-xs text-stone-400">{String(h).padStart(2, "0")}:00</div>)}
    </div>
  );
}

type A = { id: string; startAt: Date; endAt: Date; status: string; styleName: string | null; client: { name: string }; service: { name: string }; sale: { id: string } | null };
function Block({ a, top, height, color, left, width, compact }: { a: A; top: number; height: number; color: string; left?: string; width?: string; compact?: boolean }) {
  const faded = a.status === "NO_SHOW" || a.status === "COMPLETED";
  const time = a.startAt.toISOString();
  return (
    <Link href={`/app/appointments/${a.id}`} data-start={time}
      className={`absolute overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-xs ${faded ? "opacity-60" : ""} ${left ? "" : "inset-x-1"}`}
      style={{ top: top + 1, height: height - 2, borderColor: color, background: `${color}22`, ...(left ? { left: `calc(${left} + 2px)`, width: `calc(${width} - 4px)` } : {}) }}>
      <p className="truncate font-semibold">{a.client.name}</p>
      <p className="truncate text-stone-600">{compact ? a.service.name : `${a.service.name}${a.styleName ? ` · ${a.styleName}` : ""}`}</p>
      {!compact && (a.sale ? <p className="text-emerald-700">Paid</p> : a.status === "NO_SHOW" ? <p className="text-rose-700">No-show</p> : null)}
    </Link>
  );
}

/** Side-by-side lanes for overlapping appointments in one day column. */
function laneOf(list: { id: string; startAt: Date; endAt: Date }[]) {
  const out = new Map<string, { lane: number; of: number }>();
  let group: { id: string; end: number; lane: number }[] = [];
  let groupEnd = 0;
  const flush = () => { const of = Math.max(1, ...group.map((g) => g.lane + 1)); for (const g of group) out.set(g.id, { lane: g.lane, of }); group = []; };
  for (const a of [...list].sort((x, y) => x.startAt.getTime() - y.startAt.getTime())) {
    const s = a.startAt.getTime(), e = a.endAt.getTime();
    if (group.length && s >= groupEnd) flush();
    const used = new Set(group.filter((g) => g.end > s).map((g) => g.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    group.push({ id: a.id, end: e, lane });
    groupEnd = Math.max(groupEnd, e);
  }
  flush();
  return out;
}
