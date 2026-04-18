"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { signedFetch, type AdminSigner } from "@/lib/admin-client";
import { shortAddr } from "@/lib/format";
import type { Study } from "@/lib/types";

type Trend = "up" | "down" | "flat";
interface FindingDraft {
  param: string;
  avg: string;
  trend: Trend;
}

interface StudyFileEntry {
  filename: string;
  study: Study;
}

type SaveStatus =
  | { kind: "idle" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string; issues?: Array<{ path: string; message: string }> };

const emptyForm = () => ({
  id: `study-${Date.now().toString(36)}`,
  title: "",
  date: new Date().toISOString().slice(0, 10),
  author: "",
  summary: "",
  refSamples: "",
  rawDataUrl: "",
  findings: [] as FindingDraft[],
  editingFilename: null as string | null
});

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const signer: AdminSigner | null = address
    ? { address, signMessageAsync: ({ message }) => signMessageAsync({ message }) }
    : null;

  const [files, setFiles] = useState<StudyFileEntry[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });

  const reloadFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/studies", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { items: StudyFileEntry[] };
      setFiles(json.items);
    } catch {
      setFiles([]);
    }
  }, []);

  useEffect(() => {
    if (isConnected) reloadFiles();
  }, [isConnected, reloadFiles]);

  const study: Study = useMemo(
    () => ({
      id: form.id,
      title: form.title,
      date: form.date,
      author: form.author,
      summary: form.summary,
      referencedSamples: form.refSamples
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      keyFindings: form.findings
        .filter((f) => f.param.trim() && f.avg.trim())
        .map((f) => ({ param: f.param.trim(), avg: Number(f.avg), trend: f.trend })),
      rawDataUrl: form.rawDataUrl.trim() || undefined
    }),
    [form]
  );

  const json = useMemo(() => JSON.stringify(study, null, 2), [study]);
  const filename = form.editingFilename ?? `${study.date}-${study.id.replace(/[^a-z0-9-]+/gi, "-")}.json`;
  const valid = Boolean(form.title.trim() && form.author.trim() && form.summary.trim());

  function loadForEdit(entry: StudyFileEntry) {
    setStatus({ kind: "idle" });
    setForm({
      id: entry.study.id,
      title: entry.study.title,
      date: entry.study.date,
      author: entry.study.author,
      summary: entry.study.summary,
      refSamples: entry.study.referencedSamples.join(", "),
      rawDataUrl: entry.study.rawDataUrl ?? "",
      findings: entry.study.keyFindings.map((f) => ({
        param: f.param,
        avg: String(f.avg),
        trend: f.trend
      })),
      editingFilename: entry.filename
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setStatus({ kind: "idle" });
    setForm(emptyForm());
  }

  async function handleSaveLocal() {
    setStatus({ kind: "idle" });
    if (!signer) {
      setStatus({ kind: "error", message: "Wallet not ready to sign." });
      return;
    }
    try {
      const res = await signedFetch(signer, "/api/studies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename, study })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({
          kind: "error",
          message: body.error ?? `HTTP ${res.status}`,
          issues: body.issues
        });
        return;
      }
      setStatus({ kind: "ok", message: `Saved ${body.path ?? filename}` });
      await reloadFiles();
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : String(e) });
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

  async function handleDelete(entry: StudyFileEntry) {
    if (typeof window !== "undefined" && !window.confirm(`Delete ${entry.filename}?`)) return;
    if (!signer) {
      setStatus({ kind: "error", message: "Wallet not ready to sign." });
      return;
    }
    const res = await signedFetch(signer, `/api/studies/${encodeURIComponent(entry.filename)}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setStatus({ kind: "error", message: body.error ?? `HTTP ${res.status}` });
      return;
    }
    setStatus({ kind: "ok", message: `Deleted ${entry.filename}` });
    if (form.editingFilename === entry.filename) resetForm();
    await reloadFiles();
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
          Connect a wallet to manage studies.
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

      <h1 className="mt-4 text-2xl font-semibold text-aqua-900 dark:text-aqua-50">
        Admin · {form.editingFilename ? "Edit study" : "New study"}
      </h1>
      <p className="mt-1 text-sm text-aqua-700 dark:text-aqua-50/70">
        Studies are versioned JSON files under <code>/studies/</code>. Save locally (dev) or
        download and commit. Server validates shape before writing.
      </p>

      {files.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-aqua-700 dark:text-aqua-50/80">
            Existing studies ({files.length})
          </h2>
          <ul className="mt-2 divide-y divide-aqua-500/15 overflow-hidden rounded-2xl border border-aqua-500/20 bg-white/50 dark:bg-aqua-900/30">
            {files.map((f) => (
              <li key={f.filename} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-aqua-900 dark:text-aqua-50">{f.study.title}</div>
                  <div className="text-[11px] text-aqua-700/70 dark:text-aqua-50/60">
                    {f.study.date} · {f.filename}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => loadForEdit(f)}
                    className="rounded-full border border-aqua-500/40 px-3 py-1 text-xs text-aqua-700 hover:bg-aqua-500/10 dark:text-aqua-50"
                  >
                    edit
                  </button>
                  <button
                    onClick={() => handleDelete(f)}
                    className="rounded-full border border-red-300/60 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField label="ID" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
        <TextField label="Date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" />
        <TextField
          label="Title"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
          className="md:col-span-2"
        />
        <TextField
          label="Author"
          value={form.author}
          onChange={(v) => setForm({ ...form, author: v })}
          placeholder="e.g. maria.base.eth"
        />
        <TextField
          label="Raw data URL"
          value={form.rawDataUrl}
          onChange={(v) => setForm({ ...form, rawDataUrl: v })}
          placeholder="optional"
        />
        <TextArea
          label="Summary"
          value={form.summary}
          onChange={(v) => setForm({ ...form, summary: v })}
          rows={4}
          className="md:col-span-2"
        />
        <TextArea
          label="Referenced sample UIDs (comma-separated 0x…)"
          value={form.refSamples}
          onChange={(v) => setForm({ ...form, refSamples: v })}
          rows={2}
          className="md:col-span-2"
        />
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-aqua-700 dark:text-aqua-50/80">Key findings</h2>
          <button
            onClick={() => setForm({ ...form, findings: [...form.findings, { param: "", avg: "", trend: "flat" }] })}
            className="rounded-full border border-aqua-500/40 px-3 py-1 text-xs text-aqua-700 hover:bg-aqua-500/10 dark:text-aqua-50"
          >
            + add finding
          </button>
        </div>
        <ul className="mt-2 space-y-2">
          {form.findings.map((f, i) => (
            <li key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2">
              <input
                value={f.param}
                onChange={(e) =>
                  setForm({
                    ...form,
                    findings: form.findings.map((p, idx) => (idx === i ? { ...p, param: e.target.value } : p))
                  })
                }
                placeholder="param"
                className="h-10 rounded-lg border border-aqua-500/30 bg-white/70 px-2 text-sm dark:bg-aqua-900/40"
              />
              <input
                value={f.avg}
                onChange={(e) =>
                  setForm({
                    ...form,
                    findings: form.findings.map((p, idx) => (idx === i ? { ...p, avg: e.target.value } : p))
                  })
                }
                placeholder="avg"
                type="number"
                step="any"
                className="h-10 rounded-lg border border-aqua-500/30 bg-white/70 px-2 text-sm dark:bg-aqua-900/40"
              />
              <select
                value={f.trend}
                onChange={(e) =>
                  setForm({
                    ...form,
                    findings: form.findings.map((p, idx) => (idx === i ? { ...p, trend: e.target.value as Trend } : p))
                  })
                }
                className="h-10 rounded-lg border border-aqua-500/30 bg-white/70 px-2 text-sm dark:bg-aqua-900/40"
              >
                <option value="up">up</option>
                <option value="down">down</option>
                <option value="flat">flat</option>
              </select>
              <button
                onClick={() => setForm({ ...form, findings: form.findings.filter((_, idx) => idx !== i) })}
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

      {status.kind === "ok" && (
        <p className="mt-4 rounded-lg border border-aqua-500/30 bg-aqua-50 p-3 text-sm text-aqua-900 dark:bg-aqua-900/40 dark:text-aqua-50">
          {status.message}
        </p>
      )}
      {status.kind === "error" && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          <p>{status.message}</p>
          {status.issues && status.issues.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs">
              {status.issues.map((i, k) => (
                <li key={k}>
                  <code>{i.path || "(root)"}</code> — {i.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          disabled={!valid}
          onClick={handleSaveLocal}
          className="h-12 rounded-xl bg-aqua-500 px-5 font-semibold text-white shadow transition hover:bg-aqua-700 disabled:opacity-40"
        >
          {form.editingFilename ? "Sign + save changes" : "Sign + save to /studies"}
        </button>
        <button
          disabled={!valid}
          onClick={handleDownload}
          className="h-12 rounded-xl border border-aqua-500/40 px-5 font-medium text-aqua-700 transition hover:bg-aqua-500/10 disabled:opacity-40 dark:text-aqua-50"
        >
          Download JSON
        </button>
        {form.editingFilename && (
          <button
            onClick={resetForm}
            className="h-12 rounded-xl border border-aqua-500/40 px-5 font-medium text-aqua-700 transition hover:bg-aqua-500/10 dark:text-aqua-50"
          >
            New study
          </button>
        )}
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
