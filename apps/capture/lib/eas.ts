/**
 * EAS-aligned attestation helpers.
 *
 * The MVP implements a minimal, EAS-compatible attestation envelope: the
 * collector signs a canonical JSON payload and the resulting (dataHash,
 * attestationUID) tuple is what gets submitted to WaterSampleRegistry.
 *
 * Full on-chain EAS integration (EAS.attest / attestByDelegation against a
 * registered schema UID on Base) is deferred — see specification.md §3.
 *
 * Schema (per spec §3):
 *   uint256 timestamp, uint256 lat, uint256 lon, string collectorName,
 *   string imageCid, string labReadingsJson, string notes
 */

import { encodePacked, keccak256, type Hex } from "viem";
import type { SampleDraft } from "./types";

export interface AttestationPayload {
  timestamp: bigint;
  lat: bigint;
  lon: bigint;
  collectorName: string;
  imageCid: string;
  labReadingsJson: string;
  notes: string;
}

const LATLON_SCALE = 1_000_000n;
const LATLON_BIAS = 180n * LATLON_SCALE;

/** Fixed-point encode lat/lon at 6 decimals, biased by +180 deg so the value fits in uint256. */
export function encodeLatLon(value: number): bigint {
  return BigInt(Math.round(value * 1_000_000)) + LATLON_BIAS;
}

export function buildPayload(draft: SampleDraft): AttestationPayload {
  if (draft.lat === undefined || draft.lon === undefined) {
    throw new Error("Draft missing GPS fix");
  }
  return {
    timestamp: BigInt(Math.floor(draft.createdAt / 1000)),
    lat: encodeLatLon(draft.lat),
    lon: encodeLatLon(draft.lon),
    collectorName: draft.collectorName,
    imageCid: draft.imageCid ?? "",
    labReadingsJson: JSON.stringify(draft.labReadings ?? {}),
    notes: draft.notes ?? ""
  };
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
export function attestationUID(
  schemaUID: Hex,
  attester: Hex,
  hash: Hex
): Hex {
  return keccak256(encodePacked(["bytes32", "address", "bytes32"], [schemaUID, attester, hash]));
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

export const ZERO_SCHEMA_UID: Hex = `0x${"00".repeat(32)}` as Hex;

export function schemaUIDFromEnv(): Hex {
  const raw = process.env.NEXT_PUBLIC_EAS_SCHEMA_UID;
  if (!raw || raw === "") return ZERO_SCHEMA_UID;
  if (!/^0x[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error("NEXT_PUBLIC_EAS_SCHEMA_UID must be a 32-byte hex string");
  }
  return raw as Hex;
}
