"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { useActiveWallet } from "@/components/ActiveWallet";
import { TorqueBadge } from "@/components/TorqueBadge";

interface RaffleData {
  myTickets: number;
  totalTickets: number;
  drawAt: number;
  chancePct: number;
  buckets: { amount: number; count: number }[];
  pastWinners: { week: string; wallet: string; prize: number; isYou: boolean }[];
  prizePool: number;
}
interface RebateData {
  tiers: {
    name: "Bronze" | "Silver" | "Gold";
    days: number;
    multiplier: number;
    status: "completed" | "active" | "locked";
    progressPct: number;
  }[];
  weekEarned: number;
  totalEarned: number;
  pending: number;
}

export default function RewardsPage() {
  const { wallet } = useActiveWallet();
  const [raffle, setRaffle] = useState<RaffleData | null>(null);
  const [rebate, setRebate] = useState<RebateData | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const load = useCallback(async () => {
    const [r, b] = await Promise.all([
      fetch(`/api/raffle?wallet=${wallet}`).then((r) => r.json()),
      fetch(`/api/rebate?wallet=${wallet}`).then((r) => r.json()),
    ]);
    setRaffle(r);
    setRebate(b);
  }, [wallet]);

  useEffect(() => {
    load();
  }, [load]);

  const claim = useCallback(async () => {
    if (!rebate || rebate.pending <= 0) return;
    setClaiming(true);
    try {
      await fetch("/api/torque/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          type: "streak_maintained",
          data: { action: "reward_claim", amount: rebate.pending },
        }),
      });
      setClaimed(true);
    } finally {
      setClaiming(false);
    }
  }, [wallet, rebate]);

  const chancePct = raffle?.chancePct ?? 0;

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Claim */}
        <div className="lg:col-span-5 flex flex-col justify-between p-8 rounded-3xl bg-surface-container shadow-[0_32px_64px_-12px_rgba(49,49,192,0.12)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-9xl text-secondary">payments</span>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Available to Claim</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-1">Total Earnings</h1>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-black text-primary">
                ${(rebate?.pending ?? 0).toFixed(2)}
              </span>
              <span className="text-xl font-bold text-slate-500">USDC</span>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant">
              Total earned: ${(rebate?.totalEarned ?? 0).toFixed(2)} • This week: ${(rebate?.weekEarned ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="mt-12">
            <button
              onClick={claim}
              disabled={claiming || claimed || !rebate || rebate.pending <= 0}
              className="w-full py-5 rounded-2xl streak-gradient text-on-primary-container font-black text-lg md:text-xl uppercase tracking-widest shadow-[0_10px_30px_rgba(49,49,192,0.4)] hover:shadow-[0_15px_40px_rgba(49,49,192,0.6)] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 disabled:opacity-60"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance_wallet
              </span>
              <span>{claimed ? "Claimed ✓" : claiming ? "Claiming…" : "Claim Rewards"}</span>
            </button>
            <p className="text-center text-slate-500 text-xs mt-4 font-medium uppercase tracking-tighter">
              Distributed via Torque Protocol • Verified Yield
            </p>
          </div>
        </div>

        {/* Raffle */}
        <div className="lg:col-span-7 p-8 rounded-3xl bg-surface-container-high relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="bg-tertiary-container/20 text-tertiary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center">
                  <span
                    className="material-symbols-outlined text-sm mr-1"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    local_fire_department
                  </span>
                  Live Raffle
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-on-surface leading-tight">
                🎟 You have <span className="text-primary">{raffle?.myTickets ?? 0} tickets</span>
                <br />
                this week
              </h2>
              <p className="mt-2 text-xs text-on-surface-variant">
                Prize pool ${raffle?.prizePool.toLocaleString() ?? "—"} USDC • Weighted by streak metric
              </p>
            </div>
            <div className="bg-surface-container-highest p-4 rounded-2xl border border-white/5">
              <span
                className="material-symbols-outlined text-primary text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                confirmation_number
              </span>
            </div>
          </div>
          <div className="mt-12 relative z-10">
            <div className="flex justify-between items-end mb-4">
              <span className="text-slate-200 font-bold tracking-tight">Chances of Winning</span>
              <span className="text-primary font-black text-2xl">
                {chancePct >= 10 ? "High Momentum" : chancePct >= 3 ? "Building" : "Low Velocity"}
              </span>
            </div>
            <div className="w-full h-4 bg-surface-container-lowest rounded-full overflow-hidden p-1">
              <div
                className="h-full streak-gradient rounded-full shadow-[0_0_15px_rgba(249,115,22,0.6)] transition-all"
                style={{ width: `${Math.min(100, Math.max(4, chancePct * 3))}%` }}
              />
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-slate-500 font-black uppercase tracking-widest">
              <span>Low Velocity</span>
              <span>Maximum Kinetic Energy</span>
            </div>
            <TorqueBadge size="inline" label="Torque Raffle Campaign" className="mt-4" />
          </div>
        </div>
      </div>

      {/* Rebate tiers */}
      <div className="mb-12">
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center">
          <span className="w-10 h-1 bg-primary mr-4" />
          Rebate Tier Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(rebate?.tiers ?? []).map((tier) => (
            <TierCard key={tier.name} tier={tier} />
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-surface-container-lowest rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden mb-12">
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-indigo-400 font-black text-xs uppercase tracking-[0.3em] mb-4">The Protocol</h3>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-on-surface mb-8">How it Works</h2>
          <div className="space-y-8">
            <HowItem
              icon="security"
              title="Provably Fair Raffle"
              body="Every raffle is powered by Torque's decentralized raffle campaign. Winners are selected on-chain using your ticket count as weighting — every streak day = 1 ticket."
            />
            <HowItem
              icon="bolt"
              title="Kinetic Multipliers"
              body="Your rewards grow with your streak. Bronze (7 days) → Silver (14) → Gold (30) unlock compounding rebate multipliers calculated by Torque's rebate campaign formula."
            />
            <HowItem
              icon="auto_graph"
              title="IDL-Tracked Activity"
              body="We attach a Raydium IDL in Torque so every qualifying swap fires a custom event automatically. No manual claims, no trust assumptions."
            />
          </div>
        </div>
      </div>

      {/* Past winners */}
      <div>
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">Past Raffle Results</h3>
        <div className="bg-surface-container rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface-container-highest">
              <tr className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant">
                <th className="px-6 py-4">Week</th>
                <th className="px-6 py-4">Winner</th>
                <th className="px-6 py-4 text-right">Prize</th>
                <th className="px-6 py-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody>
              {(raffle?.pastWinners ?? []).map((w, i) => (
                <tr
                  key={i}
                  className={clsx(
                    "border-t border-outline-variant/10",
                    w.isYou && "bg-secondary-container/10",
                  )}
                >
                  <td className="px-6 py-4 font-bold text-on-surface-variant">{w.week}</td>
                  <td className="px-6 py-4 font-bold">{w.wallet}</td>
                  <td className="px-6 py-4 text-right font-black text-primary">
                    ${w.prize.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={clsx(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
                      w.isYou ? "bg-secondary text-on-secondary" : "bg-surface-container-low text-on-surface-variant",
                    )}>
                      {w.isYou ? "YOU WON" : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between">
        <Link href="/share" className="text-xs font-black uppercase tracking-widest text-primary hover:underline">
          Share your streak →
        </Link>
        <TorqueBadge size="card" label="All rewards verified via Torque" />
      </div>
    </div>
  );
}

function TierCard({
  tier,
}: {
  tier: {
    name: "Bronze" | "Silver" | "Gold";
    days: number;
    multiplier: number;
    status: "completed" | "active" | "locked";
    progressPct: number;
  };
}) {
  const tone =
    tier.status === "completed"
      ? { border: "border-orange-900/30", color: "text-orange-400", icon: "verified" }
      : tier.status === "active"
        ? { border: "border-t-4 border-primary", color: "text-primary", icon: "pending_actions" }
        : { border: "border-slate-800", color: "text-slate-500", icon: "lock" };
  return (
    <div
      className={clsx(
        "p-6 rounded-2xl relative",
        tier.status === "active" ? "bg-surface-container" : "bg-surface-container-low",
        tier.status === "locked" && "opacity-60",
        tier.status !== "active" && `border-t-2 ${tone.border}`,
        tier.status === "active" && tone.border,
      )}
    >
      {tier.status === "active" && (
        <div className="absolute -top-3 right-6 bg-primary text-on-primary-container px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
          Active Streak
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <span className={`${tone.color} font-black text-sm uppercase tracking-widest`}>{tier.name} Tier</span>
        <span className={`material-symbols-outlined ${tone.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {tone.icon}
        </span>
      </div>
      <div className={clsx("text-4xl font-black mb-1", tier.status === "locked" ? "text-slate-400" : "text-on-surface")}>
        {tier.days} Days
      </div>
      <p className="text-slate-400 text-sm font-medium mb-6">
        {Math.round((tier.multiplier - 1) * 100)}% Yield Multiplier
      </p>
      {tier.status === "completed" && (
        <div className="flex items-center text-tertiary text-xs font-bold uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
          Completed
        </div>
      )}
      {tier.status === "active" && (
        <>
          <div className="w-full bg-surface-container-lowest h-1.5 rounded-full mb-2">
            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${tier.progressPct}%` }} />
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase">{tier.progressPct}% progress</div>
        </>
      )}
      {tier.status === "locked" && (
        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Unlock at Day {tier.days}</div>
      )}
    </div>
  );
}

function HowItem({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex space-x-4 md:space-x-6">
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center">
        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div>
        <h4 className="text-lg font-bold text-on-surface mb-1 uppercase tracking-tight">{title}</h4>
        <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
