"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONFETTI_COLORS = ["#f97316", "#ffb690", "#6366f1", "#c0c1ff", "#62df7d"];

export function MilestoneModal({
  streak,
  onClose,
}: {
  streak: number;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="absolute block w-2 h-3 rounded-sm animate-confetti-fall"
            style={{
              left: `${(i * 97) % 100}%`,
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${(i % 10) * 120}ms`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 max-w-md w-full bg-surface-container-high rounded-3xl p-8 border border-primary/30 shadow-[0_0_60px_rgba(249,115,22,0.3)] text-center">
        <p className="text-xs uppercase font-black tracking-[0.3em] text-primary mb-4">
          Milestone Unlocked
        </p>
        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container mb-2 tracking-tighter">
          🔥 {streak}
        </div>
        <h2 className="text-3xl font-black tracking-tighter uppercase mb-3">
          {streak}-Day Streak!
        </h2>
        <p className="text-on-surface-variant mb-6">
          You&apos;ve hit a verified Torque milestone. Share it to bank a bonus raffle ticket.
        </p>
        <div className="flex gap-3">
          <Link
            href={`/share?streak=${streak}`}
            className="flex-1 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-black uppercase tracking-tight text-sm shadow-[0_0_24px_rgba(249,115,22,0.35)]"
          >
            Share on X
          </Link>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-surface-container-highest text-on-surface font-black uppercase tracking-tight text-sm"
          >
            Keep going
          </button>
        </div>
      </div>
    </div>
  );
}
