"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, createAdminSession, destroyAdminSession, requireAdmin } from "@/lib/admin-auth";
import { createSession } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { getSettings, PROVIDERS, SETTING_DEFAULTS } from "@/lib/platform";
import { grantFoundingIfEligible, setFounding } from "@/lib/offer";
import type { BusinessStatus, Prisma } from "@prisma/client";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export type AdminState = { error?: string; ok?: string } | undefined;

/* ---------- Auth ---------- */

export async function adminLogin(_: AdminState, fd: FormData): Promise<AdminState> {
  const email = str(fd, "email").toLowerCase();
  const admin = await db.platformAdmin.findUnique({ where: { email } });
  if (!admin || !(await bcrypt.compare(String(fd.get("password") ?? ""), admin.passwordHash))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return { error: "Incorrect email or password" };
  }
  await db.platformAdmin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await createAdminSession(admin.id);
  await audit(admin.email, "admin.login");
  redirect("/admin");
}

export async function adminLogout() {
  await destroyAdminSession();
  redirect("/admin/login");
}

/* ---------- Businesses & trials ---------- */

export async function resetTrial(businessId: string) {
  const a = await requireAdmin();
  const { general } = await getSettings();
  const trialEndsAt = new Date(Date.now() + general.trialDays * 86400_000);
  await db.business.update({ where: { id: businessId }, data: { status: "TRIAL", trialEndsAt } });
  await audit(a.email, "trial.reset", { type: "business", id: businessId }, { days: general.trialDays });
  revalidatePath("/admin", "layout");
}

export async function extendTrial(fd: FormData) {
  const a = await requireAdmin();
  const id = str(fd, "businessId");
  const days = Math.max(1, Math.min(365, Number(str(fd, "days")) || 7));
  const b = await db.business.findUniqueOrThrow({ where: { id } });
  const from = Math.max(Date.now(), b.trialEndsAt.getTime());
  await db.business.update({ where: { id }, data: { status: "TRIAL", trialEndsAt: new Date(from + days * 86400_000) } });
  await audit(a.email, "trial.extend", { type: "business", id }, { days });
  revalidatePath("/admin", "layout");
}

export async function setBusinessStatus(fd: FormData) {
  const a = await requireAdmin();
  const id = str(fd, "businessId");
  const status = str(fd, "status") as BusinessStatus;
  if (!["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"].includes(status)) return;
  const plan = ["monthly", "annual", "lifetime"].includes(str(fd, "plan")) ? str(fd, "plan") : "monthly";
  const qty = Math.max(1, Number(str(fd, "qty")) || 1); // months (monthly) or years (annual)
  const data: Prisma.BusinessUpdateInput = { status };
  if (status === "ACTIVE") {
    data.plan = plan;
    const b = await db.business.findUniqueOrThrow({ where: { id } });
    // extend from the later of today or the current paid-until date, so renewals stack
    const from = b.paidUntil && b.paidUntil > new Date() ? new Date(b.paidUntil) : new Date();
    if (plan === "lifetime") data.paidUntil = null;
    else { from.setMonth(from.getMonth() + (plan === "annual" ? 12 * qty : qty)); data.paidUntil = from; }
  }
  const months = plan === "annual" ? 12 * qty : plan === "lifetime" ? 0 : qty;
  await db.business.update({ where: { id }, data });
  const founding = status === "ACTIVE" && plan !== "lifetime" ? await grantFoundingIfEligible(id) : false;
  await audit(a.email, "business.status", { type: "business", id }, { status, ...(status === "ACTIVE" ? { plan, months } : {}), ...(founding ? { foundingOffer: "granted" } : {}) });
  revalidatePath("/admin", "layout");
  if (status === "ACTIVE") await db.lead.updateMany({ where: { businessId: id, status: { not: "PAYING" } }, data: { status: "PAYING" } }).catch(() => {});
}

