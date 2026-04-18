import Link from "next/link";
import { formatTimestamp, shortAddr, shortHash } from "@/lib/format";
import type { ParsedSample } from "@/lib/types";

export function SampleList({ samples }: { samples: ParsedSample[] }) {
  if (samples.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-aqua-500/30 bg-white/50 p-8 text-center text-sm text-aqua-700 dark:bg-aqua-900/30 dark:text-aqua-50/70">
        No samples indexed yet. Capture one in the{" "}
        <a className="underline" href="http://localhost:3000">Capture PWA</a>, then make sure the
        Ponder indexer is running.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-aqua-500/15 overflow-hidden rounded-2xl border border-aqua-500/20 bg-white/50 dark:bg-aqua-900/30">
      {samples.map((s) => (
        <li key={s.attestationUID}>
          <Link
            href={`/sample/${s.attestationUID}`}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-aqua-500/5"
          >
            <div className="min-w-0">
              <div className="truncate font-mono text-xs text-aqua-900 dark:text-aqua-50">
                {shortHash(s.attestationUID)}
              </div>
              <div className="text-[11px] text-aqua-700/70 dark:text-aqua-50/60">
                {formatTimestamp(s.blockTimestamp)} · by {shortAddr(s.attester)}
              </div>
            </div>
            <div className="shrink-0 text-xs text-aqua-700 dark:text-aqua-50/70">
              {Object.keys(s.readings).length} reading{Object.keys(s.readings).length === 1 ? "" : "s"}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
