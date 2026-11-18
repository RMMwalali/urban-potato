import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { COMPLAINT_CATEGORIES, complaintRef } from "@/lib/complaints";
import { resendComplaint, setComplaintStatus } from "@/app/actions/complaints";
import { fmtDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui";

const TZ = "Africa/Nairobi";

export default async function AdminComplaint({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await db.complaint.findUnique({ where: { id }, include: { business: { select: { id: true, name: true, city: true, plan: true, status: true } } } });
  if (!c) notFound();
  const ref = complaintRef(c.number);
  const label = COMPLAINT_CATEGORIES.find((x) => x.id === c.category)?.label ?? c.category;
  return (
    <div className="max-w-4xl">
      <Link href="/admin/complaints" className="label-caps text-muted hover:text-ink">← Complaints</Link>
      <PageHeader title={c.subject} label={`${ref} · ${label}`}>
        {(["NEW", "IN_PROGRESS", "RESOLVED"] as const).map((s) => (
          <form key={s} action={setComplaintStatus.bind(null, c.id, s)}><button className={c.status === s ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>{s === "NEW" ? "New" : s === "IN_PROGRESS" ? "In progress" : "Resolved"}</button></form>
        ))}
      </PageHeader>
      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <p className="whitespace-pre-wrap text-[16px] leading-relaxed [overflow-wrap:anywhere]">{c.message}</p>
          <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${ref} ${c.subject}`)}`} className="btn-primary mt-8">Reply by email</a>
        </div>
        <dl className="space-y-4 text-[14px]">
          <div><dt className="label-caps text-muted">Salon</dt><dd><Link href={`/admin/businesses/${c.business.id}`} className="underline">{c.business.name}</Link>{c.business.city ? `, ${c.business.city}` : ""}<br /><span className="text-muted">{c.business.plan} · {c.business.status.toLowerCase()}</span></dd></div>
          <div><dt className="label-caps text-muted">From</dt><dd>{c.name}<br /><a href={`mailto:${c.email}`} className="underline">{c.email}</a>{c.phone && <><br /><a href={`tel:${c.phone}`}>{c.phone}</a></>}</dd></div>
          <div><dt className="label-caps text-muted">Received</dt><dd>{fmtDateTime(c.createdAt, TZ)}</dd></div>
          <div><dt className="label-caps text-muted">Email</dt><dd>Team inbox: {c.emailedAt ? fmtDateTime(c.emailedAt, TZ) : "not sent"}<br />Automatic reply: {c.repliedAt ? fmtDateTime(c.repliedAt, TZ) : "not sent"}{c.emailError && <span className="mt-1 block text-pink">{c.emailError}</span>}</dd></div>
          {(!c.emailedAt || !c.repliedAt) && <form action={resendComplaint.bind(null, c.id)}><button className="btn-secondary btn-sm">Send emails again</button></form>}
          {c.resolvedAt && <div><dt className="label-caps text-muted">Resolved</dt><dd>{fmtDateTime(c.resolvedAt, TZ)}</dd></div>}
        </dl>
      </div>
    </div>
  );
}
