# StreakFi

**Trade Daily. Earn More.**
A Solana-native DeFi streak reward platform, powered end-to-end by [Torque Protocol](https://torque.so).

Built for the Frontier Hackathon — Torque Track.

---

## What it does

StreakFi tracks whether a wallet has executed a qualifying Raydium swap each day. Consecutive days build a "streak" that earns:

- **Leaderboard rank** (Torque Leaderboard campaign)
- **Raffle tickets** (Torque Raffle campaign, weighted by metric)
- **Tiered rebates** (Torque Rebate campaign — Bronze/Silver/Gold at 7/14/30 days)
- **Direct distributions** for milestone claims

Every reward moment in the UI is attributed to Torque — per the hackathon's "Use of Torque MCP" judging criterion.

## Stack

- **Next.js 14 App Router** + TypeScript
- **Tailwind CSS** with design tokens from `design/streakfi_kinetic/DESIGN.md`
- **@solana/wallet-adapter** (Phantom, Solflare)
- **Torque Protocol** ingest + campaigns (via API / MCP)
- **File-based JSON store** (`data/`) for streak events and wallet records — swap for Postgres in prod

## Pages

| Path | Purpose |
|------|---------|
| `/` | Landing — hero, live stats, "How it works", CTA |
| `/dashboard` | The hero streak counter, momentum deadline, reward cards, activity feed |
| `/leaderboard` | Torque-ranked weekly + all-time table, rank movements, Torque engine card |
| `/rewards` | Claim pending USDC, raffle tickets, rebate tier progress, past winners |
| `/history` | 13-week GitHub-style heatmap + full trade log |
| `/share` | Auto-generated momentum trophy card + X share flow |

## API routes

All routes live under `/app/api`. Server-side, they read/write the local JSON store and fan out to Torque's ingest endpoint when `TORQUE_API_KEY` is set.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/streak` | `GET` | Current streak, status, countdown, recent activity |
| `/api/streak` | `POST` | Record a qualifying swap → emits `streak_maintained` Torque event |
| `/api/torque/events` | `POST` | Generic passthrough to emit any custom event |
| `/api/leaderboard` | `GET` | Top 10 + your rank (scope: `week` or `all`) |
| `/api/raffle` | `GET` | Your tickets, total pool, draw time, past winners |
| `/api/rebate` | `GET` | Tier progress, earnings, pending |
| `/api/stats` | `GET` | Platform-wide active streaks, rewards distributed |
| `/api/share` | `POST` | Emits `streak_shared` Torque event |

## Torque integration

StreakFi uses four Torque primitives, matching the [Torque MCP docs](https://platform.torque.so/docs/mcp/quickstart):

### 1. Custom events
Three events are emitted via `POST https://ingest.torque.so/events`:

```json
{
  "userPubkey": "<wallet>",
  "timestamp": 1742400000000,
  "eventName": "streak_maintained",
  "data": { "day": 14, "pair": "SOL/USDC", "volume": 1200, "dex": "raydium" }
}
```

- `streak_maintained` — fired on every qualifying swap (day = consecutive streak count)
- `streak_broken` — fired when a day is missed
- `streak_shared` — fired when a user shares their streak to X (earns bonus raffle ticket)
- `referral_converted` — fired when a referral hits their first 3-day streak

Register the event schemas once via `create_custom_event` (MCP tool), then attach them to the StreakFi project.

### 2. IDL tracking
Upload the Raydium AMM program IDL via `create_idl` so swap instructions automatically fire events as a data source for incentives. Workflow: `parse_idl` → `create_idl` → `generate_incentive_query (source: idl_instruction)` → `create_recurring_incentive`.

### 3. Incentive campaigns
Configure three recurring incentives in Torque:

- **Leaderboard** — ranks by `points` metric, payout formula: `RANK == 1 ? 2000 : RANK == 2 ? 1500 : RANK == 3 ? 1000 : (RANK <= 10 ? 50 : 0)`
- **Raffle** — `WEIGHTED_BY_METRIC` with buckets `[{amount:1000,count:1},{amount:250,count:5},{amount:50,count:20}]`
- **Rebate** — `rebatePercentage: 0.05`, formula automatically becomes `VALUE * 0.05`

### 4. Direct distribution
For milestone bonuses (7/14/30-day), a `direct` incentive with explicit wallet allocations.

## Local dev

```bash
# 1. Install
npm install

# 2. Environment (copy and fill)
cp .env.example .env.local
# set TORQUE_API_KEY (from MCP `create_api_key` or the Torque dashboard)

# 3. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without a wallet connected, the UI runs against a seeded demo wallet so judges see populated state immediately. Connect a real Solana wallet to track your own.

### Seed data

`lib/db.ts` seeds 9 wallets covering top 10 + a "you" row at rank 5, and 15 days of `streak_maintained` events for the demo wallet so the calendar and activity feed render out of the box. Delete `data/events.json` and `data/wallets.json` to reset.

### Simulate a trade
On the dashboard, click **Simulate Raydium Swap** — this writes a `streak_maintained` event locally and forwards it to Torque's ingest endpoint (when `TORQUE_API_KEY` is set).

## Torque MCP setup (one-time)

```bash
# If you have Claude Code:
claude mcp add torque -e TORQUE_API_TOKEN=<your-token> -- npx @torque-labs/mcp

# Then inside Claude Code, ask it to:
# 1. create_custom_event streak_maintained, streak_broken, streak_shared, referral_converted
# 2. attach_custom_event to the StreakFi project
# 3. parse_idl / create_idl for Raydium AMM (Program ID: 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8)
# 4. create_recurring_incentive (leaderboard, raffle, rebate)
```

## Design system

Tokens live in `tailwind.config.ts` — matched exactly to `design/streakfi_kinetic/DESIGN.md` "Kinetic High-Energy DeFi":

- **Streak Orange** `#f97316` — momentum, CTAs
- **Torque Indigo** `#3131c0` / `#6366f1` — protocol attribution, badges
- **Deep Night** `#0c1322` — background
- **Inter Black** for all hero numerals, Inter Medium for body

Conventions: no 1px borders (tonal shifts instead), glass panels for floating elements, ambient tinted glows (never grey shadows), minimum `0.75rem` radius.

## Accessibility

- WCAG AA contrast across all dark-bg text
- Streak status never relies on color alone — icon + text label always paired
- 44px minimum touch targets on mobile
- Countdown timers expose `aria-live` updates
- Wallet addresses truncated consistently via `truncateWallet()`

## Folder map

```
app/
  api/               server routes (streak, leaderboard, raffle, rebate, stats, share, torque/events)
  dashboard/         hero streak + reward cards + Torque engine sidebar
  history/           heatmap calendar + trade log
  leaderboard/       ranked table + rank movements + Torque card
  rewards/           claim + raffle + tier progress + past winners
  share/             viral moment trophy card
  page.tsx           landing
  layout.tsx         wallet provider, nav, footer, Torque badge
components/          shared UI (StreakCounter, TorqueBadge, MilestoneModal, Wallet*)
lib/                 torque client, streak math, db, types
data/                JSON persistence (gitignored except .gitkeep)
design/              original HTML comps + requirements doc
```

## Hackathon alignment

From the requirements doc:

- ✅ **G1 "Make streaks feel alive"** — 12rem streak numeral, odometer + pulse animations, risk/broken states
- ✅ **G2 "Surface Torque at every reward moment"** — `TorqueBadge` on every card, floating persistent badge, dedicated engine sidebar
- ✅ **G3 "Time-to-first-streak < 60s"** — wallet-connect → dashboard → Simulate Swap is 3 clicks
- ✅ **G4 "Make sharing irresistible"** — auto-open milestone modal at 7/14/30/60/100 days + dedicated `/share` trophy card
- ✅ **G5 "Trust through transparency"** — "How it Works" section on rewards page cites IDL tracking, raffle weighting, on-chain verification
- ✅ **G6 "Mobile-first"** — responsive at 390px, bottom tab bar, stacked hero

---

Built for the Frontier Hackathon. Torque is not a bolt-on — it *is* the reward engine.
