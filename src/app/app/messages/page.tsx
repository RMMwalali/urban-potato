import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { displayPhone, fmtDateTime } from "@/lib/format";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser();
  const b = user.business;
  const msgs = await db.messageLog.findMany({ where: { businessId: b.id }, orderBy: { createdAt: "desc" }, take: 200 });
  const clientIds = [...new Set(msgs.map((m) => m.clientId).filter(Boolean) as string[])];
  const clients = new Map((await db.client.findMany({ where: { id: { in: clientIds } } })).map((c) => [c.id, c.name]));
  const failed = msgs.filter((m) => m.status === "FAILED").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Messages</h1>
        <p className="text-sm text-stone-500">
          Reminders go out {b.reminderHours}h before each appointment.
          {failed > 0 && <span className="text-rose-700"> {failed} failed recently.</span>}
        </p>
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>When</th><th>To</th><th>Type</th><th>Message</th><th>Status</th></tr></thead>
          <tbody>
            {msgs.length === 0 && <tr><td colSpan={5} className="text-center text-stone-500">No messages yet.</td></tr>}
            {msgs.map((m) => (
              <tr key={m.id}>
                <td className="whitespace-nowrap">{fmtDateTime(m.createdAt, b.timezone)}</td>
                <td className="whitespace-nowrap">
                  {m.clientId ? <Link href={`/app/clients/${m.clientId}`} className="hover:text-brand-700">{clients.get(m.clientId)}</Link> : null}
                  <span className="block text-xs text-stone-500">{displayPhone(m.to)} · {m.channel}</span>
                </td>
                <td className="text-xs">{m.kind}</td>
                <td className="max-w-md [overflow-wrap:anywhere]">{m.body}</td>
                <td>
                  <span className={`badge ${m.status === "SENT" ? "bg-emerald-100 text-emerald-800" : m.status === "FAILED" ? "bg-rose-100 text-rose-800" : "bg-stone-100"}`}>{m.status}</span>
                  {m.error && <span className="block text-xs text-rose-700">{m.error}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
