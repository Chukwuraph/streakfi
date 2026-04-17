import { NextResponse } from "next/server";
import { addEvent, getEvents, getWallet, upsertWallet } from "@/lib/db";
import { emitTorqueEvent } from "@/lib/torque";
import { computeStreakFromEvents, streakStatus, hoursUntilUtcMidnight, formatCountdown, newestFirst } from "@/lib/streak";
import { resolveWallet } from "@/lib/demoWallet";
import type { StreakEvent } from "@/lib/types";

export async function GET(req: Request) {
  const wallet = resolveWallet(req);
  const [events, record] = await Promise.all([getEvents(), getWallet(wallet)]);
  const userEvents = events.filter((e) => e.wallet === wallet);
  const streak = computeStreakFromEvents(userEvents);
  const status = streakStatus(streak.lastTradeAt);
  return NextResponse.json({
    wallet,
    record,
    streak,
    status,
    countdown: formatCountdown(hoursUntilUtcMidnight()),
    activity: newestFirst(userEvents).slice(0, 12),
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    wallet?: string;
    pair?: string;
    volume?: number;
    simulate?: boolean;
  };
  const wallet = body.wallet ?? resolveWallet(req);
  const timestamp = Date.now();
  const event: StreakEvent = {
    id: `evt-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    wallet,
    type: "streak_maintained",
    timestamp,
    data: {
      pair: body.pair ?? "SOL/USDC",
      volume: body.volume ?? 500,
      dex: "raydium",
    },
  };
  await addEvent(event);

  const events = (await getEvents()).filter((e) => e.wallet === wallet);
  const streak = computeStreakFromEvents(events);

  const existing = await getWallet(wallet);
  const updated = {
    wallet,
    currentStreak: streak.currentStreak,
    longestStreak: Math.max(streak.longestStreak, existing?.longestStreak ?? 0),
    lastTradeAt: streak.lastTradeAt,
    streakStartedAt: streak.streakStartedAt,
    totalVolume: (existing?.totalVolume ?? 0) + (body.volume ?? 500),
    weekVolume: (existing?.weekVolume ?? 0) + (body.volume ?? 500),
    points: (existing?.points ?? 0) + 100 + streak.currentStreak * 10,
    raffleTickets: (existing?.raffleTickets ?? 0) + 1,
    rebateEarned: (existing?.rebateEarned ?? 0) + (body.volume ?? 500) * 0.0005,
    pendingRewards: (existing?.pendingRewards ?? 0) + (body.volume ?? 500) * 0.0005,
    createdAt: existing?.createdAt ?? timestamp,
    referralCode: existing?.referralCode ?? wallet.slice(-6).toUpperCase(),
    referredBy: existing?.referredBy ?? null,
  };
  await upsertWallet(updated);

  const torque = await emitTorqueEvent({
    userPubkey: wallet,
    eventName: "streak_maintained",
    timestamp,
    data: { day: streak.currentStreak, ...event.data },
  });

  return NextResponse.json({ event, wallet: updated, streak, torque });
}
