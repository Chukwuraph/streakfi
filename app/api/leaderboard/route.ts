import { NextResponse } from "next/server";
import { getWallets } from "@/lib/db";
import { resolveWallet } from "@/lib/demoWallet";
import { truncateWallet } from "@/lib/streak";

export async function GET(req: Request) {
  const wallet = resolveWallet(req);
  const scope = new URL(req.url).searchParams.get("scope") ?? "week";
  const all = await getWallets();
  const sorted = [...all].sort((a, b) => b.points - a.points);
  const rows = sorted.map((w, i) => ({
    rank: i + 1,
    wallet: w.wallet,
    walletShort: truncateWallet(w.wallet),
    streak: w.currentStreak,
    volume: scope === "all" ? w.totalVolume : w.weekVolume,
    points: w.points,
    isYou: w.wallet === wallet,
  }));
  const you = rows.find((r) => r.isYou);
  const top = rows.slice(0, 10);
  return NextResponse.json({ scope, top, you, totalTraders: rows.length });
}
