import type { Hex } from "viem";

/**
 * Canonical EAS WaterSampleAttestation payload. Field ordering MUST match the
 * on-chain schema string and the encodePacked call in `eas.ts::canonicalPayloadBytes`;
 * any reordering silently changes `dataHash` and breaks verification.
 */
export interface AttestationPayload {
  timestamp: bigint;
  lat: bigint;
  lon: bigint;
  collectorName: string;
  imageCid: string;
  labReadingsJson: string;
  notes: string;
}

/** Field-agent → Laboratory inbox envelope. */
export interface PendingEnvelope {
  schema: Hex;
  fieldAgent: `0x${string}`;
  uid: Hex;
  dataHash: Hex;
  imageCid: string;
  payload: {
    timestamp: string;
    lat: string;
    lon: string;
    collectorName: string;
    imageCid: string;
    labReadingsJson: string;
    notes: string;
  };
  message: string;
  signature: Hex;
  submittedAt: number;
}
