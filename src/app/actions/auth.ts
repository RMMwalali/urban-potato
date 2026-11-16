"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { getSettings } from "@/lib/platform";
import { createAdminSession } from "@/lib/admin-auth";
import { COUNTRIES, KENYA_COUNTIES, placeBusiness } from "@/lib/geo";
import { recordSignupEvent } from "@/lib/funnel";
import type { Prisma } from "@prisma/client";

/**
 * The very first account on the platform gets platform-admin rights (same email and password for /admin).
 * Runs at sign-up and at login, so an account created before this rule existed is promoted on its next login.
 * Does nothing once any platform admin exists.
 */
async function promoteFirstAccount(userId: string) {
  if ((await db.platformAdmin.count()) > 0) return false;
  const first = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!first || first.id !== userId) return false;
  try {
    const admin = await db.platformAdmin.create({ data: { email: first.email, name: first.name, passwordHash: first.passwordHash } });
    await db.auditLog.create({ data: { actor: first.email, action: "admin.first_account", targetType: "user", targetId: first.id } });
    await createAdminSession(admin.id);
    return true;
  } catch (e) {
    console.error("first-account admin promotion skipped:", e);
    return false;
  }
}

export type FormState = { error?: string } | undefined;

const SignupSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name"),
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  country: z.string().trim().toUpperCase().refine((c) => COUNTRIES.some((x) => x.code === c), "Choose your country"),
  region: z.string().trim().min(2, "Enter your county or region").max(80),
  city: z.string().trim().min(2, "Enter your town or area").max(80),
  address: z.string().trim().max(160).optional(),
}).refine((d) => d.country !== "KE" || KENYA_COUNTIES.some((c) => c.name === d.region), { message: "Choose your county", path: ["region"] });

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const raw = Object.fromEntries(fd) as Record<string, string>;
  const tz = String(fd.get("tz") ?? "") || null;
  const fail = async (error: string) => {
    await recordSignupEvent({ stage: "attempt", email: raw.email, businessName: raw.businessName, error, timezone: tz });
    return { error };
  };
  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { businessName, name, email, password, country, region, city, address } = parsed.data;

  const settings = await getSettings();
  if (!settings.general.signupEnabled) return fail("New sign-ups are paused right now. Please contact us.");

  let user;
  let net;
  try {
    if (await db.user.findUnique({ where: { email } })) return fail("An account with this email already exists");
    const base = slugify(businessName) || "salon";
    let slug = base;
    for (let i = 2; await db.business.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
    const trialEndsAt = new Date(Date.now() + settings.general.trialDays * 86400_000);
    const passwordHash = await hashPassword(password);
    net = await recordSignupEvent({ stage: "attempt", email, businessName, timezone: tz });
    const place = placeBusiness({ country, region }, net);
    const location = { country, region, city, address: address || null, ...place, signupGeo: net as Prisma.InputJsonValue };
    user = await db.$transaction(async (tx) => {
      const business = await tx.business.create({ data: { name: businessName, slug, email, trialEndsAt, ...location } });
      return tx.user.create({ data: { businessId: business.id, name, email, passwordHash, role: "OWNER", title: "Owner", color: "#ec4899" } });
    });
  } catch (e) {
    console.error("signup failed (database):", e);
    return { error: "We couldn't create your account right now (database unavailable). Please try again shortly." };
  }
  await recordSignupEvent({ stage: "created", email, businessName, businessId: user.businessId, timezone: tz });
  // came from an outreach message: move that lead to "on trial" (or match by email)
  try {
    const { linkLeadToSignup } = await import("@/lib/leads");
    const ref = String(fd.get("ref") ?? "");
    if (ref) await linkLeadToSignup(ref, user.businessId);
    else {
      const byEmail = await db.lead.findFirst({ where: { email, businessId: null } });
      if (byEmail) await linkLeadToSignup(`lead_${byEmail.id}`, user.businessId);
    }
  } catch (e) { console.error("lead link failed:", (e as Error).message); }

  try {
    await createSession({ userId: user.id, businessId: user.businessId, role: user.role });
    await promoteFirstAccount(user.id);
  } catch (e) {
    console.error("signup failed (session):", e);
    return { error: "Your account was created, but signing in failed because the server isn't fully configured. Please contact support." };
  }
  redirect("/app");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } }).catch((e) => {
    console.error("login failed (database):", e);
    return undefined;
  });
  if (user === undefined) return { error: "We can't reach the database right now. Please try again shortly." };
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash)))
    return { error: "Incorrect email or password" };
  try {
    await createSession({ userId: user.id, businessId: user.businessId, role: user.role });
    await promoteFirstAccount(user.id);
  } catch (e) {
    console.error("login failed (session):", e);
    return { error: "Signing in failed because the server isn't fully configured. Please contact support." };
  }
  redirect("/app");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

/** Product tour finished or skipped; don't auto-start it again. */
export async function finishTour() {
  const s = await getSession();
  if (!s) return;
  await db.user.updateMany({ where: { id: s.userId, businessId: s.businessId }, data: { tourDoneAt: new Date() } });
}
