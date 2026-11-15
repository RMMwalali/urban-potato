"use server";
import { randomBytes } from "crypto";
import { DateTime } from "luxon";
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
export type FilmVars = { slug: string; manage: string; mpesaCode: string; depositCode: string; finCode: string; smsCode: string; checkoutAppt: string; freeDate: string; smsDate: string; stamp: string };

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
  // Undo what earlier takes added, so every take starts from the same place.
  // (seeded bookings are dated before the salon was created; anything newer was made by a take)
  await Promise.allSettled([
    db.appointment.deleteMany({ where: { businessId: s.id, createdAt: { gt: s.createdAt } } }),
    db.mpesaTransaction.deleteMany({ where: { businessId: s.id, createdAt: { gt: s.createdAt }, claimedAt: null, payment: null } }),
    db.user.deleteMany({ where: { businessId: s.id, email: { startsWith: "faith." }, role: "STAFF" } }),
    db.service.deleteMany({ where: { businessId: s.id, name: "Knotless braids", appointments: { none: {} } } }),
    db.payRun.deleteMany({ where: { businessId: s.id, note: "November pay" } }),
    db.staffAdvance.deleteMany({ where: { businessId: s.id, note: "Transport" } }),
  ]);
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  // shaped like real M-Pesa codes: 10 characters, letters and digits mixed
  const code = () => {
    const c = [...randomBytes(8)].map((x) => A[x % A.length]);
    c[2] = String(2 + (randomBytes(1)[0] % 8)); c[6] = String(2 + (randomBytes(1)[0] % 8));
    return "TK" + c.join("");
  };
  const [mpesaCode, depositCode, finCode, smsCode] = [code(), code(), code(), code()];
  const ago = (m: number) => new Date(Date.now() - m * 60_000);
  await db.mpesaTransaction.createMany({
    data: [
      { businessId: s.id, code: mpesaCode, amount: 3500, payerName: SHOWCASE_MPESA_PAYER, phone: "2547******101", source: "C2B", transTime: ago(4) },
      { businessId: s.id, code: depositCode, amount: 600, payerName: "NAOMI WANGARI", phone: "2547******113", source: "C2B", transTime: ago(1) },
      { businessId: s.id, code: finCode, amount: 1200, payerName: "GRACE AKINYI", phone: "2547******103", source: "C2B", transTime: ago(25) },
    ],
  });
  // Settings the demos change are put back first, so every take starts from the same place.
  await db.business.update({ where: { id: s.id }, data: { depositPercent: 0, messageChannel: "SMS", reminderHours: 12 } });
  const next = await db.appointment.findFirst({ where: { businessId: s.id, startAt: { gt: new Date(Date.now() + 24 * 3600_000) }, status: { in: ["BOOKED", "CONFIRMED"] } }, orderBy: { startAt: "asc" }, select: { manageToken: true } });
  // A client sitting in the chair right now, ready to check out (Box braids, matching the M-Pesa payment).
  const now = DateTime.now().setZone(s.timezone);
  const startAt = DateTime.max(now.startOf("day").set({ hour: 8 }), DateTime.min(now.minus({ minutes: 40 }), now.startOf("day").set({ hour: 21 }))).startOf("minute");
  const [client, service, stylist] = await Promise.all([
    db.client.findFirst({ where: { businessId: s.id, name: "Jane Wambui" } }),
    db.service.findFirst({ where: { businessId: s.id, name: "Box braids" } }),
    db.user.findFirst({ where: { businessId: s.id, name: "Wanjiru Njeri" } }),
  ]);
  let checkoutAppt = "";
  if (client && service) {
    const a = await db.appointment.create({
      data: { businessId: s.id, clientId: client.id, serviceId: service.id, staffId: stylist?.id, startAt: startAt.toJSDate(), endAt: startAt.plus({ minutes: service.durationMin }).toJSDate(), status: "ARRIVED", source: "INSTAGRAM", price: service.price, reminderSentAt: startAt.minus({ hours: 24 }).toJSDate() },
    });
    checkoutAppt = a.id;
  }
  return { slug: s.slug, manage: next?.manageToken ?? "", mpesaCode, depositCode, finCode, smsCode, checkoutAppt, freeDate: now.plus({ days: 9 }).toISODate()!, smsDate: now.toFormat("d/L/yy 'at' h:mm a"), stamp: Date.now().toString(36) };
}

export async function stopFilming() {
  await requireAdmin();
  const jar = await cookies();
  const prev = jar.get(PREV)?.value;
  if (prev) jar.set(SESSION_COOKIE, prev, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  else jar.delete(SESSION_COOKIE);
  jar.delete(PREV);
}
