import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { LEAD_STATUSES, statusLabel } from "@/lib/leads";
import { importLeads } from "@/app/actions/leads";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";
type SP = { status?: string; city?: string; type?: string; q?: string; due?: string; imported?: string; skipped?: string; error?: string };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const where: Prisma.LeadWhereInput = {
    ...(sp.status ? { status: sp.status } : { status: { notIn: ["DO_NOT_CONTACT"] } }),
    ...(sp.city ? { city: sp.city } : {}),
    ...(sp.type ? { type: sp.type } : {}),
    ...(sp.due ? { followUpAt: { lte: new Date() }, status: { in: ["CONTACTED", "REPLIED", "DEMO"] } } : {}),
    ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: "insensitive" } }, { area: { contains: sp.q, mode: "insensitive" } }, { instagram: { contains: sp.q.replace(/^@/, ""), mode: "insensitive" } }] } : {}),
  };
  const [leads, counts, cities, types, due, total] = await Promise.all([
    db.lead.findMany({ where, orderBy: [{ followUpAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }], take: 300 }),
    db.lead.groupBy({ by: ["status"], _count: true }),
    db.lead.findMany({ distinct: ["city"], select: { city: true }, where: { city: { not: null } } }),
    db.lead.findMany({ distinct: ["type"], select: { type: true }, where: { type: { not: null } } }),
    db.lead.count({ where: { followUpAt: { lte: new Date() }, status: { in: ["CONTACTED", "REPLIED", "DEMO"] } } }),
    db.lead.count(),
  ]);
  const n = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const q = (p: Partial<SP>) => { const u = new URLSearchParams(Object.entries({ status: sp.status, city: sp.city, type: sp.type, q: sp.q, due: sp.due, ...p }).filter(([, v]) => v) as [string, string][]); return `?${u}`; };
  return (
    <div className="space-y-10">
      <PageHeader title="Leads" label={`${total} salons`} sub="Salons to reach out to. Messages open in your own WhatsApp, Instagram or email, ready to send; nothing is sent automatically. Public business contacts only." />
      {sp.imported && <p className="border-l-2 border-ink bg-panel px-4 py-3 text-[14px]">Imported {sp.imported} lead(s){Number(sp.skipped) ? `, skipped ${sp.skipped} duplicate or empty row(s)` : ""}.</p>}
      {sp.error && <p className="border-l-2 border-pink bg-panel px-4 py-3 text-[14px]">That import couldn&apos;t be read. Paste a JSON array or CSV with a header row.</p>}

      <nav className="grid grid-cols-2 border-t-2 border-ink sm:grid-cols-4 lg:grid-cols-8">
        {LEAD_STATUSES.map((s) => (
          <Link key={s.id} href={q({ status: sp.status === s.id ? undefined : s.id, due: undefined })} className={`border-b border-ink/20 px-3 py-3 transition-colors hover:bg-panel ${sp.status === s.id ? "bg-ink text-paper hover:bg-ink" : ""}`}>
            <span className="block text-[24px] leading-none tabular-nums">{n(s.id)}</span>
            <span className="label-caps mt-1 block opacity-70">{s.label}</span>
          </Link>
        ))}
      </nav>

      <form className="flex flex-wrap items-end gap-3">
        <input name="q" defaultValue={sp.q} placeholder="Search name, area or @handle" className="input w-64" />
        <select name="city" defaultValue={sp.city ?? ""} className="input w-auto"><option value="">All cities</option>{cities.map((c) => <option key={c.city} value={c.city!}>{c.city}</option>)}</select>
        <select name="type" defaultValue={sp.type ?? ""} className="input w-auto"><option value="">All types</option>{types.map((t) => <option key={t.type} value={t.type!}>{t.type}</option>)}</select>
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <button className="btn-secondary btn-sm">Filter</button>
        <Link href={q({ due: sp.due ? undefined : "1", status: undefined })} className={`btn btn-sm ${sp.due ? "border-ink bg-ink text-paper" : "border-pink text-pink"}`}>Follow-ups due · {due}</Link>
        <span className="ml-auto flex gap-3"><Link href="/admin/leads/templates" className="label-caps hover:opacity-60">Message templates</Link><a href="/admin/leads-export" className="label-caps hover:opacity-60">Export CSV</a></span>
      </form>

      <div className="overflow-x-auto border-t-2 border-ink">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead><tr className="label-caps text-muted"><th className="py-3 font-normal">Salon</th><th className="font-normal">Where</th><th className="font-normal">Books via</th><th className="font-normal">Status</th><th className="font-normal">Follow up</th></tr></thead>
          <tbody>
            {leads.length === 0 && <tr><td colSpan={5} className="py-6 text-muted">{total ? "No leads match these filters." : "No leads yet. Import a list below."}</td></tr>}
            {leads.map((l) => {
              const overdue = l.followUpAt && l.followUpAt <= new Date() && ["CONTACTED", "REPLIED", "DEMO"].includes(l.status);
              return (
                <tr key={l.id} className="border-t border-ink/20 align-top hover:bg-panel">
                  <td className="py-3 pr-4"><Link href={`/admin/leads/${l.id}`} className="text-[15px] hover:opacity-60">{l.name}</Link><span className="block text-[12px] text-muted">{[l.type, l.instagram && `@${l.instagram}`].filter(Boolean).join(" · ")}</span></td>
                  <td className="py-3 pr-4">{[l.area, l.city].filter(Boolean).join(", ")}</td>
                  <td className="max-w-[260px] py-3 pr-4 text-[13px] text-muted">{l.bookingMethod ?? "–"}</td>
                  <td className="py-3 pr-4">{statusLabel(l.status)}</td>
                  <td className={`py-3 ${overdue ? "text-pink" : "text-muted"}`}>{l.followUpAt ? l.followUpAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Nairobi" }) : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="border-t-2 border-ink pt-5">
        <summary className="label-caps cursor-pointer hover:opacity-60">Import leads</summary>
        <form action={importLeads} className="mt-4 space-y-3">
          <textarea name="data" rows={8} className="input font-mono text-[12px]" placeholder={'Paste a JSON array, or CSV with a header row:\nname,type,city,area,phone,instagram,bookingMethod,fitNote,sources'} required />
          <button className="btn-primary btn-sm">Import</button>
          <p className="text-[12px] text-muted">Duplicates (same phone, Instagram handle, or name and area) are skipped. Only add public business contact details.</p>
        </form>
      </details>
    </div>
  );
}
