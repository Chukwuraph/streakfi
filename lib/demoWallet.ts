/**
 * Active wallet resolution:
 * - If ?wallet=... is provided, use it.
 * - Otherwise fall back to the seeded demo wallet so the UI is always populated.
 */
export const DEMO_WALLET = "0x982233ccddeea4f2";

export function resolveWallet(req: Request): string {
  const url = new URL(req.url);
  return url.searchParams.get("wallet") ?? DEMO_WALLET;
}
