import "./globals.css";
import type { Metadata, Viewport } from "next";
import { SWRegister } from "@/components/SWRegister";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AguasPuras Capture",
  description: "Field capture + on-chain attestation for water samples.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AguasPuras"
  }
};

export const viewport: Viewport = {
  themeColor: "#0aa8cc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <SWRegister />
      </body>
    </html>
  );
}
