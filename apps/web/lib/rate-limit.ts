/**
 * Minimal in-memory per-key rate limit for single-replica Next runtimes.
 *
 * Deliberately NOT a distributed limiter: it resets on restart and doesn't
 * coordinate across replicas. Adequate as spam-prevention for the MVP's
 * single-VPS deployment target; swap for Redis/Upstash before horizontal
 * scaling. Documented in SECURITY.md.
 */

const lastSeen = new Map<string, number>();

export function rateLimit(key: string, windowSeconds: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const last = lastSeen.get(key) ?? 0;
  const elapsedMs = now - last;
  const windowMs = windowSeconds * 1000;
  if (elapsedMs < windowMs) {
    return { ok: false, retryAfter: Math.ceil((windowMs - elapsedMs) / 1000) };
  }
  lastSeen.set(key, now);
  return { ok: true, retryAfter: 0 };
}

// Exposed for tests.
export function _resetRateLimit(): void {
  lastSeen.clear();
}
