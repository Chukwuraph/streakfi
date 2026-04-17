"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StreakCounter } from "@/components/StreakCounter";
import { TorqueBadge } from "@/components/TorqueBadge";
import { MilestoneModal } from "@/components/MilestoneModal";
import { useActiveWallet } from "@/components/ActiveWallet";
import { useToast } from "@/components/ToastProvider";
import { LiveCountdown } from "@/components/LiveCountdown";
import { StreakAtRiskBanner } from "@/components/StreakAtRiskBanner";
import { useFocusRefresh } from "@/components/useFocusRefresh";
import { useResetOnWallet } from "@/components/useResetOnWallet";
import { getStoredReferral, clearStoredReferral } from "@/components/ReferralTracker";

interface StreakResponse {
  wallet: string;
  record: {
    currentStreak: number;
    longestStreak: number;
    points: number;
    raffleTickets: number;
    rebateEarned: number;
    pendingRewards: number;
    weekVolume: number;
    totalVolume: number;
  } | null;
  streak: {
    currentStreak: number;
    longestStreak: number;
    streakStartedAt: number | null;
    lastTradeAt: number | null;
  };
  status: "safe" | "at_risk" | "broken" | "new";
  countdown: string;
  activity: { id: string; type: string; timestamp: number; data: Record<string, string | number | boolean> }[];
}

interface LeaderboardResponse {
  top: { rank: number; walletShort: string }[];
  you?: { rank: number };
  totalTraders: number;
}

const MILESTONES = [7, 14, 30, 60, 100];

