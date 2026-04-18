"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Hex } from "viem";

interface Props {
  uid: Hex;
  txHash: Hex;
  attester: Hex;
  onNew: () => void;
}

export function SuccessStep({ uid, txHash, attester, onNew }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const origin = process.env.NEXT_PUBLIC_VERIFIER_ORIGIN ?? "http://localhost:3001";
    const verifierUrl = `${origin}/verify/${uid}`;
    QRCode.toDataURL(verifierUrl, { margin: 1, width: 240 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [uid]);

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-aqua-500 text-2xl text-white shadow">
        ✓
      </div>

      <h3 className="text-xl font-semibold text-aqua-900 dark:text-aqua-50">Registered on Base</h3>

      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt="Verifier QR code"
          className="mx-auto rounded-xl border border-aqua-500/20 bg-white p-2"
        />
      ) : (
        <div className="mx-auto h-60 w-60 animate-pulse rounded-xl bg-aqua-500/10" />
      )}

      <dl className="mx-auto max-w-md space-y-2 rounded-xl border border-aqua-500/20 bg-white/50 p-4 text-left text-xs dark:bg-aqua-900/30">
        <Row label="attestationUID" value={uid} />
        <Row label="tx" value={txHash} />
        <Row label="attester" value={attester} />
      </dl>

      <button
        onClick={onNew}
        className="h-12 w-full rounded-xl bg-aqua-900 font-semibold text-white shadow transition hover:bg-aqua-700 dark:bg-aqua-50 dark:text-aqua-900"
      >
        Capture another sample
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-aqua-700/70 dark:text-aqua-50/60">{label}</span>
      <code className="break-all font-mono text-aqua-900 dark:text-aqua-50">{value}</code>
    </div>
  );
}
