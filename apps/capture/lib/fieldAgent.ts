import { fieldAgentRegistryAbi } from "@aguas/shared";
import { createPublicClient, http, type Address, type Hex } from "viem";
import { base, baseSepolia, foundry } from "viem/chains";

export { fieldAgentRegistryAbi };

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? baseSepolia.id);
const chain =
  chainId === base.id ? base : chainId === foundry.id ? foundry : baseSepolia;

const rpcUrl =
  chainId === foundry.id ? "http://127.0.0.1:8545" : process.env.NEXT_PUBLIC_RPC_URL;

export const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

export function fieldAgentRegistryAddress(): Address {
  const raw = process.env.NEXT_PUBLIC_FIELD_AGENT_REGISTRY_ADDRESS;
  if (!raw || !/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    throw new Error(
      "NEXT_PUBLIC_FIELD_AGENT_REGISTRY_ADDRESS is not set. Deploy FieldAgentRegistry first."
    );
  }
  return raw as Address;
}

export async function readDataOwnerPubkey(): Promise<Hex> {
  const address = fieldAgentRegistryAddress();
  const pubkey = (await publicClient.readContract({
    address,
    abi: fieldAgentRegistryAbi,
    functionName: "dataOwnerPublicKey"
  })) as Hex;
  if (pubkey === "0x" || pubkey.length !== 132) {
    throw new Error(
      "Data Owner public key not yet published on FieldAgentRegistry. Ask the Data Owner to call setDataOwnerPublicKey first."
    );
  }
  return pubkey;
}

export async function readAgent(address: Address) {
  return publicClient.readContract({
    address: fieldAgentRegistryAddress(),
    abi: fieldAgentRegistryAbi,
    functionName: "getAgent",
    args: [address]
  });
}
