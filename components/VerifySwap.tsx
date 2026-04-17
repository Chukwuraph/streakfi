"use client";

import { useState } from "react";
import clsx from "clsx";
import { useToast } from "./ToastProvider";

/**
 * Paste a Raydium tx signature → /api/verify-swap parses it on chain → credit.
 * "Auto-scan my wallet" pulls last 20 sigs → imports every Raydium swap we
 * haven't seen before.
 */
export function VerifySwap({
  wallet,
  isDemo,
  onImported,
}: {
  wallet: string;
  isDemo: boolean;
  onImported: () => void;
}) {
  const { push } = useToast();
  const [sig, setSig] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [scanning, setScanning] = useState(false);

  const verify = async () => {
    const trimmed = sig.trim();
    if (!trimmed) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/verify-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: trimmed }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        push({
          tone: "error",
          title: "Could not verify swap",
          body: json.error ?? "Unknown error",
        });
        return;
      }
      if (json.alreadyRecorded) {
        push({ tone: "info", title: "Already credited", body: "This signature was recorded previously." });
      } else {
        push({
          tone: "success",
          title: `On-chain swap verified`,
          body: `+$${(json.event.data.volume as number).toFixed(2)} volume, streak → day ${json.streak.currentStreak}. Torque event emitted.`,
          href: `https://solscan.io/tx/${trimmed}`,
          hrefLabel: "View on Solscan",
        });
      }
      setSig("");
      onImported();
    } catch (err) {
      push({ tone: "error", title: "Verify failed", body: (err as Error).message });
    } finally {
      setVerifying(false);
    }
  };

  const scan = async () => {
    if (isDemo) {
      push({
        tone: "warn",
        title: "Connect wallet first",
        body: "Scan needs a real Solana pubkey to query. Connect Phantom or Solflare above.",
      });
      return;
    }
    setScanning(true);
    try {
      const res = await fetch(`/api/scan-swaps?wallet=${wallet}&limit=20`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        push({
          tone: "error",
          title: "Scan failed",
          body: json.error ?? "RPC unavailable",
        });
        return;
      }
      push({
        tone: json.imported > 0 ? "success" : "info",
        title:
          json.imported > 0
            ? `Imported ${json.imported} on-chain swap${json.imported === 1 ? "" : "s"}`
            : "Wallet up to date",
        body: `Scanned last ${json.scanned} signatures • ${json.imported} Raydium swaps imported • ${json.skippedNotRaydium} non-Raydium skipped.`,
      });
      onImported();
    } catch (err) {
      push({ tone: "error", title: "Scan failed", body: (err as Error).message });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5 md:p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="material-symbols-outlined text-secondary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          verified
        </span>
        <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">
          Verify a real Raydium swap
        </h3>
      </div>
      <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
        Paste a signature from{" "}
        <a
          href="https://solscan.io"
          target="_blank"
          rel="noreferrer"
          className="text-secondary underline"
        >
          Solscan
        </a>{" "}
        or auto-scan your connected wallet. We verify the tx on mainnet, confirm
        a Raydium program ran, and credit the streak + fire a Torque event.
      </p>

      <div className="flex flex-col md:flex-row gap-2">
        <input
          type="text"
          value={sig}
          onChange={(e) => setSig(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !verifying && verify()}
          placeholder="Paste Solana tx signature…"
          spellCheck={false}
          className="flex-1 px-4 py-3 rounded-xl bg-surface-container-lowest border-t-2 border-surface-variant text-sm text-on-surface placeholder:text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={verify}
          disabled={verifying || !sig.trim()}
          className={clsx(
            "px-5 py-3 rounded-xl font-black uppercase tracking-tight text-xs",
            "bg-gradient-to-br from-primary to-primary-container text-on-primary-container",
            "shadow-[0_0_16px_rgba(249,115,22,0.2)] disabled:opacity-50",
          )}
        >
          {verifying ? "Verifying…" : "Verify"}
        </button>
        <button
          onClick={scan}
          disabled={scanning}
          className="px-5 py-3 rounded-xl font-black uppercase tracking-tight text-xs bg-surface-container-highest text-on-surface hover:bg-surface-container border border-outline-variant/20 disabled:opacity-50"
          title={isDemo ? "Connect a wallet to auto-scan" : "Import last 20 Raydium swaps from your wallet"}
        >
          {scanning ? "Scanning…" : "Auto-scan my wallet"}
        </button>
      </div>
    </div>
  );
}
