import { http, createConfig } from "wagmi";
import { base, baseSepolia, foundry } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const connectors = [
  coinbaseWallet({ appName: "AguasPuras Capture", preference: "smartWalletOnly" }),
  injected(),
  ...(wcProjectId
    ? [
        walletConnect({
          projectId: wcProjectId,
          metadata: {
            name: "AguasPuras Capture",
            description: "Field capture + on-chain attestation for water samples.",
            url: process.env.NEXT_PUBLIC_VERIFIER_ORIGIN ?? "https://aguaspuras.org",
            icons: [
              `${process.env.NEXT_PUBLIC_VERIFIER_ORIGIN ?? "https://aguaspuras.org"}/icon.svg`
            ]
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

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? baseSepolia.id);
export const activeChain =
  chainId === base.id ? base : chainId === foundry.id ? foundry : baseSepolia;
