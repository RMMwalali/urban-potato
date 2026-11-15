import "server-only";
import { cookies, headers } from "next/headers";
import { randomBytes } from "crypto";
import { db } from "./db";
import { geoFromHeaders, ipHash, type Geo } from "./geo";

export const VISITOR_COOKIE = "dl_vid";

/** Record a sign-up attempt (successful or not) with the visitor's network location. Never throws. */
export async function recordSignupEvent(data: { stage: "attempt" | "created"; email?: string; businessName?: string; error?: string; businessId?: string; timezone?: string | null }): Promise<Geo> {
  const h = await headers();
  const geo = geoFromHeaders(h);
  try {
    const jar = await cookies();
    let visitorId = jar.get(VISITOR_COOKIE)?.value;
    if (!visitorId) {
      visitorId = randomBytes(12).toString("base64url");
      jar.set(VISITOR_COOKIE, visitorId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 365 * 86400, path: "/" });
    }
    await db.signupEvent.create({
      data: {
        stage: data.stage, visitorId, ipHash: ipHash(h), ...geo,
        email: data.email?.slice(0, 200) || null, businessName: data.businessName?.slice(0, 120) || null,
        error: data.error?.slice(0, 200) || null, businessId: data.businessId ?? null,
        timezone: data.timezone?.slice(0, 60) || null, language: h.get("accept-language")?.split(",")[0]?.slice(0, 35) || null,
      },
    });
  } catch (e) {
    console.error("signup event not recorded:", (e as Error).message);
  }
  return geo;
}
