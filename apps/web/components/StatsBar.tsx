import { formatTimestamp } from "@/lib/format";
import type { ParsedSample } from "@/lib/types";

interface Props {
  total: number;
  shown: ParsedSample[];
  filtered: boolean;
}

export function StatsBar({ total, shown, filtered }: Props) {
  const last = shown[0];
  const latest = last ? formatTimestamp(last.blockTimestamp) : "—";
  const label = filtered ? `${shown.length} of ${total}` : `${total}`;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-aqua-700/80 dark:text-aqua-50/70">
      <span>
        <span className="font-mono text-sm font-semibold text-aqua-900 dark:text-aqua-50">{label}</span>{" "}
        sample{shown.length === 1 ? "" : "s"}
      </span>
      <span>
        Latest:{" "}
        <span className="font-mono text-aqua-900 dark:text-aqua-50">{latest}</span>
      </span>
      <a
        href={exportUrl(filtered)}
        className="rounded-full border border-aqua-500/40 px-3 py-1 text-aqua-700 hover:bg-aqua-500/10 dark:text-aqua-50"
      >
        Export CSV ↓
      </a>
    </div>
  );
}

function exportUrl(filtered: boolean): string {
  if (typeof window === "undefined") return "/api/samples.csv";
  return filtered ? `/api/samples.csv${window.location.search}` : "/api/samples.csv";
}
