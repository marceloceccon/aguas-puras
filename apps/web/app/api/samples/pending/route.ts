import { NextResponse } from "next/server";
import { encodePacked, isHex, keccak256, recoverMessageAddress } from "viem";
import { requireAdmin } from "@/lib/admin-auth";
import { listPending, pendingExists, savePending, type PendingEnvelope } from "@/lib/pending";
import { isFieldAgentActive } from "@/lib/publicClient";
import { rateLimit } from "@/lib/rate-limit";

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, GET, OPTIONS",
  "access-control-allow-headers": "content-type, authorization"
};

// Rate-limit window. Field agents submitting faster than this are almost
// certainly a misclick or a replay; legitimate capture flows take minutes.
const RATE_LIMIT_WINDOW_SECONDS = Number(process.env.INBOX_RATE_LIMIT_SECONDS ?? 30);

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function withCors(res: Response): Response {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
  return res;
}

export async function POST(req: Request) {
  let body: PendingEnvelope;
  try {
    body = (await req.json()) as PendingEnvelope;
  } catch {
    return withCors(NextResponse.json({ error: "Invalid JSON" }, { status: 400 }));
  }

  const shapeError = validateShape(body);
  if (shapeError) return withCors(NextResponse.json({ error: shapeError }, { status: 400 }));

  // Signature verification: recovered address must match fieldAgent.
  let recovered: string;
  try {
    recovered = await recoverMessageAddress({ message: body.message, signature: body.signature });
  } catch {
    return withCors(
      NextResponse.json({ error: "Signature could not be recovered" }, { status: 400 })
    );
  }
  if (recovered.toLowerCase() !== body.fieldAgent.toLowerCase()) {
    return withCors(
      NextResponse.json({ error: "Signature does not match claimed fieldAgent" }, { status: 400 })
    );
  }

  // Integrity: UID must equal keccak256(schema || fieldAgent || dataHash).
  const expectedUid = keccak256(
    encodePacked(["bytes32", "address", "bytes32"], [body.schema, body.fieldAgent, body.dataHash])
  );
  if (expectedUid.toLowerCase() !== body.uid.toLowerCase()) {
    return withCors(
      NextResponse.json({ error: "UID does not match schema+agent+dataHash" }, { status: 400 })
    );
  }

  // Duplicate: this uid is already in the inbox (re-submit or deterministic replay).
  if (await pendingExists(body.uid)) {
    return withCors(
      NextResponse.json({ error: "Envelope already queued for this UID" }, { status: 409 })
    );
  }

  // Field-agent must be registered + active on-chain. Prevents spam from
  // unknown wallets at the cost of one RPC call.
  if (!(await isFieldAgentActive(body.fieldAgent))) {
    return withCors(
      NextResponse.json(
        { error: "Field agent is not registered or has been deactivated" },
        { status: 403 }
      )
    );
  }

  // Per-wallet rate limit.
  const rl = rateLimit(`inbox:${body.fieldAgent.toLowerCase()}`, RATE_LIMIT_WINDOW_SECONDS);
  if (!rl.ok) {
    const res = NextResponse.json(
      { error: "Too many submissions from this wallet; slow down.", retryAfter: rl.retryAfter },
      { status: 429 }
    );
    res.headers.set("retry-after", String(rl.retryAfter));
    return withCors(res);
  }

  try {
    const id = await savePending(body);
    return withCors(NextResponse.json({ ok: true, id }));
  } catch (e) {
    return withCors(
      NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
    );
  }
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return withCors(auth.response);
  const items = await listPending();
  return withCors(NextResponse.json({ items }));
}

function validateShape(e: unknown): string | null {
  if (!e || typeof e !== "object") return "Expected object";
  const o = e as Record<string, unknown>;
  for (const k of ["schema", "fieldAgent", "uid", "dataHash", "message", "signature"]) {
    if (typeof o[k] !== "string") return `Missing or non-string ${k}`;
  }
  if (!isHex(o.schema as string) || (o.schema as string).length !== 66) return "Bad schema";
  if (!isHex(o.fieldAgent as string) || (o.fieldAgent as string).length !== 42) return "Bad fieldAgent";
  if (!isHex(o.uid as string) || (o.uid as string).length !== 66) return "Bad uid";
  if (!isHex(o.dataHash as string) || (o.dataHash as string).length !== 66) return "Bad dataHash";
  if (!isHex(o.signature as string)) return "Bad signature";
  if (typeof o.imageCid !== "string") return "Missing imageCid";
  if (!o.payload || typeof o.payload !== "object") return "Missing payload";
  if (typeof o.submittedAt !== "number") return "Missing submittedAt";
  return null;
}
