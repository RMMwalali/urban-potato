import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { digits, getTemplates, LEAD_STATUSES, render, statusLabel } from "@/lib/leads";
import { deleteLead, updateLead } from "@/app/actions/leads";
import { LeadOutreach } from "@/components/admin/LeadOutreach";
import { ConfirmButton } from "@/components/ActionForm";

export const metadata = { title: "Lead" };
export const dynamic = "force-dynamic";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  const lead = await db.lead.findUnique({ where: { id }, include: { activity: { orderBy: { at: "desc" }, take: 50 } } });
  if (!lead) notFound();
  const t = await getTemplates();
  const sender = admin.name || "the Darling HQ team";
  const [whatsapp, instagram, emailSubject, email, followUp] = await Promise.all([render(t.whatsapp, lead, sender), render(t.instagram, lead, sender), render(t.emailSubject, lead, sender), render(t.email, lead, sender), render(t.followUp, lead, sender)]);
  const wa = digits(lead.whatsapp || lead.phone) || null;
  const business = lead.businessId ? await db.business.findUnique({ where: { id: lead.businessId }, select: { id: true, name: true, status: true } }) : null;
  const row = (k: string, v: React.ReactNode) => v ? <div className="flex justify-between gap-4 border-b border-ink/15 py-2"><dt className="label-caps text-muted">{k}</dt><dd className="text-right">{v}</dd></div> : null;
  const ext = (href: string, label: string) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-1 underline-offset-4 hover:opacity-60">{label}</a>;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
      <section>
        <Link href="/admin/leads" className="label-caps text-muted hover:text-ink">← Leads</Link>
        <h1 className="page-title mt-3">{lead.name}</h1>
        <p className="label-caps mt-2 text-muted">{[lead.type, lead.area, lead.city].filter(Boolean).join(" · ")} · {statusLabel(lead.status)}</p>
        {lead.fitNote && <p className="mt-4 border-l-2 border-pink bg-panel px-3 py-2 text-[14px]">{lead.fitNote}</p>}
        <dl className="mt-6 border-t-2 border-ink text-[14px]">
          {row("Books via", lead.bookingMethod)}
          {row("Phone", lead.phone && ext(`tel:${lead.phone}`, lead.phone))}
          {row("WhatsApp", lead.whatsapp)}
          {row("Instagram", lead.instagram && ext(`https://instagram.com/${lead.instagram}`, `@${lead.instagram}`))}
          {row("TikTok", lead.tiktok)}
          {row("Facebook", lead.facebook && ext(lead.facebook.startsWith("http") ? lead.facebook : `https://facebook.com/${lead.facebook}`, "Page"))}
          {row("Website", lead.website && ext(lead.website.startsWith("http") ? lead.website : `https://${lead.website}`, lead.website.replace(/^https?:\/\//, "")))}
          {row("Email", lead.email)}
          {row("Signed up", business && <Link href={`/admin/businesses/${business.id}`} className="underline">{business.name} ({business.status.toLowerCase()})</Link>)}
          {row("Confidence", lead.confidence)}
        </dl>
        {lead.sources.length > 0 && <p className="mt-3 text-[12px] text-muted">Sources: {lead.sources.map((s, i) => <span key={s}>{i ? " · " : ""}{ext(s, new URL(s.startsWith("http") ? s : `https://${s}`).hostname.replace(/^www\./, ""))}</span>)}</p>}

        <form action={updateLead} className="mt-10 space-y-4 border-t-2 border-ink pt-5">
          <input type="hidden" name="id" value={lead.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="status">Status</label><select id="status" name="status" defaultValue={lead.status} className="input">{LEAD_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
            <div><label className="label" htmlFor="followUpAt">Follow up on</label><input id="followUpAt" name="followUpAt" type="date" defaultValue={lead.followUpAt?.toISOString().slice(0, 10)} className="input" /></div>
          </div>
          <div><label className="label" htmlFor="note">Add a note (what they said, next step)</label><textarea id="note" name="note" rows={3} className="input" /></div>
          <button className="btn-secondary btn-sm">Save</button>
        </form>

        <section className="mt-10">
          <p className="label-caps">History</p>
          <ul className="mt-3 border-t border-ink/30">
            {lead.activity.map((a) => (
              <li key={a.id} className="border-b border-ink/15 py-2 text-[13px]">
                <span className="label-caps text-muted">{a.kind} · {a.at.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" })}</span>
                <p className="mt-1 whitespace-pre-line">{a.text.length > 400 ? `${a.text.slice(0, 400)}…` : a.text}</p>
              </li>
            ))}
          </ul>
        </section>
        <form action={deleteLead.bind(null, lead.id)} className="mt-8"><ConfirmButton message={`Delete ${lead.name}?`}>Delete lead</ConfirmButton></form>
      </section>

      <section className="lg:sticky lg:top-28 lg:self-start">
        <p className="label-caps mb-4">Reach out</p>
        <LeadOutreach id={lead.id} wa={wa} instagram={lead.instagram} email={lead.email} messages={{ whatsapp, instagram, emailSubject, email, followUp }} contacted={!!lead.lastContactAt} blocked={lead.status === "DO_NOT_CONTACT"} />
        <p className="mt-4 text-[12px] text-muted">If they reply STOP or say no, set the status to “Do not contact”. Keep messages personal and few: one first message and at most two follow-ups.</p>
      </section>
    </div>
  );
}
