"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { MANAGERS, requireUser } from "@/lib/auth";
import { checkUpload, readKeep, readUploads, storeUpload, syncImages } from "@/lib/media";

export type ServiceFormState = { error?: string } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const Svc = z.object({
  name: z.string().trim().min(2, "Enter the service name").max(80),
  category: z.string().trim().min(1, "Enter a category").max(40),
  description: z.string().trim().max(400).optional(),
  durationMin: z.coerce.number().int().min(5, "Duration must be at least 5 minutes").max(600, "Duration can be at most 10 hours"),
  price: z.coerce.number().min(0, "Price can't be negative"),
});
const Style = z.object({
  key: z.string().regex(/^[\w-]{1,40}$/),
  id: z.string().optional(),
  name: z.string().trim().min(1, "Give every style a name").max(60),
  price: z.union([z.literal(""), z.coerce.number().min(0)]).optional(),
  durationMin: z.union([z.literal(""), z.coerce.number().int().min(5).max(600)]).optional(),
});

/** Create or update a service with its photos (at least one) and optional styles. */
export async function saveServiceFull(_: ServiceFormState, fd: FormData): Promise<ServiceFormState> {
  const user = await requireUser(MANAGERS);
  const b = user.business;
  const p = Svc.safeParse({ name: str(fd, "name"), category: str(fd, "category") || "General", description: str(fd, "description") || undefined, durationMin: str(fd, "durationMin"), price: str(fd, "price") });
  if (!p.success) return { error: p.error.issues[0].message };

  const id = str(fd, "id") || null;
  const current = id ? await db.service.findFirst({ where: { id, businessId: b.id } }) : null;
  if (id && !current) return { error: "That service no longer exists." };

  let styles: z.infer<typeof Style>[] = [];
  try {
    const raw = JSON.parse(str(fd, "styles") || "[]");
    const parsed = z.array(Style).max(20, "Up to 20 styles per service").safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    styles = parsed.data;
  } catch { return { error: "Couldn't read the styles. Please try again." }; }

  // Photos are required: count what will remain before writing anything.
  const keep = readKeep(fd, "photos");
  const keptValid = id ? await db.media.count({ where: { id: { in: keep }, serviceId: id, styleId: null, businessId: b.id } }) : 0;
  const uploads = readUploads(fd, "photos");
  if (keptValid + uploads.length < 1) return { error: "Add at least one photo of this service." };
  for (const u of [...uploads, ...styles.flatMap((s) => readUploads(fd, `style_${s.key}`))]) {
    const bad = checkUpload(u);
    if (bad) return { error: bad };
  }

  const data = { ...p.data, description: p.data.description || null, onlineBooking: fd.get("onlineBooking") === "on" };
  const svc = current ? await db.service.update({ where: { id: current.id }, data }) : await db.service.create({ data: { ...data, businessId: b.id } });
  const where = [b.city, b.region].filter(Boolean)[0];
  const alt = (style?: string) => `${svc.name}${style ? ` (${style})` : ""} at ${b.name}${where ? `, ${where}` : ""}`;
  await syncImages(fd, "photos", { businessId: b.id, serviceId: svc.id, styleId: null, alt: alt() });

  const before = await db.serviceStyle.findMany({ where: { serviceId: svc.id }, select: { id: true } });
  const keptIds = styles.map((s) => s.id).filter(Boolean) as string[];
  const removed = before.filter((x) => !keptIds.includes(x.id)).map((x) => x.id);
  if (removed.length) {
    await db.media.deleteMany({ where: { styleId: { in: removed } } });
    await db.serviceStyle.deleteMany({ where: { id: { in: removed } } });
  }
  for (const [i, s] of styles.entries()) {
    const fields = { name: s.name, price: s.price === "" || s.price == null ? null : s.price, durationMin: s.durationMin === "" || s.durationMin == null ? null : s.durationMin, position: i };
    const st = s.id && before.some((x) => x.id === s.id)
      ? await db.serviceStyle.update({ where: { id: s.id }, data: fields })
      : await db.serviceStyle.create({ data: { ...fields, serviceId: svc.id } });
    await syncImages(fd, `style_${s.key}`, { businessId: b.id, serviceId: svc.id, styleId: st.id, alt: alt(st.name) });
  }

  revalidatePath("/app/services");
  revalidatePath(`/book/${b.slug}`);
  redirect("/app/services?saved=1");
}

/** Salon logo and permission for Darling to feature the salon on its own website. */
export async function saveBrand(fd: FormData) {
  const user = await requireUser(MANAGERS);
  const b = user.business;
  const keep = readKeep(fd, "logo");
  const [upload] = readUploads(fd, "logo");
  if (upload && checkUpload(upload)) redirect("/app/settings?error=logo");
  let logoId = b.logoId && keep.includes(b.logoId) ? b.logoId : null;
  if (upload) {
    logoId = (await storeUpload(upload, { businessId: b.id, kind: "logo", alt: `${b.name} logo` })).id;
  }
  if (b.logoId && b.logoId !== logoId) await db.media.deleteMany({ where: { id: b.logoId, businessId: b.id } });
  const consent = fd.get("featureConsent") === "on";
  await db.business.update({
    where: { id: b.id },
    // withdrawing permission takes the salon off the homepage straight away
    data: { logoId, featureConsent: consent, ...(consent ? {} : { homeLogo: false, homeServices: false }), ...(logoId ? {} : { homeLogo: false }) },
  });
  revalidatePath("/app/settings");
  revalidatePath("/");
  redirect("/app/settings?saved=brand");
}
