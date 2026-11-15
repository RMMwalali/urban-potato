// Browser-side image preparation: fix phone-camera rotation, resize, and compress to WebP (JPEG/PNG
// fallback), plus a small thumbnail. Keeps uploads small enough for a phone on mobile data.

export type Prepared = { main: File; thumb: File; width: number; height: number; preview: string };

async function encode(canvas: HTMLCanvasElement, transparent: boolean, quality: number): Promise<Blob> {
  const tryType = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
  const webp = await tryType("image/webp");
  if (webp && webp.type === "image/webp") return webp;
  return (await tryType(transparent ? "image/png" : "image/jpeg"))!;
}

function draw(src: ImageBitmap, maxSide: number) {
  const k = Math.min(1, maxSide / Math.max(src.width, src.height));
  const c = document.createElement("canvas");
  c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

export async function prepareImage(file: File | Blob, opts: { max?: number; thumb?: number; transparent?: boolean } = {}): Promise<Prepared> {
  if (file.type && !file.type.startsWith("image/")) throw new Error("That file isn't an image.");
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("That photo couldn't be read. Try a JPG or PNG.");
  }
  const big = draw(bmp, opts.max ?? 1600);
  const small = draw(bmp, opts.thumb ?? 520);
  bmp.close();
  const [main, thumb] = await Promise.all([encode(big, !!opts.transparent, 0.82), encode(small, !!opts.transparent, 0.78)]);
  const ext = main.type === "image/webp" ? "webp" : main.type === "image/png" ? "png" : "jpg";
  return {
    main: new File([main], `photo.${ext}`, { type: main.type }),
    thumb: new File([thumb], `thumb.${ext}`, { type: thumb.type }),
    width: big.width, height: big.height,
    preview: URL.createObjectURL(thumb),
  };
}
