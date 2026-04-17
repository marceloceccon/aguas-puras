"use client";

import { useState } from "react";
import type { LabReadings } from "@/lib/types";

interface Props {
  initial: { collectorName: string; notes: string; labReadings: LabReadings };
  onBack: () => void;
  onContinue: (data: { collectorName: string; notes: string; labReadings: LabReadings }) => void;
}

const SUGGESTED_PARAMS = ["ecoli", "lead", "ph", "fluoride", "chlorine", "turbidity"] as const;

export function FormStep({ initial, onBack, onContinue }: Props) {
  const [collectorName, setCollectorName] = useState(initial.collectorName);
  const [notes, setNotes] = useState(initial.notes);
  const [readings, setReadings] = useState<LabReadings>(initial.labReadings);

  function setReading(param: string, raw: string) {
    setReadings((prev) => {
      const next = { ...prev };
      if (raw === "") {
        delete next[param];
      } else {
        const n = Number(raw);
        if (!Number.isNaN(n)) next[param] = n;
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="text-sm font-medium text-aqua-700 dark:text-aqua-50/80">Collector name</span>
        <input
          type="text"
          value={collectorName}
          onChange={(e) => setCollectorName(e.target.value)}
          placeholder="e.g. maria.base.eth"
          className="mt-1 h-11 w-full rounded-xl border border-aqua-500/30 bg-white/70 px-3 text-base text-aqua-900 placeholder:text-aqua-700/40 focus:border-aqua-500 focus:outline-none dark:bg-aqua-900/40 dark:text-aqua-50"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-aqua-700 dark:text-aqua-50/80">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Tide, weather, proximity to outflow, etc."
          className="mt-1 w-full rounded-xl border border-aqua-500/30 bg-white/70 px-3 py-2 text-base text-aqua-900 placeholder:text-aqua-700/40 focus:border-aqua-500 focus:outline-none dark:bg-aqua-900/40 dark:text-aqua-50"
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-aqua-700 dark:text-aqua-50/80">
          Field readings (optional)
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {SUGGESTED_PARAMS.map((p) => (
            <label key={p} className="block">
              <span className="text-xs uppercase tracking-wide text-aqua-700/70 dark:text-aqua-50/60">
                {p}
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={readings[p] ?? ""}
                onChange={(e) => setReading(p, e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-aqua-500/30 bg-white/70 px-2 font-mono text-sm text-aqua-900 focus:border-aqua-500 focus:outline-none dark:bg-aqua-900/40 dark:text-aqua-50"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="h-12 flex-1 rounded-xl border border-aqua-500/40 font-medium text-aqua-700 transition hover:bg-aqua-500/10 dark:text-aqua-50"
        >
          ← Back
        </button>
        <button
          disabled={!collectorName.trim()}
          onClick={() => onContinue({ collectorName: collectorName.trim(), notes: notes.trim(), labReadings: readings })}
          className="h-12 flex-1 rounded-xl bg-aqua-500 font-semibold text-white shadow transition hover:bg-aqua-700 disabled:opacity-40"
        >
          Review →
        </button>
      </div>
    </div>
  );
}
