"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Address, Hex } from "viem";
import { useAccount, useConnect, useWriteContract } from "wagmi";
import {
  fieldAgentRegistryAbi,
  fieldAgentRegistryAddress,
  readDataOwnerPubkey
} from "@/lib/fieldAgent";
import {
  encryptForDataOwner,
  type EncryptedBlob,
  type FieldAgentPersonalData
} from "@/lib/encryption";
import { pinImage } from "@/lib/ipfs";

export default function RegisterAgentPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { writeContractAsync, isPending: submitting } = useWriteContract();

  const [form, setForm] = useState<FieldAgentPersonalData>({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    kitSerial: "",
    address: ""
  });
  const [pubkey, setPubkey] = useState<Hex | null>(null);
  const [pubkeyError, setPubkeyError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);

  useEffect(() => {
    if (!isConnected) return;
    readDataOwnerPubkey()
      .then((pk) => {
        setPubkey(pk);
        setPubkeyError(null);
      })
      .catch((err) => setPubkeyError(err instanceof Error ? err.message : String(err)));
  }, [isConnected]);

  async function handleRegister() {
    setStatus(null);
    if (!address) return;
    if (!pubkey) {
      setStatus("Data Owner public key not available on-chain.");
      return;
    }
    if (!form.name.trim() || !form.cpf.trim()) {
      setStatus("Name and CPF are required.");
      return;
    }
    try {
      setStatus("Encrypting personal data…");
      const blob: EncryptedBlob = await encryptForDataOwner(
        {
          name: form.name.trim(),
          cpf: form.cpf.trim(),
          email: form.email?.trim() || undefined,
          phone: form.phone?.trim() || undefined,
          kitSerial: form.kitSerial?.trim() || undefined,
          address: form.address?.trim() || undefined
        },
        pubkey
      );

      setStatus("Pinning encrypted blob to IPFS…");
      const json = JSON.stringify(blob);
      const file = new File([json], `agent-${address}.json`, { type: "application/json" });
      const pinned = await pinImage(file as unknown as Blob);
      if (pinned.fallback) {
        setStatus(
          "Pinning fell back to stub CID — configure PINATA_JWT before a real registration."
        );
        return;
      }

      setStatus("Submitting on-chain registration…");
      const registry = fieldAgentRegistryAddress();
      const tx = await writeContractAsync({
        address: registry,
        abi: fieldAgentRegistryAbi,
        functionName: "register",
        args: [pinned.cid]
      });
      setTxHash(tx);
      setStatus(`Registered. Tx ${tx}. CID ${pinned.cid}.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    }
  }

  if (!isConnected) {
    const primary = connectors[0];
    return (
      <main className="mx-auto max-w-lg px-5 pb-20 pt-16">
        <Link href="/" className="text-sm text-aqua-700 hover:underline dark:text-aqua-50/80">
          ← Home
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-aqua-900 dark:text-aqua-50">
          Field Agent registration
        </h1>
        <p className="mt-2 text-sm text-aqua-700 dark:text-aqua-50/70">
          Connect your wallet to self-register as an AguasPuras field agent. Your personal data is
          encrypted to the Foundation's Data Owner keypair — only they can decrypt it off-chain.
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
    <main className="mx-auto max-w-xl px-5 pb-20 pt-10">
      <Link href="/" className="text-sm text-aqua-700 hover:underline dark:text-aqua-50/80">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-aqua-900 dark:text-aqua-50">
        Field Agent registration
      </h1>
      <p className="mt-1 text-sm text-aqua-700 dark:text-aqua-50/70">
        Personal data is encrypted client-side (ECIES over secp256k1) to the Data Owner's public
        key. Only the encrypted CID lands on-chain.
      </p>

      {pubkeyError && (
        <p className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {pubkeyError}
        </p>
      )}
      {!pubkeyError && pubkey && (
        <p className="mt-4 rounded-lg border border-aqua-500/20 bg-white/50 p-3 text-xs text-aqua-700 dark:bg-aqua-900/30 dark:text-aqua-50/70">
          Data Owner pubkey: <span className="break-all font-mono">{pubkey.slice(0, 20)}…{pubkey.slice(-10)}</span>
        </p>
      )}

      <div className="mt-6 grid gap-4">
        <Field label="Full name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="CPF *" value={form.cpf} onChange={(v) => setForm({ ...form, cpf: v })} />
        <Field label="Email" value={form.email ?? ""} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Phone" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Kit serial" value={form.kitSerial ?? ""} onChange={(v) => setForm({ ...form, kitSerial: v })} />
        <Field label="Address" value={form.address ?? ""} onChange={(v) => setForm({ ...form, address: v })} />
      </div>

      {status && (
        <p className="mt-5 rounded-lg border border-aqua-500/20 bg-white/50 p-3 text-sm text-aqua-900 dark:bg-aqua-900/30 dark:text-aqua-50">
          {status}
        </p>
      )}

      <button
        disabled={submitting || !pubkey || !form.name.trim() || !form.cpf.trim()}
        onClick={handleRegister}
        className="mt-5 h-12 w-full rounded-xl bg-aqua-500 font-semibold text-white shadow transition hover:bg-aqua-700 disabled:opacity-40"
      >
        {submitting ? "Submitting…" : "Encrypt + pin + register"}
      </button>

      {txHash && (
        <p className="mt-3 break-all text-xs text-aqua-700/70 dark:text-aqua-50/60">
          Transaction: <span className="font-mono">{txHash}</span>
        </p>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-aqua-700/70 dark:text-aqua-50/60">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-aqua-500/30 bg-white/70 px-3 text-sm text-aqua-900 dark:bg-aqua-900/40 dark:text-aqua-50"
      />
    </label>
  );
}
