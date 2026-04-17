import type { Metadata } from "next";
import "./globals.css";
import { SolanaWalletProvider } from "@/components/WalletProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { TorqueBadge } from "@/components/TorqueBadge";

export const metadata: Metadata = {
  title: "StreakFi | Trade Daily. Earn More.",
  description:
    "StreakFi rewards consistent Solana traders with leaderboards, raffles, and rebates — powered by Torque Protocol.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "StreakFi | Trade Daily. Earn More.",
    description: "DeFi streak rewards powered by Torque Protocol.",
    url: "/",
    siteName: "StreakFi",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background min-h-screen pb-24">
        <SolanaWalletProvider>
          <Navigation />
          <main className="min-h-screen">{children}</main>
          <TorqueBadge size="floating" />
          <Footer />
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
