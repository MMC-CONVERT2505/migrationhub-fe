export interface Box { left: number; top: number; right: number; bottom: number }

/**
 * Bounding box of the visible content in RGBA pixels: anything not transparent and not near-white.
 * Null when the image is blank. A logo uploaded on a big canvas with empty margins is otherwise drawn tiny.
 */
export function contentBox(data: ArrayLike<number>, width: number, height: number): Box | null {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      const ink = a > 24 && (data[i] < 235 || data[i + 1] < 235 || data[i + 2] < 235);
      if (!ink) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  return right < 0 ? null : { left, top, right: right + 1, bottom: bottom + 1 };
}

/** The box plus a small margin, kept inside the image. Null when trimming would remove under 10% of either side (not worth it). */
export function paddedCrop(box: Box | null, width: number, height: number, marginRatio = 0.06): Box | null {
  if (!box) return null;
  const m = Math.round(Math.max(box.right - box.left, box.bottom - box.top) * marginRatio);
  const crop = { left: Math.max(0, box.left - m), top: Math.max(0, box.top - m), right: Math.min(width, box.right + m), bottom: Math.min(height, box.bottom + m) };
  const keepsW = (crop.right - crop.left) / width, keepsH = (crop.bottom - crop.top) / height;
  return keepsW > 0.9 && keepsH > 0.9 ? null : crop;
}

const cache = new Map<string, Promise<string | null>>();

/**
 * A copy of the logo with its empty margins cut off, as an object URL; null when nothing needs trimming or it cannot be
 * done (the image server refuses cross-origin reads, the browser has no canvas): the caller then shows the original.
 */
export function trimmedLogoUrl(src: string): Promise<string | null> {
  const hit = cache.get(src);
  if (hit) return hit;
  const job = new Promise<string | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => resolve(null);
    img.onload = () => {
      try {
        const w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h) return resolve(null);
        const probe = document.createElement('canvas');
        probe.width = w; probe.height = h;
        const ctx = probe.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        const crop = paddedCrop(contentBox(ctx.getImageData(0, 0, w, h).data, w, h), w, h);
        if (!crop) return resolve(null);
        const out = document.createElement('canvas');
        out.width = crop.right - crop.left; out.height = crop.bottom - crop.top;
        out.getContext('2d')!.drawImage(img, crop.left, crop.top, out.width, out.height, 0, 0, out.width, out.height);
        out.toBlob((b) => resolve(b ? URL.createObjectURL(b) : null), 'image/png');
      } catch {
        resolve(null); // a tainted canvas throws here
      }
    };
    img.src = src;
  });
  cache.set(src, job);
  return job;
}
