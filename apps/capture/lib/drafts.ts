import { del, get, keys, set } from "idb-keyval";
import type { AttestedSample, SampleDraft } from "./types";

const PREFIX = "draft:";
const SUBMITTED_PREFIX = "submitted:";

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

export async function saveSubmitted(sample: AttestedSample): Promise<void> {
  await set(SUBMITTED_PREFIX + sample.attestationUID, sample);
}

export async function listSubmitted(): Promise<AttestedSample[]> {
  const allKeys = (await keys()) as string[];
  const submittedKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(SUBMITTED_PREFIX)
  );
  const samples = await Promise.all(submittedKeys.map((k) => get<AttestedSample>(k)));
  return samples.filter((s): s is AttestedSample => Boolean(s));
}

export function newDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
