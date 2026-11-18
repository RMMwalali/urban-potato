import "server-only";
import { db } from "./db";

/** Where complaints are emailed. Set in Admin → Salons → Complaints. */
export const DEFAULT_COMPLAINTS_INBOX = "darlingheadq@gmail.com";
export async function complaintsInbox() {
  const row = await db.platformSetting.findUnique({ where: { key: "complaints" } }).catch(() => null);
  return ((row?.value as { email?: string } | null)?.email || process.env.COMPLAINTS_EMAIL || DEFAULT_COMPLAINTS_INBOX).trim();
}
