"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, MANAGERS, requireUser } from "@/lib/auth";
import { normalizePhone, slugify } from "@/lib/format";
import { sendMessage } from "@/lib/messaging";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;

/* ---------- Clients ---------- */

export async function saveClient(fd: FormData) {
  const user = await requireUser();
  const b = user.business;
  const id = opt(fd, "id");
  const data = {
    name: str(fd, "name"),
    phone: normalizePhone(str(fd, "phone"), b.countryCode),
    email: opt(fd, "email"),
    birthday: opt(fd, "birthday") ? new Date(str(fd, "birthday")) : null,
    allergies: opt(fd, "allergies"),
    preferences: opt(fd, "preferences"),
    notes: opt(fd, "notes"),
    marketingOk: fd.get("marketingOk") === "on",
  };
  if (!data.name || data.phone.length < 9) throw new Error("Name and a valid phone are required");
  const dup = await db.client.findFirst({ where: { businessId: b.id, phone: data.phone, ...(id ? { id: { not: id } } : {}) } });
  if (dup) redirect(`/app/clients/${dup.id}?duplicate=1`);
  let clientId = id;
  if (id) {
    const r = await db.client.updateMany({ where: { id, businessId: b.id }, data });
    if (!r.count) throw new Error("Client not found");
  } else {
    clientId = (await db.client.create({ data: { ...data, businessId: b.id } })).id;
  }
  revalidatePath("/app/clients");
  redirect(`/app/clients/${clientId}`);
}

export async function messageClient(fd: FormData) {
  const user = await requireUser();
  const c = await db.client.findFirst({ where: { id: str(fd, "clientId"), businessId: user.businessId } });
  const body = str(fd, "body");
  if (!c || !body) return;
  await sendMessage({ business: user.business, to: c.phone, body, kind: "CUSTOM", clientId: c.id });
  revalidatePath(`/app/clients/${c.id}`);
}

/* ---------- Services ---------- */

const ServiceSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1).default("General"),
  durationMin: z.coerce.number().int().min(5).max(600),
  price: z.coerce.number().min(0),
  description: z.string().trim().optional(),
});

export async function saveService(fd: FormData) {
  const user = await requireUser(MANAGERS);
  const p = ServiceSchema.parse(Object.fromEntries(fd));
  const data = { ...p, description: p.description || null, onlineBooking: fd.get("onlineBooking") === "on", active: fd.get("active") !== "off" };
  const id = opt(fd, "id");
  if (id) await db.service.updateMany({ where: { id, businessId: user.businessId }, data });
  else await db.service.create({ data: { ...data, businessId: user.businessId } });
  revalidatePath("/app/services");
}

export async function toggleService(id: string) {
  const user = await requireUser(MANAGERS);
  const s = await db.service.findFirst({ where: { id, businessId: user.businessId } });
  if (s) await db.service.update({ where: { id }, data: { active: !s.active } });
  revalidatePath("/app/services");
}

/* ---------- Staff ---------- */

const COLORS = ["#c084fc", "#f472b6", "#60a5fa", "#34d399", "#fbbf24", "#fb7185", "#22d3ee", "#a3e635"];

