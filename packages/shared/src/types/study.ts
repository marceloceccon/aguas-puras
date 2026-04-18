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
