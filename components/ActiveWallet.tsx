"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { DEMO_WALLET } from "@/lib/demoWallet";

/**
 * Returns the active wallet for data-fetching.
 * When a real wallet is connected, uses its pubkey. Otherwise falls back to the
 * seeded demo wallet so the UI is populated for hackathon judges out of the box.
 */
export function useActiveWallet(): { wallet: string; isDemo: boolean } {
  const { publicKey, connected } = useWallet();
  if (connected && publicKey) {
    return { wallet: publicKey.toBase58(), isDemo: false };
  }
  return { wallet: DEMO_WALLET, isDemo: true };
}
