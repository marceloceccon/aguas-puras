import { http, createConfig } from "wagmi";
import { base, baseSepolia, foundry } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? baseSepolia.id);

const chain =
  chainId === base.id ? base : chainId === foundry.id ? foundry : baseSepolia;

export const wagmiConfig = createConfig({
  chains: [chain],
  connectors: [
    coinbaseWallet({ appName: "AguasPuras Capture", preference: "smartWalletOnly" }),
    injected()
  ],
  transports: {
    [chain.id]: http(process.env.NEXT_PUBLIC_RPC_URL)
  },
  ssr: true
});

export const activeChain = chain;
