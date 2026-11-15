import Link from "next/link";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { displayPhone, fmtDateTime, money, num, STATUS_LABEL, STATUS_STYLE } from "@/lib/format";
import { messageClient, saveClient } from "@/app/actions/manage";

export const metadata = { title: "Client" };

export default async function ClientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string; duplicate?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const b = user.business;
  const c = await db.client.findFirst({
    where: { id, businessId: b.id },
    include: {
      appointments: { include: { service: true, staff: true }, orderBy: { startAt: "desc" } },
      sales: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!c) notFound();
  const tz = b.timezone;
  const spent = c.sales.reduce((t, s) => t + num(s.total), 0);
  const visits = c.appointments.filter((a) => a.status === "COMPLETED").length;
  const noShows = c.appointments.filter((a) => a.status === "NO_SHOW").length;
  const messages = await db.messageLog.findMany({ where: { clientId: c.id }, orderBy: { createdAt: "desc" }, take: 10 });

  return (
    <div className="max-w-5xl space-y-5">
      <Link href="/app/clients" className="text-sm text-stone-500">← Clients</Link>
      {sp.duplicate && <div className="card bg-amber-50 p-3 text-sm text-amber-800">A client with that phone number already exists. Here is their record.</div>}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{c.name}</h1>
          <p className="text-stone-600">{displayPhone(c.phone)}{c.email && ` · ${c.email}`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/app/appointments/new?clientId=${c.id}`} className="btn-primary">Book appointment</Link>
          <a className="btn-secondary" target="_blank" href={`https://wa.me/${c.phone}`}>WhatsApp</a>
          <Link href={`?edit=1`} className="btn-secondary">Edit</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border-t-2 border-ink py-4 pr-3"><p className="label-caps text-muted">Total spent</p><p className="stat-value mt-2">{money(spent, b.currency)}</p></div>
        <div className="border-t-2 border-ink py-4 pr-3"><p className="label-caps text-muted">Completed visits</p><p className="stat-value mt-2">{visits}</p></div>
        <div className="border-t-2 border-ink py-4 pr-3"><p className="label-caps text-muted">No-shows</p><p className={`stat-value mt-2 ${noShows ? "text-rose-700" : ""}`}>{noShows}</p></div>
        <div className="border-t-2 border-ink py-4 pr-3"><p className="label-caps text-muted">Client since</p><p className="stat-value mt-2">{DateTime.fromJSDate(c.createdAt).toFormat("LLL yyyy")}</p></div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-5 md:col-span-2">
          <section className="card">
            <h2 className="section-title border-b border-stone-200 px-4 py-3">Appointment history</h2>
            {c.appointments.length === 0 ? <p className="p-4 text-sm text-stone-500">No appointments yet.</p> : (
              <ul className="divide-y divide-stone-100">
                {c.appointments.map((a) => (
                  <li key={a.id}>
                    <Link href={`/app/appointments/${a.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-stone-50">
                      <span>
                        <span className="block font-medium">{a.service.name}</span>
                        <span className="text-xs text-stone-500">{fmtDateTime(a.startAt, tz)} · {a.staff?.name ?? "Unassigned"}</span>
                      </span>
                      <span className={`badge ${STATUS_STYLE[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="card p-4">
            <h2 className="section-title mb-3">Send a message</h2>
            <form action={messageClient} className="space-y-2">
              <input type="hidden" name="clientId" value={c.id} />
              <textarea name="body" rows={2} className="input" placeholder={`Hi ${c.name.split(" ")[0]}, …`} required />
              <button className="btn-secondary btn-sm">Send {b.messageChannel === "WHATSAPP" ? "WhatsApp" : "SMS"}</button>
            </form>
            {messages.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm">
                {messages.map((m) => (
                  <li key={m.id} className="rounded-none bg-stone-50 px-3 py-2">
                    <p className="text-[13px] text-muted">{m.kind} · {fmtDateTime(m.createdAt, tz)} · {m.status}</p>
                    <p className="[overflow-wrap:anywhere]">{m.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside>
          {sp.edit ? (
            <form action={saveClient} className="card space-y-3 p-4">
              <input type="hidden" name="id" value={c.id} />
              <div><label className="label">Name</label><input name="name" defaultValue={c.name} className="input" required /></div>
              <div><label className="label">Phone</label><input name="phone" defaultValue={displayPhone(c.phone)} className="input" required /></div>
              <div><label className="label">Email</label><input name="email" type="email" defaultValue={c.email ?? ""} className="input" /></div>
              <div><label className="label">Birthday</label><input name="birthday" type="date" defaultValue={c.birthday?.toISOString().slice(0, 10) ?? ""} className="input" /></div>
              <div><label className="label">Allergies / sensitivities</label><textarea name="allergies" defaultValue={c.allergies ?? ""} rows={2} className="input" /></div>
              <div><label className="label">Preferences</label><textarea name="preferences" defaultValue={c.preferences ?? ""} rows={2} className="input" placeholder="Hair type, colour formula, favourite stylist, pressure…" /></div>
              <div><label className="label">Notes</label><textarea name="notes" defaultValue={c.notes ?? ""} rows={3} className="input" /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="marketingOk" defaultChecked={c.marketingOk} className="accent-brand-600" /> OK to receive offers</label>
              <div className="flex gap-2"><button className="btn-primary">Save</button><Link href={`/app/clients/${c.id}`} className="btn-secondary">Cancel</Link></div>
            </form>
          ) : (
            <section className="card space-y-3 p-4 text-sm">
              <h2 className="section-title">Profile</h2>
              {c.allergies && <p className="rounded-none bg-rose-50 px-3 py-2 text-rose-800"><b>Allergies:</b> {c.allergies}</p>}
              <div><p className="text-[13px] text-muted">Preferences</p><p>{c.preferences || "-"}</p></div>
              <div><p className="text-[13px] text-muted">Notes</p><p className="whitespace-pre-wrap">{c.notes || "-"}</p></div>
              <div><p className="text-[13px] text-muted">Birthday</p><p>{c.birthday ? DateTime.fromJSDate(c.birthday, { zone: "utc" }).toFormat("d LLLL") : "-"}</p></div>
              <div><p className="text-[13px] text-muted">Marketing</p><p>{c.marketingOk ? "Opted in" : "Opted out"}</p></div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
