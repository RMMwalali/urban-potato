"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { MANAGERS, requireUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-auth";

export type ReviewState = { error?: string; done?: { rating: number } } | undefined;
const R = z.object({
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  body: z.string().trim().min(10, "Tell us a little more (at least a sentence)").max(800),
  authorName: z.string().trim().min(2, "Add your name").max(80),
  authorRole: z.string().trim().max(60).optional(),
});

export async function submitReview(_: ReviewState, fd: FormData): Promise<ReviewState> {
  const user = await requireUser(MANAGERS, { allowLocked: true });
  const p = R.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const b = user.business;
  const data = { ...p.data, authorRole: p.data.authorRole || null, consent: fd.get("consent") === "on", salonName: b.name, city: b.city, userId: user.id, status: "PENDING", approvedAt: null };
  await db.review.upsert({ where: { businessId: b.id }, update: data, create: { ...data, businessId: b.id } });
  const { notifyAdmins } = await import("@/lib/admin-notify");
  await notifyAdmins(`New review: ${p.data.rating}/5 from ${b.name}`);
  revalidatePath("/app");
  return { done: { rating: p.data.rating } };
}

export async function setReviewStatus(id: string, status: "APPROVED" | "HIDDEN" | "PENDING") {
  await requireAdmin();
  await db.review.update({ where: { id }, data: { status, approvedAt: status === "APPROVED" ? new Date() : null } });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function deleteReview(id: string) {
  await requireAdmin();
  await db.review.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

/** In-app nudge to a salon's owners and managers (they can say no; it only appears once). */
export async function askForReview(businessId: string) {
  await requireAdmin();
  const { notify } = await import("@/lib/notify");
  await notify({ businessId, kind: "news", title: "How is Darling HQ working for you?", body: "Two minutes: rate Darling HQ and tell us what to improve. Your words help other salons decide.", url: "/app/review" });
  redirect("/admin/reviews?asked=1");
}

export async function saveGoogleReviewUrl(fd: FormData) {
  await requireAdmin();
  const url = String(fd.get("googleReviewUrl") ?? "").trim();
  if (url && !/^https:\/\//.test(url)) redirect("/admin/reviews?error=url");
  const row = await db.platformSetting.findUnique({ where: { key: "general" } });
  const { SETTING_DEFAULTS } = await import("@/lib/platform");
  const value = { ...SETTING_DEFAULTS.general, ...((row?.value ?? {}) as object), googleReviewUrl: url, homeReviewsEnabled: fd.get("homeReviewsEnabled") === "on" };
  await db.platformSetting.upsert({ where: { key: "general" }, update: { value }, create: { key: "general", value } });
  revalidatePath("/");
  redirect("/admin/reviews?saved=1");
}
