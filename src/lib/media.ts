import "server-only";
import { db } from "./db";

export const MEDIA_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;
const EXT: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/svg+xml": "svg" };
const MAX_BYTES = 1_500_000, MAX_THUMB = 300_000;

export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 70) || "image";

/** Public, crawlable URL for an image; the file name carries the alt text for SEO. */
export function mediaUrl(m: { id: string; alt: string; mime: string }, size: "full" | "thumb" = "full") {
  return `/img/${m.id}/${size === "thumb" ? "t/" : ""}${slugify(m.alt)}.${EXT[m.mime] ?? "img"}`;
}

export type Upload = { file: File; thumb?: File | null; width: number; height: number };

/** Reads the parallel inputs an ImagePicker submits: `${name}` files, `${name}Thumbs` files and `${name}Dims` JSON. */
export function readUploads(fd: FormData, name: string): Upload[] {
  const files = fd.getAll(name).filter((f): f is File => f instanceof File && f.size > 0);
  const thumbs = fd.getAll(`${name}Thumbs`).filter((f): f is File => f instanceof File && f.size > 0);
  let dims: { w: number; h: number }[] = [];
  try { dims = JSON.parse(String(fd.get(`${name}Dims`) ?? "[]")); } catch {}
  return files.map((file, i) => ({ file, thumb: thumbs[i] ?? null, width: dims[i]?.w ?? 0, height: dims[i]?.h ?? 0 }));
}

/** Ids of already-uploaded images to keep, in display order. */
export function readKeep(fd: FormData, name: string): string[] {
  try { const v = JSON.parse(String(fd.get(`${name}Keep`) ?? "[]")); return Array.isArray(v) ? v.map(String) : []; } catch { return []; }
}

export function checkUpload(u: Upload): string | null {
  if (!(MEDIA_TYPES as readonly string[]).includes(u.file.type)) return "Photos must be JPG, PNG or WebP.";
  if (u.file.size > MAX_BYTES) return "One of the photos is too large. Please choose a smaller one.";
  if (u.thumb && (u.thumb.size > MAX_THUMB || !(MEDIA_TYPES as readonly string[]).includes(u.thumb.type))) return "One of the photos couldn't be processed.";
  return null;
}

export async function storeUpload(u: Upload, data: { businessId: string; kind: "service" | "logo"; alt: string; serviceId?: string | null; styleId?: string | null; position?: number }) {
  return db.media.create({
    data: {
      ...data,
      mime: u.file.type,
      width: Math.max(1, Math.round(u.width)),
      height: Math.max(1, Math.round(u.height)),
      data: Buffer.from(await u.file.arrayBuffer()),
      thumb: u.thumb ? Buffer.from(await u.thumb.arrayBuffer()) : null,
    },
    select: { id: true },
  });
}

/**
 * Sync one picker's images for a service or style: keep (and reorder) the listed ones, delete the rest,
 * add new uploads after them. Returns how many images it now has.
 */
export async function syncImages(fd: FormData, name: string, scope: { businessId: string; serviceId: string; styleId: string | null; alt: string }) {
  const keep = readKeep(fd, name);
  const uploads = readUploads(fd, name);
  const existing = await db.media.findMany({ where: { businessId: scope.businessId, kind: "service", serviceId: scope.serviceId, styleId: scope.styleId }, select: { id: true } });
  const keepIds = keep.filter((id) => existing.some((e) => e.id === id));
  await db.media.deleteMany({ where: { id: { in: existing.filter((e) => !keepIds.includes(e.id)).map((e) => e.id) } } });
  for (const [i, id] of keepIds.entries()) await db.media.update({ where: { id }, data: { position: i, alt: scope.alt } });
  for (const [i, u] of uploads.entries()) await storeUpload(u, { businessId: scope.businessId, kind: "service", serviceId: scope.serviceId, styleId: scope.styleId, alt: scope.alt, position: keepIds.length + i });
  return keepIds.length + uploads.length;
}
