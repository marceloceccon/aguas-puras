"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortAddr } from "@/lib/format";
import type { Study } from "@/lib/types";

type Trend = "up" | "down" | "flat";
interface FindingDraft {
  param: string;
  avg: string;
  trend: Trend;
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();

  const [id, setId] = useState(() => `study-${Date.now().toString(36)}`);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [author, setAuthor] = useState("");
  const [summary, setSummary] = useState("");
  const [refSamples, setRefSamples] = useState("");
  const [rawDataUrl, setRawDataUrl] = useState("");
  const [findings, setFindings] = useState<FindingDraft[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const study: Study = useMemo(
    () => ({
      id,
      title,
      date,
      author,
      summary,
      referencedSamples: refSamples
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      keyFindings: findings
        .filter((f) => f.param.trim() && f.avg.trim())
        .map((f) => ({ param: f.param.trim(), avg: Number(f.avg), trend: f.trend })),
      rawDataUrl: rawDataUrl.trim() || undefined
    }),
    [id, title, date, author, summary, refSamples, rawDataUrl, findings]
  );

  const json = useMemo(() => JSON.stringify(study, null, 2), [study]);
  const filename = `${study.date}-${study.id.replace(/[^a-z0-9-]+/gi, "-")}.json`;
  const valid = Boolean(title.trim() && author.trim() && summary.trim());

  async function handleSaveLocal() {
    setSaveStatus(null);
    try {
      const res = await fetch("/api/studies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename, study })
      });
      if (!res.ok) throw new Error(await res.text());
      setSaveStatus(`Saved /studies/${filename}`);
    } catch (e) {
      setSaveStatus(e instanceof Error ? e.message : String(e));
    }
  }

