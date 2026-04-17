import { NextResponse } from "next/server";
import { getWallet, upsertWallet } from "@/lib/db";
import { resolveWallet } from "@/lib/demoWallet";

export async function GET(req: Request) {
  const wallet = resolveWallet(req);
  const record = await getWallet(wallet);
  return NextResponse.json({
    wallet,
    exists: Boolean(record),
    record,
  });
}

/**
 * Ensure a wallet record exists (called on first wallet connect to prep state).
 * Idempotent — no-op if already present.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { wallet?: string; referredBy?: string };
  const wallet = body.wallet ?? resolveWallet(req);
  const existing = await getWallet(wallet);
  if (existing) {
    return NextResponse.json({ wallet, created: false, record: existing });
  }
  const now = Date.now();
  const record = {
    wallet,
    currentStreak: 0,
    longestStreak: 0,
    lastTradeAt: null,
    streakStartedAt: null,
    totalVolume: 0,
    weekVolume: 0,
    points: 0,
    raffleTickets: 0,
    rebateEarned: 0,
    pendingRewards: 0,
    createdAt: now,
    referralCode: wallet.slice(-6).toUpperCase(),
    referredBy: body.referredBy ?? null,
  };
  await upsertWallet(record);
  return NextResponse.json({ wallet, created: true, record });
}
