import "server-only";
import { db } from "./db";
import { getSession } from "./auth";

/** The signed-in salon user for API routes (null if not signed in or deactivated). */
export async function apiUser() {
  const s = await getSession();
  if (!s) return null;
  return db.user.findFirst({ where: { id: s.userId, businessId: s.businessId, active: true }, select: { id: true, businessId: true, role: true, name: true, notifyMuted: true } });
}
