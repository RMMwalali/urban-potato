import { db } from "@/lib/db";
import { MANAGERS, requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/platform";
import { PageHeader } from "@/components/ui";
import { ReviewForm } from "@/components/ReviewForm";

export const metadata = { title: "Rate Laazizi" };

export default async function ReviewPage() {
  const user = await requireUser(MANAGERS, { allowLocked: true });
  const [{ general }, existing] = await Promise.all([getSettings(), db.review.findUnique({ where: { businessId: user.businessId } })]);
  return (
    <div>
      <PageHeader title="Rate Laazizi" label="Feedback" sub="Honest feedback helps us improve, and helps other salon owners decide. It takes two minutes." />
      {existing && <p className="mb-8 max-w-xl border-l-2 border-ink bg-panel px-4 py-3 text-[14px]">You reviewed Laazizi on {existing.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}. You can update it here.</p>}
      <ReviewForm initial={existing} name={user.name.split(" ")[0]} googleUrl={general.googleReviewUrl} />
    </div>
  );
}
