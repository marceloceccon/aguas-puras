import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { deletePending, readPending } from "@/lib/pending";

export async function GET(_req: Request, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const envelope = await readPending(uid);
  if (!envelope) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ envelope });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ uid: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { uid } = await params;
  const ok = await deletePending(uid);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, by: auth.address });
}
