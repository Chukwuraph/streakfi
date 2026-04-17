"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useToast } from "./ToastProvider";
import { getStoredReferral } from "./ReferralTracker";

/**
 * When a Solana wallet connects, ensure a wallet record exists on the server.
 * Fires once per distinct public key per session.
 */
export function WalletBootstrap() {
  const { connected, publicKey } = useWallet();
  const { push } = useToast();
  const bootstrapped = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!connected || !publicKey) return;
    const key = publicKey.toBase58();
    if (bootstrapped.current.has(key)) return;
    bootstrapped.current.add(key);

    const referredBy = getStoredReferral();
    fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: key, referredBy }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.created) {
          push({
            tone: "success",
            title: "Wallet connected",
            body: `Tracking streaks for ${key.slice(0, 4)}…${key.slice(-4)}. Make your first Raydium swap to begin.`,
          });
        } else {
          push({
            tone: "info",
            title: "Welcome back",
            body: `${d.record?.currentStreak ?? 0}-day streak loaded. Verified by Torque.`,
          });
        }
      })
      .catch(() => {
        push({ tone: "error", title: "Connection issue", body: "Failed to sync with server. Try reconnecting." });
      });
  }, [connected, publicKey, push]);

  return null;
}
