import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { Empty, PageHeader } from "@/components/ui";

export default async function AuditPage() {
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  return (
    <div>
      <PageHeader title="Audit log" sub="Every action taken in the admin panel" />
      <div className="card overflow-x-auto">
        {logs.length === 0 ? <Empty title="Nothing logged yet" /> : (
          <table className="table">
            <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-xs">{fmtDateTime(l.createdAt, "Africa/Nairobi")}</td>
                  <td className="text-xs">{l.actor}</td>
                  <td className="font-mono text-xs font-semibold">{l.action}</td>
                  <td className="text-xs">{l.targetType && `${l.targetType}:`}{l.targetId}</td>
                  <td className="max-w-xs truncate font-mono text-[11px] text-stone-500">{l.details ? JSON.stringify(l.details) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
