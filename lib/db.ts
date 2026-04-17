import fs from "fs/promises";
import path from "path";
import type { StreakEvent, WalletRecord } from "./types";

// On Vercel/serverless the project filesystem is read-only; only `/tmp` is writable
// (ephemeral per-instance, ~512 MB). In dev we use `./data` for easy inspection.
// Swap this for Vercel KV / Upstash Redis / Postgres for durable multi-instance state.
const IS_SERVERLESS = Boolean(process.env.VERCEL);
const DATA_DIR = IS_SERVERLESS ? "/tmp/streakfi" : path.join(process.cwd(), "data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");
const WALLETS_FILE = path.join(DATA_DIR, "wallets.json");

type DBShape<T> = { items: T[] };

async function ensureFile<T>(file: string, seed: DBShape<T>): Promise<void> {
  try {
    await fs.access(file);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(seed, null, 2));
  }
}

async function readJson<T>(file: string, seed: DBShape<T>): Promise<DBShape<T>> {
  await ensureFile(file, seed);
  const raw = await fs.readFile(file, "utf-8");
  try {
    return JSON.parse(raw) as DBShape<T>;
  } catch {
    return seed;
  }
}

async function writeJson<T>(file: string, data: DBShape<T>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function getEvents(): Promise<StreakEvent[]> {
  const db = await readJson<StreakEvent>(EVENTS_FILE, { items: seedEvents() });
  return db.items;
}

export async function addEvent(event: StreakEvent): Promise<void> {
  const db = await readJson<StreakEvent>(EVENTS_FILE, { items: seedEvents() });
  db.items.push(event);
  await writeJson(EVENTS_FILE, db);
}

export async function getWallets(): Promise<WalletRecord[]> {
  const db = await readJson<WalletRecord>(WALLETS_FILE, { items: seedWallets() });
  return db.items;
}

export async function getWallet(wallet: string): Promise<WalletRecord | null> {
  const all = await getWallets();
  return all.find((w) => w.wallet === wallet) ?? null;
}

export async function upsertWallet(record: WalletRecord): Promise<void> {
  const db = await readJson<WalletRecord>(WALLETS_FILE, { items: seedWallets() });
  const idx = db.items.findIndex((w) => w.wallet === record.wallet);
  if (idx >= 0) db.items[idx] = record;
  else db.items.push(record);
  await writeJson(WALLETS_FILE, db);
}

function seedWallets(): WalletRecord[] {
  const now = Date.now();
  const day = 86_400_000;
  return [
    mkWallet("0x7a8f4c21aab34e21", 42, 42, 124500, 22000, 15820, 48, 184.2, 210.3, now - day * 42),
    mkWallet("0x2b19cde78789fc00", 38, 41, 98210, 18400, 12440, 40, 142.6, 156.7, now - day * 38),
    mkWallet("0xfe0099aa331122bb", 31, 31, 85400, 15300, 9120, 28, 96.4, 103.2, now - day * 31),
    mkWallet("0x34aabb11cdddee00", 29, 30, 72100, 13800, 7840, 24, 78.3, 82.5, now - day * 29),
    mkWallet("0x982233ccddeea4f2", 15, 18, 14220, 4100, 3240, 7, 12.4, 45.2, now - day * 15),
    mkWallet("0x1122aabbccdd99bb", 14, 14, 12800, 3600, 2910, 6, 10.2, 18.0, now - day * 14),
    mkWallet("0xbc4455669988aa33", 9, 24, 8100, 2500, 1980, 4, 6.1, 11.2, now - day * 9),
    mkWallet("0x4512ee887766ff32", 6, 12, 5400, 1200, 1210, 2, 3.4, 5.0, now - day * 6),
    mkWallet("0x91cc1000aa23bb77", 4, 9, 3200, 900, 820, 1, 1.8, 2.4, now - day * 4),
  ];
}

function mkWallet(
  wallet: string,
  currentStreak: number,
  longestStreak: number,
  totalVolume: number,
  weekVolume: number,
  points: number,
  raffleTickets: number,
  rebateEarned: number,
  pendingRewards: number,
  streakStartedAt: number,
): WalletRecord {
  return {
    wallet,
    currentStreak,
    longestStreak,
    lastTradeAt: Date.now() - Math.floor(Math.random() * 6 * 3_600_000),
    streakStartedAt,
    totalVolume,
    weekVolume,
    points,
    raffleTickets,
    rebateEarned,
    pendingRewards,
    createdAt: streakStartedAt,
    referralCode: wallet.slice(-6).toUpperCase(),
    referredBy: null,
  };
}

function seedEvents(): StreakEvent[] {
  const day = 86_400_000;
  const hour = 3_600_000;
  const wallet = "0x982233ccddeea4f2";
  const pairs = ["SOL/USDC", "JTO/USDC", "RAY/USDC", "BONK/USDC", "mSOL/USDC"];

  // Anchor each day to 12:00 UTC so the latest event is always "today" (status=safe),
  // regardless of when the seed is generated in any timezone.
  const d = new Date();
  const todayNoonUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12);

  const events: StreakEvent[] = [];

  for (let i = 14; i >= 0; i--) {
    events.push({
      id: `seed-swap-${i}`,
      wallet,
      type: "streak_maintained",
      timestamp: todayNoonUtc - i * day,
      data: { day: 15 - i, pair: pairs[i % pairs.length], volume: 800 + i * 120, dex: "raydium" },
    });
  }

  events.push({
    id: "seed-share-7",
    wallet,
    type: "streak_shared",
    timestamp: todayNoonUtc - 7 * day + 3 * hour,
    data: { streak_length: 7 },
  });
  events.push({
    id: "seed-share-14",
    wallet,
    type: "streak_shared",
    timestamp: todayNoonUtc - 1 * day + 2 * hour,
    data: { streak_length: 14 },
  });
  events.push({
    id: "seed-referral",
    wallet,
    type: "referral_converted",
    timestamp: todayNoonUtc - 3 * day + hour,
    data: { referred_wallet: "0x11cc2233aabbffee", bonus_tickets: 1 },
  });

  return events;
}
