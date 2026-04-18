import { http, createConfig } from "wagmi";
import { base, baseSepolia, foundry } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const connectors = [
  coinbaseWallet({ appName: "AguasPuras Admin", preference: "all" }),
  injected(),
  ...(wcProjectId
    ? [
        walletConnect({
          projectId: wcProjectId,
          metadata: {
            name: "AguasPuras Admin",
            description: "Wallet-gated study composer for AguasPuras.",
            url: "https://aguaspuras.org",
            icons: []
          },
          showQrModal: true
        })
      ]
    : [])
];

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia, foundry],
  connectors,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [foundry.id]: http("http://127.0.0.1:8545")
  },
  ssr: true
});

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? foundry.id);
export const activeChain =
  chainId === base.id ? base : chainId === baseSepolia.id ? baseSepolia : foundry;
