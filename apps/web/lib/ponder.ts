import type { IndexedSample, LabReadings, ParsedSample } from "./types";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL ?? "http://localhost:42069/graphql";

const SAMPLES_QUERY = `
  query Samples {
    samples(orderBy: "blockTimestamp", orderDirection: "desc", limit: 500) {
      items {
        attestationUID
        dataHash
        attester
        blockNumber
        blockTimestamp
        txHash
        labReadingsJson
        labReadingsUpdatedAt
        labReadingsUpdater
      }
    }
  }
`;

const SAMPLE_QUERY = `
  query Sample($uid: String!) {
    sample(attestationUID: $uid) {
      attestationUID
      dataHash
      attester
      blockNumber
      blockTimestamp
      txHash
      labReadingsJson
      labReadingsUpdatedAt
      labReadingsUpdater
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
  if (!res.ok) {
    throw new Error(`Ponder GraphQL ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
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

function parseSample(s: IndexedSample): ParsedSample {
  const readings = safeParseJson<LabReadings>(s.labReadingsJson ?? "") ?? {};
  const lat = typeof readings["_lat"] === "number" ? (readings["_lat"] as number) : null;
  const lon = typeof readings["_lon"] === "number" ? (readings["_lon"] as number) : null;
  const iso = new Date(Number(s.blockTimestamp) * 1000).toISOString();
  return { ...s, readings, lat, lon, iso };
}

function safeParseJson<T>(s: string): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
