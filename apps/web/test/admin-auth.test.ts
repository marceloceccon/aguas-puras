import { beforeEach, describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { hashBody, requireAdmin } from "@/lib/admin-auth";

// Anvil dev key #0 — public knowledge, never used in production.
const ANVIL_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const account = privateKeyToAccount(ANVIL_KEY);

async function sign(method: string, path: string, body: string, ts = Math.floor(Date.now() / 1000)) {
  const bodyHash = hashBody(body);
  const message = `AguasPuras admin\n${method.toUpperCase()} ${path}\n${ts}\n${bodyHash}`;
  const signature = await account.signMessage({ message });
  return `AguasPuras ${account.address} ${ts} ${signature}`;
}

function makeRequest(method: string, path: string, body: string, auth?: string): Request {
  const headers = new Headers();
  if (auth) headers.set("authorization", auth);
  headers.set("content-type", "application/json");
  const init: RequestInit = { method, headers };
  if (method !== "GET" && method !== "HEAD" && method !== "DELETE") init.body = body;
  return new Request(`http://localhost:3001${path}`, init);
}

describe("requireAdmin", () => {
  beforeEach(() => {
    process.env.STUDIES_API_ENABLED = "true";
    process.env.ADMIN_ALLOWLIST = account.address.toLowerCase();
  });

  it("rejects when kill-switch is off (503)", async () => {
    process.env.STUDIES_API_ENABLED = "false";
    const auth = await sign("POST", "/api/studies", "{}");
    const res = await requireAdmin(makeRequest("POST", "/api/studies", "{}", auth));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(503);
  });

  it("rejects missing Authorization (401)", async () => {
    const res = await requireAdmin(makeRequest("POST", "/api/studies", "{}"));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(401);
  });

  it("rejects malformed Authorization (401)", async () => {
    const res = await requireAdmin(makeRequest("POST", "/api/studies", "{}", "garbage"));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(401);
  });

  it("rejects expired timestamps (401)", async () => {
    const old = Math.floor(Date.now() / 1000) - 3600;
    const auth = await sign("POST", "/api/studies", "{}", old);
    const res = await requireAdmin(makeRequest("POST", "/api/studies", "{}", auth));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(401);
  });

  it("rejects non-allowlisted wallets (403)", async () => {
    process.env.ADMIN_ALLOWLIST = "0x0000000000000000000000000000000000000001";
    const auth = await sign("POST", "/api/studies", "{}");
    const res = await requireAdmin(makeRequest("POST", "/api/studies", "{}", auth));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(403);
  });

  it("rejects empty allowlist (503)", async () => {
    process.env.ADMIN_ALLOWLIST = "";
    const auth = await sign("POST", "/api/studies", "{}");
    const res = await requireAdmin(makeRequest("POST", "/api/studies", "{}", auth));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(503);
  });

  it("accepts a valid signed POST and returns the raw body", async () => {
    const body = JSON.stringify({ hello: "world" });
    const auth = await sign("POST", "/api/studies", body);
    const res = await requireAdmin(makeRequest("POST", "/api/studies", body, auth));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.address).toBe(account.address.toLowerCase());
      expect(res.body).toBe(body);
    }
  });

  it("rejects when body is tampered with (401)", async () => {
    const original = JSON.stringify({ hello: "world" });
    const tampered = JSON.stringify({ hello: "evil" });
    const auth = await sign("POST", "/api/studies", original);
    const res = await requireAdmin(makeRequest("POST", "/api/studies", tampered, auth));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(401);
  });

  it("accepts a valid signed DELETE with empty body", async () => {
    const auth = await sign("DELETE", "/api/studies/foo.json", "");
    const res = await requireAdmin(makeRequest("DELETE", "/api/studies/foo.json", "", auth));
    expect(res.ok).toBe(true);
  });
});
