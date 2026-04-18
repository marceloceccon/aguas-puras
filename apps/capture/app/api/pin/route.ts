import { NextResponse } from "next/server";

/**
 * Server-side Pinata proxy. PINATA_JWT stays on the server — never shipped to
 * the client. Expects a multipart/form-data POST with a single `file` part.
 * Returns `{ cid, size }` on success.
 *
 * Pinata Files API (v3): https://docs.pinata.cloud/api-reference/endpoint/upload-a-file
 */
const PINATA_URL = "https://uploads.pinata.cloud/v3/files";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB hard cap — refuses larger uploads early.

export async function POST(req: Request) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json(
      { error: "Pinning is not configured on this deployment (PINATA_JWT missing)." },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing `file` field" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File too large (>${MAX_BYTES} bytes)` }, { status: 413 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image/* content types are accepted" }, { status: 415 });
  }

  const upstream = new FormData();
  const name = (form.get("name") as string | null) ?? `aguas-sample-${Date.now()}.jpg`;
  upstream.set("file", file, name);
  upstream.set("network", "public");

  const res = await fetch(PINATA_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${jwt}` },
    body: upstream
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: `Pinata upload failed (${res.status})`, details: text.slice(0, 500) },
      { status: 502 }
    );
  }

  const body = (await res.json()) as { data?: { cid?: string; size?: number } };
  const cid = body.data?.cid;
  if (!cid) return NextResponse.json({ error: "Pinata response missing cid" }, { status: 502 });
  return NextResponse.json({ cid, size: body.data?.size ?? file.size });
}
