import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, guideBySlug, readMinutes } from "@/content/guides";
import { getSettings } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";
import { appUrl } from "@/lib/url";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, SitePage } from "@/components/site/SitePage";
import { Reveal } from "@/components/motion/Reveal";

export const dynamicParams = false;
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  if (!g) return {};
  const meta = await pageMetadata(`/guides/${g.slug}`, { title: g.title, description: g.description });
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", modifiedTime: g.updated } };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const { general } = await getSettings();
  const base = appUrl();
  const url = `${base}/guides/${g.slug}`;
  const related = g.related.map(guideBySlug).filter(Boolean) as typeof GUIDES;
  const updated = new Date(g.updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <SitePage>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: g.title,
            description: g.description,
            url,
            mainEntityOfPage: url,
            dateModified: g.updated,
            datePublished: g.updated,
            articleSection: g.category,
            inLanguage: "en",
            author: { "@type": "Organization", name: general.siteName, url: base },
            publisher: { "@type": "Organization", name: general.siteName, url: base },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: g.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: general.siteName, item: base },
              { "@type": "ListItem", position: 2, name: "Guides", item: `${base}/guides` },
              { "@type": "ListItem", position: 3, name: g.title, item: url },
            ],
          },
        ]}
      />
      <article className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ href: "/", label: general.siteName }, { href: "/guides", label: "Guides" }, { label: g.category }]} />
        <h1 className="text-[clamp(34px,5.4vw,72px)] leading-[0.95] uppercase">{g.title}</h1>
        <p className="label-caps mt-6 text-muted">Updated {updated} · {readMinutes(g)} min read</p>
        <p className="mt-8 text-[clamp(18px,1.6vw,22px)] leading-snug">{g.description}</p>

        <section className="mt-12 bg-panel p-6 sm:p-8">
          <h2 className="label-caps mb-4">Key points</h2>
          <ol className="space-y-3">
            {g.takeaways.map((t, i) => (
              <li key={i} className="flex gap-4 text-[16px] leading-snug"><sup className="pt-2 text-[11px]">{i + 1}</sup>{t}</li>
            ))}
          </ol>
        </section>

        <div className="mt-14 space-y-12 text-[17px] leading-[1.65]">
          {g.blocks.map((b, i) => (
            <Reveal key={i}>
              <section>
                {b.h && <h2 className="mb-4 border-t-2 border-ink pt-4 text-[clamp(22px,2.2vw,30px)] leading-tight uppercase">{b.h}</h2>}
                {b.p?.map((p, k) => <p key={k} className="mb-4">{p}</p>)}
                {b.list && (
                  <ul className="mb-4 space-y-2">
                    {b.list.map((l, k) => <li key={k} className="flex gap-3"><span aria-hidden className="pt-[0.1em]">—</span><span>{l}</span></li>)}
                  </ul>
                )}
                {b.steps && (
                  <ol className="mb-4 space-y-2">
                    {b.steps.map((s, k) => <li key={k} className="flex gap-3"><sup className="pt-2 text-[11px]">{k + 1}</sup><span>{s}</span></li>)}
                  </ol>
                )}
              </section>
            </Reveal>
          ))}
        </div>

        <section className="mt-16">
          <h2 className="label-caps mb-4">Questions</h2>
          <dl className="border-t-2 border-ink">
            {g.faqs.map((f) => (
              <div key={f.q} className="border-b border-ink/40 py-5">
                <dt className="text-[19px] leading-snug">{f.q}</dt>
                <dd className="mt-2 text-[16px] leading-relaxed text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16 flex flex-wrap items-center justify-between gap-8 bg-ink p-7 text-paper sm:p-10">
          <p className="max-w-md text-[clamp(20px,2vw,28px)] leading-tight uppercase">Bookings, clients and M-Pesa payments in one place.</p>
          <Link href="/signup" className="btn border-paper bg-paper text-ink hover:bg-transparent hover:text-paper">Start {general.trialDays}-day free trial</Link>
        </section>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="label-caps mb-4">Related guides</h2>
            <ul className="border-t-2 border-ink">
              {related.map((r) => (
                <li key={r.slug} className="border-b border-ink/40">
                  <Link href={`/guides/${r.slug}`} className="group flex items-center justify-between gap-6 py-4 text-[clamp(17px,1.6vw,21px)]">
                    {r.title}<span className="shrink-0 transition-transform duration-700 group-hover:rotate-45">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </SitePage>
  );
}
