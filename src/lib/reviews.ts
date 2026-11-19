import "server-only";
import type { Business } from "@prisma/client";
import { db } from "./db";

/** A salon is asked for a review once it has really used Darling HQ: a week in, or 10+ bookings. */
export async function reviewEligible(b: Pick<Business, "id" | "createdAt" | "isShowcase">) {
  if (b.isShowcase) return false;
  const existing = await db.review.findUnique({ where: { businessId: b.id }, select: { id: true } });
  if (existing) return false;
  const weekOld = Date.now() - b.createdAt.getTime() > 7 * 86400_000;
  if (weekOld) return true;
  return (await db.appointment.count({ where: { businessId: b.id } })) >= 10;
}

/** Public numbers: approved quotes to show, and the honest average across every review. */
export async function reviewStats() {
  const [all, shown] = await Promise.all([
    db.review.aggregate({ _avg: { rating: true }, _count: true }),
    db.review.findMany({ where: { status: "APPROVED", consent: true }, orderBy: [{ rating: "desc" }, { approvedAt: "desc" }], take: 12 }),
  ]);
  return { count: all._count, average: all._avg.rating ? Math.round(all._avg.rating * 10) / 10 : null, shown };
}
