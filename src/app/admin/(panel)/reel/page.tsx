import { getSettings } from "@/lib/platform";
import { foundingOffer } from "@/lib/offer";
import { appUrl } from "@/lib/url";
import { PageHeader } from "@/components/ui";
import { ReelStudio } from "@/components/reel/ReelStudio";

export const metadata = { title: "Reel studio" };

export default async function ReelPage() {
  const [{ general }, offer] = await Promise.all([getSettings(), foundingOffer()]);
  const domain = appUrl().replace(/^https?:\/\//, "");
  return (
    <div>
      <PageHeader title="Reel studio" label="Marketing" sub="Generates an HD video of the platform, feature by feature, with an original opera-style score. Opens on SAY NO MORE. Record it in Chrome or Edge on a computer." />
      <ReelStudio
        base={{
          name: general.siteName,
          domain,
          currency: general.currency,
          price: general.monthlyPrice,
          trialDays: general.trialDays,
          offer: { enabled: offer.enabled, percent: offer.percent, months: offer.months, slots: offer.slots, left: offer.left },
        }}
      />
    </div>
  );
}