export async function toggleFounding(businessId: string, on: boolean) {
  const a = await requireAdmin();
  await setFounding(businessId, on);
  await audit(a.email, on ? "founding.grant" : "founding.remove", { type: "business", id: businessId });
  revalidatePath("/admin", "layout");
}

export async function saveBusinessNotes(fd: FormData) {
  const a = await requireAdmin();
  const id = str(fd, "businessId");
  await db.business.update({ where: { id }, data: { adminNotes: str(fd, "adminNotes") || null } });
  await audit(a.email, "business.notes", { type: "business", id });
  revalidatePath(`/admin/businesses/${id}`);
}

export async function deleteBusiness(fd: FormData) {
  const a = await requireAdmin();
  const id = str(fd, "businessId");
  const b = await db.business.findUniqueOrThrow({ where: { id } });
  if (str(fd, "confirm") !== b.slug) redirect(`/admin/businesses/${id}?error=confirm`);
  await db.business.delete({ where: { id } });
  await audit(a.email, "business.delete", { type: "business", id }, { name: b.name, slug: b.slug });
  redirect("/admin/businesses?deleted=1");
}

/** Support: open the salon dashboard as its owner (audited). */
export async function impersonate(businessId: string) {
  const a = await requireAdmin();
  const owner = await db.user.findFirst({ where: { businessId, role: "OWNER", active: true }, orderBy: { createdAt: "asc" } });
  if (!owner) redirect(`/admin/businesses/${businessId}?error=noowner`);
  await createSession({ userId: owner.id, businessId, role: owner.role });
  await audit(a.email, "business.impersonate", { type: "business", id: businessId }, { userId: owner.id });
  redirect("/app");
}

/* ---------- Users ---------- */

export async function adminSetUserPassword(_: AdminState, fd: FormData): Promise<AdminState> {
  const a = await requireAdmin();
  const id = str(fd, "userId");
  const pw = String(fd.get("password") ?? "");
  if (pw.length < 8) return { error: "Password must be at least 8 characters" };
  await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(pw, 10) } });
  await audit(a.email, "user.password_reset", { type: "user", id });
  return { ok: "Password updated. Share it with the user securely." };
}

export async function adminToggleUser(id: string) {
  const a = await requireAdmin();
  const u = await db.user.findUniqueOrThrow({ where: { id } });
  await db.user.update({ where: { id }, data: { active: !u.active } });
  await audit(a.email, u.active ? "user.disable" : "user.enable", { type: "user", id });
  revalidatePath("/admin", "layout");
}

export async function adminSetRole(fd: FormData) {
  const a = await requireAdmin();
  const id = str(fd, "userId");
  const role = str(fd, "role");
  if (!["OWNER", "MANAGER", "STAFF"].includes(role)) return;
  await db.user.update({ where: { id }, data: { role: role as "OWNER" } });
  await audit(a.email, "user.role", { type: "user", id }, { role });
  revalidatePath("/admin", "layout");
}

/* ---------- API credentials ---------- */

export async function saveCredential(fd: FormData) {
  const a = await requireAdmin();
  const provider = str(fd, "provider") as keyof typeof PROVIDERS;
  const name = str(fd, "name");
  const value = String(fd.get("value") ?? "").trim();
  if (!PROVIDERS[provider] || !(PROVIDERS[provider].fields as readonly string[]).includes(name) || !value) return;
  const last4 = value.length > 8 ? value.slice(-4) : "••••";
  await db.apiCredential.upsert({
    where: { provider_name: { provider, name } },
    update: { encValue: encrypt(value), last4 },
    create: { provider, name, encValue: encrypt(value), last4 },
  });
  await audit(a.email, "credential.set", { type: "credential", id: `${provider}:${name}` });
  revalidatePath("/admin/api-keys");
}

export async function deleteCredential(id: string) {
  const a = await requireAdmin();
  const c = await db.apiCredential.delete({ where: { id } });
  await audit(a.email, "credential.delete", { type: "credential", id: `${c.provider}:${c.name}` });
  revalidatePath("/admin/api-keys");
}

