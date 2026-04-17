import { del, get, keys, set } from "idb-keyval";
import type { SampleDraft } from "./types";

const PREFIX = "draft:";

export async function saveDraft(draft: SampleDraft): Promise<void> {
  await set(PREFIX + draft.id, draft);
}

export async function loadDraft(id: string): Promise<SampleDraft | undefined> {
  return get<SampleDraft>(PREFIX + id);
}

export async function deleteDraft(id: string): Promise<void> {
  await del(PREFIX + id);
}

export async function listDrafts(): Promise<SampleDraft[]> {
  const allKeys = (await keys()) as string[];
  const draftKeys = allKeys.filter((k) => typeof k === "string" && k.startsWith(PREFIX));
  const drafts = await Promise.all(draftKeys.map((k) => get<SampleDraft>(k)));
  return drafts.filter((d): d is SampleDraft => Boolean(d));
}

export function newDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
