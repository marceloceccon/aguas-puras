import { NextResponse } from "next/server";
import { keccak256, recoverMessageAddress, toBytes, type Hex } from "viem";

const MAX_AGE_SECONDS = 300;
const HEADER_RE = /^AguasPuras (0x[0-9a-fA-F]{40}) (\d+) (0x[0-9a-fA-F]+)$/;

export type AuthResult =
  | { ok: true; address: `0x${string}`; body: string }
  | { ok: false; response: Response };

/**
 * Canonical signed message for admin writes. The body hash covers the raw
 * bytes of the request body (or the empty string for GET/DELETE), preventing
 * an interceptor from swapping the payload of an otherwise-valid request.
 */
export function adminSignatureMessage(
  method: string,
  pathname: string,
  timestamp: number,
  bodyHash: Hex
): string {
  return `AguasPuras admin\n${method.toUpperCase()} ${pathname}\n${timestamp}\n${bodyHash}`;
}

export function hashBody(body: string): Hex {
  return keccak256(toBytes(body));
}

function readAllowlist(): Set<string> {
  const raw = process.env.ADMIN_ALLOWLIST ?? "";
  return new Set(
    raw
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter((a) => /^0x[0-9a-f]{40}$/.test(a))
  );
}

/**
 * Gate admin API routes. On success returns the raw body string so the
 * handler can parse it once (we read the body here to compute its hash
 * for signature verification).
 *
 * Checks:
 *   1. STUDIES_API_ENABLED === "true" (kill-switch)
 *   2. Authorization header `AguasPuras <addr> <unix-ts> <signature>`
 *   3. Timestamp within ±300s (replay window)
 *   4. Address ∈ ADMIN_ALLOWLIST
 *   5. signature recovers to the claimed address over
 *      `"AguasPuras admin\n<METHOD> <pathname>\n<ts>\n<keccak256(body)>"`.
 */
export async function requireAdmin(req: Request): Promise<AuthResult> {
  if (process.env.STUDIES_API_ENABLED !== "true") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Studies API is disabled (STUDIES_API_ENABLED != true)." },
        { status: 503 }
      )
    };
  }

  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(HEADER_RE);
  if (!match) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing or malformed Authorization header" },
        { status: 401 }
      )
    };
  }

  const [, address, tsStr, signature] = match as [string, string, string, string];
  const timestamp = Number(tsStr);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > MAX_AGE_SECONDS) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Request expired" }, { status: 401 })
    };
  }

  const list = readAllowlist();
  if (list.size === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "ADMIN_ALLOWLIST is empty on this deployment" },
        { status: 503 }
      )
    };
  }
  if (!list.has(address.toLowerCase())) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Wallet not on ADMIN_ALLOWLIST" }, { status: 403 })
    };
  }

  // Read body once; empty for bodyless methods.
  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" || method === "DELETE" ? "" : await req.text();
  const bodyHash = hashBody(body);
  const url = new URL(req.url);
  const message = adminSignatureMessage(method, url.pathname, timestamp, bodyHash);

  let recovered: string;
  try {
    recovered = await recoverMessageAddress({ message, signature: signature as Hex });
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Signature verification failed" }, { status: 401 })
    };
  }
  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Signature does not match claimed address (body may have been tampered with)" },
        { status: 401 }
      )
    };
  }

  return { ok: true, address: address.toLowerCase() as `0x${string}`, body };
}
