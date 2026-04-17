"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useActiveWallet } from "@/components/ActiveWallet";
import { TorqueBadge } from "@/components/TorqueBadge";

function ShareInner() {
  const { wallet } = useActiveWallet();
  const sp = useSearchParams();
  const cardRef = useRef<HTMLDivElement>(null);
  const [streak, setStreak] = useState<number>(Number(sp.get("streak")) || 0);
  const [rank, setRank] = useState<number | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/streak?wallet=${wallet}`).then((r) => r.json()),
      fetch(`/api/leaderboard?wallet=${wallet}`).then((r) => r.json()),
    ]).then(([s, lb]) => {
      if (cancelled) return;
      if (!Number(sp.get("streak"))) setStreak(s.streak?.currentStreak ?? 0);
      setRank(lb.you?.rank ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [wallet, sp]);

  const tweetUrl = useMemo(() => {
    const text = `I'm on a 🔥 ${streak}-day DeFi streak on @streakfi — earning rewards powered by @torqueprotocol.\n\nJoin me: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://streakfi.app"}\n\n#StreakFi #Torque`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  }, [streak]);

  const onShare = useCallback(async () => {
    await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, streakLength: streak }),
    });
    setShared(true);
    window.open(tweetUrl, "_blank", "noopener,noreferrer");
  }, [wallet, streak, tweetUrl]);

  return (
    <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none mb-3">
          Your Momentum Trophy
        </h1>
        <p className="text-on-surface-variant max-w-lg mx-auto">
          Each share fires a <code className="text-secondary">streak_shared</code> Torque custom event and earns a bonus raffle ticket.
        </p>
      </header>

      {/* The share card (styled to match Twitter 1200x630 feel) */}
      <div
        ref={cardRef}
        className="relative mx-auto aspect-[1200/630] w-full max-w-3xl rounded-3xl overflow-hidden bg-background border border-outline-variant/10 shadow-[0_0_80px_rgba(249,115,22,0.15)]"
      >
        <div className="absolute inset-0 kinetic-gradient-bg" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary-container/10 rounded-full blur-[120px]" />
        <div className="relative z-10 p-8 md:p-12 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xl md:text-3xl font-black text-primary-container uppercase tracking-tighter">
              StreakFi
            </span>
            <TorqueBadge size="card" label="Verified by Torque" />
          </div>
          <div className="text-center">
            <div className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container streak-glow leading-none">
              🔥 {streak}
            </div>
            <div className="mt-4 text-xl md:text-3xl font-black uppercase tracking-tight text-on-surface">
              {streak}-Day Solana DeFi Streak
            </div>
            {rank != null && (
              <div className="mt-2 text-secondary font-black uppercase tracking-widest text-xs md:text-sm">
                Global Rank #{rank}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] md:text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">
            <span>Raydium • Solana</span>
            <span>Powered by Torque Protocol</span>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col md:flex-row gap-4 justify-center">
        <button
          onClick={onShare}
          className="flex-1 md:flex-initial px-10 py-4 rounded-2xl streak-gradient text-on-primary-container font-black uppercase tracking-tighter shadow-[0_0_30px_rgba(249,115,22,0.3)] inline-flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            share
          </span>
          Share on X
        </button>
        <Link
          href="/dashboard"
          className="flex-1 md:flex-initial px-10 py-4 rounded-2xl bg-surface-container-highest text-on-surface font-black uppercase tracking-tighter inline-flex items-center justify-center gap-3"
        >
          Back to Dashboard
        </Link>
      </div>

      {shared && (
        <p className="mt-4 text-center text-tertiary font-black uppercase tracking-widest text-xs">
          ✓ Share event emitted to Torque. Bonus raffle ticket pending.
        </p>
      )}
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="pt-32 px-6 max-w-5xl mx-auto text-on-surface-variant">Loading…</div>}>
      <ShareInner />
    </Suspense>
  );
}