  function handleDownload() {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!isConnected) {
    const primary = connectors[0];
    return (
      <main className="mx-auto max-w-lg px-5 pb-20 pt-16">
        <Link href="/" className="text-sm text-aqua-700 hover:underline dark:text-aqua-50/80">
          ← Dashboard
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-aqua-900 dark:text-aqua-50">Admin</h1>
        <p className="mt-2 text-sm text-aqua-700 dark:text-aqua-50/70">
          Connect a wallet to compose a study.
        </p>
        <button
          disabled={!primary || connecting}
          onClick={() => primary && connect({ connector: primary })}
          className="mt-6 h-12 w-full rounded-xl bg-aqua-900 font-semibold text-white transition hover:bg-aqua-700 disabled:opacity-50 dark:bg-aqua-50 dark:text-aqua-900"
        >
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-aqua-700 hover:underline dark:text-aqua-50/80">
          ← Dashboard
        </Link>
        <button
          onClick={() => disconnect()}
          className="rounded-full border border-aqua-500/40 px-3 py-1 text-xs text-aqua-700 hover:bg-aqua-500/10 dark:text-aqua-50"
        >
          {shortAddr(address ?? "")} · disconnect
        </button>
      </div>

      <h1 className="mt-4 text-2xl font-semibold text-aqua-900 dark:text-aqua-50">Admin · New study</h1>
      <p className="mt-1 text-sm text-aqua-700 dark:text-aqua-50/70">
        Studies are versioned JSON files under <code>/studies/</code>. Save locally (dev) or
        download and commit.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField label="ID" value={id} onChange={setId} />
        <TextField label="Date" value={date} onChange={setDate} type="date" />
        <TextField label="Title" value={title} onChange={setTitle} className="md:col-span-2" />
        <TextField label="Author" value={author} onChange={setAuthor} placeholder="e.g. maria.base.eth" />
        <TextField label="Raw data URL" value={rawDataUrl} onChange={setRawDataUrl} placeholder="optional" />
        <TextArea
          label="Summary"
          value={summary}
          onChange={setSummary}
          rows={4}
          className="md:col-span-2"
        />
        <TextArea
          label="Referenced sample UIDs (comma-separated)"
          value={refSamples}
          onChange={setRefSamples}
          rows={2}
          className="md:col-span-2"
        />
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-aqua-700 dark:text-aqua-50/80">Key findings</h2>
          <button
            onClick={() => setFindings((f) => [...f, { param: "", avg: "", trend: "flat" }])}
            className="rounded-full border border-aqua-500/40 px-3 py-1 text-xs text-aqua-700 hover:bg-aqua-500/10 dark:text-aqua-50"
          >
            + add finding
          </button>
        </div>
        <ul className="mt-2 space-y-2">
          {findings.map((f, i) => (
            <li key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2">
              <input
                value={f.param}
                onChange={(e) =>
                  setFindings((prev) => prev.map((p, idx) => (idx === i ? { ...p, param: e.target.value } : p)))
                }
                placeholder="param"
                className="h-10 rounded-lg border border-aqua-500/30 bg-white/70 px-2 text-sm dark:bg-aqua-900/40"
              />
              <input
                value={f.avg}
                onChange={(e) =>
                  setFindings((prev) => prev.map((p, idx) => (idx === i ? { ...p, avg: e.target.value } : p)))
                }
                placeholder="avg"
                type="number"
                step="any"
                className="h-10 rounded-lg border border-aqua-500/30 bg-white/70 px-2 text-sm dark:bg-aqua-900/40"
              />
              <select
                value={f.trend}
                onChange={(e) =>
                  setFindings((prev) =>
                    prev.map((p, idx) => (idx === i ? { ...p, trend: e.target.value as Trend } : p))
                  )
                }
                className="h-10 rounded-lg border border-aqua-500/30 bg-white/70 px-2 text-sm dark:bg-aqua-900/40"
              >
                <option value="up">up</option>
                <option value="down">down</option>
                <option value="flat">flat</option>
              </select>
              <button
                onClick={() => setFindings((prev) => prev.filter((_, idx) => idx !== i))}
                className="h-10 rounded-lg border border-aqua-500/30 px-3 text-sm text-aqua-700 hover:bg-aqua-500/10"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-aqua-700 dark:text-aqua-50/80">JSON preview</h2>
        <pre className="mt-2 max-h-80 overflow-auto rounded-xl border border-aqua-500/20 bg-white/70 p-3 font-mono text-xs text-aqua-900 dark:bg-aqua-900/40 dark:text-aqua-50">
{json}
        </pre>
        <p className="mt-2 text-xs text-aqua-700/70 dark:text-aqua-50/60">
          Filename: <code>{filename}</code>
        </p>
      </section>

      {saveStatus && (
        <p
          className={`mt-4 rounded-lg border p-3 text-sm ${
            saveStatus.startsWith("Saved")
              ? "border-aqua-500/30 bg-aqua-50 text-aqua-900 dark:bg-aqua-900/40 dark:text-aqua-50"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {saveStatus}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          disabled={!valid}
          onClick={handleSaveLocal}
          className="h-12 rounded-xl bg-aqua-500 px-5 font-semibold text-white shadow transition hover:bg-aqua-700 disabled:opacity-40"
        >
          Save to /studies (dev only)
        </button>
        <button
          disabled={!valid}
          onClick={handleDownload}
          className="h-12 rounded-xl border border-aqua-500/40 px-5 font-medium text-aqua-700 transition hover:bg-aqua-500/10 disabled:opacity-40 dark:text-aqua-50"
        >
          Download JSON
        </button>
      </div>
    </main>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}

function TextField({ label, value, onChange, placeholder, type = "text", className = "" }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-aqua-700/70 dark:text-aqua-50/60">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-aqua-500/30 bg-white/70 px-3 text-sm text-aqua-900 dark:bg-aqua-900/40 dark:text-aqua-50"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  className = ""
}: FieldProps & { rows?: number }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-aqua-700/70 dark:text-aqua-50/60">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-aqua-500/30 bg-white/70 px-3 py-2 text-sm text-aqua-900 dark:bg-aqua-900/40 dark:text-aqua-50"
      />
    </label>
  );
}
