"use client";

import dynamic from "next/dynamic";

const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

export function WalletButton() {
  return (
    <WalletMultiButtonDynamic
      style={{
        backgroundColor: "#f97316",
        color: "#582200",
        fontWeight: 900,
        textTransform: "uppercase",
        letterSpacing: "-0.02em",
        height: "44px",
        padding: "0 1.5rem",
        borderRadius: "0.75rem",
        boxShadow: "0 0 12px rgba(249,115,22,0.3)",
        fontSize: "0.875rem",
      }}
    />
  );
}
