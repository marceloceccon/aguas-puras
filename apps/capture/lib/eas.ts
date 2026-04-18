/**
 * App-local glue around the shared EAS codec (@aguas/shared/eas). Holds only
 * the env-resolution logic + draft→payload projection; the pure codec lives
 * in the shared package so capture and web stay bit-identical.
 */
import {
  ZERO_SCHEMA_UID,
  attestationMessage as sharedAttestationMessage,
  attestationUID as sharedAttestationUID,
  canonicalPayloadBytes as sharedCanonicalPayloadBytes,
  dataHash as sharedDataHash,
  encodeLatLon,
  type AttestationPayload
} from "@aguas/shared";
import type { Hex } from "viem";
import type { SampleDraft } from "./types";

export { ZERO_SCHEMA_UID, encodeLatLon };
export const canonicalPayloadBytes = sharedCanonicalPayloadBytes;
export const dataHash = sharedDataHash;
export const attestationUID = sharedAttestationUID;
export const attestationMessage = sharedAttestationMessage;
export type { AttestationPayload };

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

export function schemaUIDFromEnv(): Hex {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "0");
  const keyed =
    chainId === 8453
      ? process.env.NEXT_PUBLIC_EAS_SCHEMA_UID_BASE
      : chainId === 84532
        ? process.env.NEXT_PUBLIC_EAS_SCHEMA_UID_BASE_SEPOLIA
        : chainId === 31337
          ? process.env.NEXT_PUBLIC_EAS_SCHEMA_UID_ANVIL
          : undefined;
  const raw = keyed ?? process.env.NEXT_PUBLIC_EAS_SCHEMA_UID;
  if (!raw || raw === "") return ZERO_SCHEMA_UID;
  if (!/^0x[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error("EAS schema UID env must be a 32-byte hex string");
  }
  return raw as Hex;
}
