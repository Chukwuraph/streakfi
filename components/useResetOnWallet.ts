"use client";

import { useEffect, useRef } from "react";

/**
 * Fire the reset callbacks when `wallet` changes value (not on initial mount).
 * Used to clear stale demo/remote data the instant the active wallet switches
 * (wallet-adapter connect/disconnect), so pages don't flash prior-wallet state
 * while the new fetch is in-flight.
 */
export function useResetOnWallet(wallet: string, ...resets: Array<() => void>) {
  const prev = useRef(wallet);
  useEffect(() => {
    if (prev.current === wallet) return;
    prev.current = wallet;
    resets.forEach((r) => r());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);
}
