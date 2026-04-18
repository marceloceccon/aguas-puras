import Link from "next/link";
import { WalletBar } from "@/components/WalletBar";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-5 pb-16 pt-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-aqua-900 dark:text-aqua-50">
            AguasPuras
          </h1>
          <p className="text-sm text-aqua-700 dark:text-aqua-50/70">
            Clean water. Open data. Prove every drop.
          </p>
        </div>
        <WalletBar />
      </header>

      <section className="rounded-2xl border border-aqua-500/20 bg-white/70 p-6 shadow-sm backdrop-blur dark:bg-aqua-900/40">
        <h2 className="text-lg font-medium text-aqua-900 dark:text-aqua-50">Capture a sample</h2>
        <p className="mt-1 text-sm text-aqua-700 dark:text-aqua-50/70">
          Photo + GPS + notes, signed on Base. Immutable forever.
        </p>
        <Link
          href="/new"
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-aqua-500 text-base font-semibold text-white shadow transition hover:bg-aqua-700 active:scale-[0.99]"
        >
          New sample →
        </Link>
        <Link
          href="/register"
          className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-aqua-500/40 text-sm font-medium text-aqua-700 transition hover:bg-aqua-500/10 dark:text-aqua-50"
        >
          Register as Field Agent
        </Link>
      </section>

      <footer className="mt-auto text-center text-xs text-aqua-700/60 dark:text-aqua-50/40">
        Open-source public good. Starts in Floripa.
      </footer>
    </main>
  );
}
