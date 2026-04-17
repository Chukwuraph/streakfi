export type StreakEventType =
  | "streak_maintained"
  | "streak_broken"
  | "streak_shared"
  | "referral_converted"
  | "swap_confirmed";

export interface StreakEvent {
  id: string;
  wallet: string;
  type: StreakEventType;
  timestamp: number;
  data: Record<string, string | number | boolean>;
}

export interface WalletRecord {
  wallet: string;
  currentStreak: number;
  longestStreak: number;
  lastTradeAt: number | null;
  streakStartedAt: number | null;
  totalVolume: number;
  weekVolume: number;
  points: number;
  raffleTickets: number;
  rebateEarned: number;
  pendingRewards: number;
  createdAt: number;
  referralCode: string;
  referredBy: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  streak: number;
  volume: number;
  points: number;
  isYou?: boolean;
}

export interface PlatformStats {
  activeStreaks: number;
  rewardsDistributed: number;
  totalParticipants: number;
  volumeTracked: number;
}

export interface RafflePrizeBucket {
  amount: number;
  count: number;
}

export interface RaffleSummary {
  myTickets: number;
  totalTickets: number;
  drawAt: number;
  buckets: RafflePrizeBucket[];
  pastWinners: {
    week: string;
    wallet: string;
    prize: number;
    isYou: boolean;
  }[];
}

export interface RebateTier {
  name: "Bronze" | "Silver" | "Gold";
  days: number;
  multiplier: number;
  status: "completed" | "active" | "locked";
  progressPct: number;
}
