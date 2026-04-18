import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AguasPuras",
  description: "Clean water. Open data. Every drop, proven on Base."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
