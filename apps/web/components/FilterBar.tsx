"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const PARAM_OPTIONS = ["", "ecoli", "lead", "ph", "fluoride", "chlorine", "turbidity"];

export function FilterBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");
  const [param, setParam] = useState(sp.get("param") ?? "");
  const [attester, setAttester] = useState(sp.get("attester") ?? "");

  function apply() {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (param) q.set("param", param);
    if (attester) q.set("attester", attester);
    const s = q.toString();
    router.replace(s ? `/?${s}` : "/");
  }

  function reset() {
    setFrom("");
    setTo("");
    setParam("");
    setAttester("");
    router.replace("/");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="grid gap-2 rounded-2xl border border-aqua-500/20 bg-white/50 p-3 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto] dark:bg-aqua-900/30"
    >
      <label className="text-xs">
        <span className="mb-1 block font-medium uppercase tracking-wide text-aqua-700/70 dark:text-aqua-50/60">
          From
        </span>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 w-full rounded-lg border border-aqua-500/30 bg-white/80 px-2 text-sm text-aqua-900 dark:bg-aqua-900/40 dark:text-aqua-50"
        />
      </label>
      <label className="text-xs">
        <span className="mb-1 block font-medium uppercase tracking-wide text-aqua-700/70 dark:text-aqua-50/60">
          To
        </span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-9 w-full rounded-lg border border-aqua-500/30 bg-white/80 px-2 text-sm text-aqua-900 dark:bg-aqua-900/40 dark:text-aqua-50"
        />
      </label>
      <label className="text-xs">
        <span className="mb-1 block font-medium uppercase tracking-wide text-aqua-700/70 dark:text-aqua-50/60">
          Parameter
        </span>
        <select
          value={param}
          onChange={(e) => setParam(e.target.value)}
          className="h-9 w-full rounded-lg border border-aqua-500/30 bg-white/80 px-2 text-sm text-aqua-900 dark:bg-aqua-900/40 dark:text-aqua-50"
        >
          {PARAM_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p || "any"}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs">
        <span className="mb-1 block font-medium uppercase tracking-wide text-aqua-700/70 dark:text-aqua-50/60">
          Attester
        </span>
        <input
          type="text"
          value={attester}
          onChange={(e) => setAttester(e.target.value)}
          placeholder="0x…"
          className="h-9 w-full rounded-lg border border-aqua-500/30 bg-white/80 px-2 font-mono text-xs text-aqua-900 dark:bg-aqua-900/40 dark:text-aqua-50"
        />
      </label>
      <button
        type="submit"
        className="h-9 self-end rounded-lg bg-aqua-500 px-4 text-sm font-medium text-white hover:bg-aqua-700"
      >
        Apply
      </button>
      <button
        type="button"
        onClick={reset}
        className="h-9 self-end rounded-lg border border-aqua-500/40 px-3 text-sm text-aqua-700 hover:bg-aqua-500/10 dark:text-aqua-50"
      >
        Reset
      </button>
    </form>
  );
}
