/**
 * IPFS pinning — STUB IMPLEMENTATION.
 *
 * The MVP ships without a real pinning service wired up. We hash the file with
 * SHA-256 and return a deterministic pseudo-CID so the rest of the flow
 * (attestation, registry submit, display) works end-to-end offline.
 *
 * Swap `pinImage` for a real Pinata / web3.storage call when a pinning
 * provider is chosen. See specification.md §5 — "Needs Decision: IPFS pinning".
 */

export interface PinResult {
  cid: string;
  sha256: string;
  bytes: number;
}

export async function pinImage(file: Blob): Promise<PinResult> {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const sha256 = bufferToHex(digest);
  return {
    cid: `bafy-stub-${sha256.slice(0, 46)}`,
    sha256,
    bytes: bytes.byteLength
  };
}

function bufferToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}
