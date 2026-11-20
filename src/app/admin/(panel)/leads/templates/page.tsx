import Link from "next/link";
import { getTemplates } from "@/lib/leads";
import { saveTemplates } from "@/app/actions/leads";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Message templates" };

const FIELDS = [
  { k: "whatsapp", label: "First message (WhatsApp)", rows: 9 },
  { k: "instagram", label: "First message (Instagram DM)", rows: 5 },
  { k: "emailSubject", label: "Email subject", rows: 1 },
  { k: "email", label: "Email", rows: 12 },
  { k: "followUp", label: "Follow-up", rows: 5 },
] as const;

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const t = await getTemplates();
  return (
    <form action={saveTemplates} className="max-w-3xl space-y-6">
      <Link href="/admin/leads" className="label-caps text-muted hover:text-ink">← Leads</Link>
      <PageHeader title="Message templates" sub="Placeholders: {name} salon, {area}, {how} (how they book today), {sender} your first name, {brand}, {price}, {trial} days, {offer} (founding offer, live), {link} their own sign-up link, {preview} the booking page made for them (start with this)." />
      {saved && <p className="border-l-2 border-ink bg-panel px-4 py-3 text-[14px]">Saved.</p>}
      {FIELDS.map((f) => (
        <div key={f.k}>
          <label className="label" htmlFor={f.k}>{f.label}</label>
          {f.rows === 1 ? <input id={f.k} name={f.k} defaultValue={t[f.k]} className="input" /> : <textarea id={f.k} name={f.k} rows={f.rows} defaultValue={t[f.k]} className="input text-[14px]" />}
        </div>
      ))}
      <button className="btn-primary">Save templates</button>
      <p className="text-[12px] text-muted">Keep the opt-out line: it keeps outreach respectful and within Kenya&apos;s data protection rules.</p>
    </form>
  );
}
