"use client";

import clsx from "clsx";

type Status = "safe" | "at_risk" | "broken" | "new";

export function StreakCounter({
  streak,
  status,
  lastTradeAt,
}: {
  streak: number;
  status: Status;
  lastTradeAt: number | null;
}) {
  const lastLabel =
    lastTradeAt != null
      ? new Date(lastTradeAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "No trades yet";

  const flame = status === "broken" ? "💔" : "🔥";
  const tone =
    status === "broken"
      ? "from-slate-500 to-slate-700"
      : status === "at_risk"
        ? "from-[#ffb690] to-[#d97706]"
        : "from-primary to-primary-container";

  return (
    <div className="flex items-baseline gap-4">
      <span
        className={clsx(
          "text-8xl md:text-[10rem] lg:text-[12rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br streak-glow leading-none animate-odometer-in",
          tone,
          status === "at_risk" && "animate-pulse-flame",
        )}
      >
        {flame} {streak}
      </span>
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-black tracking-tight uppercase leading-none">
          Day Streak
        </h1>
        <p className="text-on-surface-variant font-medium mt-2 text-sm md:text-base">
          Last trade: {lastLabel}
        </p>
      </div>
    </div>
  );
}
