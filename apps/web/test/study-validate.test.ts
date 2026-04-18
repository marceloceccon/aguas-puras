import { describe, expect, it } from "vitest";
import { validateStudy } from "@/lib/study-validate";

const valid = {
  id: "study-001",
  title: "E.coli Correlation with Rainfall",
  date: "2026-04-15",
  author: "researcher.base.eth",
  summary: "Markdown summary here",
  referencedSamples: [],
  keyFindings: [{ param: "ecoli", avg: 45, trend: "up" as const }]
};

describe("validateStudy", () => {
  it("accepts a minimally valid study", () => {
    const res = validateStudy(valid);
    expect(res.ok).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(validateStudy(null).ok).toBe(false);
    expect(validateStudy("foo").ok).toBe(false);
    expect(validateStudy(42).ok).toBe(false);
  });

  it("enforces required fields", () => {
    const res = validateStudy({ ...valid, title: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.some((e) => e.path === "title")).toBe(true);
  });

  it("enforces date format YYYY-MM-DD", () => {
    const res = validateStudy({ ...valid, date: "April 15, 2026" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.some((e) => e.path === "date")).toBe(true);
  });

  it("rejects non-hex referenced sample UIDs", () => {
    const res = validateStudy({ ...valid, referencedSamples: ["not-a-uid"] });
    expect(res.ok).toBe(false);
  });

  it("accepts valid 32-byte hex referenced samples", () => {
    const res = validateStudy({
      ...valid,
      referencedSamples: [`0x${"ab".repeat(32)}`]
    });
    expect(res.ok).toBe(true);
  });

  it("rejects invalid trend", () => {
    const res = validateStudy({
      ...valid,
      keyFindings: [{ param: "ecoli", avg: 45, trend: "sideways" }]
    });
    expect(res.ok).toBe(false);
  });

  it("rejects non-numeric finding avg", () => {
    const res = validateStudy({
      ...valid,
      keyFindings: [{ param: "ecoli", avg: "lots", trend: "up" }]
    });
    expect(res.ok).toBe(false);
  });

  it("accepts an optional rawDataUrl string but rejects other types", () => {
    expect(validateStudy({ ...valid, rawDataUrl: "https://x/y.csv" }).ok).toBe(true);
    expect(validateStudy({ ...valid, rawDataUrl: 42 }).ok).toBe(false);
  });
});
