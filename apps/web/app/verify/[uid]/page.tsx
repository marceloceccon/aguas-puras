import Link from "next/link";
import { isHex, type Hex } from "viem";
import { easUrl, explorerTxUrl, formatTimestamp, shortAddr } from "@/lib/format";
import { publicClient, registryAddress, waterSampleRegistryAbi } from "@/lib/publicClient";

export const dynamic = "force-dynamic";

interface OnchainSample {
  dataHash: Hex;
  attester: Hex;
  blockTimestamp: bigint;
  labReadingsJson: string;
}

async function readSample(uid: Hex): Promise<OnchainSample | null> {
  try {
    const result = (await publicClient.readContract({
      address: registryAddress,
      abi: waterSampleRegistryAbi,
      functionName: "getSample",
      args: [uid]
    })) as OnchainSample;
    return result;
  } catch {
    return null;
  }
}

export default async function VerifyPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  if (!isHex(uid) || uid.length !== 66) {
    return (
      <main className="mx-auto max-w-xl px-5 pb-20 pt-16">
        <Link href="/" className="text-sm text-aqua-700 hover:underline dark:text-aqua-50/80">
          ← Dashboard
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-aqua-900 dark:text-aqua-50">Invalid UID</h1>
        <p className="mt-2 text-sm text-aqua-700 dark:text-aqua-50/70">
          Expected a 0x-prefixed 32-byte hex string.
        </p>
      </main>
    );
  }

  const sample = await readSample(uid as Hex);
  const eas = easUrl(uid);

  return (
    <main className="mx-auto max-w-xl px-5 pb-20 pt-12">
      <Link href="/" className="text-sm text-aqua-700 hover:underline dark:text-aqua-50/80">
        ← Dashboard
      </Link>

      <header className="mt-6">
        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-xl text-white ${
            sample ? "bg-aqua-500" : "bg-red-500"
          }`}
        >
          {sample ? "✓" : "!"}
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-aqua-900 dark:text-aqua-50">
          {sample ? "Verified on Base" : "Not registered"}
        </h1>
        <p className="mt-1 text-sm text-aqua-700 dark:text-aqua-50/70">
          {sample
            ? "This sample's attestation UID is recorded on-chain."
            : "No sample found for this UID on the configured chain."}
        </p>
      </header>

      <section className="mt-6 rounded-2xl border border-aqua-500/20 bg-white/50 p-5 dark:bg-aqua-900/30">
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-aqua-700/70 dark:text-aqua-50/60">UID</dt>
          <dd className="break-all font-mono text-xs">{uid}</dd>
          {sample && (
            <>
              <dt className="text-aqua-700/70 dark:text-aqua-50/60">Attester</dt>
              <dd className="font-mono">{shortAddr(sample.attester)}</dd>
              <dt className="text-aqua-700/70 dark:text-aqua-50/60">When</dt>
              <dd>{formatTimestamp(sample.blockTimestamp.toString())}</dd>
              <dt className="text-aqua-700/70 dark:text-aqua-50/60">Data hash</dt>
              <dd className="break-all font-mono text-xs">{sample.dataHash}</dd>
              {sample.labReadingsJson && (
                <>
                  <dt className="text-aqua-700/70 dark:text-aqua-50/60">Readings</dt>
                  <dd className="whitespace-pre-wrap font-mono text-xs">{sample.labReadingsJson}</dd>
                </>
              )}
            </>
          )}
        </dl>
      </section>

      <p className="mt-4 text-[11px] text-aqua-700/60 dark:text-aqua-50/60">
        Chain: <span className="font-mono">{process.env.NEXT_PUBLIC_CHAIN_ID ?? "31337"}</span>.
        Registry: <span className="break-all font-mono">{registryAddress}</span>.
        Verified directly against chain state (no indexer dependency).
      </p>

      <section className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link
          href={`/sample/${uid}`}
          className="rounded-full border border-aqua-500/40 px-3 py-1.5 text-aqua-700 hover:bg-aqua-500/10 dark:text-aqua-50"
        >
          Indexed view →
        </Link>
        {eas && (
          <a
            href={eas}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-aqua-500/40 px-3 py-1.5 text-aqua-700 hover:bg-aqua-500/10 dark:text-aqua-50"
          >
            EAS explorer ↗
          </a>
        )}
      </section>
    </main>
  );
}
