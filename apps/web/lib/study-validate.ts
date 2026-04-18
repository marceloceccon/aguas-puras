import type { Study } from "./types";

export interface ValidationError {
  path: string;
  message: string;
}

const TRENDS = new Set(["up", "down", "flat"]);

/** Strict runtime validator for a Study. Returns ok/errors; never throws. */
export function validateStudy(input: unknown): { ok: true; value: Study } | { ok: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const push = (path: string, message: string) => errors.push({ path, message });

  if (!input || typeof input !== "object") {
    return { ok: false, errors: [{ path: "", message: "Expected an object" }] };
  }
  const o = input as Record<string, unknown>;

  requireString(o, "id", push);
  requireString(o, "title", push);
  requireString(o, "date", push);
  requireString(o, "author", push);
  requireString(o, "summary", push);

  if (typeof o.date === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) {
    push("date", "must be YYYY-MM-DD");
  }

  if (!Array.isArray(o.referencedSamples)) {
    push("referencedSamples", "must be an array");
  } else {
    o.referencedSamples.forEach((s, i) => {
      if (typeof s !== "string") push(`referencedSamples[${i}]`, "must be a string");
      else if (!/^0x[0-9a-fA-F]{64}$/.test(s)) push(`referencedSamples[${i}]`, "must be a 32-byte hex (0x…)");
    });
  }

  if (!Array.isArray(o.keyFindings)) {
    push("keyFindings", "must be an array");
  } else {
    o.keyFindings.forEach((f, i) => {
      if (!f || typeof f !== "object") {
        push(`keyFindings[${i}]`, "must be an object");
        return;
      }
      const fo = f as Record<string, unknown>;
      if (typeof fo.param !== "string" || !fo.param.trim()) push(`keyFindings[${i}].param`, "required");
      if (typeof fo.avg !== "number" || Number.isNaN(fo.avg)) push(`keyFindings[${i}].avg`, "must be a number");
      if (typeof fo.trend !== "string" || !TRENDS.has(fo.trend)) push(`keyFindings[${i}].trend`, "must be up|down|flat");
    });
  }

  if (o.rawDataUrl !== undefined && typeof o.rawDataUrl !== "string") {
    push("rawDataUrl", "must be a string if present");
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: input as Study };
}

function requireString(o: Record<string, unknown>, key: string, push: (p: string, m: string) => void) {
  if (typeof o[key] !== "string" || !(o[key] as string).trim()) push(key, "required non-empty string");
}