/* ---------- Settings & SEO ---------- */

export async function saveSettingsGroup(fd: FormData) {
  const a = await requireAdmin();
  const group = str(fd, "group") as keyof typeof SETTING_DEFAULTS;
  const defaults = SETTING_DEFAULTS[group];
  if (!defaults) return;
  const value: Record<string, unknown> = {};
  for (const [k, def] of Object.entries(defaults)) {
    if (typeof def === "boolean") value[k] = fd.get(k) === "on";
    else if (typeof def === "number") value[k] = Number(str(fd, k)) || def;
    else value[k] = str(fd, k);
  }
  if (group === "general") {
    value.trialDays = Math.max(1, Math.min(90, Number(value.trialDays)));
    // allow 0 places / 0% explicitly (the generic number parser treats 0 as "use default")
    for (const k of ["foundingSlots", "foundingPercent", "foundingMonths", "lifetimeLimit"]) if (str(fd, k) === "0") value[k] = 0;
    value.foundingPercent = Math.max(0, Math.min(100, Number(value.foundingPercent)));
  }
  await db.platformSetting.upsert({ where: { key: group }, update: { value: value as Prisma.InputJsonValue }, create: { key: group, value: value as Prisma.InputJsonValue } });
  await audit(a.email, `settings.${group}`);
  revalidatePath("/", "layout");
  redirect(`${str(fd, "back") || "/admin/settings"}?saved=1`);
}

