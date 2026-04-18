import { NextResponse } from "next/server";
import { deleteStudy, readStudy } from "@/lib/studies";

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const study = await readStudy(filename);
  if (!study) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ filename, study });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Disabled in production. Delete the file in the repo and commit." },
      { status: 403 }
    );
  }
  const { filename } = await params;
  const ok = await deleteStudy(filename);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