export async function saveStaff(fd: FormData) {
  const user = await requireUser(MANAGERS);
  const id = opt(fd, "id");
  const role = str(fd, "role") as "OWNER" | "MANAGER" | "STAFF";
  if (role === "OWNER" && user.role !== "OWNER") throw new Error("Only owners can create owners");
  const data = {
    name: str(fd, "name"),
    email: str(fd, "email").toLowerCase(),
    phone: opt(fd, "phone") ? normalizePhone(str(fd, "phone"), user.business.countryCode) : null,
    title: opt(fd, "title"),
    role: ["OWNER", "MANAGER", "STAFF"].includes(role) ? role : "STAFF",
    commissionRate: Number(str(fd, "commissionRate") || 0),
    bookable: fd.get("bookable") === "on",
  };
  if (!data.name || !data.email) throw new Error("Name and email are required");
  const pw = str(fd, "password");
  const serviceIds = fd.getAll("serviceIds").map(String);
  const owned = await db.service.findMany({ where: { id: { in: serviceIds }, businessId: user.businessId }, select: { id: true } });
  const services = owned.map((s) => ({ id: s.id }));
  if (id) {
    const target = await db.user.findFirst({ where: { id, businessId: user.businessId } });
    if (!target) throw new Error("Not found");
    if (target.role === "OWNER" && user.role !== "OWNER") throw new Error("Only owners can edit owners");
    await db.user.update({ where: { id }, data: { ...data, services: { set: services }, ...(pw ? { passwordHash: await hashPassword(pw) } : {}) } });
  } else {
    if (pw.length < 8) throw new Error("Password must be at least 8 characters");
    const count = await db.user.count({ where: { businessId: user.businessId } });
    await db.user.create({
      data: { ...data, businessId: user.businessId, passwordHash: await hashPassword(pw), color: COLORS[count % COLORS.length], services: { connect: services } },
    });
  }
  revalidatePath("/app/staff");
  redirect("/app/staff");
}

export async function toggleStaff(id: string) {
  const user = await requireUser(MANAGERS);
  if (id === user.id) return;
  const s = await db.user.findFirst({ where: { id, businessId: user.businessId } });
  if (!s || (s.role === "OWNER" && user.role !== "OWNER")) return;
  await db.user.update({ where: { id }, data: { active: !s.active } });
  revalidatePath("/app/staff");
}

/* ---------- Settings ---------- */

export async function saveSettings(fd: FormData) {
  const user = await requireUser(MANAGERS);
  const slug = slugify(str(fd, "slug")) || user.business.slug;
  const taken = await db.business.findFirst({ where: { slug, id: { not: user.businessId } } });
  if (taken) redirect("/app/settings?error=slug");
  await db.business.update({
    where: { id: user.businessId },
    data: {
      name: str(fd, "name"),
      slug,
      phone: opt(fd, "phone"),
      email: opt(fd, "email"),
      address: opt(fd, "address"),
      currency: str(fd, "currency") || "KES",
      timezone: str(fd, "timezone") || "Africa/Nairobi",
      countryCode: str(fd, "countryCode").replace(/\D/g, "") || "254",
      openTime: str(fd, "openTime"),
      closeTime: str(fd, "closeTime"),
      openDays: fd.getAll("openDays").map(Number),
      slotMinutes: Number(str(fd, "slotMinutes")) || 15,
      reminderHours: Number(str(fd, "reminderHours")) || 24,
      bookingEnabled: fd.get("bookingEnabled") === "on",
      messageChannel: str(fd, "messageChannel") === "WHATSAPP" ? "WHATSAPP" : "SMS",
      mpesaType: ["TILL", "PAYBILL", "POCHI", "PHONE"].includes(str(fd, "mpesaType")) ? str(fd, "mpesaType") : null,
      mpesaNumber: opt(fd, "mpesaNumber"),
      mpesaAccount: opt(fd, "mpesaAccount"),
      depositPercent: Math.max(0, Math.min(100, Number(str(fd, "depositPercent")) || 0)),
      cancelPolicyHours: Math.max(0, Number(str(fd, "cancelPolicyHours")) || 0),
      cancelPolicyText: opt(fd, "cancelPolicyText"),
      bufferMinutes: Math.max(0, Math.min(120, Number(str(fd, "bufferMinutes")) || 0)),
    },
  });
  revalidatePath("/app", "layout");
  redirect("/app/settings?saved=1");
}

export async function addServiceTemplate(key: string) {
  const user = await requireUser(MANAGERS);
  const { SERVICE_TEMPLATES } = await import("@/lib/templates");
  const t = SERVICE_TEMPLATES[key];
  if (!t) return;
  const existing = new Set((await db.service.findMany({ where: { businessId: user.businessId }, select: { name: true } })).map((s) => s.name.toLowerCase()));
  await db.service.createMany({
    data: t.items.filter(([n]) => !existing.has(n.toLowerCase())).map(([name, durationMin, price]) => ({ businessId: user.businessId, name, durationMin, price, category: t.label })),
  });
  revalidatePath("/app/services");
}
