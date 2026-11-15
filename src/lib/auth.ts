import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";
import type { Role } from "@prisma/client";
import { accessState } from "./platform";
import { authSecret } from "./secrets";

const COOKIE = "spadesk_session";
export const SESSION_COOKIE = COOKIE;
const secret = () => new TextEncoder().encode(authSecret());

export type Session = { userId: string; businessId: string; role: Role };

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function createSession(s: Session) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: payload.userId as string, businessId: payload.businessId as string, role: payload.role as Role };
  } catch {
    return null;
  }
}

/** Use in every protected page/action. Returns the signed-in user with their business (tenant). */
export async function requireUser(roles?: Role[], opts?: { allowLocked?: boolean }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const user = await db.user.findFirst({
    where: { id: s.userId, businessId: s.businessId, active: true },
    include: { business: true },
  });
  if (!user) redirect("/login");
  // Trial ended / suspended salons can only reach the billing page.
  if (!opts?.allowLocked && !accessState(user.business).ok) redirect("/app/billing");
  if (roles && !roles.includes(user.role)) redirect("/app?denied=1");
  return user;
}

export const MANAGERS: Role[] = ["OWNER", "MANAGER"];
