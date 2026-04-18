"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Hex } from "viem";
import { useAccount, useConnect, useDisconnect, useWriteContract } from "wagmi";
import { shortAddr } from "@/lib/format";
import { registryAddress, waterSampleRegistryWriteAbi } from "@/lib/registry";

interface UnreviewedSample {
  attestationUID: `0x${string}`;
  fieldAgent: `0x${string}`;
  publisher: `0x${string}`;
  publishedAt: string;
  imageCid: string;
  labReadingsJson: string;
}

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL ?? "http://localhost:42069/graphql";

const UNREVIEWED_QUERY = `
  query Unreviewed {
    samples(where: { reviewed: false }, orderBy: "publishedAt", orderDirection: "desc", limit: 100) {
      items {
        attestationUID
        fieldAgent
        publisher
        publishedAt
        imageCid
        labReadingsJson
      }
    }
  }
`;

export default function ReviewPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync, isPending: reviewing } = useWriteContract();

  const [items, setItems] = useState<UnreviewedSample[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch(PONDER_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: UNREVIEWED_QUERY })
      });
      const body = (await res.json()) as {
        data?: { samples: { items: UnreviewedSample[] } };
        errors?: Array<{ message: string }>;
      };
      if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join("; "));
      setItems(body.data?.samples.items ?? []);
      setStatus(null);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    if (isConnected) reload();
  }, [isConnected, reload]);

  async function review(uid: Hex) {
    setBusyUid(uid);
    setStatus(null);
    try {
      const tx = await writeContractAsync({
        address: registryAddress(),
        abi: waterSampleRegistryWriteAbi,
        functionName: "reviewAndSign",
        args: [uid]
      });
      setStatus(`Reviewed ${uid.slice(0, 10)}… tx ${tx}`);
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
          Laboratory · Review
        </h1>
        <p className="mt-2 text-sm text-aqua-700 dark:text-aqua-50/70">
          Connect a wallet with REVIEWER_ROLE to sign off on published samples. Separation of
          duties: reviewer must differ from publisher.
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
        Laboratory · Review pending samples
      </h1>
      <p className="mt-1 text-sm text-aqua-700 dark:text-aqua-50/70">
        Samples published on-chain but awaiting second-pair-of-eyes review.
      </p>

      {status && (
        <p className="mt-4 rounded-lg border border-aqua-500/20 bg-white/50 p-3 text-sm text-aqua-900 dark:bg-aqua-900/30 dark:text-aqua-50">
          {status}
        </p>
      )}

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-aqua-500/30 bg-white/50 p-8 text-center text-sm text-aqua-700 dark:bg-aqua-900/30 dark:text-aqua-50/70">
          Nothing awaiting review.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((s) => (
            <li
              key={s.attestationUID}
              className="rounded-2xl border border-aqua-500/20 bg-white/50 p-4 dark:bg-aqua-900/30"
            >
              <div className="flex items-baseline justify-between gap-3">
                <code className="truncate font-mono text-xs text-aqua-900 dark:text-aqua-50">
                  {s.attestationUID.slice(0, 14)}…{s.attestationUID.slice(-10)}
                </code>
                <time className="text-xs text-aqua-700/70 dark:text-aqua-50/60">
                  {new Date(Number(s.publishedAt) * 1000).toLocaleString()}
                </time>
              </div>
              <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-xs">
                <dt className="text-aqua-700/70 dark:text-aqua-50/60">field agent</dt>
                <dd className="font-mono">{shortAddr(s.fieldAgent)}</dd>
                <dt className="text-aqua-700/70 dark:text-aqua-50/60">publisher</dt>
                <dd className="font-mono">{shortAddr(s.publisher)}</dd>
                <dt className="text-aqua-700/70 dark:text-aqua-50/60">readings</dt>
                <dd className="break-all font-mono">{s.labReadingsJson}</dd>
              </dl>
              <button
                disabled={reviewing || busyUid === s.attestationUID || (address && s.publisher.toLowerCase() === address.toLowerCase())}
                onClick={() => review(s.attestationUID)}
                className="mt-3 h-10 w-full rounded-xl bg-aqua-500 text-sm font-semibold text-white hover:bg-aqua-700 disabled:opacity-40"
              >
                {address && s.publisher.toLowerCase() === address.toLowerCase()
                  ? "You published this — separation of duties"
                  : busyUid === s.attestationUID
                    ? "Reviewing…"
                    : "Review & sign"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
