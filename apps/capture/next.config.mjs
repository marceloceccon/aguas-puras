/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@coinbase/onchainkit", "wagmi", "viem"]
  },
  headers: async () => [
    {
      source: "/manifest.webmanifest",
      headers: [{ key: "Content-Type", value: "application/manifest+json" }]
    }
  ]
};

export default nextConfig;
