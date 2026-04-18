import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteStudy, readStudy } from "@/lib/studies";

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const study = await readStudy(filename);
  if (!study) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ filename, study });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { filename } = await params;
  const ok = await deleteStudy(filename);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, by: auth.address });
}
