import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { geoFromHeaders, ipHash } from "@/lib/geo";
import { VISITOR_COOKIE } from "@/lib/funnel";

export const dynamic = "force-dynamic";

const clip = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

/** Called once by the sign-up page in the browser: records a visit with the network location. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const existing = req.headers.get("cookie")?.match(new RegExp(`${VISITOR_COOKIE}=([\\w-]+)`))?.[1];
  const visitorId = existing ?? randomBytes(12).toString("base64url");
  const res = NextResponse.json({ ok: true });
  if (!existing) res.cookies.set(VISITOR_COOKIE, visitorId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 365 * 86400, path: "/" });
  if (/bot|crawl|spider|preview|headless/i.test(req.headers.get("user-agent") ?? "") && !process.env.FUNNEL_COUNT_HEADLESS) return res;
  try {
    const recent = await db.signupEvent.findFirst({ where: { visitorId, stage: "visit", createdAt: { gte: new Date(Date.now() - 12 * 3600_000) } }, select: { id: true } });
    if (!recent) {
      const g = geoFromHeaders(req.headers);
      let referrer = clip(body.referrer, 300);
      if (referrer && new URL(referrer, "http://x").host === req.headers.get("host")) referrer = null; // internal navigation
      await db.signupEvent.create({
        data: { stage: "visit", visitorId, ipHash: ipHash(req.headers), ...g, timezone: clip(body.timezone, 60), language: clip(body.language, 35), referrer },
      });
    }
  } catch (e) {
    console.error("signup visit not recorded:", (e as Error).message);
  }
  return res;
}
