"use client";

import { useMemo, useState } from "react";
import type { Hex } from "viem";
import { useAccount, useConnect, useSignMessage, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  attestationMessage,
  attestationUID,
  buildPayload,
  dataHash,
  schemaUIDFromEnv
} from "@/lib/eas";
import { registryAddressFromEnv, waterSampleRegistryAbi } from "@/lib/registry";
import type { SampleDraft } from "@/lib/types";

interface Props {
  draft: SampleDraft;
  onBack: () => void;
  onSuccess: (result: { uid: Hex; txHash: Hex; attester: Hex }) => void;
}

export function SignStep({ draft, onBack, onSuccess }: Props) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { signMessageAsync, isPending: signing } = useSignMessage();
  const { writeContractAsync, isPending: submitting, data: txHash } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });
  const [err, setErr] = useState<string | null>(null);

  const payload = useMemo(() => {
    try {
      return buildPayload(draft);
    } catch (e) {
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

  async function handleSign() {
    setErr(null);
    if (!address) {
      setErr("Connect a wallet first.");
      return;
    }
    if (!payload) {
      setErr("Draft is missing GPS fix.");
      return;
    }
    if (!schemaUID) {
      setErr("NEXT_PUBLIC_EAS_SCHEMA_UID is invalid.");
      return;
    }
    try {
      const hash = dataHash(payload);
      const uid = attestationUID(schemaUID, address, hash);
      await signMessageAsync({ message: attestationMessage(schemaUID, payload) });
      const registry = registryAddressFromEnv();
      const tx = await writeContractAsync({
        address: registry,
        abi: waterSampleRegistryAbi,
        functionName: "registerSample",
        args: [uid, hash]
      });
      onSuccess({ uid, txHash: tx, attester: address });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  if (!isConnected) {
    const primary = connectors[0];
    return (
      <div className="space-y-4 rounded-xl border border-aqua-500/20 bg-white/50 p-5 dark:bg-aqua-900/30">
        <p className="text-sm text-aqua-700 dark:text-aqua-50/80">
          Connect a wallet to attest this sample on Base.
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

  const busy = signing || submitting || receipt.isLoading;
  const busyLabel = signing
    ? "Waiting for signature…"
    : submitting
      ? "Submitting to registry…"
      : receipt.isLoading
        ? "Waiting for confirmation…"
        : null;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-aqua-500/20 bg-white/50 p-4 text-xs text-aqua-700 dark:bg-aqua-900/30 dark:text-aqua-50/70">
        <p>Signer: <span className="font-mono text-aqua-900 dark:text-aqua-50">{address}</span></p>
        <p className="mt-1">
          A wallet prompt will ask you to sign the canonical attestation payload.
          Then a transaction calls <code>registerSample</code> on the
          WaterSampleRegistry.
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
          onClick={handleSign}
          className="h-12 flex-1 rounded-xl bg-aqua-500 font-semibold text-white shadow transition hover:bg-aqua-700 disabled:opacity-40"
        >
          {busy ? "Working…" : "Sign & submit"}
        </button>
      </div>
    </div>
  );
}
