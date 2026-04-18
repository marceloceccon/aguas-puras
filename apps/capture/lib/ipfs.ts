/**
 * Pin an image to IPFS via the server-side /api/pin proxy (Pinata JWT stays
 * server-side). Computes sha256 of the uploaded bytes client-side for the
 * on-chain dataHash — the hash covers the same bytes Pinata stores, so a
 * verifier can fetch the pin and recompute.
 *
 * If pinning fails, falls back to a deterministic pseudo-CID derived from the
 * sha256 so the capture flow still completes. Callers can inspect
 * `result.fallback === true` to surface a warning.
 */

export interface PinResult {
  cid: string;
  sha256: string;
  bytes: number;
  fallback?: true;
}

export async function pinImage(file: Blob): Promise<PinResult> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const sha256 = bufferToHex(digest);
  const bytes = buffer.byteLength;

  try {
    const form = new FormData();
    form.set("file", file, (file as File).name || "sample.jpg");
    const res = await fetch("/api/pin", { method: "POST", body: form });
    if (!res.ok) {
      console.warn("[pin] upstream error", res.status, await res.text().catch(() => ""));
      return fallback(sha256, bytes);
    }
    const body = (await res.json()) as { cid?: string };
    if (!body.cid) return fallback(sha256, bytes);
    return { cid: body.cid, sha256, bytes };
  } catch (err) {
    console.warn("[pin] network error", err);
    return fallback(sha256, bytes);
  }
}

function fallback(sha256: string, bytes: number): PinResult {
  return { cid: `bafy-stub-${sha256.slice(0, 46)}`, sha256, bytes, fallback: true };
}

function bufferToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}
