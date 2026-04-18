import { applyFilter, parseFilter } from "@/lib/filter";
import { fetchSamples } from "@/lib/ponder";

const COLUMNS = ["attestationUID", "attester", "iso", "lat", "lon", "dataHash", "txHash", "readingsJson"] as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filter = parseFilter(Object.fromEntries(url.searchParams.entries()));
  const all = await fetchSamples();
  const filtered = applyFilter(all, filter);

  const rows = filtered.map((s) => [
    s.attestationUID,
    s.attester,
    s.iso,
    s.lat ?? "",
    s.lon ?? "",
    s.dataHash,
    s.txHash,
    JSON.stringify(s.readings)
  ]);

  const csv = [COLUMNS.join(","), ...rows.map(rowToCsv)].join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="aguas-samples-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store"
    }
  });
}

function rowToCsv(row: Array<string | number>): string {
  return row.map(csvEscape).join(",");
}

function csvEscape(v: string | number): string {
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
