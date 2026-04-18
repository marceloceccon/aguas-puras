import { waterSampleRegistryAbi } from "@aguas/shared";
import type { Address } from "viem";

export { waterSampleRegistryAbi };

export function registryAddressFromEnv(): Address {
  const raw = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
  if (!raw || !/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    throw new Error(
      "NEXT_PUBLIC_REGISTRY_ADDRESS is not set. Deploy WaterSampleRegistry and copy the address."
    );
  }
  return raw as Address;
}
