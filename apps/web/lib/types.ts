import type { LabReadings, Study } from "@aguas/shared";

export type { LabReadings, Study };

/** Shape returned by Ponder's GraphQL for the `sample` table. */
export interface IndexedSample {
  attestationUID: `0x${string}`;
  dataHash: `0x${string}`;
  fieldAgent: `0x${string}`;
  publisher: `0x${string}`;
  publishedAt: string;
  publishedBlock: string;
  publishTxHash: `0x${string}`;
  imageCid: string;
  labReadingsJson: string;
  reviewer: `0x${string}` | null;
  reviewedAt: string | null;
  reviewed: boolean;
  labReadingsUpdatedAt: string | null;
  labReadingsUpdater: `0x${string}` | null;
}

/** Post-parse view of an IndexedSample — readings decoded, lat/lon extracted. */
export interface ParsedSample extends IndexedSample {
  readings: LabReadings;
  lat: number | null;
  lon: number | null;
  iso: string;
}
