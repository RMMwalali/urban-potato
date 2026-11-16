import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  await requireAdmin();
  const leads = await db.lead.findMany({ orderBy: { createdAt: "asc" } });
  const cols = ["name", "type", "city", "area", "phone", "whatsapp", "instagram", "tiktok", "facebook", "website", "email", "bookingMethod", "fitNote", "status", "followUpAt", "lastContactAt", "notes"] as const;
  const esc = (v: unknown) => { const s = v instanceof Date ? v.toISOString() : v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [cols.join(","), ...leads.map((l) => cols.map((c) => esc(l[c])).join(","))].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="darling-leads-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
