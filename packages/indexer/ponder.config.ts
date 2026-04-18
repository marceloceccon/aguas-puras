import { createConfig } from "ponder";
import { http } from "viem";
import { CollectorRegistryAbi } from "./abis/CollectorRegistry";
import { WaterSampleRegistryAbi } from "./abis/WaterSampleRegistry";

const network = (process.env.PONDER_NETWORK ?? "anvil") as "anvil" | "baseSepolia" | "base";
const registryAddress = (process.env.REGISTRY_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
const collectorRegistryAddress = (process.env.COLLECTOR_REGISTRY_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
const startBlock = Number(process.env.REGISTRY_START_BLOCK ?? 0);

export default createConfig({
  networks: {
    anvil: {
      chainId: 31337,
      transport: http(process.env.PONDER_RPC_URL_31337 ?? "http://127.0.0.1:8545"),
      disableCache: true
    },
    baseSepolia: {
      chainId: 84532,
      transport: http(process.env.PONDER_RPC_URL_84532 ?? "https://sepolia.base.org")
    },
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453 ?? "https://mainnet.base.org")
    }
  },
  contracts: {
    WaterSampleRegistry: {
      abi: WaterSampleRegistryAbi,
      network,
      address: registryAddress,
      startBlock
    },
    CollectorRegistry: {
      abi: CollectorRegistryAbi,
      network,
      address: collectorRegistryAddress,
      startBlock
    }
  }
});
