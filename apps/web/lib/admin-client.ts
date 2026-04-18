"use client";

import { keccak256, toBytes } from "viem";

export interface AdminSigner {
  address: `0x${string}`;
  signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>;
}

function adminMessage(method: string, pathname: string, timestamp: number, bodyHash: string): string {
  return `AguasPuras admin\n${method.toUpperCase()} ${pathname}\n${timestamp}\n${bodyHash}`;
}

/**
 * Signed fetch for admin-only API routes. Signature binds to the raw body
 * bytes as well as method + pathname + timestamp, so a MITM can't swap the
 * JSON payload after the user signed.
 */
export async function signedFetch(
  signer: AdminSigner,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const pathname = new URL(path, window.location.origin).pathname;
  const bodyText =
    method === "GET" || method === "HEAD" || method === "DELETE"
      ? ""
      : typeof init.body === "string"
        ? init.body
        : "";
  const bodyHash = keccak256(toBytes(bodyText));
  const timestamp = Math.floor(Date.now() / 1000);
  const message = adminMessage(method, pathname, timestamp, bodyHash);
  const signature = await signer.signMessageAsync({ message });
  const headers = new Headers(init.headers);
  headers.set("authorization", `AguasPuras ${signer.address} ${timestamp} ${signature}`);
  return fetch(path, { ...init, method, headers });
}
