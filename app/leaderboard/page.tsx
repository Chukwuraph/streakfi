"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { useActiveWallet } from "@/components/ActiveWallet";
import { TorqueBadge } from "@/components/TorqueBadge";
import { useFocusRefresh } from "@/components/useFocusRefresh";

interface Row {
  rank: number;
  wallet: string;
  walletShort: string;
  streak: number;
  volume: number;
  points: number;
  isYou: boolean;
}
interface LBResponse {
  scope: string;
  top: Row[];
  you?: Row;
  totalTraders: number;
}

export default function LeaderboardPage() {
  const { wallet } = useActiveWallet();
  const [scope, setScope] = useState<"week" | "all">("week");
  const [data, setData] = useState<LBResponse | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/leaderboard?wallet=${wallet}&scope=${scope}`);
    setData(await res.json());
  }, [wallet, scope]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  useFocusRefresh(load);

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-none mb-2">
          This Week&apos;s Leaderboard
        </h1>
        <p className="text-secondary font-bold tracking-widest uppercase text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          Ranking powered by Torque Protocol
        </p>
      </header>

      {/* Prize pool */}
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-xl bg-surface-container border border-outline-variant/20 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
          <div>
            <span className="text-primary-fixed uppercase font-black text-sm tracking-[0.2em] mb-1 block">
              Current Reward Status
            </span>
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">🏆 Weekly Prize Pool: $5,000 USDC</h2>
          </div>
          <div className="bg-surface-container-highest px-6 py-4 rounded-xl border border-primary-container/30">
            <span className="text-xs uppercase font-bold text-primary-container tracking-widest block mb-1">Time Remaining</span>
            <div className="text-2xl font-black tracking-tighter text-on-surface">3d 14h 22m</div>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-container/10 blur-[100px] rounded-full" />
        </div>
      </section>

      {/* Scope tabs */}
      <div className="flex gap-2 mb-6">
        {(["week", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={clsx(
              "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition",
              scope === s ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low text-slate-400 hover:text-slate-200",
            )}
          >
            {s === "week" ? "This Week" : "All Time"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Leaderboard table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="hidden md:grid grid-cols-12 px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Wallet</div>
            <div className="col-span-2 text-right">Streak</div>
            <div className="col-span-3 text-right">Volume</div>
            <div className="col-span-2 text-right">Points</div>
          </div>
          <div className="space-y-3">
            {(data?.top ?? []).map((row) => (
              <LBRow key={row.wallet} row={row} />
            ))}
            {data?.you && !(data.top ?? []).some((r) => r.isYou) && (
              <>
                <div className="text-center py-2 text-xs text-slate-500 font-black uppercase tracking-widest">···</div>
                <LBRow row={data.you} />
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant mb-6">Recent Rank Changes</h3>
            <div className="space-y-6">
              <RankChange wallet="0x7a...4e21" label="Jumped +2 Ranks" rank="#1" tone="tertiary" icon="trending_up" />
              <RankChange wallet="0xfe...1122" label="Moved +1 Rank" rank="#3" tone="secondary" icon="swap_vert" />
              <RankChange wallet="0xbc...5544" label="Dropped -4 Ranks" rank="#18" tone="error" icon="trending_down" />
            </div>
          </div>

          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant mb-6">
              Top Points Gainers (24h)
            </h3>
            <div className="space-y-4">
              <GainerRow value="+1.2k" wallet="0x45...ff32" tag="Multiplier Active 2.0x" />
              <GainerRow value="+980" wallet="0x91...cc10" tag="Volume Streak" />
            </div>
            <div className="mt-8 flex items-center gap-2 p-4 bg-secondary-container rounded-xl">
              <span className="material-symbols-outlined text-secondary-fixed">bolt</span>
              <div>
                <p className="text-[10px] font-black uppercase text-secondary-fixed tracking-widest">Torque Engine Tip</p>
                <p className="text-[11px] text-on-secondary-container leading-tight">
                  Share your streak to earn a bonus raffle ticket per milestone.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-secondary-container p-6 rounded-xl shadow-[0_10px_30px_rgba(49,49,192,0.15)] relative group">
            <div className="absolute inset-0 bg-surface-bright/20 backdrop-blur-md rounded-xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-on-secondary-container">Engine Active</span>
              </div>
              <div className="font-black text-2xl text-on-secondary uppercase tracking-tighter leading-none mb-1">
                Torque Protocol
              </div>
              <p className="text-xs text-on-secondary-container/80 font-medium">
                Decentralized Momentum Aggregator v2.4.1
              </p>
              <div className="mt-6 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase text-on-secondary-container/60 tracking-[0.2em]">
                    Verified Integrity
                  </span>
                  <span className="text-xs font-black text-on-secondary">On-Chain Audit Pass</span>
                </div>
                <TorqueBadge size="inline" label="Verified" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LBRow({ row }: { row: Row }) {
  const medal = row.rank === 1 ? "gold" : row.rank === 2 ? "silver" : row.rank === 3 ? "bronze" : null;
  const medalClasses =
    medal === "gold"
      ? "border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
      : medal === "silver"
        ? "border-slate-400/20 shadow-[0_0_20px_rgba(148,163,184,0.1)]"
        : medal === "bronze"
          ? "border-orange-700/20"
          : "bg-surface-container-low";

  if (row.isYou) {
    return (
      <div className="grid grid-cols-12 items-center bg-secondary-container/20 border-2 border-secondary/40 px-4 md:px-6 py-5 md:py-6 rounded-xl shadow-[0_0_25px_rgba(49,49,192,0.2)] relative">
        <div className="col-span-2 md:col-span-1 text-2xl font-black text-secondary">{row.rank}</div>
        <div className="col-span-7 md:col-span-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-black text-xs">
            YOU
          </div>
          <span className="font-black text-on-surface text-sm md:text-base">{row.walletShort}</span>
        </div>
        <div className="col-span-3 md:col-span-2 text-right">
          <span className="text-base md:text-lg font-black text-secondary">{row.streak} Days</span>
          <span className="block text-[9px] font-bold uppercase text-secondary tracking-widest">Climbing</span>
        </div>
        <div className="hidden md:block col-span-3 text-right font-bold text-on-surface">${row.volume.toLocaleString()}</div>
        <div className="hidden md:block col-span-2 text-right font-black text-2xl text-on-surface">
          {row.points.toLocaleString()}
        </div>
      </div>
    );
  }

  const rankColor = medal === "gold" ? "text-yellow-500" : medal === "silver" ? "text-slate-400" : medal === "bronze" ? "text-orange-700" : "text-slate-500";
  return (
    <div className={clsx("grid grid-cols-12 items-center px-4 md:px-6 py-4 md:py-6 rounded-xl group hover:bg-surface-container transition-colors", medal ? `bg-surface-container border ${medalClasses}` : "bg-surface-container-low")}>
      <div className={clsx("col-span-2 md:col-span-1 text-xl md:text-2xl font-black", rankColor)}>{row.rank}</div>
      <div className="col-span-7 md:col-span-4 flex items-center gap-3">
        {medal && (
          <div className={clsx("w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center", medal === "gold" ? "bg-yellow-500/20 text-yellow-500" : medal === "silver" ? "bg-slate-400/20 text-slate-400" : "bg-orange-700/20 text-orange-700")}>
            <span className="material-symbols-outlined text-sm md:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
          </div>
        )}
        <span className="font-bold text-on-surface/90 text-sm md:text-base">{row.walletShort}</span>
      </div>
      <div className="col-span-3 md:col-span-2 text-right">
        <span className={clsx("text-sm md:text-lg font-black", medal === "gold" ? "text-primary-container" : "text-primary")}>
          {row.streak} Days
        </span>
      </div>
      <div className="hidden md:block col-span-3 text-right font-bold text-on-surface/70">${row.volume.toLocaleString()}</div>
      <div className="hidden md:block col-span-2 text-right font-black text-xl text-on-surface">
        {row.points.toLocaleString()}
      </div>
    </div>
  );
}

function RankChange({
  wallet,
  label,
  rank,
  tone,
  icon,
}: {
  wallet: string;
  label: string;
  rank: string;
  tone: "tertiary" | "secondary" | "error";
  icon: string;
}) {
  const bg = tone === "tertiary" ? "bg-tertiary-container/20 text-tertiary" : tone === "secondary" ? "bg-secondary-container/20 text-secondary" : "bg-error-container/20 text-error";
  const rankTone = tone === "tertiary" ? "text-tertiary" : tone === "secondary" ? "text-secondary" : "text-slate-500";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded flex items-center justify-center ${bg}`}>
          <span className="material-symbols-outlined text-sm">{icon}</span>
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">{wallet}</p>
          <p className="text-[10px] uppercase font-bold text-on-surface-variant">{label}</p>
        </div>
      </div>
      <span className={`text-[10px] font-black ${rankTone}`}>{rank}</span>
    </div>
  );
}

function GainerRow({ value, wallet, tag }: { value: string; wallet: string; tag: string }) {
  return (
    <div className="flex items-center gap-4 bg-surface-container-low p-3 rounded-lg">
      <span className="text-lg font-black text-primary">{value}</span>
      <div className="flex flex-col">
        <span className="text-xs font-bold text-on-surface">{wallet}</span>
        <span className="text-[9px] uppercase font-bold text-tertiary">{tag}</span>
      </div>
    </div>
  );
}
