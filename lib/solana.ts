import { Connection, PublicKey } from "@solana/web3.js";

/**
 * Known Raydium program IDs. Any instruction (top-level or inner) against
 * one of these counts as a qualifying StreakFi swap.
 */
export const RAYDIUM_PROGRAMS = new Set<string>([
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // AMM V4
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", // CLMM
  "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", // CPMM
  "5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h", // Stable swap
  "routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS", // Raydium Router
]);

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

let _connection: Connection | null = null;
function conn(): Connection {
  if (!_connection) _connection = new Connection(RPC_URL, "confirmed");
  return _connection;
}

export interface ParsedSwap {
  signature: string;
  signer: string;
  blockTime: number | null;
  slot: number;
  isRaydium: boolean;
  touchedPrograms: string[];
  volumeUsd: number;
  pair: string;
}

/**
 * Fetch a signed Solana tx and extract everything we need to credit a streak.
 * Returns null if the tx doesn't exist / is still processing.
 */
export async function parseSwap(signature: string): Promise<ParsedSwap | null> {
  const tx = await conn().getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  if (!tx || !tx.meta) return null;

  const keys = tx.transaction.message.accountKeys;
  const signer = keys.find((k) => k.signer)?.pubkey.toBase58() ?? keys[0]?.pubkey.toBase58() ?? "";

  const top = tx.transaction.message.instructions ?? [];
  const inner = tx.meta.innerInstructions?.flatMap((i) => i.instructions) ?? [];
  const allInstructions = [...top, ...inner];
  const touchedPrograms = Array.from(
    new Set(allInstructions.map((ix) => ix.programId.toBase58())),
  );
  const isRaydium = touchedPrograms.some((p) => RAYDIUM_PROGRAMS.has(p));

  const { volumeUsd, pair } = estimateVolume(tx.meta, signer);

  return {
    signature,
    signer,
    blockTime: tx.blockTime ?? null,
    slot: tx.slot,
    isRaydium,
    touchedPrograms,
    volumeUsd,
    pair,
  };
}

/**
 * Approximate USD volume from the signer's stablecoin balance delta; falls back
 * to SOL lamport delta * rough SOL price for swaps that don't touch USDC/USDT.
 */
function estimateVolume(
  meta: NonNullable<Awaited<ReturnType<Connection["getParsedTransaction"]>>>["meta"],
  signer: string,
): { volumeUsd: number; pair: string } {
  if (!meta) return { volumeUsd: 0, pair: "UNKNOWN" };
  const pre = meta.preTokenBalances ?? [];
  const post = meta.postTokenBalances ?? [];

  let stableDelta = 0;
  let stableMint = "";
  for (const p of post) {
    if (p.owner !== signer) continue;
    if (p.mint !== USDC_MINT && p.mint !== USDT_MINT) continue;
    const preMatch = pre.find((x) => x.accountIndex === p.accountIndex);
    const postAmt = p.uiTokenAmount.uiAmount ?? 0;
    const preAmt = preMatch?.uiTokenAmount.uiAmount ?? 0;
    const delta = Math.abs(postAmt - preAmt);
    if (delta > stableDelta) {
      stableDelta = delta;
      stableMint = p.mint;
    }
  }

  if (stableDelta > 0) {
    return {
      volumeUsd: Number(stableDelta.toFixed(2)),
      pair: stableMint === USDC_MINT ? "USDC" : "USDT",
    };
  }

  const preBal = meta.preBalances?.[0] ?? 0;
  const postBal = meta.postBalances?.[0] ?? 0;
  const lamportDelta = Math.abs(preBal - postBal);
  if (lamportDelta > 0) {
    // Rough SOL price — fine for hackathon volume approximation.
    const SOL_USD = 160;
    return { volumeUsd: Number(((lamportDelta / 1e9) * SOL_USD).toFixed(2)), pair: "SOL" };
  }

  return { volumeUsd: 0, pair: "UNKNOWN" };
}

/**
 * Recent signatures for a wallet, newest first.
 */
export async function recentSignatures(wallet: string, limit = 20): Promise<string[]> {
  const sigs = await conn().getSignaturesForAddress(new PublicKey(wallet), { limit });
  return sigs.map((s) => s.signature);
}
