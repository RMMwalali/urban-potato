"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { DEFAULT_TEMPLATES, digits, LEAD_STATUSES, type Templates } from "@/lib/leads";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const clip = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

/** Paste JSON (array of leads) or CSV with a header row. Duplicates (same phone, Instagram or name+area) are skipped. */
export async function importLeads(fd: FormData) {
  const a = await requireAdmin();
  const raw = str(fd, "data");
  let rows: Record<string, unknown>[] = [];
  try {
    if (raw.startsWith("[")) rows = JSON.parse(raw);
    else {
      const lines = raw.split(/\r?\n/).filter((l) => l.trim());
      const split = (l: string) => (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? []).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim());
      const head = split(lines[0]).map((h) => h.toLowerCase());
      rows = lines.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [head[i], v])));
    }
  } catch {
    redirect("/admin/leads?error=import");
  }
  const existing = await db.lead.findMany({ select: { name: true, area: true, phone: true, instagram: true } });
  const seen = new Set(existing.flatMap((e) => [digits(e.phone), e.instagram?.toLowerCase(), `${e.name.toLowerCase()}|${(e.area ?? "").toLowerCase()}`].filter(Boolean) as string[]));
  let added = 0, skipped = 0;
  for (const r of rows.slice(0, 1000)) {
    const name = clip(r.name, 120);
    if (!name) { skipped++; continue; }
    const ig = clip(r.instagram, 60)?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "") ?? null;
    const keys = [digits(clip(r.phone, 40)), ig?.toLowerCase(), `${name.toLowerCase()}|${(clip(r.area, 80) ?? "").toLowerCase()}`].filter(Boolean) as string[];
    if (keys.some((k) => seen.has(k))) { skipped++; continue; }
    keys.forEach((k) => seen.add(k));
    const sources = Array.isArray(r.sources) ? r.sources.map(String).slice(0, 10) : clip(r.sources, 2000)?.split(/\s*[|;]\s*/) ?? [];
    await db.lead.create({
      data: {
        name, type: clip(r.type, 20), city: clip(r.city, 60), area: clip(r.area, 80), phone: clip(r.phone, 40), whatsapp: clip(r.whatsapp, 40), instagram: ig,
        tiktok: clip(r.tiktok, 80), facebook: clip(r.facebook, 200), website: clip(r.website, 200), email: clip(r.email, 120)?.toLowerCase() ?? null,
        bookingMethod: clip(r.bookingMethod ?? r.booking_method, 200), fitNote: clip(r.fitNote ?? r.fit_note, 300), sources, confidence: clip(r.confidence, 10),
        activity: { create: { kind: "note", text: "Imported", actor: a.email } },
      },
    });
    added++;
  }
  revalidatePath("/admin/leads");
  redirect(`/admin/leads?imported=${added}&skipped=${skipped}`);
}

export async function updateLead(fd: FormData) {
  const a = await requireAdmin();
  const id = str(fd, "id");
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return;
  const status = LEAD_STATUSES.some((s) => s.id === str(fd, "status")) ? str(fd, "status") : lead.status;
  const follow = str(fd, "followUpAt");
  const note = str(fd, "note");
  const acts: Prisma.LeadActivityCreateWithoutLeadInput[] = [];
  if (status !== lead.status) acts.push({ kind: "status", text: `Status: ${lead.status} → ${status}`, actor: a.email });
  if (note) acts.push({ kind: "note", text: note.slice(0, 2000), actor: a.email });
  await db.lead.update({
    where: { id },
    data: { status, followUpAt: follow ? new Date(`${follow}T09:00:00+03:00`) : null, ...(status === "DO_NOT_CONTACT" ? { followUpAt: null } : {}), activity: { create: acts } },
  });
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
}

/** Called when the admin opens WhatsApp/Instagram/email for a lead: logs it and moves NEW → CONTACTED. */
export async function logContact(id: string, channel: string, text: string) {
  const a = await requireAdmin();
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead || lead.status === "DO_NOT_CONTACT") return { ok: false };
  const followUp = new Date(Date.now() + 3 * 86400_000);
  await db.lead.update({
    where: { id },
    data: {
      lastContactAt: new Date(),
      status: lead.status === "NEW" ? "CONTACTED" : lead.status,
      followUpAt: lead.followUpAt && lead.followUpAt > new Date() ? lead.followUpAt : followUp,
      activity: { create: { kind: channel, text: `Message opened in ${channel}:\n${text.slice(0, 1500)}`, actor: a.email } },
    },
  });
  revalidatePath(`/admin/leads/${id}`);
  return { ok: true };
}

export async function deleteLead(id: string) {
  await requireAdmin();
  await db.lead.delete({ where: { id } }).catch(() => {});
  redirect("/admin/leads");
}

export async function saveTemplates(fd: FormData) {
  await requireAdmin();
  const value = Object.fromEntries((Object.keys(DEFAULT_TEMPLATES) as (keyof Templates)[]).map((k) => [k, str(fd, k) || DEFAULT_TEMPLATES[k]]));
  await db.platformSetting.upsert({ where: { key: "outreach" }, update: { value }, create: { key: "outreach", value } });
  revalidatePath("/admin/leads");
  redirect("/admin/leads/templates?saved=1");
}
