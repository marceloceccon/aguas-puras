"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

function short(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletBar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <button
        onClick={() => disconnect()}
        className="rounded-full border border-aqua-500/40 px-3 py-1.5 text-xs font-medium text-aqua-700 transition hover:bg-aqua-500/10 dark:text-aqua-50"
      >
        {short(address)} · disconnect
      </button>
    );
  }

  const primary = connectors[0];
  if (!primary) return null;

  return (
    <button
      disabled={isPending}
      onClick={() => connect({ connector: primary })}
      className="rounded-full bg-aqua-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-aqua-700 disabled:opacity-50 dark:bg-aqua-50 dark:text-aqua-900"
    >
      {isPending ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
