import Link from "next/link";
import { FieldAgentsCard } from "@/components/FieldAgentsCard";
import { FilterBar } from "@/components/FilterBar";
import { ReadingsChart } from "@/components/ReadingsChart";
import { SampleList } from "@/components/SampleList";
import { SamplesMap } from "@/components/SamplesMap";
import { StatsBar } from "@/components/StatsBar";
import { StudiesFeed } from "@/components/StudiesFeed";
import { applyFilter, isEmptyFilter, parseFilter } from "@/lib/filter";
import { fetchActiveFieldAgents, fetchSamples } from "@/lib/ponder";
import { listStudies } from "@/lib/studies";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filter = parseFilter(sp);
  const [all, studies, agents] = await Promise.all([
    fetchSamples(),
    listStudies(),
    fetchActiveFieldAgents()
  ]);
  const filtered = isEmptyFilter(filter) ? all : applyFilter(all, filter);

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
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/publish"
            className="rounded-full border border-aqua-500/40 px-3 py-1.5 text-aqua-700 transition hover:bg-aqua-500/10 dark:text-aqua-50"
          >
            Publish
          </Link>
          <Link
            href="/review"
            className="rounded-full border border-aqua-500/40 px-3 py-1.5 text-aqua-700 transition hover:bg-aqua-500/10 dark:text-aqua-50"
          >
            Review
          </Link>
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
        <FilterBar />
        <StatsBar total={all.length} shown={filtered} filtered={!isEmptyFilter(filter)} />
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-lg font-medium text-aqua-900 dark:text-aqua-50">Live map</h2>
        <SamplesMap samples={filtered} />
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-medium text-aqua-900 dark:text-aqua-50">Parameters over time</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ReadingsChart samples={filtered} param="ecoli" />
          <ReadingsChart samples={filtered} param="lead" />
          <ReadingsChart samples={filtered} param="ph" />
          <ReadingsChart samples={filtered} param="fluoride" />
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="mb-3 text-lg font-medium text-aqua-900 dark:text-aqua-50">Recent samples</h2>
          <SampleList samples={filtered.slice(0, 50)} />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-medium text-aqua-900 dark:text-aqua-50">Field agents</h2>
          <FieldAgentsCard agents={agents} />
        </div>
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
