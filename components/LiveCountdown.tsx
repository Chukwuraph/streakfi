"use client";

import { useEffect, useState } from "react";

function msUntilUtcMidnight(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(0, next.getTime() - now.getTime());
}

function format(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function LiveCountdown({ className }: { className?: string }) {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    setMs(msUntilUtcMidnight());
    const id = setInterval(() => setMs(msUntilUtcMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  return <span className={className}>{ms == null ? "—" : format(ms)}</span>;
}
