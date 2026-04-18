import { formatTimestamp, shortAddr } from "@/lib/format";
import type { IndexedCollector } from "@/lib/ponder";

export function CollectorsCard({ collectors }: { collectors: IndexedCollector[] }) {
  if (collectors.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-aqua-500/30 bg-white/50 p-4 text-xs text-aqua-700 dark:bg-aqua-900/30 dark:text-aqua-50/70">
        No approved collectors on-chain yet. Run <code>approveCollector</code> on
        CollectorRegistry to populate.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-aqua-500/20 bg-white/50 p-4 dark:bg-aqua-900/30">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-aqua-700/70 dark:text-aqua-50/60">
          Approved collectors
        </span>
        <span className="font-mono text-sm text-aqua-900 dark:text-aqua-50">{collectors.length}</span>
      </div>
      <ul className="space-y-1">
        {collectors.slice(0, 8).map((c) => (
          <li
            key={c.address}
            className="flex items-center justify-between gap-3 rounded-lg border border-aqua-500/10 bg-white/70 px-3 py-1.5 text-xs dark:bg-aqua-900/40"
          >
            <code className="font-mono text-aqua-900 dark:text-aqua-50">{shortAddr(c.address)}</code>
            <span className="text-aqua-700/70 dark:text-aqua-50/60">
              since {formatTimestamp(c.lastChangedAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
