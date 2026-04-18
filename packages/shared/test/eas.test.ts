import { describe, expect, it } from "vitest";
import {
  ZERO_SCHEMA_UID,
  attestationMessage,
  attestationUID,
  canonicalPayloadBytes,
  dataHash,
  decodeLatLon,
  encodeLatLon,
  type AttestationPayload
} from "../src/eas";

const sampleSchema = `0x${"ab".repeat(32)}` as const;
const attester = "0x000000000000000000000000000000000000dEaD" as const;

function payload(): AttestationPayload {
  return {
    timestamp: 1_700_000_000n,
    lat: encodeLatLon(-27.439),
    lon: encodeLatLon(-48.497),
    collectorName: "maria.base.eth",
    imageCid: "bafybeigdyrzt",
    labReadingsJson: '{"ecoli":120,"lead":0.005}',
    notes: "Jurerê outflow"
  };
}

describe("encodeLatLon / decodeLatLon", () => {
  it("round-trips at 6-decimal precision", () => {
    for (const v of [0, -27.439, 48.497, -90, 90, -180, 180, -0.000001]) {
      const encoded = encodeLatLon(v);
      const decoded = decodeLatLon(encoded);
      expect(decoded).toBeCloseTo(v, 6);
    }
  });

  it("is bias-positive for negative coordinates", () => {
    // encoded value is always >= 0 because we shift by +180 degrees.
    expect(encodeLatLon(-179.999999)).toBeGreaterThan(0n);
  });
});

describe("canonicalPayloadBytes / dataHash", () => {
  it("is deterministic", () => {
    const p = payload();
    expect(canonicalPayloadBytes(p)).toEqual(canonicalPayloadBytes(p));
    expect(dataHash(p)).toEqual(dataHash(p));
  });

  it("changes when any field changes", () => {
    const base = payload();
    const variants: Array<Partial<AttestationPayload>> = [
      { timestamp: base.timestamp + 1n },
      { lat: base.lat + 1n },
      { lon: base.lon + 1n },
      { collectorName: base.collectorName + "!" },
      { imageCid: base.imageCid + "!" },
      { labReadingsJson: base.labReadingsJson + "!" },
      { notes: base.notes + "!" }
    ];
    const h0 = dataHash(base);
    for (const v of variants) {
      const h = dataHash({ ...base, ...v });
      expect(h).not.toEqual(h0);
    }
  });
});

describe("attestationUID", () => {
  it("is deterministic given schema + attester + dataHash", () => {
    const p = payload();
    const h = dataHash(p);
    const a = attestationUID(sampleSchema, attester, h);
    const b = attestationUID(sampleSchema, attester, h);
    expect(a).toEqual(b);
  });

  it("differs across attesters", () => {
    const h = dataHash(payload());
    const a = attestationUID(sampleSchema, attester, h);
    const b = attestationUID(
      sampleSchema,
      "0x0000000000000000000000000000000000000001",
      h
    );
    expect(a).not.toEqual(b);
  });

  it("differs across schemas", () => {
    const h = dataHash(payload());
    const a = attestationUID(sampleSchema, attester, h);
    const b = attestationUID(ZERO_SCHEMA_UID, attester, h);
    expect(a).not.toEqual(b);
  });
});

describe("attestationMessage", () => {
  it("includes the dataHash line", () => {
    const p = payload();
    const m = attestationMessage(sampleSchema, p);
    expect(m).toContain(`dataHash: ${dataHash(p)}`);
  });

  it("puts every schema-visible field on its own labeled line", () => {
    const m = attestationMessage(sampleSchema, payload());
    for (const label of [
      "timestamp",
      "lat",
      "lon",
      "collector",
      "imageCid",
      "readings",
      "notes"
    ]) {
      expect(m).toMatch(new RegExp(`^${label}:`, "m"));
    }
  });
});
