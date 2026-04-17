"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "streakfi:referralCode";

/**
 * Silently captures `?ref=CODE` from the URL into localStorage.
 * The first POST /api/streak after a referral will include `referredBy` and
 * Torque will fire `referral_converted` once the referred wallet hits day 3.
 */
export function ReferralTracker() {
  const sp = useSearchParams();
  useEffect(() => {
    const ref = sp.get("ref");
    if (!ref) return;
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      window.localStorage.setItem(STORAGE_KEY, ref.toUpperCase());
    }
  }, [sp]);
  return null;
}

export function getStoredReferral(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function clearStoredReferral() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
