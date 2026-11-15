import { GUIDES, CATEGORIES } from "@/content/guides";
import { getSettings } from "@/lib/platform";
import { appUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

// llms.txt: a plain-text map of the site for AI assistants (https://llmstxt.org).
export async function GET() {
  const { general, seo } = await getSettings();
  const base = appUrl();
  const n = general.siteName;
  const lines = [
    `# ${n}`,
    "",
    `> ${n} is salon, barbershop and spa management software built for Kenya: an online booking engine, client records, M-Pesa checkout with Safaricom-verified codes, SMS/WhatsApp reminders, deposits, staff commission and reports. Flat pricing: ${general.currency} ${general.monthlyPrice.toLocaleString()} a month, ${general.currency} ${general.annualPrice.toLocaleString()} a year${general.lifetimeEnabled ? `, or ${general.currency} ${general.lifetimePrice.toLocaleString()} once for lifetime access (limited places)` : ""}; no commission on clients, ${general.trialDays}-day free trial.`,
    "",
    seo.description,
    "",
    "## Product",
    `- [Home](${base}/): what ${n} does, pricing and FAQ`,
    `- [Start a free trial](${base}/signup)`,
    "",
    ...CATEGORIES.flatMap((c) => [`## Guides: ${c}`, ...GUIDES.filter((g) => g.category === c).map((g) => `- [${g.title}](${base}/guides/${g.slug}): ${g.description}`), ""]),
    "## Optional",
    `- [Full text of all guides](${base}/llms-full.txt)`,
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
