import { NextResponse } from "next/server";
import { addEvent, getWallet } from "@/lib/db";
import { emitTorqueEvent } from "@/lib/torque";
import { resolveWallet } from "@/lib/demoWallet";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { wallet?: string; streakLength?: number };
  const wallet = body.wallet ?? resolveWallet(req);
  const record = await getWallet(wallet);
  const streakLength = body.streakLength ?? record?.currentStreak ?? 0;
  const timestamp = Date.now();
  await addEvent({
    id: `evt-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    wallet,
    type: "streak_shared",
    timestamp,
    data: { streak_length: streakLength },
  });
  const torque = await emitTorqueEvent({
    userPubkey: wallet,
    eventName: "streak_shared",
    timestamp,
    data: { streak_length: streakLength },
  });
  return NextResponse.json({ ok: true, torque });
}
