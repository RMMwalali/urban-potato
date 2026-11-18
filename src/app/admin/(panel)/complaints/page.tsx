import Link from "next/link";
import { db } from "@/lib/db";
import { COMPLAINT_CATEGORIES, complaintRef } from "@/lib/complaints";
import { complaintsInbox } from "@/lib/complaints-inbox";
import { mailConfig } from "@/lib/mail";
import { saveComplaintsInbox } from "@/app/actions/complaints";
import { fmtDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui";

const TZ = "Africa/Nairobi";
const FILTERS = [{ id: "open", label: "Open" }, { id: "RESOLVED", label: "Resolved" }, { id: "all", label: "All" }];

export default async function AdminComplaints({ searchParams }: { searchParams: Promise<{ f?: string; saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const f = sp.f ?? "open";
  const where = f === "all" ? {} : f === "RESOLVED" ? { status: "RESOLVED" } : { status: { not: "RESOLVED" } };
  const [rows, inbox, mail, open, failed] = await Promise.all([
    db.complaint.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { business: { select: { name: true, city: true } } } }),
    complaintsInbox(), mailConfig(), db.complaint.count({ where: { status: { not: "RESOLVED" } } }), db.complaint.count({ where: { emailError: { not: null } } }),
  ]);
  return (
    <div className="max-w-6xl">
      <PageHeader title="Complaints" sub={`Sent by salon users from "We take complaints seriously". Each one is emailed to ${inbox} with the sender as reply-to, and the sender gets an automatic reply.`} />
      {sp.saved && <p className="mb-6 border-l-2 border-ink bg-panel px-4 py-3 text-[14px]">Saved.</p>}
      {sp.error && <p className="mb-6 border-l-2 border-pink bg-panel px-4 py-3 text-[14px] text-pink">That email address doesn&apos;t look right.</p>}
      {!mail && <p className="mb-6 border-l-2 border-pink bg-panel px-4 py-3 text-[14px]">Email isn&apos;t set up, so complaints are saved here but not emailed, and no automatic reply goes out. Add it in <Link href="/admin/api-keys" className="underline">Connections → Email (SMTP)</Link>.</p>}
      {mail && failed > 0 && <p className="mb-6 border-l-2 border-pink bg-panel px-4 py-3 text-[14px]">{failed} complaint(s) had an email problem. Open one to see why and send again.</p>}

      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <nav className="flex gap-6">
          {FILTERS.map((x) => <Link key={x.id} href={`/admin/complaints?f=${x.id}`} className={`label-caps ${f === x.id ? "text-ink" : "text-muted hover:text-ink"}`}>{x.label}{x.id === "open" ? ` (${open})` : ""}</Link>)}
        </nav>
        <form action={saveComplaintsInbox} className="flex items-end gap-2">
          <div><label className="label" htmlFor="email">Email complaints to</label><input id="email" name="email" type="email" defaultValue={inbox} className="input w-72" /></div>
          <button className="btn-secondary btn-sm">Save</button>
        </form>
      </div>

      {rows.length === 0 ? <p className="text-muted">Nothing here.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead><tr className="label-caps text-muted"><th className="pb-3 font-normal">Ref</th><th className="pb-3 font-normal">Received</th><th className="pb-3 font-normal">Salon · from</th><th className="pb-3 font-normal">About</th><th className="pb-3 font-normal">Status</th><th className="pb-3 font-normal">Email</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-ink/30 align-top">
                  <td className="py-3 pr-4"><Link href={`/admin/complaints/${c.id}`} className="underline">{complaintRef(c.number)}</Link></td>
                  <td className="py-3 pr-4 whitespace-nowrap">{fmtDateTime(c.createdAt, TZ)}</td>
                  <td className="py-3 pr-4">{c.business.name}<br /><span className="text-muted">{c.name}</span></td>
                  <td className="py-3 pr-4"><Link href={`/admin/complaints/${c.id}`}>{c.subject}</Link><br /><span className="text-muted">{COMPLAINT_CATEGORIES.find((x) => x.id === c.category)?.label}</span></td>
                  <td className={`py-3 pr-4 label-caps ${c.status === "RESOLVED" ? "text-muted" : "text-pink"}`}>{c.status.replace("_", " ").toLowerCase()}</td>
                  <td className="py-3 text-[12px]">{c.emailError ? <span className="text-pink">Problem</span> : c.emailedAt ? "Sent · replied" : "Not sent"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
