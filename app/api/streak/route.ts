import { NextResponse } from "next/server";
import { addEvent, getEvents, getWallet, getWallets, upsertWallet } from "@/lib/db";
import { emitTorqueEvent } from "@/lib/torque";
import { computeStreakFromEvents, streakStatus, hoursUntilUtcMidnight, formatCountdown, newestFirst } from "@/lib/streak";
import { resolveWallet } from "@/lib/demoWallet";
import type { StreakEvent } from "@/lib/types";

const REFERRAL_CONVERSION_DAY = 3;

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
    referredBy?: string;
  };
  const wallet = body.wallet ?? resolveWallet(req);
  const timestamp = Date.now();
  const volume = body.volume ?? 500;

  const event: StreakEvent = {
    id: `evt-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    wallet,
    type: "streak_maintained",
    timestamp,
    data: {
      pair: body.pair ?? "SOL/USDC",
      volume,
      dex: "raydium",
    },
  };
  await addEvent(event);

  const events = (await getEvents()).filter((e) => e.wallet === wallet);
  const streak = computeStreakFromEvents(events);

  const existing = await getWallet(wallet);
  const wasNew = !existing;

  const updated = {
    wallet,
    currentStreak: streak.currentStreak,
    longestStreak: Math.max(streak.longestStreak, existing?.longestStreak ?? 0),
    lastTradeAt: streak.lastTradeAt,
    streakStartedAt: streak.streakStartedAt,
    totalVolume: (existing?.totalVolume ?? 0) + volume,
    weekVolume: (existing?.weekVolume ?? 0) + volume,
    points: (existing?.points ?? 0) + 100 + streak.currentStreak * 10,
    raffleTickets: (existing?.raffleTickets ?? 0) + 1,
    rebateEarned: (existing?.rebateEarned ?? 0) + volume * 0.0005,
    pendingRewards: (existing?.pendingRewards ?? 0) + volume * 0.0005,
    createdAt: existing?.createdAt ?? timestamp,
    referralCode: existing?.referralCode ?? wallet.slice(-6).toUpperCase(),
    referredBy: existing?.referredBy ?? body.referredBy ?? null,
  };
  await upsertWallet(updated);

  const torque = await emitTorqueEvent({
    userPubkey: wallet,
    eventName: "streak_maintained",
    timestamp,
    data: { day: streak.currentStreak, pair: event.data.pair, volume, dex: "raydium" },
  });

  // Referral conversion: if this wallet was referred and just hit day 3, credit the referrer.
  let referralTorque: Awaited<ReturnType<typeof emitTorqueEvent>> | null = null;
  if (
    updated.referredBy &&
    streak.currentStreak === REFERRAL_CONVERSION_DAY &&
    existing?.currentStreak !== REFERRAL_CONVERSION_DAY
  ) {
    const referrer = (await getWallets()).find(
      (w) => w.referralCode === updated.referredBy || w.wallet === updated.referredBy,
    );
    if (referrer) {
      await addEvent({
        id: `evt-${timestamp + 1}-${Math.random().toString(36).slice(2, 8)}`,
        wallet: referrer.wallet,
        type: "referral_converted",
        timestamp: timestamp + 1,
        data: { referred_wallet: wallet, bonus_tickets: 1 },
      });
      await upsertWallet({
        ...referrer,
        raffleTickets: referrer.raffleTickets + 1,
        points: referrer.points + 250,
      });
      referralTorque = await emitTorqueEvent({
        userPubkey: referrer.wallet,
        eventName: "referral_converted",
        timestamp: timestamp + 1,
        data: { referred_wallet: wallet, bonus_tickets: 1 },
      });
    }
  }

  return NextResponse.json({ event, wallet: updated, streak, torque, referralTorque, wasNew });
}
