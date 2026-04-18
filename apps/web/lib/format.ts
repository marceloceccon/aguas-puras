export function shortAddr(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function shortHash(hash: string): string {
  if (!hash) return "";
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

export function formatTimestamp(ts: string | number | bigint): string {
  const n = typeof ts === "bigint" ? Number(ts) : Number(ts);
  return new Date(n * 1000).toLocaleString();
}

export function explorerTxUrl(hash: string): string | null {
  const base = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL;
  if (!base) return null;
  return `${base}/tx/${hash}`;
}

export function easUrl(uid: string): string | null {
  const base = process.env.NEXT_PUBLIC_EAS_EXPLORER_URL;
  if (!base) return null;
  return `${base}/attestation/view/${uid}`;
}
