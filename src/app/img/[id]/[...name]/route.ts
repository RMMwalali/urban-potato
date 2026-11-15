import { db } from "@/lib/db";

// Public images (service photos and logos). Each upload gets a new id and is never changed, so it can be
// cached for a year. The file name after the id is only for people and search engines.
export async function GET(req: Request, { params }: { params: Promise<{ id: string; name: string[] }> }) {
  const { id, name } = await params;
  const thumb = name[0] === "t" && name.length > 1;
  const m = await db.media.findUnique({ where: { id }, select: { mime: true, data: !thumb, thumb: thumb, business: { select: { isShowcase: true } } } });
  const body = m ? (thumb ? m.thumb ?? null : m.data) : null;
  if (!m || !body) return new Response("Not found", { status: 404 });
  const etag = `"${id}${thumb ? "t" : ""}"`;
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ETag: etag } });
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": m.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
      ...(m.mime === "image/svg+xml" ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox" } : {}),
      ...(m.business.isShowcase ? { "X-Robots-Tag": "noindex" } : {}),
    },
  });
}
