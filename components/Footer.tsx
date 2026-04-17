"use client";

import { useEffect, useState } from "react";

export function Footer() {
  const [stats, setStats] = useState<{ activeStreaks: number; rewardsDistributed: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setStats(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="fixed bottom-0 w-full h-10 bg-[#141b2b] border-t-2 border-[#2e3545] flex justify-between items-center px-4 md:px-8 z-40">
      <div className="flex items-center gap-2 md:gap-4">
        <span className="text-secondary font-black text-xs uppercase tracking-widest">StreakFi × Torque</span>
        <span className="hidden md:inline text-slate-500 text-[10px] font-bold uppercase tracking-widest">
          Powered by Torque Protocol
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-4 md:gap-8">
        <span className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">
          Active Streaks: {stats ? stats.activeStreaks.toLocaleString() : "…"}
        </span>
        <span className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">
          Live Rewards: ${stats ? Math.round(stats.rewardsDistributed / 1000) + "K" : "…"}
        </span>
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">© StreakFi</div>
    </footer>
  );
}
