import type { Address } from "viem";

export const waterSampleRegistryWriteAbi = [
  {
    type: "function",
    name: "publishSample",
    stateMutability: "nonpayable",
    inputs: [
      { name: "fieldAgent", type: "address" },
      { name: "attestationUID", type: "bytes32" },
      { name: "dataHash", type: "bytes32" },
      { name: "imageCid", type: "string" },
      { name: "labReadingsJson", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "reviewAndSign",
    stateMutability: "nonpayable",
    inputs: [{ name: "attestationUID", type: "bytes32" }],
    outputs: []
  }
] as const;

export function registryAddress(): Address {
  const raw = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
  if (!raw || !/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    throw new Error("NEXT_PUBLIC_REGISTRY_ADDRESS is not set");
  }
  return raw as Address;
}
