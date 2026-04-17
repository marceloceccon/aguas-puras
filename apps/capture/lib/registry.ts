import type { Address } from "viem";

export const waterSampleRegistryAbi = [
  {
    type: "function",
    name: "registerSample",
    stateMutability: "nonpayable",
    inputs: [
      { name: "attestationUID", type: "bytes32" },
      { name: "dataHash", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "exists",
    stateMutability: "view",
    inputs: [{ name: "attestationUID", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "event",
    name: "SampleRegistered",
    inputs: [
      { name: "attestationUID", type: "bytes32", indexed: true },
      { name: "attester", type: "address", indexed: true },
      { name: "dataHash", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint64", indexed: false }
    ]
  }
] as const;

export function registryAddressFromEnv(): Address {
  const raw = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
  if (!raw || !/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    throw new Error(
      "NEXT_PUBLIC_REGISTRY_ADDRESS is not set. Deploy WaterSampleRegistry and copy the address."
    );
  }
  return raw as Address;
}
