import "server-only";
import webpush from "web-push";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { decrypt, encrypt } from "./crypto";
import { appUrl } from "./url";

export const KINDS = {
  booking: { label: "New online bookings", tone: "booking" },
  rescheduled: { label: "Clients rescheduling", tone: "rescheduled" },
  cancelled: { label: "Clients cancelling", tone: "cancelled" },
  payment: { label: "M-Pesa payments received", tone: "payment" },
  deposit: { label: "Deposits paid", tone: "payment" },
  alert: { label: "Problems (e.g. a reminder failed to send)", tone: "alert" },
  news: { label: "Messages from the Laazizi team", tone: "booking" },
} as const;
export type Kind = keyof typeof KINDS | "test";

/* ---------- VAPID keys ----------
 * In order: keys saved in Admin → Platform → Connections, then the server environment, then a pair
 * generated automatically on first use and kept (encrypted) in the database. Cached for a minute so a
 * rotation reaches every server instance quickly. */
let cached: { at: number; keys: { publicKey: string; privateKey: string; source: "admin" | "env" | "auto" } } | null = null;
export async function vapidKeys() {
  if (cached && Date.now() - cached.at < 60_000) return cached.keys;
  const { getCredential } = await import("./platform");
  const [pub, priv] = await Promise.all([getCredential("VAPID_PUBLIC_KEY"), getCredential("VAPID_PRIVATE_KEY")]);
  let keys: { publicKey: string; privateKey: string; source: "admin" | "env" | "auto" };
  if (pub && priv) {
    const fromAdmin = !!(await db.apiCredential.findFirst({ where: { name: "VAPID_PUBLIC_KEY" }, select: { id: true } }));
    keys = { publicKey: pub, privateKey: priv, source: fromAdmin ? "admin" : "env" };
  } else {
    const row = await db.platformSetting.findUnique({ where: { key: "vapid" } });
    const v = row?.value as { publicKey?: string; privateKeyEnc?: string } | undefined;
    if (v?.publicKey && v.privateKeyEnc) keys = { publicKey: v.publicKey, privateKey: decrypt(v.privateKeyEnc), source: "auto" };
    else {
      const k = webpush.generateVAPIDKeys();
      const value = { publicKey: k.publicKey, privateKeyEnc: encrypt(k.privateKey), createdAt: new Date().toISOString() } as Prisma.InputJsonValue;
      await db.platformSetting.upsert({ where: { key: "vapid" }, update: {}, create: { key: "vapid", value } });
      cached = null;
      return vapidKeys();
    }
  }
  cached = { at: Date.now(), keys };
  return keys;
}

/** New automatic key pair. Devices must turn notifications on again, so their old subscriptions are removed. */
export async function rotateVapidKeys() {
  const k = webpush.generateVAPIDKeys();
  const value = { publicKey: k.publicKey, privateKeyEnc: encrypt(k.privateKey), createdAt: new Date().toISOString() } as Prisma.InputJsonValue;
  await db.platformSetting.upsert({ where: { key: "vapid" }, update: { value }, create: { key: "vapid", value } });
  const removed = await db.pushSubscription.deleteMany({});
  cached = null;
  return removed.count;
}

export async function pushSubject() {
  const { getCredential } = await import("./platform");
  return (await getCredential("VAPID_SUBJECT")) || (appUrl().startsWith("https://") ? appUrl() : "https://laazizi.app");
}

/** Who should see a notification: owners and managers, plus (optionally) one specific person. */
async function recipients(businessId: string, userId?: string | null) {
  const users = await db.user.findMany({ where: { businessId, active: true, OR: [{ role: { in: ["OWNER", "MANAGER"] } }, ...(userId ? [{ id: userId }] : [])] }, select: { id: true, notifyMuted: true } });
  return users;
}

export async function unreadCount(user: { id: string; businessId: string; role: string }) {
  return db.notification.count({ where: { ...audience(user), NOT: { readBy: { has: user.id } } } });
}

/** Notifications a person can see. */
export function audience(user: { id: string; businessId: string; role: string }): Prisma.NotificationWhereInput {
  const manager = user.role === "OWNER" || user.role === "MANAGER";
  return { businessId: user.businessId, OR: [{ userId: user.id }, ...(manager ? [{ userId: null }] : [])] };
}

/**
 * Record a notification and push it to the devices of everyone who should get it.
 * Never throws: a notification problem must not break a booking or a payment.
 */
export async function notify(n: { businessId: string; kind: Kind; title: string; body: string; url?: string; forUserId?: string | null; onlyUser?: boolean }) {
  try {
    const row = await db.notification.create({ data: { businessId: n.businessId, kind: n.kind, title: n.title.slice(0, 120), body: n.body.slice(0, 300), url: n.url ?? null, userId: n.onlyUser ? n.forUserId ?? null : null } });
    const people = n.onlyUser && n.forUserId ? [{ id: n.forUserId, notifyMuted: [] as string[] }] : await recipients(n.businessId, n.forUserId);
    // a booking for a stylist who isn't a manager: give them their own copy
    if (!n.onlyUser && n.forUserId) {
      const stylist = await db.user.findFirst({ where: { id: n.forUserId, businessId: n.businessId, role: "STAFF" }, select: { id: true } });
      if (stylist) await db.notification.create({ data: { businessId: n.businessId, kind: n.kind, title: row.title, body: row.body, url: row.url, userId: stylist.id } });
    }
    const targets = people.filter((p) => !p.notifyMuted.includes(n.kind));
    if (targets.length) await push(targets.map((t) => t.id), { kind: n.kind, title: row.title, body: row.body, url: row.url ?? "/app/notifications", id: row.id });
    return row;
  } catch (e) {
    console.error("notify failed:", (e as Error).message);
    return null;
  }
}

/** Send a Web Push message to every device of these people. Expired subscriptions are removed. */
export async function push(userIds: string[], payload: { kind: string; title: string; body: string; url: string; id: string }) {
  const subs = await db.pushSubscription.findMany({ where: { userId: { in: userIds } }, include: { user: { select: { id: true, businessId: true, role: true } } } });
  if (!subs.length) return { sent: 0, failed: 0 };
  const keys = await vapidKeys();
  const contact = await pushSubject();
  let sent = 0, failed = 0;
  await Promise.all(subs.map(async (s) => {
    const badge = await unreadCount(s.user).catch(() => 0);
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ ...payload, badge, tag: payload.id }),
        { vapidDetails: { subject: contact, publicKey: keys.publicKey, privateKey: keys.privateKey }, TTL: 6 * 3600, urgency: payload.kind === "payment" || payload.kind === "booking" ? "high" : "normal" },
      );
      sent++;
      await db.pushSubscription.update({ where: { id: s.id }, data: { lastOkAt: new Date() } }).catch(() => {});
    } catch (e) {
      failed++;
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
      else console.error("push failed:", code, (e as Error).message);
    }
  }));
  return { sent, failed };
}
