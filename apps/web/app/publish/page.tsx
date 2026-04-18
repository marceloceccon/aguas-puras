"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Hex } from "viem";
import { useAccount, useConnect, useDisconnect, useSignMessage, useWriteContract } from "wagmi";
import { signedFetch, type AdminSigner } from "@/lib/admin-client";
import { shortAddr } from "@/lib/format";
import { registryAddress, waterSampleRegistryWriteAbi } from "@/lib/registry";
import type { PendingEnvelope } from "@/lib/pending";

export default function PublishPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync, isPending: publishing } = useWriteContract();

  const signer: AdminSigner | null = useMemo(
    () =>
      address
        ? { address, signMessageAsync: ({ message }) => signMessageAsync({ message }) }
        : null,
    [address, signMessageAsync]
  );

  const [items, setItems] = useState<PendingEnvelope[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!signer) return;
    try {
      const res = await signedFetch(signer, "/api/samples/pending");
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setStatus(b.error ?? `HTTP ${res.status}`);
        return;
      }
      const body = (await res.json()) as { items: PendingEnvelope[] };
      setItems(body.items);
      setStatus(null);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }, [signer]);

  useEffect(() => {
    if (isConnected) reload();
  }, [isConnected, reload]);

  async function publish(env: PendingEnvelope) {
    if (!signer) return;
    setBusyUid(env.uid);
    setStatus(null);
    try {
      const tx = await writeContractAsync({
        address: registryAddress(),
        abi: waterSampleRegistryWriteAbi,
        functionName: "publishSample",
        args: [
          env.fieldAgent,
          env.uid,
          env.dataHash,
          env.imageCid,
          env.payload.labReadingsJson
        ]
      });
      setStatus(`Published ${env.uid.slice(0, 10)}… tx ${tx}`);
      // Remove from inbox.
      await signedFetch(signer, `/api/samples/pending/${env.uid}`, { method: "DELETE" });
      await reload();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyUid(null);
    }
  }

  if (!isConnected) {
    const primary = connectors[0];
    return (
      <main className="mx-auto max-w-lg px-5 pb-20 pt-16">
        <Link href="/" className="text-sm text-aqua-700 hover:underline dark:text-aqua-50/80">
          ← Dashboard
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-aqua-900 dark:text-aqua-50">
          Laboratory · Publish
        </h1>
        <p className="mt-2 text-sm text-aqua-700 dark:text-aqua-50/70">
          Connect a wallet with PUBLISHER_ROLE + ADMIN_ALLOWLIST membership to publish pending
          field-agent envelopes.
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
        Laboratory · Publish pending envelopes
      </h1>
      <p className="mt-1 text-sm text-aqua-700 dark:text-aqua-50/70">
        Field agents sign attestations off-chain. Verify the envelope, then publish on Base.
      </p>

      {status && (
        <p className="mt-4 rounded-lg border border-aqua-500/20 bg-white/50 p-3 text-sm text-aqua-900 dark:bg-aqua-900/30 dark:text-aqua-50">
          {status}
        </p>
      )}

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-aqua-500/30 bg-white/50 p-8 text-center text-sm text-aqua-700 dark:bg-aqua-900/30 dark:text-aqua-50/70">
          Inbox is empty.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((env) => (
            <li
              key={env.uid}
              className="rounded-2xl border border-aqua-500/20 bg-white/50 p-4 dark:bg-aqua-900/30"
            >
              <div className="flex items-baseline justify-between gap-3">
                <code className="truncate font-mono text-xs text-aqua-900 dark:text-aqua-50">
                  {env.uid.slice(0, 14)}…{env.uid.slice(-10)}
                </code>
                <time className="text-xs text-aqua-700/70 dark:text-aqua-50/60">
                  {new Date(env.submittedAt).toLocaleString()}
                </time>
              </div>
              <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-xs">
                <dt className="text-aqua-700/70 dark:text-aqua-50/60">field agent</dt>
                <dd className="font-mono">{shortAddr(env.fieldAgent)}</dd>
                <dt className="text-aqua-700/70 dark:text-aqua-50/60">collector</dt>
                <dd>{env.payload.collectorName}</dd>
                <dt className="text-aqua-700/70 dark:text-aqua-50/60">imageCid</dt>
                <dd className="break-all font-mono">{env.imageCid || "—"}</dd>
                <dt className="text-aqua-700/70 dark:text-aqua-50/60">readings</dt>
                <dd className="break-all font-mono">{env.payload.labReadingsJson}</dd>
              </dl>
              <button
                disabled={publishing || busyUid === env.uid}
                onClick={() => publish(env)}
                className="mt-3 h-10 w-full rounded-xl bg-aqua-500 text-sm font-semibold text-white hover:bg-aqua-700 disabled:opacity-40"
              >
                {busyUid === env.uid ? "Publishing…" : "Publish on Base"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
