/**
 * Burn a timestamp + GPS watermark into a sample image before pinning so the
 * pixel data itself carries tamper-evident provenance. The hash of the
 * watermarked image is what gets attested on-chain.
 *
 * Graceful degradation: if OffscreenCanvas / createImageBitmap isn't available,
 * or if anything throws, returns the original file untouched so the capture
 * flow never gets stuck. Callers should treat this as best-effort.
 */

export interface WatermarkInfo {
  isoTime: string;
  lat?: number;
  lon?: number;
  accuracyMeters?: number;
  collectorName?: string;
}

export async function watermarkImage(file: File, info: WatermarkInfo): Promise<File> {
  if (typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0);

    const lines = [
      `AguasPuras · ${info.isoTime}`,
      info.lat !== undefined && info.lon !== undefined
        ? `${info.lat.toFixed(6)}, ${info.lon.toFixed(6)}${
            info.accuracyMeters ? ` ±${info.accuracyMeters.toFixed(0)}m` : ""
          }`
        : "no GPS"
    ];
    if (info.collectorName) lines.push(info.collectorName);

    const padding = Math.max(8, Math.round(bitmap.width * 0.015));
    const fontSize = Math.max(12, Math.round(bitmap.width / 48));
    const lineHeight = Math.round(fontSize * 1.35);
    const bgHeight = lineHeight * lines.length + padding * 1.5;
    const y0 = bitmap.height - bgHeight;

    ctx.fillStyle = "rgba(6, 42, 52, 0.72)";
    ctx.fillRect(0, y0, bitmap.width, bgHeight);

    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = "#e8fbff";
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      ctx.fillText(line, padding, y0 + padding * 0.75 + i * lineHeight);
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );
    if (!blob) return file;
    const outName = file.name.replace(/\.[a-z0-9]+$/i, "") + "-wm.jpg";
    return new File([blob], outName, { type: blob.type });
  } catch {
    return file;
  }
}
