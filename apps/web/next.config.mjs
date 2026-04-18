/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["recharts", "wagmi", "viem"]
  },
  // wagmi's WalletConnect + MetaMask connectors pull optional peer deps that
  // Next's webpack can't resolve; externalize them so the bundle builds cleanly.
  webpack: (config) => {
    config.externals.push(
      "pino-pretty",
      "lokijs",
      "encoding",
      "@react-native-async-storage/async-storage"
    );
    return config;
  }
};

export default nextConfig;
