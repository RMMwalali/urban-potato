import "server-only";
// Admins aren't salon users, so admin-facing alerts go to the audit log, which Admin → Platform shows.
import { db } from "./db";
export async function notifyAdmins(text: string) {
  await db.auditLog.create({ data: { actor: "system", action: "review.new", targetType: "review", targetId: null, details: { text } } }).catch(() => {});
}
