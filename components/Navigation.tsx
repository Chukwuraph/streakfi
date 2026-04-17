"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { WalletButton } from "./WalletButton";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rewards", label: "Rewards" },
  { href: "/history", label: "History" },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#0c1322]/80 backdrop-blur-xl shadow-[0_0_20px_rgba(249,115,22,0.08)]">
        <nav className="flex justify-between items-center px-6 h-20 max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-black text-orange-500 tracking-tighter uppercase">
            StreakFi
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            {LINKS.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "transition-all duration-300 uppercase tracking-tighter",
                    active
                      ? "text-orange-500 border-b-2 border-orange-500 pb-1 font-black"
                      : "text-slate-400 font-medium hover:text-slate-200 hover:bg-white/5 px-3 py-1 rounded-lg",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <WalletButton />
        </nav>
      </header>
      {/* mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-10 left-0 right-0 z-40 px-4 pb-3">
        <div className="glass-panel rounded-2xl border border-outline-variant/20 grid grid-cols-5 text-[10px] font-black uppercase tracking-widest">
          {LINKS.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "py-3 text-center",
                  active ? "text-primary-container" : "text-slate-400",
                )}
              >
                {link.label.slice(0, 4)}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
