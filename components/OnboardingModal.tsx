"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import clsx from "clsx";

const STORAGE_KEY = "streakfi:onboarded";

const SLIDES = [
  {
    icon: "local_fire_department",
    title: "Streaks are the game",
    body: "Swap on Raydium at least once every 24 hours. Each consecutive day grows your streak — your points, raffle tickets, and rebate tier all compound with it.",
    tone: "primary" as const,
  },
  {
    icon: "bolt",
    title: "Rewards run on Torque",
    body: "Every streak increment, leaderboard rank, and raffle draw flows through Torque Protocol. Custom events + on-chain IDL tracking make rewards provable and trustless.",
    tone: "secondary" as const,
  },
  {
    icon: "verified",
    title: "What counts as a streak day?",
    body: "Any qualifying swap on Raydium counts. Events are tracked via Torque's IDL integration — no manual check-ins needed.",
    tone: "tertiary" as const,
  },
];

export function OnboardingModal() {
  const { connected } = useWallet();
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (!connected) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    setOpen(true);
  }, [connected]);

  const close = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
    setOpen(false);
  };

  if (!open) return null;
  const current = SLIDES[slide];
  const last = slide === SLIDES.length - 1;

  const iconBg =
    current.tone === "primary"
      ? "bg-primary-container/20 text-primary-container"
      : current.tone === "secondary"
        ? "bg-secondary-container/40 text-secondary"
        : "bg-tertiary-container/20 text-tertiary";

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
      <div className="relative z-10 max-w-lg w-full bg-surface-container-high rounded-3xl p-8 border border-outline-variant/20 shadow-2xl">
        <button
          onClick={close}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
          aria-label="Skip onboarding"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className={clsx("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", iconBg)}>
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {current.icon}
          </span>
        </div>

        <p className="text-xs uppercase font-black tracking-[0.3em] text-on-surface-variant mb-2">
          Welcome to StreakFi — {slide + 1} / {SLIDES.length}
        </p>
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-on-surface mb-4">
          {current.title}
        </h2>
        <p className="text-on-surface-variant leading-relaxed mb-8">{current.body}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "h-1.5 rounded-full transition-all",
                  i === slide ? "w-8 bg-primary-container" : "w-1.5 bg-surface-container-highest",
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={close}
              className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
            >
              Skip
            </button>
            {last ? (
              <Link
                href="https://raydium.io/swap"
                target="_blank"
                onClick={close}
                className="px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest bg-gradient-to-br from-primary to-primary-container text-on-primary-container shadow-[0_0_20px_rgba(249,115,22,0.3)]"
              >
                Make first trade →
              </Link>
            ) : (
              <button
                onClick={() => setSlide(slide + 1)}
                className="px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest bg-primary-container text-on-primary-container"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
