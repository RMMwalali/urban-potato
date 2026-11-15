import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/api-user";
import { audience, unreadCount } from "@/lib/notify";

export const dynamic = "force-dynamic";

// GET: latest notifications for the signed-in person (?after=ISO for only newer ones) plus the unread count.
export async function GET(req: Request) {
  const u = await apiUser();
  if (!u) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const after = new URL(req.url).searchParams.get("after");
  const since = after && !isNaN(Date.parse(after)) ? new Date(after) : null;
  const rows = await db.notification.findMany({ where: { ...audience(u), ...(since ? { createdAt: { gt: since } } : {}) }, orderBy: { createdAt: "desc" }, take: since ? 20 : 40 });
  return NextResponse.json({
    items: rows.map((r) => ({ id: r.id, kind: r.kind, title: r.title, body: r.body, url: r.url, at: r.createdAt.toISOString(), read: r.readBy.includes(u.id) })),
    unread: await unreadCount(u),
    now: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}

// POST { ids?: string[] } marks those (or all) as read.
export async function POST(req: Request) {
  const u = await apiUser();
  if (!u) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.map(String).slice(0, 200) : null;
  const rows = await db.notification.findMany({ where: { ...audience(u), ...(ids ? { id: { in: ids } } : {}), NOT: { readBy: { has: u.id } } }, select: { id: true } });
  for (const r of rows) await db.notification.update({ where: { id: r.id }, data: { readBy: { push: u.id } } });
  return NextResponse.json({ unread: await unreadCount(u) });
}
