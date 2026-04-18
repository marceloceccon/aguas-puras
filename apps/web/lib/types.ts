export interface IndexedSample {
  attestationUID: `0x${string}`;
  dataHash: `0x${string}`;
  attester: `0x${string}`;
  blockNumber: string;
  blockTimestamp: string;
  txHash: `0x${string}`;
  labReadingsJson: string | null;
  labReadingsUpdatedAt: string | null;
  labReadingsUpdater: `0x${string}` | null;
}

export interface LabReadings {
  [param: string]: number;
}

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
