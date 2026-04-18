"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ParsedSample } from "@/lib/types";

interface Props {
  samples: ParsedSample[];
  param: string;
}

export function ReadingsChart({ samples, param }: Props) {
  const series = samples
    .filter((s) => typeof s.readings[param] === "number")
    .map((s) => ({
      t: new Date(Number(s.publishedAt) * 1000).toLocaleDateString(),
      v: s.readings[param]
    }))
    .reverse();

  if (series.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-2xl border border-aqua-500/20 bg-white/50 text-xs text-aqua-700 dark:bg-aqua-900/30 dark:text-aqua-50/70">
        No <span className="mx-1 font-mono">{param}</span> readings yet.
      </div>
    );
  }

  return (
    <div className="h-44 rounded-2xl border border-aqua-500/20 bg-white/50 p-3 dark:bg-aqua-900/30">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-aqua-700/80 dark:text-aqua-50/70">
        {param}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(10,168,204,0.15)" />
          <XAxis dataKey="t" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="v" stroke="#0aa8cc" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
