import { Globe, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/platform";
import { deleteSeoPage, saveSeoPage, saveSettingsGroup } from "@/app/actions/admin";
import { ActionForm, ConfirmButton } from "@/components/ActionForm";
import { Alert, PageHeader } from "@/components/ui";
import { SeoPreview } from "@/components/admin/SeoPreview";

const SUGGESTED = ["/", "/signup", "/login", "/book/*"];

export default async function SeoPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const [{ seo, general }, pages] = await Promise.all([getSettings(), db.seoPage.findMany({ orderBy: { path: "asc" } })]);
  const base = seo.canonicalUrl || process.env.APP_URL || "https://example.com";
  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="SEO & meta tags" sub="Titles, descriptions, social cards and indexing for public pages" icon={Globe} />
      {saved && <Alert tone="success">SEO defaults saved.</Alert>}

      <section className="card p-5">
        <h2 className="section-title mb-4">Site-wide defaults</h2>
        <form action={saveSettingsGroup} className="grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="group" value="seo" /><input type="hidden" name="back" value="/admin/seo" />
          <div className="space-y-4">
            <div><label className="label">Default title</label><input name="defaultTitle" defaultValue={seo.defaultTitle} maxLength={70} className="input" /></div>
            <div><label className="label">Title template <span className="normal-case">(%s = page title)</span></label><input name="titleTemplate" defaultValue={seo.titleTemplate} className="input" /></div>
            <div><label className="label">Meta description</label><textarea name="description" defaultValue={seo.description} maxLength={170} rows={3} className="input" /></div>
            <div><label className="label">Keywords (comma separated)</label><input name="keywords" defaultValue={seo.keywords} className="input" /></div>
          </div>
          <div className="space-y-4">
            <div><label className="label">Social share image URL (1200×630)</label><input name="ogImage" defaultValue={seo.ogImage} className="input" placeholder="https://…/og.png" /></div>
            <div><label className="label">X / Twitter handle</label><input name="twitterHandle" defaultValue={seo.twitterHandle} className="input" placeholder="@yourbrand" /></div>
            <div><label className="label">Google Search Console verification</label><input name="googleVerification" defaultValue={seo.googleVerification} className="input" /></div>
            <div><label className="label">Canonical site URL</label><input name="canonicalUrl" defaultValue={seo.canonicalUrl} className="input" placeholder="https://yourdomain.com" /></div>
            <SeoPreview url={base} title={seo.defaultTitle} description={seo.description} />
          </div>
          <div className="lg:col-span-2"><button className="btn-primary">Save defaults</button></div>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="section-title mb-1">Per-page overrides</h2>
        <p className="mb-4 text-sm text-stone-500">Use <code>/book/*</code> for all salon booking pages; <code>{"{name}"}</code> is replaced with the salon&apos;s name. {general.siteName} adds the title template automatically.</p>
        <div className="space-y-3">
          {[...pages, ...SUGGESTED.filter((p) => !pages.some((x) => x.path === p)).map((path) => ({ id: "", path, title: null, description: null, keywords: null, ogImage: null, noIndex: false }))].map((p) => (
            <details key={p.path} className="group rounded-xl border border-stone-200 open:bg-stone-50/50">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm">
                <span className="font-mono font-semibold">{p.path}</span>
                <span className="text-xs text-stone-500">{p.id ? (p.title ?? "custom") : "default"}{p.noIndex && " · noindex"}</span>
              </summary>
              <div className="grid gap-4 border-t border-stone-200 p-4 lg:grid-cols-2">
                <ActionForm action={saveSeoPage} submit="Save page SEO" className="space-y-3">
                  <input type="hidden" name="path" value={p.path} />
                  <div><label className="label">Title (≤ 60 chars ideal)</label><input name="title" defaultValue={p.title ?? ""} maxLength={70} className="input" /></div>
                  <div><label className="label">Description (≤ 160 chars ideal)</label><textarea name="description" defaultValue={p.description ?? ""} maxLength={170} rows={2} className="input" /></div>
                  <div><label className="label">Keywords</label><input name="keywords" defaultValue={p.keywords ?? ""} className="input" /></div>
                  <div><label className="label">Share image URL</label><input name="ogImage" defaultValue={p.ogImage ?? ""} className="input" /></div>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="noIndex" defaultChecked={p.noIndex} className="accent-brand-600" /> Hide from search engines (noindex)</label>
                </ActionForm>
                <div className="space-y-3">
                  <SeoPreview url={`${base}${p.path.replace("*", "your-salon")}`} title={(p.title ?? seo.defaultTitle).replace("{name}", "Your Salon")} description={(p.description ?? seo.description).replace("{name}", "Your Salon")} />
                  {p.id && <form action={deleteSeoPage.bind(null, p.id)}><ConfirmButton message={`Remove override for ${p.path}?`}><Trash2 className="h-3.5 w-3.5" /> Remove override</ConfirmButton></form>}
                </div>
              </div>
            </details>
          ))}
        </div>
        <details className="mt-4 rounded-xl border border-dashed border-stone-300 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-brand-600">+ Add another path</summary>
          <ActionForm action={saveSeoPage} submit="Add" className="mt-3 grid gap-3 sm:grid-cols-2">
            <input name="path" placeholder="/pricing" className="input" required />
            <input name="title" placeholder="Title" className="input" />
            <textarea name="description" placeholder="Description" rows={2} className="input sm:col-span-2" />
          </ActionForm>
        </details>
      </section>
    </div>
  );
}