const SeoSchema = z.object({
  path: z.string().trim().regex(/^\/[\w\-/*]*$/, "Path must start with / (use * for wildcards, e.g. /book/*)"),
  title: z.string().trim().max(70).optional(),
  description: z.string().trim().max(170).optional(),
  keywords: z.string().trim().optional(),
  ogImage: z.string().trim().url().optional().or(z.literal("")),
});

export async function saveSeoPage(_: AdminState, fd: FormData): Promise<AdminState> {
  const a = await requireAdmin();
  const p = SeoSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = { ...p.data, title: p.data.title || null, description: p.data.description || null, keywords: p.data.keywords || null, ogImage: p.data.ogImage || null, noIndex: fd.get("noIndex") === "on" };
  await db.seoPage.upsert({ where: { path: d.path }, update: d, create: d });
  await audit(a.email, "seo.page", { type: "seo", id: d.path });
  revalidatePath("/", "layout");
  return { ok: `Saved SEO for ${d.path}` };
}

export async function deleteSeoPage(id: string) {
  const a = await requireAdmin();
  const p = await db.seoPage.delete({ where: { id } });
  await audit(a.email, "seo.delete", { type: "seo", id: p.path });
  revalidatePath("/", "layout");
}

/* ---------- Admin accounts ---------- */

export async function addAdmin(_: AdminState, fd: FormData): Promise<AdminState> {
  const a = await requireAdmin();
  const email = str(fd, "email").toLowerCase();
  const pw = String(fd.get("password") ?? "");
  if (!email.includes("@") || pw.length < 12) return { error: "Enter an email and a password of 12+ characters" };
  if (await db.platformAdmin.findUnique({ where: { email } })) return { error: "That admin already exists" };
  await db.platformAdmin.create({ data: { email, name: str(fd, "name") || email, passwordHash: await bcrypt.hash(pw, 12) } });
  await audit(a.email, "admin.create", { type: "admin", id: email });
  revalidatePath("/admin/settings");
  return { ok: `Added ${email}` };
}

export async function changeOwnAdminPassword(_: AdminState, fd: FormData): Promise<AdminState> {
  const a = await requireAdmin();
  if (!(await bcrypt.compare(String(fd.get("current") ?? ""), a.passwordHash))) return { error: "Current password is wrong" };
  const pw = String(fd.get("password") ?? "");
  if (pw.length < 12) return { error: "New password must be 12+ characters" };
  await db.platformAdmin.update({ where: { id: a.id }, data: { passwordHash: await bcrypt.hash(pw, 12) } });
  await audit(a.email, "admin.password");
  return { ok: "Password changed" };
}

export async function removeAdmin(id: string) {
  const a = await requireAdmin();
  if (id === a.id) return;
  const r = await db.platformAdmin.delete({ where: { id } });
  await audit(a.email, "admin.delete", { type: "admin", id: r.email });
  revalidatePath("/admin/settings");
}

/** First-run admin creation for hosted deployments. Disabled once any admin exists. */
export async function createFirstAdmin(_: AdminState, fd: FormData): Promise<AdminState> {
  if (!process.env.ADMIN_SETUP_TOKEN || str(fd, "token") !== process.env.ADMIN_SETUP_TOKEN) return { error: "Invalid setup token" };
  if ((await db.platformAdmin.count()) > 0) return { error: "An admin already exists. Log in instead." };
  const email = str(fd, "email").toLowerCase();
  const pw = String(fd.get("password") ?? "");
  if (!email.includes("@") || pw.length < 12) return { error: "Enter an email and a password of 12+ characters" };
  const admin = await db.platformAdmin.create({ data: { email, name: str(fd, "name") || email, passwordHash: await bcrypt.hash(pw, 12) } });
  await createAdminSession(admin.id);
  await audit(email, "admin.setup");
  redirect("/admin");
}

/* ---------- Homepage: featured salons ---------- */

export async function saveHomepage(fd: FormData) {
  const a = await requireAdmin();
  // merge the two switches into the existing general settings (other keys untouched)
  const row = await db.platformSetting.findUnique({ where: { key: "general" } });
  const current = (row?.value ?? {}) as Record<string, unknown>;
  const value = { ...SETTING_DEFAULTS.general, ...current, homeServicesEnabled: fd.get("homeServicesEnabled") === "on", homeLogosEnabled: fd.get("homeLogosEnabled") === "on" };
  await db.platformSetting.upsert({ where: { key: "general" }, update: { value: value as Prisma.InputJsonValue }, create: { key: "general", value: value as Prisma.InputJsonValue } });
  // per-salon picks; only salons that agreed to be featured can be switched on
  const ids = fd.getAll("salon").map(String);
  const salons = await db.business.findMany({ where: { id: { in: ids } }, select: { id: true, featureConsent: true, logoId: true } });
  for (const s of salons) {
    await db.business.update({
      where: { id: s.id },
      data: { homeServices: s.featureConsent && fd.get(`svc_${s.id}`) === "on", homeLogo: s.featureConsent && !!s.logoId && fd.get(`logo_${s.id}`) === "on" },
    });
  }
  await audit(a.email, "homepage.save", undefined, { services: value.homeServicesEnabled, logos: value.homeLogosEnabled });
  revalidatePath("/");
  revalidatePath("/admin/homepage");
  redirect("/admin/homepage?saved=1");
}

/* ---------- Web Push keys ---------- */

export async function rotatePushKeys() {
  const a = await requireAdmin();
  const { rotateVapidKeys } = await import("@/lib/notify");
  const removed = await rotateVapidKeys();
  await audit(a.email, "push.rotate_keys", undefined, { devicesRemoved: removed });
  revalidatePath("/admin/api-keys");
  redirect("/admin/api-keys?rotated=" + removed);
}

export async function sendPushTestToAll() {
  const a = await requireAdmin();
  const { push } = await import("@/lib/notify");
  const subs = await db.pushSubscription.findMany({ select: { userId: true } });
  const r = await push([...new Set(subs.map((s) => s.userId))], { kind: "test", title: "Test from Darling", body: "Push notifications are working on this device.", url: "/app/notifications", id: `admin-test-${Date.now()}` });
  await audit(a.email, "push.test_all", undefined, r);
  redirect(`/admin/api-keys?pushed=${r.sent}&failed=${r.failed}`);
}
