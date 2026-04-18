"use client";

export interface AdminSigner {
  address: `0x${string}`;
  signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>;
}

function adminMessage(method: string, pathname: string, timestamp: number): string {
  return `AguasPuras admin\n${method.toUpperCase()} ${pathname}\n${timestamp}`;
}

/**
 * Signed fetch for admin-only API routes. Produces a short-lived Authorization
 * header of the form `AguasPuras <address> <unix-ts> <signature>` where the
 * signature is over a canonical message binding method + pathname + timestamp.
 *
 * Calls signMessageAsync inside — the wallet prompt is unavoidable. Callers
 * should serialize requests so users aren't hit with multiple popups.
 */
export async function signedFetch(
  signer: AdminSigner,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const pathname = new URL(path, window.location.origin).pathname;
  const timestamp = Math.floor(Date.now() / 1000);
  const message = adminMessage(method, pathname, timestamp);
  const signature = await signer.signMessageAsync({ message });
  const headers = new Headers(init.headers);
  headers.set("authorization", `AguasPuras ${signer.address} ${timestamp} ${signature}`);
  return fetch(path, { ...init, method, headers });
}
