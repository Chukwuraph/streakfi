"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { useActiveWallet } from "@/components/ActiveWallet";
import { TorqueBadge } from "@/components/TorqueBadge";

interface StreakResponse {
  record: {
    currentStreak: number;
    longestStreak: number;
    streakStartedAt?: number | null;
    totalVolume: number;
  } | null;
  streak: {
    currentStreak: number;
    longestStreak: number;
    streakStartedAt: number | null;
    lastTradeAt: number | null;
  };
  activity: {
    id: string;
    type: string;
    timestamp: number;
    data: Record<string, string | number | boolean>;
  }[];
}

const DAYS_TO_SHOW = 91; // ~13 weeks

export default function HistoryPage() {
  const { wallet } = useActiveWallet();
  const [data, setData] = useState<StreakResponse | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/streak?wallet=${wallet}`);
    setData(await res.json());
  }, [wallet]);

  useEffect(() => {
    load();
  }, [load]);

  const tradeDays = new Set(
    (data?.activity ?? [])
      .filter((e) => e.type === "streak_maintained" || e.type === "swap_confirmed")
      .map((e) => {
        const d = new Date(e.timestamp);
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      }),
  );

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const cells: { ts: number; traded: boolean }[] = [];
  for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
    const ts = today.getTime() - i * 86_400_000;
    cells.push({ ts, traded: tradeDays.has(ts) });
  }

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none mb-2">
          Streak History
        </h1>
        <p className="text-secondary font-bold tracking-widest uppercase text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          Activity logged by Torque IDL
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Current Streak" value={`${data?.streak.currentStreak ?? 0}`} tone="primary" />
        <StatCard label="Longest Streak" value={`${data?.streak.longestStreak ?? 0}`} tone="tertiary" />
        <StatCard label="Trading Days" value={`${tradeDays.size}`} tone="secondary" />
        <StatCard
          label="Total Volume"
          value={`$${(data?.record?.totalVolume ?? 0).toLocaleString()}`}
          tone="primary"
        />
      </section>

      <section className="bg-surface-container rounded-2xl p-6 md:p-8 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Last 13 Weeks</h2>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-black text-on-surface-variant">
            <LegendDot color="bg-tertiary-container" /> Traded
            <LegendDot color="bg-surface-container-highest" /> No trade
            <LegendDot color="bg-primary-container/40" /> Today
          </div>
        </div>
        <div className="grid grid-cols-13 gap-1.5 overflow-x-auto no-scrollbar" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
          {cells.map((c, i) => {
            const isToday = i === cells.length - 1;
            return (
              <div
                key={c.ts}
                title={new Date(c.ts).toUTCString()}
                className={clsx(
                  "aspect-square rounded-sm",
                  isToday
                    ? "bg-primary-container/40 border border-primary"
                    : c.traded
                      ? "bg-tertiary-container"
                      : "bg-surface-container-highest",
                )}
              />
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Trade Log</h2>
          <TorqueBadge size="inline" label="Verified by Torque" />
        </div>
        <div className="bg-surface-container rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-highest">
              <tr className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant">
                <th className="px-4 md:px-6 py-4">Date</th>
                <th className="px-4 md:px-6 py-4">Event</th>
                <th className="px-4 md:px-6 py-4 hidden md:table-cell">Pair</th>
                <th className="px-4 md:px-6 py-4 text-right hidden md:table-cell">Volume</th>
                <th className="px-4 md:px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.activity ?? []).length === 0 && (
                <tr>
                  <td className="p-6 text-on-surface-variant text-sm" colSpan={5}>
                    No activity yet — record a swap on the dashboard to emit your first Torque custom event.
                  </td>
                </tr>
              )}
              {(data?.activity ?? []).map((evt) => (
                <tr key={evt.id} className="border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                  <td className="px-4 md:px-6 py-4 font-mono text-xs text-on-surface-variant">
                    {new Date(evt.timestamp).toISOString().replace("T", " ").slice(0, 16)}
                  </td>
                  <td className="px-4 md:px-6 py-4 font-bold uppercase text-xs">{evt.type.replaceAll("_", " ")}</td>
                  <td className="px-4 md:px-6 py-4 hidden md:table-cell font-bold">{(evt.data.pair as string) ?? "—"}</td>
                  <td className="px-4 md:px-6 py-4 text-right hidden md:table-cell">
                    {evt.data.volume != null ? `$${Number(evt.data.volume).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <span className="bg-tertiary-container/20 text-tertiary px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                      Confirmed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "primary" | "secondary" | "tertiary" }) {
  const color = tone === "primary" ? "text-primary" : tone === "secondary" ? "text-secondary" : "text-tertiary";
  return (
    <div className="bg-surface-container p-4 md:p-6 rounded-2xl">
      <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
      <div className={`text-2xl md:text-4xl font-black tracking-tighter ${color}`}>{value}</div>
    </div>
  );
}

function LegendDot({ color }: { color: string }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-sm ${color}`} />;
}
