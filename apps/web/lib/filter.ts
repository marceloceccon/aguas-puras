import type { ParsedSample } from "./types";

export interface SampleFilter {
  from?: string; // YYYY-MM-DD inclusive
  to?: string; // YYYY-MM-DD inclusive
  param?: string; // filter to samples that have this reading
  attester?: string; // 0x-prefixed address (case-insensitive)
}

export function parseFilter(sp: Record<string, string | string[] | undefined>): SampleFilter {
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    from: one("from"),
    to: one("to"),
    param: one("param")?.trim() || undefined,
    attester: one("attester")?.trim().toLowerCase() || undefined
  };
}

export function applyFilter(samples: ParsedSample[], f: SampleFilter): ParsedSample[] {
  const fromTs = f.from ? Date.parse(f.from) / 1000 : undefined;
  const toTs = f.to ? Date.parse(f.to) / 1000 + 86_399 : undefined; // inclusive end-of-day
  const attester = f.attester;
  return samples.filter((s) => {
    const ts = Number(s.publishedAt);
    if (fromTs !== undefined && ts < fromTs) return false;
    if (toTs !== undefined && ts > toTs) return false;
    if (f.param && !(f.param in s.readings)) return false;
    if (attester && s.fieldAgent.toLowerCase() !== attester) return false;
    return true;
  });
}

export function isEmptyFilter(f: SampleFilter): boolean {
  return !f.from && !f.to && !f.param && !f.attester;
}
