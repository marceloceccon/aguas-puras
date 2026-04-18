import { promises as fs } from "node:fs";
import path from "node:path";
import type { Study } from "./types";

const STUDIES_DIR = path.join(process.cwd(), "..", "..", "studies");

export async function listStudies(): Promise<Study[]> {
  try {
    const files = await fs.readdir(STUDIES_DIR);
    const jsons = files.filter((f) => f.endsWith(".json"));
    const loaded = await Promise.all(
      jsons.map(async (f) => {
        const raw = await fs.readFile(path.join(STUDIES_DIR, f), "utf8");
        try {
          return JSON.parse(raw) as Study;
        } catch {
          return null;
        }
      })
    );
    return loaded
      .filter((s): s is Study => Boolean(s))
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}
