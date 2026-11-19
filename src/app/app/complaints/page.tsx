import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { COMPLAINT_CATEGORIES, complaintRef } from "@/lib/complaints";
import { fmtDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { ComplaintForm } from "@/components/ComplaintForm";

export const metadata = { title: "Complaints & feedback" };

const STATUS: Record<string, string> = { NEW: "Received", IN_PROGRESS: "Being looked at", RESOLVED: "Resolved" };

export default async function ComplaintsPage() {
  const user = await requireUser(undefined, { allowLocked: true });
  const mine = await db.complaint.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 });
  return (
    <div>
      <PageHeader title="We take complaints seriously" label="Complaints & feedback"
        sub="Something not working, a payment that looks wrong, or something we could do better? Tell us here. It goes straight to the Darling HQ team, and you'll get an email confirming we've received it." />
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ComplaintForm name={user.name} email={user.email} phone={user.phone} />
        {mine.length > 0 && (
          <aside>
            <p className="label-caps mb-4">What you&apos;ve sent</p>
            <ul className="border-t-2 border-ink">
              {mine.map((c) => (
                <li key={c.id} className="border-b border-ink/30 py-3 text-[14px]">
                  <p className="flex justify-between gap-3"><span className="label-caps">{complaintRef(c.number)}</span><span className={`label-caps ${c.status === "RESOLVED" ? "text-muted" : "text-pink"}`}>{STATUS[c.status] ?? c.status}</span></p>
                  <p className="mt-1">{c.subject}</p>
                  <p className="text-[12px] text-muted">{COMPLAINT_CATEGORIES.find((x) => x.id === c.category)?.label} · {fmtDateTime(c.createdAt, user.business.timezone)}</p>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
