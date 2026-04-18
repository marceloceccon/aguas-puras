import Link from "next/link";
import { notFound } from "next/navigation";
import { easUrl, explorerTxUrl, formatTimestamp, ipfsUrl, shortAddr } from "@/lib/format";
import { fetchSample } from "@/lib/ponder";

export const dynamic = "force-dynamic";

export default async function SamplePage({
  params
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const sample = await fetchSample(uid);
  if (!sample) notFound();

  const eas = easUrl(sample.attestationUID);
  const tx = explorerTxUrl(sample.txHash);
  const imageCid = typeof sample.readings["_imageCid"] === "string" ? (sample.readings["_imageCid"] as unknown as string) : null;
  const image = ipfsUrl(imageCid);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-20 pt-8">
      <Link href="/" className="text-sm text-aqua-700 hover:underline dark:text-aqua-50/80">
        ← Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-aqua-900 dark:text-aqua-50">Sample</h1>
      <p className="mt-1 break-all font-mono text-xs text-aqua-700 dark:text-aqua-50/70">
        {sample.attestationUID}
      </p>

      {image && (
        <a
          href={image}
          target="_blank"
          rel="noreferrer"
          className="mt-6 block overflow-hidden rounded-2xl border border-aqua-500/20"
        >
          <img
            src={image}
            alt="Sample image from IPFS"
            className="h-auto w-full max-w-full object-cover"
            loading="lazy"
          />
        </a>
      )}

      <section className="mt-6 rounded-2xl border border-aqua-500/20 bg-white/50 p-5 dark:bg-aqua-900/30">
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-aqua-700/70 dark:text-aqua-50/60">Attester</dt>
          <dd className="font-mono">{shortAddr(sample.attester)}</dd>
          <dt className="text-aqua-700/70 dark:text-aqua-50/60">When</dt>
          <dd>{formatTimestamp(sample.blockTimestamp)}</dd>
          <dt className="text-aqua-700/70 dark:text-aqua-50/60">Block</dt>
          <dd className="font-mono">#{sample.blockNumber}</dd>
          <dt className="text-aqua-700/70 dark:text-aqua-50/60">Data hash</dt>
          <dd className="break-all font-mono text-xs">{sample.dataHash}</dd>
          {sample.lat !== null && sample.lon !== null && (
            <>
              <dt className="text-aqua-700/70 dark:text-aqua-50/60">Location</dt>
              <dd className="font-mono text-xs">
                {sample.lat.toFixed(6)}, {sample.lon.toFixed(6)}
              </dd>
            </>
          )}
        </dl>
      </section>

      {Object.keys(sample.readings).length > 0 && (
        <section className="mt-6 rounded-2xl border border-aqua-500/20 bg-white/50 p-5 dark:bg-aqua-900/30">
          <h2 className="mb-3 text-sm font-medium text-aqua-900 dark:text-aqua-50">Readings</h2>
          <ul className="grid grid-cols-2 gap-y-1 font-mono text-xs text-aqua-900 dark:text-aqua-50">
            {Object.entries(sample.readings).map(([k, v]) => (
              <li key={k} className="flex justify-between pr-3">
                <span className="text-aqua-700/70 dark:text-aqua-50/60">{k}</span>
                <span className="font-semibold">{String(v)}</span>
              </li>
            ))}
          </ul>
          {sample.labReadingsUpdatedAt && (
            <p className="mt-3 text-[11px] text-aqua-700/70 dark:text-aqua-50/60">
              Last updated by {sample.labReadingsUpdater && shortAddr(sample.labReadingsUpdater)}{" "}
              at {formatTimestamp(sample.labReadingsUpdatedAt)}.
            </p>
          )}
        </section>
      )}

      <section className="mt-6 flex flex-wrap gap-3 text-sm">
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
        {tx && (
          <a
            href={tx}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-aqua-500/40 px-3 py-1.5 text-aqua-700 hover:bg-aqua-500/10 dark:text-aqua-50"
          >
            Tx on explorer ↗
          </a>
        )}
      </section>
    </main>
  );
}
