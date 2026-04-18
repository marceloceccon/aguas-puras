import { describe, expect, it } from "vitest";
import { applyFilter, isEmptyFilter, parseFilter } from "@/lib/filter";
import type { ParsedSample } from "@/lib/types";

function sample(overrides: Partial<ParsedSample>): ParsedSample {
  return {
    attestationUID: "0x1",
    dataHash: "0x2",
    fieldAgent: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaaaa",
    publisher: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBbbbb",
    publishedAt: "1700000000",
    publishedBlock: "100",
    publishTxHash: "0x3",
    imageCid: "",
    labReadingsJson: '{"ecoli":12}',
    reviewer: null,
    reviewedAt: null,
    reviewed: false,
    labReadingsUpdatedAt: null,
    labReadingsUpdater: null,
    readings: { ecoli: 12 },
    lat: null,
    lon: null,
    iso: "2023-11-14T22:13:20.000Z",
    ...overrides
  } as ParsedSample;
}

describe("parseFilter", () => {
  it("reads all four fields from URL-style search params", () => {
    const f = parseFilter({
      from: "2026-04-01",
      to: "2026-04-30",
      param: "ecoli",
      attester: "0xABCD1234000000000000000000000000000000aa"
    });
    expect(f.from).toBe("2026-04-01");
    expect(f.to).toBe("2026-04-30");
    expect(f.param).toBe("ecoli");
    expect(f.attester).toBe("0xabcd1234000000000000000000000000000000aa");
  });

  it("treats empty strings as absent", () => {
    const f = parseFilter({ param: "" });
    expect(f.param).toBeUndefined();
  });

  it("collapses array params to the first value", () => {
    const f = parseFilter({ param: ["ecoli", "lead"] });
    expect(f.param).toBe("ecoli");
  });
});

describe("isEmptyFilter", () => {
  it("recognises an empty filter", () => {
    expect(isEmptyFilter(parseFilter({}))).toBe(true);
  });
  it("rejects a non-empty filter", () => {
    expect(isEmptyFilter(parseFilter({ param: "ecoli" }))).toBe(false);
  });
});

describe("applyFilter", () => {
  const recent = sample({ publishedAt: String(Math.floor(Date.UTC(2026, 3, 15) / 1000)) });
  const old = sample({
    attestationUID: "0x10",
    publishedAt: String(Math.floor(Date.UTC(2025, 0, 1) / 1000))
  });
  const leaded = sample({
    attestationUID: "0x20",
    readings: { ecoli: 5, lead: 0.01 }
  });
  const other = sample({
    attestationUID: "0x30",
    fieldAgent: "0x0000000000000000000000000000000000000001"
  });

  const all = [recent, old, leaded, other];

  it("filters by date range inclusively", () => {
    const filtered = applyFilter(all, { from: "2026-04-01", to: "2026-04-30" });
    expect(filtered.map((s) => s.attestationUID)).toContain("0x1");
    expect(filtered.map((s) => s.attestationUID)).not.toContain("0x10");
  });

  it("filters by parameter presence", () => {
    const filtered = applyFilter(all, { param: "lead" });
    expect(filtered.map((s) => s.attestationUID)).toEqual(["0x20"]);
  });

  it("filters by attester (case-insensitive)", () => {
    const filtered = applyFilter(all, { attester: "0X0000000000000000000000000000000000000001" });
    expect(filtered.map((s) => s.attestationUID)).toEqual(["0x30"]);
  });

  it("no-filter returns everything", () => {
    expect(applyFilter(all, {}).length).toBe(all.length);
  });
});
