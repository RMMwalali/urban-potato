import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import { authSecret } from "./secrets";

// Platform admins use a separate cookie and table from salon users.
const COOKIE = "spadesk_admin";
const secret = () => new TextEncoder().encode(`${authSecret()}::admin`);

export async function createAdminSession(adminId: string) {
  const token = await new SignJWT({ adminId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
}

export async function destroyAdminSession() {
  (await cookies()).delete(COOKIE);
}

export async function getAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return db.platformAdmin.findUnique({ where: { id: payload.adminId as string } });
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  return a;
}

export async function audit(actor: string, action: string, target?: { type: string; id: string }, details?: object) {
  const ip = (await headers()).get("x-forwarded-for") ?? undefined;
  await db.auditLog.create({
    data: { actor, action, targetType: target?.type, targetId: target?.id, details: { ...(details ?? {}), ...(ip ? { ip } : {}) } },
  });
}
