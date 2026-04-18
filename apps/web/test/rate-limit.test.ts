import { beforeEach, describe, expect, it, vi } from "vitest";
import { _resetRateLimit, rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    _resetRateLimit();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T12:00:00Z"));
  });

  it("accepts the first call for a key", () => {
    expect(rateLimit("key-a", 30)).toEqual({ ok: true, retryAfter: 0 });
  });

  it("rejects within-window subsequent calls with retryAfter", () => {
    rateLimit("key-a", 30);
    vi.setSystemTime(new Date("2026-04-18T12:00:10Z")); // +10s
    const r = rateLimit("key-a", 30);
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBeGreaterThan(0);
    expect(r.retryAfter).toBeLessThanOrEqual(30);
  });

  it("accepts after the window elapses", () => {
    rateLimit("key-a", 30);
    vi.setSystemTime(new Date("2026-04-18T12:00:31Z")); // +31s
    expect(rateLimit("key-a", 30).ok).toBe(true);
  });

  it("scopes per key", () => {
    expect(rateLimit("key-a", 30).ok).toBe(true);
    expect(rateLimit("key-b", 30).ok).toBe(true);
  });
});
