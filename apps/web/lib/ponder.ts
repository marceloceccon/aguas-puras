import type { IndexedSample, LabReadings, ParsedSample } from "./types";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL ?? "http://localhost:42069/graphql";

export interface IndexedFieldAgent {
  address: `0x${string}`;
  active: boolean;
  encryptedPersonalDataCid: string;
  registeredAt: string;
  updatedAt: string;
  updateCount: number;
}

const SAMPLE_FIELDS = `
  attestationUID
  dataHash
  fieldAgent
  publisher
  publishedAt
  publishedBlock
  publishTxHash
  imageCid
  labReadingsJson
  reviewer
  reviewedAt
  reviewed
  labReadingsUpdatedAt
  labReadingsUpdater
`;

const SAMPLES_QUERY = `
  query Samples {
    samples(orderBy: "publishedAt", orderDirection: "desc", limit: 500) {
      items { ${SAMPLE_FIELDS} }
    }
  }
`;

const SAMPLE_QUERY = `
  query Sample($uid: String!) {
    sample(attestationUID: $uid) { ${SAMPLE_FIELDS} }
  }
`;

const AGENTS_QUERY = `
  query Agents {
    fieldAgents(where: { active: true }, orderBy: "registeredAt", orderDirection: "desc", limit: 100) {
      items {
        address
        active
        encryptedPersonalDataCid
        registeredAt
        updatedAt
        updateCount
      }
    }
  }
`;

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(PONDER_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Ponder GraphQL ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  if (!json.data) throw new Error("Empty GraphQL response");
  return json.data;
}

export async function fetchSamples(): Promise<ParsedSample[]> {
  try {
    const data = await gql<{ samples: { items: IndexedSample[] } }>(SAMPLES_QUERY);
    return data.samples.items.map(parseSample);
  } catch (err) {
    console.warn("[ponder] samples fetch failed:", err);
    return [];
  }
}

export async function fetchSample(uid: string): Promise<ParsedSample | null> {
  try {
    const data = await gql<{ sample: IndexedSample | null }>(SAMPLE_QUERY, { uid });
    if (!data.sample) return null;
    return parseSample(data.sample);
  } catch (err) {
    console.warn("[ponder] sample fetch failed:", err);
    return null;
  }
}

export async function fetchActiveFieldAgents(): Promise<IndexedFieldAgent[]> {
  try {
    const data = await gql<{ fieldAgents: { items: IndexedFieldAgent[] } }>(AGENTS_QUERY);
    return data.fieldAgents.items;
  } catch (err) {
    console.warn("[ponder] agents fetch failed:", err);
    return [];
  }
}

function parseSample(s: IndexedSample): ParsedSample {
  const readings = safeParseJson<LabReadings>(s.labReadingsJson) ?? {};
  const lat = typeof readings["_lat"] === "number" ? (readings["_lat"] as number) : null;
  const lon = typeof readings["_lon"] === "number" ? (readings["_lon"] as number) : null;
  const iso = new Date(Number(s.publishedAt) * 1000).toISOString();
  return { ...s, readings, lat, lon, iso };
}

function safeParseJson<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
