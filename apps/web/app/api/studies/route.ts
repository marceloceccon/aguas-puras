import { NextResponse } from "next/server";
import { listStudyFiles, writeStudy } from "@/lib/studies";
import { validateStudy } from "@/lib/study-validate";

export async function GET() {
  const files = await listStudyFiles();
  return NextResponse.json({ items: files });
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Disabled in production. Download JSON and commit it to the repo." },
      { status: 403 }
    );
  }

  let payload: { filename?: string; study?: unknown };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { filename, study } = payload;
  if (!filename || !study) {
    return NextResponse.json({ error: "Missing filename or study" }, { status: 400 });
  }

  const validation = validateStudy(study);
  if (!validation.ok) {
    return NextResponse.json({ error: "Validation failed", issues: validation.errors }, { status: 400 });
  }

  try {
    const saved = await writeStudy(filename, validation.value);
    return NextResponse.json({ ok: true, path: `/studies/${saved}` });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
