import Link from "next/link";
import { ReadingsChart } from "@/components/ReadingsChart";
import { SampleList } from "@/components/SampleList";
import { SamplesMap } from "@/components/SamplesMap";
import { StudiesFeed } from "@/components/StudiesFeed";
import { fetchSamples } from "@/lib/ponder";
import { listStudies } from "@/lib/studies";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [samples, studies] = await Promise.all([fetchSamples(), listStudies()]);

  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-aqua-900 dark:text-aqua-50">
            AguasPuras
          </h1>
          <p className="mt-1 text-sm text-aqua-700 dark:text-aqua-50/70">
            Clean water. Open data. Every drop, proven on Base. Starts in Floripa.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href="/admin"
            className="rounded-full border border-aqua-500/40 px-3 py-1.5 text-aqua-700 transition hover:bg-aqua-500/10 dark:text-aqua-50"
          >
            Admin
          </Link>
          <a
            href="http://localhost:3000"
            className="rounded-full bg-aqua-900 px-3 py-1.5 text-white transition hover:bg-aqua-700 dark:bg-aqua-50 dark:text-aqua-900"
          >
            Capture →
          </a>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-aqua-900 dark:text-aqua-50">Live map</h2>
        <SamplesMap samples={samples} />
        <p className="text-xs text-aqua-700/70 dark:text-aqua-50/60">
          {samples.length} sample{samples.length === 1 ? "" : "s"} indexed.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-medium text-aqua-900 dark:text-aqua-50">Parameters over time</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ReadingsChart samples={samples} param="ecoli" />
          <ReadingsChart samples={samples} param="lead" />
          <ReadingsChart samples={samples} param="ph" />
          <ReadingsChart samples={samples} param="fluoride" />
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-medium text-aqua-900 dark:text-aqua-50">Recent samples</h2>
        <SampleList samples={samples.slice(0, 20)} />
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-medium text-aqua-900 dark:text-aqua-50">Studies</h2>
        <StudiesFeed studies={studies} />
      </section>

      <footer className="mt-16 text-center text-xs text-aqua-700/60 dark:text-aqua-50/40">
        Open-source public good. Data verifiable on Base + EAS.
      </footer>
    </main>
  );
}
