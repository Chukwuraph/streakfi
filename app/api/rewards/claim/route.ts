import { NextResponse } from "next/server";
import { addEvent, getWallet, upsertWallet } from "@/lib/db";
import { emitTorqueEvent } from "@/lib/torque";
import { resolveWallet } from "@/lib/demoWallet";
import type { StreakEvent } from "@/lib/types";

export async function POST(req: Request) {
  const wallet = resolveWallet(req);
  const existing = await getWallet(wallet);
  if (!existing || existing.pendingRewards <= 0) {
    return NextResponse.json({ ok: false, error: "No pending rewards to claim" }, { status: 400 });
  }
  const amount = Number(existing.pendingRewards.toFixed(4));
  const timestamp = Date.now();

  const event: StreakEvent = {
    id: `evt-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    wallet,
    type: "streak_maintained",
    timestamp,
    data: { action: "reward_claimed", amount, unit: "USDC" },
  };
  await addEvent(event);
  await upsertWallet({ ...existing, pendingRewards: 0 });

  const torque = await emitTorqueEvent({
    userPubkey: wallet,
    eventName: "reward_claimed",
    timestamp,
    data: { amount, unit: "USDC" },
  });

  return NextResponse.json({ ok: true, amount, torque });
}
