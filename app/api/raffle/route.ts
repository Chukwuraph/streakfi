import { NextResponse } from "next/server";
import { getWallet, getWallets } from "@/lib/db";
import { resolveWallet } from "@/lib/demoWallet";
import { truncateWallet } from "@/lib/streak";

export async function GET(req: Request) {
  const wallet = resolveWallet(req);
  const [me, all] = await Promise.all([getWallet(wallet), getWallets()]);
  const totalTickets = all.reduce((acc, w) => acc + w.raffleTickets, 0);
  const myTickets = me?.raffleTickets ?? 0;

  const now = new Date();
  const daysUntilSunday = (7 - now.getUTCDay()) % 7 || 7;
  const drawAt = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSunday);

  return NextResponse.json({
    myTickets,
    totalTickets,
    drawAt,
    chancePct: totalTickets > 0 ? Math.round((myTickets / totalTickets) * 100) : 0,
    buckets: [
      { amount: 1000, count: 1 },
      { amount: 250, count: 5 },
      { amount: 50, count: 20 },
    ],
    pastWinners: [
      { week: "Week 14", wallet: truncateWallet("0x7a8f4c21aab34e21"), prize: 1000, isYou: false },
      { week: "Week 13", wallet: truncateWallet("0x2b19cde78789fc00"), prize: 1000, isYou: false },
      { week: "Week 12", wallet: truncateWallet(wallet), prize: 250, isYou: true },
    ],
    prizePool: 5000,
  });
}
