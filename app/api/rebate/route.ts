import { NextResponse } from "next/server";
import { getWallet } from "@/lib/db";
import { resolveWallet } from "@/lib/demoWallet";
import { rebateTiers } from "@/lib/streak";

export async function GET(req: Request) {
  const wallet = resolveWallet(req);
  const record = await getWallet(wallet);
  const tiers = rebateTiers(record?.currentStreak ?? 0);
  return NextResponse.json({
    wallet,
    tiers,
    weekEarned: record ? record.rebateEarned * 0.25 : 0,
    totalEarned: record?.rebateEarned ?? 0,
    pending: record?.pendingRewards ?? 0,
  });
}
