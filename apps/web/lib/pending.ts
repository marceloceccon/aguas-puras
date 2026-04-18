import type { PendingEnvelope } from "@aguas/shared";
import { promises as fs } from "node:fs";
import path from "node:path";

export type { PendingEnvelope };

const PENDING_DIR = path.resolve(process.cwd(), "..", "..", "pending");

export async function pendingExists(uid: string): Promise<boolean> {
  const filename = sanitize(uid);
  if (!filename) return false;
  try {
    await fs.access(path.join(PENDING_DIR, `${filename}.json`));
    return true;
  } catch {
    return false;
  }
}

export async function savePending(envelope: PendingEnvelope): Promise<string> {
  const filename = sanitize(envelope.uid);
  if (!filename) throw new Error("Invalid uid");
  await fs.mkdir(PENDING_DIR, { recursive: true });
  const target = path.join(PENDING_DIR, `${filename}.json`);
  if (!target.startsWith(PENDING_DIR)) throw new Error("Path traversal rejected");
  await fs.writeFile(target, JSON.stringify(envelope, null, 2) + "\n", "utf8");
  return filename;
}

export async function listPending(): Promise<PendingEnvelope[]> {
  try {
    const files = await fs.readdir(PENDING_DIR);
    const jsons = files.filter((f) => f.endsWith(".json"));
    const loaded = await Promise.all(
      jsons.map(async (f) => {
        const raw = await fs.readFile(path.join(PENDING_DIR, f), "utf8");
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
  const safe = sanitize(uid);
  if (!safe) return null;
  try {
    const raw = await fs.readFile(path.join(PENDING_DIR, `${safe}.json`), "utf8");
    return JSON.parse(raw) as PendingEnvelope;
  } catch {
    return null;
  }
}

export async function deletePending(uid: string): Promise<boolean> {
  const safe = sanitize(uid);
  if (!safe) return false;
  try {
    await fs.unlink(path.join(PENDING_DIR, `${safe}.json`));
    return true;
  } catch {
    return false;
  }
}

function sanitize(uid: string): string | null {
  if (!/^0x[0-9a-fA-F]{64}$/.test(uid)) return null;
  return uid.toLowerCase();
}
