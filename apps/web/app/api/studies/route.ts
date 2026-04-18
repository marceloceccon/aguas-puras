import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import type { Study } from "@/lib/types";

const STUDIES_DIR = path.resolve(process.cwd(), "..", "..", "studies");

/**
 * Write a study JSON to /studies/. Dev-only: refuses if NODE_ENV === "production".
 * Filename is sanitized; the body must match the Study shape.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Disabled in production. Download JSON and commit it to the repo." },
      { status: 403 }
    );
  }

  let payload: { filename?: string; study?: Study };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { filename, study } = payload;
  if (!filename || !study || typeof study !== "object") {
    return NextResponse.json({ error: "Missing filename or study" }, { status: 400 });
  }

  const safe = filename.replace(/[^a-z0-9.-]/gi, "-");
  if (!safe.endsWith(".json")) {
    return NextResponse.json({ error: "Filename must end with .json" }, { status: 400 });
  }

  const target = path.join(STUDIES_DIR, safe);
  if (!target.startsWith(STUDIES_DIR)) {
    return NextResponse.json({ error: "Path traversal rejected" }, { status: 400 });
  }

  await fs.mkdir(STUDIES_DIR, { recursive: true });
  await fs.writeFile(target, JSON.stringify(study, null, 2) + "\n", "utf8");

  return NextResponse.json({ ok: true, path: `/studies/${safe}` });
}
