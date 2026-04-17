"use client";

import type { SampleDraft } from "@/lib/types";

interface Props {
  draft: SampleDraft;
  previewUrl: string;
  onBack: () => void;
  onSign: () => void;
}

export function ReviewStep({ draft, previewUrl, onBack, onSign }: Props) {
  const readingEntries = Object.entries(draft.labReadings);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-aqua-500/20">
        <img src={previewUrl} alt="Sample" className="max-h-72 w-full object-cover" />
      </section>

      <section className="rounded-xl border border-aqua-500/20 bg-white/50 p-4 dark:bg-aqua-900/30">
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm text-aqua-900 dark:text-aqua-50">
          <dt className="text-aqua-700/70 dark:text-aqua-50/60">collector</dt>
          <dd className="font-medium">{draft.collectorName}</dd>
          <dt className="text-aqua-700/70 dark:text-aqua-50/60">lat / lon</dt>
          <dd className="font-mono text-xs">
            {draft.lat?.toFixed(6)}, {draft.lon?.toFixed(6)}
          </dd>
          <dt className="text-aqua-700/70 dark:text-aqua-50/60">accuracy</dt>
          <dd className="font-mono text-xs">±{draft.accuracyMeters?.toFixed(0)} m</dd>
          <dt className="text-aqua-700/70 dark:text-aqua-50/60">image cid</dt>
          <dd className="truncate font-mono text-xs">{draft.imageCid ?? "—"}</dd>
          {draft.notes && (
            <>
              <dt className="text-aqua-700/70 dark:text-aqua-50/60">notes</dt>
              <dd className="whitespace-pre-wrap text-sm">{draft.notes}</dd>
            </>
          )}
        </dl>

        {readingEntries.length > 0 && (
          <div className="mt-4 border-t border-aqua-500/20 pt-3">
            <h4 className="text-xs font-medium uppercase tracking-wide text-aqua-700/70 dark:text-aqua-50/60">
              Readings
            </h4>
            <ul className="mt-1 grid grid-cols-2 gap-y-1 font-mono text-xs text-aqua-900 dark:text-aqua-50">
              {readingEntries.map(([k, v]) => (
                <li key={k} className="flex justify-between pr-3">
                  <span>{k}</span>
                  <span className="font-semibold">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="h-12 flex-1 rounded-xl border border-aqua-500/40 font-medium text-aqua-700 transition hover:bg-aqua-500/10 dark:text-aqua-50"
        >
          ← Back
        </button>
        <button
          onClick={onSign}
          className="h-12 flex-1 rounded-xl bg-aqua-900 font-semibold text-white shadow transition hover:bg-aqua-700 dark:bg-aqua-50 dark:text-aqua-900"
        >
          Sign on Base
        </button>
      </div>
    </div>
  );
}
