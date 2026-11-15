import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getSettings } from "@/lib/platform";
import { appUrl } from "@/lib/url";
import { findShowcase } from "@/lib/showcase";
import { prepareShowcase } from "@/app/actions/showcase";
import { ScreenReelStudio } from "@/components/reel/screen/ScreenReelStudio";
import { REELS } from "@/components/reel/screen/reels";

export const metadata = { title: "Demo studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ reel?: string; format?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [{ general }, showcase] = await Promise.all([getSettings(), findShowcase()]);
  const domain = appUrl().replace(/^https?:\/\//, "");
  if (!showcase) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24">
        <p className="label-caps text-muted">How-to demos</p>
        <h1 className="page-title mt-4">Create the showcase salon first</h1>
        <p className="mt-6 text-[15px] text-muted">Reels film the real app using a fictional salon, so no customer&apos;s data appears in your marketing. It never sends messages and is left out of your stats.</p>
        <form action={prepareShowcase} className="mt-8 flex gap-3"><button className="btn-primary">Create showcase salon</button><Link href="/admin/reel" className="btn-secondary">Back</Link></form>
      </main>
    );
  }
  return (
    <ScreenReelStudio
      host={domain}
      initialReel={REELS.some((r) => r.id === sp.reel) ? sp.reel! : REELS[0].id}
      initialFormat={sp.format === "landscape" ? "landscape" : "portrait"}
      name={general.siteName}
    />
  );
}