export default function DashboardPage() {
  const { wallet, isDemo } = useActiveWallet();
  const { push } = useToast();
  const [data, setData] = useState<StreakResponse | null>(null);
  const [lb, setLb] = useState<LeaderboardResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [lastSeenStreak, setLastSeenStreak] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    const [s, l] = await Promise.all([
      fetch(`/api/streak?wallet=${wallet}`).then((r) => r.json()),
      fetch(`/api/leaderboard?wallet=${wallet}`).then((r) => r.json()),
    ]);
    setData(s);
    setLb(l);
  }, [wallet]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useFocusRefresh(fetchAll);
  useResetOnWallet(wallet, () => setData(null), () => setLb(null), () => setLastSeenStreak(null));

  useEffect(() => {
    if (!data) return;
    const s = data.streak.currentStreak;
    if (lastSeenStreak != null && s > lastSeenStreak && MILESTONES.includes(s)) {
      setMilestone(s);
    }
    setLastSeenStreak(s);
  }, [data, lastSeenStreak]);

  const recordTrade = useCallback(async () => {
    setSubmitting(true);
    const referredBy = getStoredReferral();
    try {
      const res = await fetch("/api/streak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          pair: "SOL/USDC",
          volume: 500 + Math.floor(Math.random() * 2000),
          referredBy,
        }),
      });
      const json = await res.json();
      if (json.wasNew && referredBy) clearStoredReferral();
      await fetchAll();
      push({
        tone: "success",
        title: `Streak day ${json.streak?.currentStreak ?? "—"} confirmed`,
        body: `Torque event emitted. +1 raffle ticket, +$${(json.event?.data?.volume * 0.0005).toFixed(2)} rebate.`,
      });
      if (json.referralTorque) {
        push({
          tone: "info",
          title: "Referral converted",
          body: "Your referrer received a bonus raffle ticket.",
        });
      }
    } catch {
      push({ tone: "error", title: "Swap not recorded", body: "Try again in a moment." });
    } finally {
      setSubmitting(false);
    }
  }, [wallet, fetchAll, push]);

  const streakValue = data?.streak.currentStreak ?? 0;
  const status = data?.status ?? "new";

  const countdownTone = useMemo(() => {
    if (status === "broken") return "text-error";
    if (status === "at_risk") return "text-primary-container";
    return "text-primary-fixed-dim";
  }, [status]);

  return (
    <div className="pt-28 px-6 max-w-7xl mx-auto">
      {isDemo && (
        <div className="mb-6 bg-secondary-container/30 border border-secondary/30 rounded-xl px-4 py-3 text-xs md:text-sm font-medium text-on-secondary-container flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            visibility
          </span>
          <span>
            <span className="font-black uppercase tracking-widest text-[10px] md:text-xs">Demo mode</span>{" "}
            — showing a seeded 15-day streak so you can explore the UI. Connect your Solana wallet and your data switches in instantly.
          </span>
        </div>
      )}

      <StreakAtRiskBanner status={status} />

      {/* Hero */}
      <section className="relative mb-12">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-container/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end relative z-10">
          <div className="lg:col-span-7">
            <StreakCounter streak={streakValue} status={status} lastTradeAt={data?.streak.lastTradeAt ?? null} />
          </div>

          <div className="lg:col-span-5 pb-0 md:pb-8">
            <div className="glass-card p-6 md:p-8 rounded-2xl border-t-2 border-surface-variant relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <StatusPill status={status} />
              </div>
              <div className="mt-6">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                  Momentum Deadline
                </p>
                <h2 className={`text-4xl md:text-5xl font-black tracking-tighter font-mono ${countdownTone}`}>
                  <LiveCountdown />
                </h2>
                <div className="w-full bg-surface-container-lowest h-2 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                    style={{ width: status === "safe" ? "35%" : status === "at_risk" ? "80%" : "100%" }}
                  />
                </div>
                <p className="text-sm text-slate-400 mt-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  Next trade due before UTC midnight
                </p>
                <button
                  onClick={recordTrade}
                  disabled={submitting}
                  className="mt-6 w-full py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-black uppercase tracking-tight text-sm shadow-[0_0_20px_rgba(249,115,22,0.25)] disabled:opacity-60"
                >
                  {submitting ? "Recording…" : "Simulate Raydium Swap"}
                </button>
                <a
                  href="https://raydium.io/swap"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-center text-xs text-on-surface-variant underline font-medium"
                >
                  Or trade live on Raydium →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reward cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <RewardCard
          icon="leaderboard"
          label="Leaderboard"
          value={lb?.you ? `Rank #${lb.you.rank}` : "Unranked"}
          sub={lb?.you && lb.totalTraders ? `Top ${Math.max(1, Math.round((lb.you.rank / lb.totalTraders) * 100))}%` : "Trade to appear"}
          href="/leaderboard"
        />
        <RewardCard
          icon="confirmation_number"
          label="Active Tickets"
          value={`${data?.record?.raffleTickets ?? 0} Tickets`}
          sub="Draw: Sunday 00:00 UTC"
          href="/rewards"
        />
        <RewardCard
          icon="payments"
          label="Protocol Rebates"
          value={`$${(data?.record?.rebateEarned ?? 0).toFixed(2)}`}
          sub="Claimable at 14 days"
          href="/rewards"
        />
      </section>

      {/* Activity + Torque engine */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black tracking-tight uppercase italic">Recent Momentum</h2>
            <Link href="/history" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">
              View All History
            </Link>
          </div>
          <div className="space-y-3">
            {(data?.activity ?? []).length === 0 && (
              <div className="bg-surface-container p-6 rounded-xl text-sm text-on-surface-variant">
                No activity yet. Record a swap to fire your first Torque custom event.
              </div>
            )}
            {(data?.activity ?? []).map((evt) => (
              <ActivityRow
                key={evt.id}
                title={titleFor(evt.type)}
                detail={detailFor(evt)}
                ts={evt.timestamp}
                tone={toneFor(evt.type)}
              />
            ))}
          </div>
        </div>
        <aside className="lg:col-span-4">
          <div className="bg-secondary-container p-1 rounded-2xl h-full shadow-[0_0_40px_rgba(49,49,192,0.2)]">
            <div className="bg-surface-bright glass-card h-full p-8 rounded-[calc(1rem-2px)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-background text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      bolt
                    </span>
                  </div>
                  <h3 className="font-black text-xl tracking-tighter uppercase text-secondary-fixed">The Torque Engine</h3>
                </div>
                <p className="text-sm text-secondary-fixed/70 leading-relaxed mb-6">
                  Your streaks are verified via Torque Protocol custom events and IDL-tracked Raydium swaps. Maintaining
                  momentum unlocks leaderboards, raffle tickets, and Bronze→Gold rebate tiers.
                </p>
                <div className="space-y-4">
                  <Metric label="Points" value={data?.record?.points?.toLocaleString() ?? "0"} />
                  <Metric label="Longest Streak" value={`${data?.streak.longestStreak ?? 0} days`} />
                  <Metric label="Week Volume" value={`$${(data?.record?.weekVolume ?? 0).toLocaleString()}`} />
                </div>
              </div>
              <div className="pt-8">
                <Link
                  href="/rewards"
                  className="block text-center w-full py-3 rounded-xl bg-secondary text-on-secondary font-black uppercase tracking-tighter text-sm hover:brightness-110 active:scale-95 transition-all"
                >
                  Claim Rewards
                </Link>
                <div className="mt-3">
                  <TorqueBadge size="inline" label="Verified by Torque" />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {milestone !== null && <MilestoneModal streak={milestone} onClose={() => setMilestone(null)} />}
    </div>
  );
}

