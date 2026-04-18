import { http, createConfig } from "wagmi";
import { base, baseSepolia, foundry } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia, foundry],
  connectors: [
    coinbaseWallet({ appName: "AguasPuras Capture", preference: "smartWalletOnly" }),
    injected()
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [foundry.id]: http("http://127.0.0.1:8545")
  },
  ssr: true
});

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? baseSepolia.id);
export const activeChain =
  chainId === base.id ? base : chainId === foundry.id ? foundry : baseSepolia;
