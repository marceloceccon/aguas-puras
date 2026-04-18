import { formatTimestamp, shortAddr } from "@/lib/format";
import type { IndexedFieldAgent } from "@/lib/ponder";

export function FieldAgentsCard({ agents }: { agents: IndexedFieldAgent[] }) {
  if (agents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-aqua-500/30 bg-white/50 p-4 text-xs text-aqua-700 dark:bg-aqua-900/30 dark:text-aqua-50/70">
        No active field agents registered yet. Agents self-register via the Capture PWA →
        Register as Field Agent.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-aqua-500/20 bg-white/50 p-4 dark:bg-aqua-900/30">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-aqua-700/70 dark:text-aqua-50/60">
          Active field agents
        </span>
        <span className="font-mono text-sm text-aqua-900 dark:text-aqua-50">{agents.length}</span>
      </div>
      <ul className="space-y-1">
        {agents.slice(0, 8).map((a) => (
          <li
            key={a.address}
            className="flex items-center justify-between gap-3 rounded-lg border border-aqua-500/10 bg-white/70 px-3 py-1.5 text-xs dark:bg-aqua-900/40"
          >
            <code className="font-mono text-aqua-900 dark:text-aqua-50">{shortAddr(a.address)}</code>
            <span className="text-aqua-700/70 dark:text-aqua-50/60">
              since {formatTimestamp(a.registeredAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
