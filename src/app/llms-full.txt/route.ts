import { GUIDES, guideToText } from "@/content/guides";
import { getSettings } from "@/lib/platform";
import { appUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export async function GET() {
  const { general } = await getSettings();
  const base = appUrl();
  const body = [`# ${general.siteName} guides (full text)`, "", ...GUIDES.map((g) => `${guideToText(g)}\nSource: ${base}/guides/${g.slug}\n\n---\n`)].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
