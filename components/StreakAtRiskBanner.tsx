"use client";

import { useEffect, useState } from "react";
import { LiveCountdown } from "./LiveCountdown";

type Status = "safe" | "at_risk" | "broken" | "new";

/**
 * Sticky orange banner when no trade today and it's past 18:00 local time
 * (matches requirements 5.9 — streak-at-risk banner).
 */
export function StreakAtRiskBanner({ status }: { status: Status }) {
  const [dismissed, setDismissed] = useState(false);
  const [isEvening, setIsEvening] = useState(false);

  useEffect(() => {
    const check = () => setIsEvening(new Date().getHours() >= 18);
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  if (dismissed) return null;
  if (status !== "at_risk" && status !== "new") return null;
  if (!isEvening && status !== "at_risk") return null;

  const message =
    status === "new"
      ? "Start your streak tonight — make your first Raydium swap before UTC midnight."
      : "Trade before UTC midnight to keep your streak alive.";

  return (
    <div className="sticky top-20 z-40 mx-4 md:mx-0 mb-6 rounded-xl bg-primary-container/15 border border-primary-container/40 px-4 py-3 flex items-center gap-3 backdrop-blur-xl shadow-[0_0_30px_rgba(249,115,22,0.15)]">
      <span
        className="material-symbols-outlined text-primary-container animate-pulse-flame"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        local_fire_department
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-sm font-black uppercase tracking-tight text-primary-container">
          Streak at risk — <LiveCountdown className="font-mono" /> remaining
        </p>
        <p className="text-[11px] md:text-xs text-on-surface-variant mt-0.5">{message}</p>
      </div>
      <a
        href="https://raydium.io/swap"
        target="_blank"
        rel="noreferrer"
        className="hidden sm:inline-block bg-primary-container text-on-primary-container px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest"
      >
        Trade now
      </a>
      <button
        onClick={() => setDismissed(true)}
        className="text-on-surface-variant hover:text-on-surface"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
