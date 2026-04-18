import { waterSampleRegistryAbi } from "@aguas/shared";
import type { Address } from "viem";

/**
 * Web-side wrapper around the shared ABI + env-resolved address.
 */
export const waterSampleRegistryWriteAbi = waterSampleRegistryAbi;

export function registryAddress(): Address {
  const raw = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
  if (!raw || !/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    throw new Error("NEXT_PUBLIC_REGISTRY_ADDRESS is not set");
  }
  return raw as Address;
}
