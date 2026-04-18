import type { Study } from "@/lib/types";

export function StudiesFeed({ studies }: { studies: Study[] }) {
  if (studies.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-aqua-500/30 bg-white/50 p-6 text-sm text-aqua-700 dark:bg-aqua-900/30 dark:text-aqua-50/70">
        No studies published yet. Researchers can draft one in the admin panel.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {studies.map((s) => (
        <li
          key={s.id}
          className="rounded-2xl border border-aqua-500/20 bg-white/50 p-4 dark:bg-aqua-900/30"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-base font-semibold text-aqua-900 dark:text-aqua-50">{s.title}</h3>
            <time className="text-xs text-aqua-700/70 dark:text-aqua-50/60">{s.date}</time>
          </div>
          <p className="mt-1 text-xs text-aqua-700/80 dark:text-aqua-50/60">
            by <span className="font-mono">{s.author}</span> · {s.referencedSamples.length} samples referenced
          </p>
          <p className="mt-2 text-sm text-aqua-900/90 dark:text-aqua-50/80">{s.summary}</p>
          {s.keyFindings.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {s.keyFindings.map((f, i) => (
                <li
                  key={i}
                  className="rounded-full border border-aqua-500/30 bg-aqua-50 px-2 py-0.5 text-xs text-aqua-900 dark:bg-aqua-900/40 dark:text-aqua-50"
                >
                  <span className="font-medium">{f.param}</span>{" "}
                  <span className="font-mono">avg {f.avg}</span>{" "}
                  <span className="text-aqua-700">{trendArrow(f.trend)}</span>
                </li>
              ))}
            </ul>
          )}
          {s.rawDataUrl && (
            <a
              href={s.rawDataUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs text-aqua-700 underline dark:text-aqua-50/80"
            >
              raw data →
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function trendArrow(t: Study["keyFindings"][number]["trend"]): string {
  return t === "up" ? "↑" : t === "down" ? "↓" : "→";
}
