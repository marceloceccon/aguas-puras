import { fieldAgentRegistryAbi, waterSampleRegistryAbi } from "@aguas/shared";
import { createPublicClient, http, type Address } from "viem";
import { base, baseSepolia, foundry } from "viem/chains";

export { fieldAgentRegistryAbi, waterSampleRegistryAbi };

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? foundry.id);
const chain =
  chainId === base.id ? base : chainId === baseSepolia.id ? baseSepolia : foundry;

const rpcUrl =
  chainId === foundry.id ? "http://127.0.0.1:8545" : undefined; // viem picks chain default otherwise

export const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

export const registryAddress = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as Address;

export function fieldAgentRegistryAddress(): Address {
  const raw = process.env.NEXT_PUBLIC_FIELD_AGENT_REGISTRY_ADDRESS;
  if (!raw || !/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    throw new Error("NEXT_PUBLIC_FIELD_AGENT_REGISTRY_ADDRESS is not set");
  }
  return raw as Address;
}

export async function isFieldAgentActive(agent: Address): Promise<boolean> {
  try {
    return (await publicClient.readContract({
      address: fieldAgentRegistryAddress(),
      abi: fieldAgentRegistryAbi,
      functionName: "isActive",
      args: [agent]
    })) as boolean;
  } catch {
    return false;
  }
}