function StatusPill({ status }: { status: "safe" | "at_risk" | "broken" | "new" }) {
  const map = {
    safe: { bg: "bg-tertiary-container/20 border-tertiary/30", text: "text-tertiary", label: "Streak Safe ✓" },
    at_risk: { bg: "bg-primary-container/20 border-primary/30", text: "text-primary-container", label: "At Risk" },
    broken: { bg: "bg-error-container/20 border-error/30", text: "text-error", label: "Streak Broken" },
    new: { bg: "bg-secondary-container/20 border-secondary/30", text: "text-secondary", label: "Start Streak" },
  }[status];
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${map.bg} ${map.text}`}>
      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
        verified
      </span>
      {map.label}
    </div>
  );
}

function RewardCard({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-surface-container-low hover:bg-surface-container transition-colors p-6 rounded-2xl relative group cursor-pointer overflow-hidden block"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-6">
        <span className="material-symbols-outlined text-primary text-3xl">{icon}</span>
        <TorqueBadge size="inline" />
      </div>
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</h3>
      <div className="text-3xl md:text-4xl font-black tracking-tighter">{value}</div>
      <p className="text-on-surface-variant text-xs mt-2 font-medium">{sub}</p>
    </Link>
  );
}

function ActivityRow({
  title,
  detail,
  ts,
  tone,
}: {
  title: string;
  detail: string;
  ts: number;
  tone: "tertiary" | "primary" | "secondary";
}) {
  const iconBg =
    tone === "tertiary" ? "bg-tertiary-container/10 text-tertiary" : tone === "primary" ? "bg-primary-container/10 text-primary" : "bg-secondary-container/10 text-secondary";
  const icon = tone === "tertiary" ? "check_circle" : tone === "primary" ? "confirmation_number" : "shield";
  return (
    <div className="bg-surface-container p-4 rounded-xl flex items-center justify-between group hover:translate-x-2 transition-transform duration-300">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        <div>
          <p className="font-bold text-on-surface tracking-tight">{title}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-500">{timeAgo(ts)}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-secondary-fixed/60 uppercase font-bold tracking-widest">{label}</span>
      <span className="text-on-surface font-black">{value}</span>
    </div>
  );
}

function titleFor(type: string): string {
  switch (type) {
    case "streak_maintained":
      return "Swap Confirmed";
    case "streak_broken":
      return "Streak Reset";
    case "streak_shared":
      return "Streak Shared";
    case "referral_converted":
      return "Referral Converted";
    default:
      return "Event";
  }
}
function detailFor(e: { type: string; data: Record<string, string | number | boolean> }): string {
  if (e.type === "streak_maintained") return `${e.data.pair ?? "SOL/USDC"} • Volume $${(e.data.volume as number)?.toLocaleString?.() ?? e.data.volume ?? 0}`;
  if (e.type === "streak_shared") return `Shared milestone: ${e.data.streak_length ?? ""} days`;
  if (e.type === "streak_broken") return "Verified broken by Torque";
  return JSON.stringify(e.data);
}
function toneFor(type: string): "tertiary" | "primary" | "secondary" {
  if (type === "streak_maintained" || type === "swap_confirmed") return "tertiary";
  if (type === "streak_shared") return "primary";
  return "secondary";
}
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
