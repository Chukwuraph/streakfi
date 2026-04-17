import type { RebateTier, StreakEvent, WalletRecord } from "./types";

const DAY_MS = 86_400_000;

export function sameUtcDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getUTCFullYear() === db.getUTCFullYear() &&
    da.getUTCMonth() === db.getUTCMonth() &&
    da.getUTCDate() === db.getUTCDate()
  );
}

export function daysBetweenUtc(a: number, b: number): number {
  const da = Date.UTC(new Date(a).getUTCFullYear(), new Date(a).getUTCMonth(), new Date(a).getUTCDate());
  const db = Date.UTC(new Date(b).getUTCFullYear(), new Date(b).getUTCMonth(), new Date(b).getUTCDate());
  return Math.round((db - da) / DAY_MS);
}

export function computeStreakFromEvents(events: StreakEvent[]): {
  currentStreak: number;
  longestStreak: number;
  streakStartedAt: number | null;
  lastTradeAt: number | null;
} {
  const tradeDays = Array.from(
    new Set(
      events
        .filter((e) => e.type === "streak_maintained" || e.type === "swap_confirmed")
        .map((e) => {
          const d = new Date(e.timestamp);
          return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        }),
    ),
  ).sort((a, b) => a - b);

  if (tradeDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0, streakStartedAt: null, lastTradeAt: null };
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < tradeDays.length; i++) {
    if (tradeDays[i] - tradeDays[i - 1] === DAY_MS) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  const todayUtc = (() => {
    const d = new Date();
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  })();

  const latest = tradeDays[tradeDays.length - 1];
  const gap = Math.round((todayUtc - latest) / DAY_MS);
  let current = 0;
  let streakStart: number | null = null;
  if (gap <= 1) {
    current = 1;
    streakStart = latest;
    for (let i = tradeDays.length - 2; i >= 0; i--) {
      if (tradeDays[i + 1] - tradeDays[i] === DAY_MS) {
        current += 1;
        streakStart = tradeDays[i];
      } else {
        break;
      }
    }
  }
  const lastTrade = events[events.length - 1]?.timestamp ?? latest;
  return {
    currentStreak: current,
    longestStreak: longest,
    streakStartedAt: streakStart,
    lastTradeAt: lastTrade,
  };
}

export function streakStatus(lastTradeAt: number | null): "safe" | "at_risk" | "broken" | "new" {
  if (!lastTradeAt) return "new";
  const now = Date.now();
  if (sameUtcDay(now, lastTradeAt)) return "safe";
  const gap = daysBetweenUtc(lastTradeAt, now);
  if (gap === 1) return "at_risk";
  return "broken";
}

export function hoursUntilUtcMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return (tomorrow.getTime() - now.getTime()) / 3_600_000;
}

export function formatCountdown(hours: number): string {
  if (hours <= 0) return "0h 00m";
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function rebateTiers(currentStreak: number): RebateTier[] {
  const tiers: { name: RebateTier["name"]; days: number; multiplier: number }[] = [
    { name: "Bronze", days: 7, multiplier: 1.05 },
    { name: "Silver", days: 14, multiplier: 1.12 },
    { name: "Gold", days: 30, multiplier: 1.25 },
  ];
  return tiers.map((t, i) => {
    const prev = i === 0 ? 0 : tiers[i - 1].days;
    let status: RebateTier["status"];
    let progressPct = 0;
    if (currentStreak >= t.days) {
      status = "completed";
      progressPct = 100;
    } else if (currentStreak >= prev) {
      status = "active";
      progressPct = Math.min(100, Math.round(((currentStreak - prev) / (t.days - prev)) * 100));
    } else {
      status = "locked";
      progressPct = 0;
    }
    return { ...t, status, progressPct };
  });
}

export function truncateWallet(wallet: string, head = 4, tail = 4): string {
  if (!wallet) return "";
  if (wallet.length <= head + tail + 2) return wallet;
  return `${wallet.slice(0, head)}...${wallet.slice(-tail)}`;
}

export function walletPoints(w: WalletRecord): number {
  return w.points;
}

export function newestFirst<T extends { timestamp: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.timestamp - a.timestamp);
}
