/**
 * EAS `WaterSampleAttestation` canonical codec. Shared between the Capture
 * PWA (which encodes + signs) and the public dashboard (which decodes + verifies).
 *
 * Schema (per specification.md §3):
 *   uint256 timestamp, uint256 lat, uint256 lon,
 *   string collectorName, string imageCid, string labReadingsJson, string notes
 *
 * Lat / lon use a fixed-point encoding at 6 decimals of precision, biased by
 * +180° to keep the value inside the uint256 domain for any point on Earth.
 */
import { encodePacked, keccak256, type Hex } from "viem";
import type { AttestationPayload } from "./types/attestation";

const LATLON_SCALE = 1_000_000;
const LATLON_BIAS = 180 * LATLON_SCALE;

export const ZERO_SCHEMA_UID: Hex = ("0x" + "00".repeat(32)) as Hex;

export function encodeLatLon(value: number): bigint {
  return BigInt(Math.round(value * LATLON_SCALE)) + BigInt(LATLON_BIAS);
}

export function decodeLatLon(encoded: bigint): number {
  return (Number(encoded) - LATLON_BIAS) / LATLON_SCALE;
}

/** Deterministic, canonical bytes for signing + dataHash. */
export function canonicalPayloadBytes(p: AttestationPayload): Hex {
  return encodePacked(
    ["uint256", "uint256", "uint256", "string", "string", "string", "string"],
    [p.timestamp, p.lat, p.lon, p.collectorName, p.imageCid, p.labReadingsJson, p.notes]
  );
}

export function dataHash(p: AttestationPayload): Hex {
  return keccak256(canonicalPayloadBytes(p));
}

/** Attestation UID: keccak256(schemaUID || attester || dataHash). Stable across retries. */
export function attestationUID(schemaUID: Hex, attester: Hex, hash: Hex): Hex {
  return keccak256(
    encodePacked(["bytes32", "address", "bytes32"], [schemaUID, attester, hash])
  );
}

/** Human-readable preimage for signMessage (shown in the wallet prompt). */
export function attestationMessage(schemaUID: Hex, p: AttestationPayload): string {
  return [
    "AguasPuras WaterSampleAttestation",
    `schema: ${schemaUID}`,
    `timestamp: ${p.timestamp.toString()}`,
    `lat: ${p.lat.toString()}`,
    `lon: ${p.lon.toString()}`,
    `collector: ${p.collectorName}`,
    `imageCid: ${p.imageCid}`,
    `readings: ${p.labReadingsJson}`,
    `notes: ${p.notes}`,
    `dataHash: ${dataHash(p)}`
  ].join("\n");
}
