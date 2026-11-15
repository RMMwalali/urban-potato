"use server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { createShowcase, deleteShowcase, findShowcase, SHOWCASE_MPESA_PAYER } from "@/lib/showcase";

const PREV = "dl_prev_session";

async function audit(actor: string, action: string, id?: string) {
  await db.auditLog.create({ data: { actor, action, targetType: "business", targetId: id ?? null } }).catch(() => {});
}

export async function prepareShowcase() {
  const a = await requireAdmin();
  const s = (await findShowcase()) ?? (await createShowcase()).business;
  await audit(a.email, "showcase.prepare", s.id);
  revalidatePath("/admin/reel");
}

export async function resetShowcase() {
  const a = await requireAdmin();
  const { business } = await createShowcase();
  await audit(a.email, "showcase.reset", business.id);
  revalidatePath("/admin/reel");
}

export async function removeShowcase() {
  const a = await requireAdmin();
  await deleteShowcase();
  await audit(a.email, "showcase.delete");
  revalidatePath("/admin/reel");
}

/**
 * Sign this browser into the showcase salon so the studio's iframe shows its real screens.
 * Your own salon session (if any) is kept aside and restored by stopFilming().
 */
export type FilmVars = { slug: string; manage: string; mpesaCode: string };

export async function startFilming(): Promise<FilmVars | { error: string }> {
  await requireAdmin();
  let s = await findShowcase();
  if (!s) {
    await createShowcase();
    s = await findShowcase();
  }
  const owner = s?.users[0];
  if (!s || !owner) return { error: "Couldn't prepare the showcase salon." };
  const jar = await cookies();
  const current = jar.get(SESSION_COOKIE)?.value;
  if (current && !jar.get(PREV)) jar.set(PREV, current, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 6 });
  await createSession({ userId: owner.id, businessId: s.id, role: "OWNER" });
  // Fresh props for this take: an unclaimed Safaricom-confirmed payment, and an upcoming booking's self-service link.
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const mpesaCode = "TK" + [...randomBytes(8)].map((x) => A[x % A.length]).join("");
  await db.mpesaTransaction.create({ data: { businessId: s.id, code: mpesaCode, amount: 3500, payerName: SHOWCASE_MPESA_PAYER, phone: "2547******101", source: "C2B", transTime: new Date(Date.now() - 4 * 60_000) } });
  const next = await db.appointment.findFirst({ where: { businessId: s.id, startAt: { gt: new Date(Date.now() + 24 * 3600_000) }, status: { in: ["BOOKED", "CONFIRMED"] } }, orderBy: { startAt: "asc" }, select: { manageToken: true } });
  return { slug: s.slug, manage: next?.manageToken ?? "", mpesaCode };
}

export async function stopFilming() {
  await requireAdmin();
  const jar = await cookies();
  const prev = jar.get(PREV)?.value;
  if (prev) jar.set(SESSION_COOKIE, prev, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  else jar.delete(SESSION_COOKIE);
  jar.delete(PREV);
}
