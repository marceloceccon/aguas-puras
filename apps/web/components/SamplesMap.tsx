"use client";

import dynamic from "next/dynamic";
import type { ParsedSample } from "@/lib/types";

const InnerMap = dynamic(() => import("./SamplesMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-2xl border border-aqua-500/20 bg-white/50 text-sm text-aqua-700 dark:bg-aqua-900/30 dark:text-aqua-50/70">
      Loading map…
    </div>
  )
});

export function SamplesMap({ samples }: { samples: ParsedSample[] }) {
  return <InnerMap samples={samples} />;
}
