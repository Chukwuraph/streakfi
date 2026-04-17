import { NextResponse } from "next/server";
import { addEvent, getEvents, getWallet, upsertWallet } from "@/lib/db";
import { emitTorqueEvent } from "@/lib/torque";
import { computeStreakFromEvents } from "@/lib/streak";
import { parseSwap, recentSignatures } from "@/lib/solana";
import { resolveWallet } from "@/lib/demoWallet";
import type { StreakEvent } from "@/lib/types";

/**
 * Scan the last N signatures for a wallet, import any Raydium swaps we
 * haven't seen before. Safe to call repeatedly — dedupes on signature.
 */
export async function POST(req: Request) {
  const wallet = resolveWallet(req);
  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") ?? 20), 50);

  let sigs: string[];
  try {
    sigs = await recentSignatures(wallet, limit);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `RPC error: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  const seen = new Set(
    (await getEvents())
      .filter((e) => e.wallet === wallet)
      .map((e) => e.data.signature as string | undefined)
      .filter((x): x is string => Boolean(x)),
  );

  const unseen = sigs.filter((s) => !seen.has(s));
  let imported = 0;
  let skippedNotRaydium = 0;
  const errors: string[] = [];

  for (const signature of unseen) {
    let parsed;
    try {
      parsed = await parseSwap(signature);
    } catch (err) {
      errors.push(`${signature.slice(0, 8)}: ${(err as Error).message}`);
      continue;
    }
    if (!parsed) continue;
    if (!parsed.isRaydium) {
      skippedNotRaydium++;
      continue;
    }
    if (parsed.signer !== wallet) continue;

    const timestamp = parsed.blockTime ? parsed.blockTime * 1000 : Date.now();
    const volume = parsed.volumeUsd > 0 ? parsed.volumeUsd : 500;
    const event: StreakEvent = {
      id: `evt-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
      wallet,
      type: "streak_maintained",
      timestamp,
      data: {
        signature,
        slot: parsed.slot,
        dex: "raydium",
        pair: parsed.pair,
        volume,
        programs: parsed.touchedPrograms.join(","),
        onchain: true,
      },
    };
    await addEvent(event);
    imported++;
    await emitTorqueEvent({
      userPubkey: wallet,
      eventName: "streak_maintained",
      timestamp,
      data: { day: 0, signature, volume, pair: parsed.pair, dex: "raydium", onchain: true },
    });
  }

  if (imported > 0) {
    const walletEvents = (await getEvents()).filter((e) => e.wallet === wallet);
    const streak = computeStreakFromEvents(walletEvents);
    const existing = await getWallet(wallet);
    await upsertWallet({
      wallet,
      currentStreak: streak.currentStreak,
      longestStreak: Math.max(streak.longestStreak, existing?.longestStreak ?? 0),
      lastTradeAt: streak.lastTradeAt,
      streakStartedAt: streak.streakStartedAt,
      totalVolume: existing?.totalVolume ?? 0,
      weekVolume: existing?.weekVolume ?? 0,
      points: (existing?.points ?? 0) + imported * 100,
      raffleTickets: (existing?.raffleTickets ?? 0) + imported,
      rebateEarned: existing?.rebateEarned ?? 0,
      pendingRewards: existing?.pendingRewards ?? 0,
      createdAt: existing?.createdAt ?? Date.now(),
      referralCode: existing?.referralCode ?? wallet.slice(-6).toUpperCase(),
      referredBy: existing?.referredBy ?? null,
    });
  }

  return NextResponse.json({
    ok: true,
    wallet,
    scanned: sigs.length,
    unseen: unseen.length,
    imported,
    skippedNotRaydium,
    errors,
  });
}
