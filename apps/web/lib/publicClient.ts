import { createPublicClient, http, type Address } from "viem";
import { base, baseSepolia, foundry } from "viem/chains";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? foundry.id);
const chain =
  chainId === base.id ? base : chainId === baseSepolia.id ? baseSepolia : foundry;

const rpcUrl =
  chainId === foundry.id ? "http://127.0.0.1:8545" : undefined; // viem picks chain default otherwise

export const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

export const registryAddress = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as Address;

export const waterSampleRegistryAbi = [
  {
    type: "function",
    name: "getSample",
    stateMutability: "view",
    inputs: [{ name: "attestationUID", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "dataHash", type: "bytes32" },
          { name: "attester", type: "address" },
          { name: "blockTimestamp", type: "uint64" },
          { name: "labReadingsJson", type: "string" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "exists",
    stateMutability: "view",
    inputs: [{ name: "attestationUID", type: "bytes32" }],
    outputs: [{ type: "bool" }]
  }
] as const;
