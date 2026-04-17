import { NextResponse } from "next/server";
import { addEvent, getEvents, getWallet, upsertWallet } from "@/lib/db";
import { emitTorqueEvent } from "@/lib/torque";
import { computeStreakFromEvents } from "@/lib/streak";
import { parseSwap } from "@/lib/solana";
import type { StreakEvent } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    signature?: string;
    expectedWallet?: string;
  };
  const sig = (body.signature ?? "").trim();
  if (!sig) {
    return NextResponse.json({ ok: false, error: "signature required" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = await parseSwap(sig);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `RPC error: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  if (!parsed) {
    return NextResponse.json(
      { ok: false, error: "Transaction not found yet. Wait a few seconds and retry." },
      { status: 404 },
    );
  }

  if (!parsed.isRaydium) {
    return NextResponse.json(
      {
        ok: false,
        error: "Not a Raydium swap — no Raydium program found in this transaction.",
        touchedPrograms: parsed.touchedPrograms,
      },
      { status: 422 },
    );
  }

  const wallet = parsed.signer;
  if (body.expectedWallet && body.expectedWallet !== wallet) {
    return NextResponse.json(
      {
        ok: false,
        error: `Tx was signed by ${wallet}, not your connected wallet (${body.expectedWallet}).`,
      },
      { status: 409 },
    );
  }

  // Dedupe: same signature shouldn't credit twice.
  const events = await getEvents();
  const already = events.find(
    (e) => e.wallet === wallet && e.data.signature === parsed.signature,
  );
  if (already) {
    return NextResponse.json({
      ok: true,
      alreadyRecorded: true,
      event: already,
      parsed,
    });
  }

  const timestamp = (parsed.blockTime ? parsed.blockTime * 1000 : Date.now());
  const volume = parsed.volumeUsd > 0 ? parsed.volumeUsd : 500;

  const event: StreakEvent = {
    id: `evt-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    wallet,
    type: "streak_maintained",
    timestamp,
    data: {
      signature: parsed.signature,
      slot: parsed.slot,
      dex: "raydium",
      pair: parsed.pair,
      volume,
      programs: parsed.touchedPrograms.join(","),
      onchain: true,
    },
  };
  await addEvent(event);

  const walletEvents = (await getEvents()).filter((e) => e.wallet === wallet);
  const streak = computeStreakFromEvents(walletEvents);
  const existing = await getWallet(wallet);

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
    referredBy: existing?.referredBy ?? null,
  };
  await upsertWallet(updated);

  const torque = await emitTorqueEvent({
    userPubkey: wallet,
    eventName: "streak_maintained",
    timestamp,
    data: {
      day: streak.currentStreak,
      signature: parsed.signature,
      volume,
      pair: parsed.pair,
      dex: "raydium",
      onchain: true,
    },
  });

  return NextResponse.json({ ok: true, event, parsed, wallet: updated, streak, torque });
}
