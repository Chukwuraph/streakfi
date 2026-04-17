import { NextResponse } from "next/server";
import { addEvent } from "@/lib/db";
import { emitTorqueEvent } from "@/lib/torque";
import type { StreakEvent, StreakEventType } from "@/lib/types";

const VALID_TYPES: StreakEventType[] = [
  "streak_maintained",
  "streak_broken",
  "streak_shared",
  "referral_converted",
  "swap_confirmed",
];

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<StreakEvent> | null;
  if (!body || !body.wallet || !body.type) {
    return NextResponse.json({ error: "wallet and type are required" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(body.type as StreakEventType)) {
    return NextResponse.json({ error: `invalid type: ${body.type}` }, { status: 400 });
  }
  const event: StreakEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    wallet: body.wallet,
    type: body.type as StreakEventType,
    timestamp: body.timestamp ?? Date.now(),
    data: body.data ?? {},
  };
  await addEvent(event);
  const torque = await emitTorqueEvent({
    userPubkey: event.wallet,
    eventName: event.type,
    timestamp: event.timestamp,
    data: event.data,
  });
  return NextResponse.json({ event, torque });
}
