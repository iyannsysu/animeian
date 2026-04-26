/**
 * Client-side helper untuk meresize + compress gambar jadi data URL.
 *
 * Tidak ada dependency: pakai canvas + createImageBitmap (fallback ke
 * <img>) bawaan browser. Hasil: data URL JPEG ≤ ~240 KB, max 720x720.
 *
 * Kenapa di-client? Supaya server tidak menerima MB-an gambar, dan agar
 * bandwidth komentar tetap kecil di Redis.
 */

type CompressOpts = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** Hasil tidak boleh > maxBytes (encoded data URL length, ≈ 1.37x raw). */
  maxBytes?: number;
};

async function loadBitmap(file: File): Promise<{
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(file);
    return {
      width: bmp.width,
      height: bmp.height,
      draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h),
      cleanup: () => bmp.close?.(),
    };
  }
  // Fallback browser tua
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
    cleanup: () => URL.revokeObjectURL(url),
  };
}

export async function compressImageToDataUrl(
  file: File,
  opts: CompressOpts = {}
): Promise<string> {
  const maxW = opts.maxWidth ?? 720;
  const maxH = opts.maxHeight ?? 720;
  const maxBytes = opts.maxBytes ?? 240_000;
  let quality = opts.quality ?? 0.72;

  const src = await loadBitmap(file);
  const ratio = Math.min(1, maxW / src.width, maxH / src.height);
  const w = Math.round(src.width * ratio);
  const h = Math.round(src.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    src.cleanup();
    throw new Error("canvas_unavailable");
  }
  // Background hitam supaya transparan PNG tidak jadi putih saat encode JPEG
  ctx.fillStyle = "#0b0b14";
  ctx.fillRect(0, 0, w, h);
  src.draw(ctx, w, h);
  src.cleanup();

  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  // Loop turunkan quality kalau masih kebesaran
  while (dataUrl.length > maxBytes && quality > 0.3) {
    quality = Math.max(0.3, quality - 0.1);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > maxBytes) {
    // Resize jadi 60% lalu re-encode
    const w2 = Math.round(w * 0.6);
    const h2 = Math.round(h * 0.6);
    const canvas2 = document.createElement("canvas");
    canvas2.width = w2;
    canvas2.height = h2;
    const ctx2 = canvas2.getContext("2d");
    if (ctx2) {
      ctx2.fillStyle = "#0b0b14";
      ctx2.fillRect(0, 0, w2, h2);
      ctx2.drawImage(canvas, 0, 0, w2, h2);
      dataUrl = canvas2.toDataURL("image/jpeg", 0.6);
    }
  }
  if (dataUrl.length > maxBytes) {
    throw new Error("image_too_large");
  }
  return dataUrl;
}
