import type { PendingEnvelope } from "@aguas/shared";
import { promises as fs } from "node:fs";
import path from "node:path";

export type { PendingEnvelope };

const PENDING_DIR = path.resolve(process.cwd(), "..", "..", "pending");

function pendingFile(uid: string): string | null {
  const filename = sanitize(uid);
  if (!filename) return null;
  const root = path.resolve(PENDING_DIR);
  const target = path.resolve(root, `${filename}.json`);
  const prefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (!target.startsWith(prefix)) return null;
  return target;
}

export async function pendingExists(uid: string): Promise<boolean> {
  const target = pendingFile(uid);
  if (!target) return false;
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function savePending(envelope: PendingEnvelope): Promise<string> {
  const filename = sanitize(envelope.uid);
  const target = pendingFile(envelope.uid);
  if (!filename || !target) throw new Error("Invalid uid");
  await fs.mkdir(path.resolve(PENDING_DIR), { recursive: true });
  await fs.writeFile(target, JSON.stringify(envelope, null, 2) + "\n", "utf8");
  return filename;
}

export async function listPending(): Promise<PendingEnvelope[]> {
  try {
    const root = path.resolve(PENDING_DIR);
    const files = await fs.readdir(root);
    const jsons = files.filter((f) => f.endsWith(".json"));
    const loaded = await Promise.all(
      jsons.map(async (f) => {
        const candidate = path.resolve(root, f);
        const prefix = root.endsWith(path.sep) ? root : root + path.sep;
        if (!candidate.startsWith(prefix)) return null;
        const raw = await fs.readFile(candidate, "utf8");
        try {
          return JSON.parse(raw) as PendingEnvelope;
        } catch {
          return null;
        }
      })
    );
    return loaded
      .filter((e): e is PendingEnvelope => Boolean(e))
      .sort((a, b) => b.submittedAt - a.submittedAt);
  } catch {
    return [];
  }
}

export async function readPending(uid: string): Promise<PendingEnvelope | null> {
  const target = pendingFile(uid);
  if (!target) return null;
  try {
    const raw = await fs.readFile(target, "utf8");
    return JSON.parse(raw) as PendingEnvelope;
  } catch {
    return null;
  }
}

export async function deletePending(uid: string): Promise<boolean> {
  const target = pendingFile(uid);
  if (!target) return false;
  try {
    await fs.unlink(target);
    return true;
  } catch {
    return false;
  }
}

function sanitize(uid: string): string | null {
  if (!/^0x[0-9a-fA-F]{64}$/.test(uid)) return null;
  return uid.toLowerCase();
}
