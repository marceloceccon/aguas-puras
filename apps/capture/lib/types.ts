export type LabReadings = Record<string, number>;

export interface SampleDraft {
  id: string;
  createdAt: number;
  lat?: number;
  lon?: number;
  accuracyMeters?: number;
  collectorName: string;
  notes: string;
  labReadings: LabReadings;
  imageCid?: string;
  imageSha256?: string;
}

export interface AttestedSample extends SampleDraft {
  attestationUID: `0x${string}`;
  txHash: `0x${string}`;
  blockNumber?: bigint;
  attester: `0x${string}`;
  pinFallback?: true;
}

export type StepKey = "capture" | "form" | "review" | "sign" | "success";
