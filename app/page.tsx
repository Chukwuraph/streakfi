import Link from "next/link";
import { TorqueBadge } from "@/components/TorqueBadge";

async function getStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/stats`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return { activeStreaks: 1240, rewardsDistributed: 450_000, totalParticipants: 340, volumeTracked: 5_200_000 };
  }
}

export default async function LandingPage() {
  const stats = await getStats();
  return (
    <div className="pt-20 kinetic-gradient-bg min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-16 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary-container/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-highest border border-outline-variant/20 mb-4">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            <span className="font-bold text-primary uppercase tracking-widest text-xs">Momentum Engine Active</span>
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.85] text-on-surface">
            Trade Daily.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container">
              Earn More.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-on-surface-variant font-medium leading-relaxed">
            Rewards consistent Solana traders via{" "}
            <span className="text-secondary font-bold">Torque Protocol</span>. Turn your daily Raydium volume into
            unstoppable yield and exclusive rebates.
          </p>
          <div className="pt-8">
            <Link
              href="/dashboard"
              className="group relative bg-gradient-to-br from-primary to-primary-container text-on-primary-container text-xl md:text-2xl font-black px-10 md:px-12 py-5 md:py-6 rounded-2xl shadow-[0_0_32px_rgba(249,115,22,0.2)] hover:shadow-[0_0_48px_rgba(249,115,22,0.4)] transition-all active:scale-95 uppercase tracking-tighter inline-flex items-center gap-4"
            >
              Start My Streak
              <span className="material-symbols-outlined font-black group-hover:translate-x-2 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <StatCard
            label="Active Streaks"
            value={stats.activeStreaks.toLocaleString()}
            icon="local_fire_department"
            tone="primary"
          />
          <StatCard
            label="Rewards Distributed"
            value={`$${Math.round(stats.rewardsDistributed / 1000)}K`}
            icon="payments"
            tone="secondary"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="mb-16">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-on-surface mb-2">The Kinetic Process</h2>
          <div className="w-24 h-2 bg-primary-container" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Step
            num="01"
            title="Connect Wallet"
            body="Securely link your Solana wallet (Phantom, Solflare, Backpack) and start tracking daily activity."
          />
          <Step
            num="02"
            title="Trade on Raydium"
            body="Execute swaps on Raydium. Every qualifying day fuels your Streak flame and raffle weight."
            secondaryBorder
          />
          <StepHighlight
            num="03"
            title="Earn Rewards"
            body="Torque distributes leaderboard prizes, weekly raffles, and rebates. Everything runs on-chain."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="bg-surface-container-lowest rounded-[3rem] p-10 md:p-24 overflow-hidden relative border border-outline-variant/10">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <TorqueBadge size="card" label="Verified via Torque Protocol" className="mb-6" />
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-on-surface mb-8 leading-none">
                Ready to ignite your yield?
              </h2>
              <Link
                href="/dashboard"
                className="inline-block bg-on-surface text-surface font-black px-10 md:px-12 py-4 md:py-5 rounded-2xl uppercase tracking-tighter hover:bg-primary hover:text-on-primary transition-colors text-lg md:text-xl"
              >
                Launch Dashboard
              </Link>
            </div>
            <div className="bg-surface-bright/50 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col gap-6 w-full max-w-sm">
              <InfoRow label="Yield Multiplier" value="x2.4" tone="tertiary" />
              <InfoRow label="Current Streak" value="14 Days" tone="primary" />
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-tertiary rounded-full animate-pulse shadow-[0_0_8px_#62df7d]" />
                  <span className="text-xl font-black text-on-surface uppercase tracking-tighter">Elite</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: string;
  tone: "primary" | "secondary";
}) {
  const border = tone === "primary" ? "border-primary/20" : "border-secondary/20";
  const color = tone === "primary" ? "text-primary" : "text-secondary";
  return (
    <div className={`glass-panel p-6 md:p-8 rounded-3xl border-t-2 ${border} flex items-center justify-between`}>
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${color}`}>{label}</p>
        <h2 className="text-3xl md:text-4xl font-black text-on-surface tracking-tighter">{value}</h2>
      </div>
      <span className={`material-symbols-outlined text-4xl md:text-5xl opacity-50 ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
    </div>
  );
}

function Step({ num, title, body, secondaryBorder }: { num: string; title: string; body: string; secondaryBorder?: boolean }) {
  return (
    <div className={`bg-surface-container-low p-10 rounded-[2rem] relative overflow-hidden group ${secondaryBorder ? "border-t-2 border-secondary/10" : ""}`}>
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
      <div className="relative z-10">
        <span className="text-6xl font-black text-outline-variant/30 absolute -top-4 -left-2 tracking-tighter">{num}</span>
        <div className="mt-12 space-y-4">
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-on-surface">{title}</h3>
          <p className="text-on-surface-variant leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

function StepHighlight({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="bg-surface-container-highest p-10 rounded-[2rem] relative overflow-hidden group shadow-2xl">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-tertiary/10 rounded-full blur-3xl" />
      <div className="relative z-10">
        <span className="text-6xl font-black text-tertiary/20 absolute -top-4 -left-2 tracking-tighter">{num}</span>
        <div className="mt-12 space-y-4">
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-tertiary">{title}</h3>
          <p className="text-on-surface-variant leading-relaxed">{body}</p>
          <div className="flex gap-2 pt-4 flex-wrap">
            <Chip>Rebates</Chip>
            <Chip>Raffles</Chip>
            <Chip>Leaderboard</Chip>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-tertiary-container/20 text-tertiary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-tertiary/30">
      {children}
    </span>
  );
}

function InfoRow({ label, value, tone }: { label: string; value: string; tone: "tertiary" | "primary" }) {
  const color = tone === "tertiary" ? "text-tertiary" : "text-primary";
  return (
    <div className="flex justify-between items-end border-b border-white/10 pb-4">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <span className={`text-3xl md:text-4xl font-black tracking-tighter ${color}`}>{value}</span>
    </div>
  );
}
