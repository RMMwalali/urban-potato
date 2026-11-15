import Link from "next/link";
import { CATEGORIES, GUIDES, readMinutes } from "@/content/guides";
import { getSettings } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";
import { appUrl } from "@/lib/url";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, SitePage } from "@/components/site/SitePage";
import { Lines, Reveal } from "@/components/motion/Reveal";

export async function generateMetadata() {
  return pageMetadata("/guides", {
    title: "Salon & spa management guides",
    description: "Practical guides for salon, barbershop and spa owners: pricing and profit, no-shows, M-Pesa, handling clients, paying and managing staff, and choosing software.",
  });
}

export default async function GuidesIndex() {
  const { general } = await getSettings();
  const base = appUrl();
  return (
    <SitePage>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${general.siteName} guides`,
          url: `${base}/guides`,
          hasPart: GUIDES.map((g) => ({ "@type": "Article", headline: g.title, url: `${base}/guides/${g.slug}` })),
        }}
      />
      <Breadcrumbs items={[{ href: "/", label: general.siteName }, { label: "Guides" }]} />
      <h1 className="border-b-2 border-ink pb-6 text-[clamp(44px,8vw,120px)] leading-[0.85] uppercase">
        <Lines lines={["Running a salon,", "explained"]} />
      </h1>
      <p className="mt-8 max-w-2xl text-[clamp(17px,1.5vw,20px)] leading-snug">
        Practical guides for salon, barbershop and spa owners on pricing, profit, clients, staff and the tools that keep it all running.
      </p>

      <div className="mt-20 space-y-20">
        {CATEGORIES.map((cat) => (
          <section key={cat} className="grid gap-6 md:grid-cols-[1fr_2fr]">
            <h2 className="label-caps">{cat}</h2>
            <ul className="border-t-2 border-ink">
              {GUIDES.filter((g) => g.category === cat).map((g) => (
                <li key={g.slug} className="border-b border-ink/40">
                  <Reveal>
                    <Link href={`/guides/${g.slug}`} className="group flex items-start justify-between gap-6 py-5">
                      <span>
                        <span className="block text-[clamp(20px,2vw,28px)] leading-tight">{g.title}</span>
                        <span className="mt-2 block text-[14px] text-muted">{g.description}</span>
                      </span>
                      <span className="label-caps shrink-0 pt-2 text-muted transition-colors duration-500 group-hover:text-ink">{readMinutes(g)} min ↗</span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </SitePage>
  );
}
