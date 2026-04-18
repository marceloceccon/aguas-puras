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

export type LabReadings = Record<string, number | string>;

export interface ParsedSample extends IndexedSample {
  readings: LabReadings;
  lat: number | null;
  lon: number | null;
  iso: string;
}

export interface Study {
  id: string;
  title: string;
  date: string;
  author: string;
  summary: string;
  referencedSamples: string[];
  keyFindings: Array<{ param: string; avg: number; trend: "up" | "down" | "flat" }>;
  charts?: string[];
  rawDataUrl?: string;
}
