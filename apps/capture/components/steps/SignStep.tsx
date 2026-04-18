"use client";

import { useMemo, useState } from "react";
import type { Hex } from "viem";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import {
  attestationMessage,
  attestationUID,
  buildPayload,
  dataHash,
  schemaUIDFromEnv
} from "@/lib/eas";
import type { SampleDraft } from "@/lib/types";

export interface EnvelopeResult {
  uid: Hex;
  fieldAgent: Hex;
  dataHash: Hex;
  imageCid: string;
  signature: Hex;
  submittedId: string;
}

interface Props {
  draft: SampleDraft;
  onBack: () => void;
  onSuccess: (result: EnvelopeResult) => void;
}

const INBOX_URL =
  (process.env.NEXT_PUBLIC_VERIFIER_ORIGIN ?? "http://localhost:3001").replace(/\/$/, "") +
  "/api/samples/pending";

export function SignStep({ draft, onBack, onSuccess }: Props) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { signMessageAsync, isPending: signing } = useSignMessage();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const payload = useMemo(() => {
    try {
      return buildPayload(draft);
    } catch {
      return null;
    }
  }, [draft]);

  const schemaUID = useMemo(() => {
    try {
      return schemaUIDFromEnv();
    } catch {
      return null;
    }
  }, []);

  async function handleSubmit() {
    setErr(null);
    if (!address) return setErr("Connect a wallet first.");
    if (!payload) return setErr("Draft is missing GPS fix.");
    if (!schemaUID) return setErr("NEXT_PUBLIC_EAS_SCHEMA_UID_* is not configured.");

    try {
      const hash = dataHash(payload);
      const uid = attestationUID(schemaUID, address, hash);
      const message = attestationMessage(schemaUID, payload);
      const signature = (await signMessageAsync({ message })) as Hex;

      setSubmitting(true);
      const envelope = {
        schema: schemaUID,
        fieldAgent: address,
        uid,
        dataHash: hash,
        imageCid: draft.imageCid ?? "",
        payload: {
          timestamp: payload.timestamp.toString(),
          lat: payload.lat.toString(),
          lon: payload.lon.toString(),
          collectorName: payload.collectorName,
          imageCid: payload.imageCid,
          labReadingsJson: payload.labReadingsJson,
          notes: payload.notes
        },
        message,
        signature,
        submittedAt: Date.now()
      };

      const res = await fetch(INBOX_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(envelope)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Inbox rejected the envelope (HTTP ${res.status})`);
      }
      const body = (await res.json()) as { id: string };
      onSuccess({
        uid,
        fieldAgent: address,
        dataHash: hash,
        imageCid: draft.imageCid ?? "",
        signature,
        submittedId: body.id
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (!isConnected) {
    const primary = connectors[0];
    return (
      <div className="space-y-4 rounded-xl border border-aqua-500/20 bg-white/50 p-5 dark:bg-aqua-900/30">
        <p className="text-sm text-aqua-700 dark:text-aqua-50/80">
          Connect a wallet to sign this sample. The Laboratory will publish it on-chain — you
          pay no gas.
        </p>
        <button
          disabled={!primary || connecting}
          onClick={() => primary && connect({ connector: primary })}
          className="h-12 w-full rounded-xl bg-aqua-900 font-semibold text-white transition hover:bg-aqua-700 disabled:opacity-50 dark:bg-aqua-50 dark:text-aqua-900"
        >
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
      </div>
    );
  }

  const busy = signing || submitting;
  const busyLabel = signing
    ? "Waiting for signature…"
    : submitting
      ? "Submitting to Laboratory inbox…"
      : null;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-aqua-500/20 bg-white/50 p-4 text-xs text-aqua-700 dark:bg-aqua-900/30 dark:text-aqua-50/70">
        <p>
          Field Agent: <span className="font-mono text-aqua-900 dark:text-aqua-50">{address}</span>
        </p>
        <p className="mt-1">
          A wallet prompt will ask you to sign the canonical attestation payload. The signed
          envelope is submitted to the Laboratory inbox; a Lab Publisher will publish it on-chain
          after verifying the signature. You pay no gas.
        </p>
      </section>

      {busyLabel && <p className="text-sm text-aqua-700 dark:text-aqua-50/70">{busyLabel}</p>}
      {err && <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      <div className="flex gap-3">
        <button
          disabled={busy}
          onClick={onBack}
          className="h-12 flex-1 rounded-xl border border-aqua-500/40 font-medium text-aqua-700 transition hover:bg-aqua-500/10 disabled:opacity-40 dark:text-aqua-50"
        >
          ← Back
        </button>
        <button
          disabled={busy}
          onClick={handleSubmit}
          className="h-12 flex-1 rounded-xl bg-aqua-500 font-semibold text-white shadow transition hover:bg-aqua-700 disabled:opacity-40"
        >
          {busy ? "Working…" : "Sign & submit"}
        </button>
      </div>
    </div>
  );
}
