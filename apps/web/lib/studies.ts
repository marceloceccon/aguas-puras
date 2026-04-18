import { promises as fs } from "node:fs";
import path from "node:path";
import type { Study } from "./types";

const STUDIES_DIR = path.resolve(process.cwd(), "..", "..", "studies");

export interface StudyFile {
  filename: string;
  study: Study;
}

export async function listStudyFiles(): Promise<StudyFile[]> {
  try {
    const files = await fs.readdir(STUDIES_DIR);
    const jsons = files.filter((f) => f.endsWith(".json"));
    const loaded = await Promise.all(
      jsons.map(async (f) => {
        const raw = await fs.readFile(path.join(STUDIES_DIR, f), "utf8");
        try {
          return { filename: f, study: JSON.parse(raw) as Study };
        } catch {
          return null;
        }
      })
    );
    return loaded
      .filter((s): s is StudyFile => Boolean(s))
      .sort((a, b) => b.study.date.localeCompare(a.study.date));
  } catch {
    return [];
  }
}

export async function listStudies(): Promise<Study[]> {
  const files = await listStudyFiles();
  return files.map((f) => f.study);
}

export async function readStudy(filename: string): Promise<Study | null> {
  const safe = sanitize(filename);
  if (!safe) return null;
  try {
    const raw = await fs.readFile(path.join(STUDIES_DIR, safe), "utf8");
    return JSON.parse(raw) as Study;
  } catch {
    return null;
  }
}

export async function writeStudy(filename: string, study: Study): Promise<string> {
  const safe = sanitize(filename);
  if (!safe) throw new Error("Invalid filename");
  const target = path.join(STUDIES_DIR, safe);
  if (!target.startsWith(STUDIES_DIR)) throw new Error("Path traversal rejected");
  await fs.mkdir(STUDIES_DIR, { recursive: true });
  await fs.writeFile(target, JSON.stringify(study, null, 2) + "\n", "utf8");
  return safe;
}

export async function deleteStudy(filename: string): Promise<boolean> {
  const safe = sanitize(filename);
  if (!safe) return false;
  const target = path.join(STUDIES_DIR, safe);
  if (!target.startsWith(STUDIES_DIR)) return false;
  try {
    await fs.unlink(target);
    return true;
  } catch {
    return false;
  }
}

function sanitize(filename: string): string | null {
  const safe = filename.replace(/[^a-z0-9.-]/gi, "-");
  if (!safe || !safe.endsWith(".json")) return null;
  if (safe.includes("..")) return null;
  return safe;
}
