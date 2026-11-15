import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/api-user";

export const dynamic = "force-dynamic";

function describe(ua: string) {
  const os = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Mac OS/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Device";
  const br = /Edg\//.test(ua) ? "Edge" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /FxiOS|Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${br} on ${os}`;
}

// POST { endpoint, keys: { p256dh, auth } } — this device wants push notifications.
export async function POST(req: Request) {
  const u = await apiUser();
  if (!u) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { endpoint?: string; keys?: { p256dh?: string; auth?: string }; standalone?: boolean } | null;
  if (!b?.endpoint || !/^https:\/\//.test(b.endpoint) || !b.keys?.p256dh || !b.keys?.auth) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  const device = `${describe(req.headers.get("user-agent") ?? "")}${b.standalone ? " (app)" : ""}`;
  await db.pushSubscription.upsert({
    where: { endpoint: b.endpoint },
    update: { userId: u.id, businessId: u.businessId, p256dh: b.keys.p256dh, auth: b.keys.auth, device },
    create: { userId: u.id, businessId: u.businessId, endpoint: b.endpoint, p256dh: b.keys.p256dh, auth: b.keys.auth, device },
  });
  return NextResponse.json({ ok: true, device });
}

// DELETE { endpoint } — stop push on this device.
export async function DELETE(req: Request) {
  const u = await apiUser();
  if (!u) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (b?.endpoint) await db.pushSubscription.deleteMany({ where: { endpoint: b.endpoint, userId: u.id } });
  return NextResponse.json({ ok: true });
}
