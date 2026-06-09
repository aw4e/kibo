# ⛰️ Kibo

> **Daily micro-savings on Celo.** Deposit 0.01 cUSD every day, build your streak, earn rewards at milestones — all on-chain, non-custodial, MiniPay-native.

Built for the **14M+ MiniPay users** who want a dead-simple daily savings habit with real yield.

---

## What it does

Kibo turns saving into a streak game:

| Action | Result |
|--------|--------|
| Deposit 0.01–1 cUSD | Streak +1, 20h cooldown starts |
| Hit day 7, 14, 21… | Claim milestone reward from pool |
| Miss a day | Streak resets (shields can absorb 1 miss) |
| Reach 30/90/180/365 days | Earn Bronze → Silver → Gold → Diamond badge |
| Broke your streak? | Pay a small recovery fee to restore it |
| Invite a friend | Earn 5% of their first deposit |
| Sponsor a friend | `depositFor` — pay their daily deposit for them |
| Set a savings goal | On-chain target with live progress bar |

---

## Features

- **Streak system** — 20h cooldown, milestone rewards every 7 days, escalating reward tiers
- **Streak shields** — up to 3 free miss-absorbers earned at milestones
- **Streak recovery** — broke your streak? pay `brokenStreak × 0.01 cUSD` (capped 0.1) to restore it
- **Badge system** — Bronze (30d), Silver (90d), Gold (180d), Diamond (365d) — on-chain, visible on leaderboard
- **Savings goal** — set a cUSD target, track progress on-chain
- **Referral system** — 5% of referee's first deposit credited to referrer, claimable anytime
- **Sponsor deposit** — `depositFor(address)` lets you pay a friend's daily deposit
- **Leaderboard** — top 20 savers by streak, queried directly from contract
- **Non-custodial** — funds sit in the contract, withdrawable anytime (streak resets on withdraw)
- **MiniPay compatible** — injected wallet detection, mobile-first UI

---

## Contract

| | |
|---|---|
| **Network** | Celo Mainnet (chainId 42220) |
| **Kibo** | [`0x765c96F44c2d82EB5C6609e2a09220600e1C8006`](https://celoscan.io/address/0x765c96F44c2d82EB5C6609e2a09220600e1C8006) |
| **cUSD** | [`0x765DE816845861e75A25fCA122bb6898B8B1282a`](https://celoscan.io/address/0x765DE816845861e75A25fCA122bb6898B8B1282a) |

---

## Stack

```
contracts/     Solidity 0.8.20 · Hardhat · deployed to Celo mainnet
packages/
  react-app/   Next.js 15 · wagmi v2 · viem · Tailwind-free CSS
kibo-sdk/      Vanilla TS SDK — use Kibo from any JS app
```

---

## Quick start

```bash
# Install all workspaces
yarn

# Run the dApp locally (connects to mainnet by default)
cd packages/react-app
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) and connect MiniPay or any injected wallet.

### Environment

```bash
cp .env.example .env
```

```env
NEXT_PUBLIC_KIBO_ADDRESS=0x765c96F44c2d82EB5C6609e2a09220600e1C8006
PRIVATE_KEY=           # only needed for deploy
CELOSCAN_API_KEY=      # only needed for verify
```

### Contract deploy

```bash
# Testnet (Celo Sepolia)
yarn deploy:celoSepolia

# Mainnet
yarn deploy:celo

# Verify on Celoscan
yarn verify:celo
```

---

## SDK

```bash
npm install kibo-sdk
```

```ts
import { getUser, deposit, setGoal, claimReferralReward } from "kibo-sdk";
import type { WalletClient } from "viem";

// Read user state
const user = await getUser("0xYourAddress");
console.log(user.streak);          // current streak in days
console.log(user.badge);           // Badge enum: None / Bronze / Silver / Gold / Diamond
console.log(user.brokenStreak);    // days in broken streak (recoverable)
console.log(user.rewardsClaimed);  // total cUSD claimed as rewards (bigint, 18 decimals)

// Write — pass a viem WalletClient
await deposit(walletClient);                              // 0.01 cUSD, no referrer
await deposit(walletClient, parseUnits("0.05", 18), referrerAddr);
await depositFor(walletClient, friendAddr);              // sponsor a friend
await setGoal(walletClient, parseUnits("10", 18));       // set 10 cUSD savings goal
await recoverStreak(walletClient);                       // restore broken streak
await claimReferralReward(walletClient);                 // claim pending referral earnings
```

---

## Reward tiers

| Streak milestone | Reward |
|-----------------|--------|
| Day 7 | 0.005 cUSD |
| Day 14+ | 0.012 cUSD |
| Day 35+ | 0.025 cUSD |

Rewards come from the shared pool funded by a 0.5% fee on each deposit. Pool balance is on-chain and publicly readable.

---

## Project structure

```
kibo/
├── contracts/
│   └── Kibo.sol              # Main savings contract
├── packages/
│   └── react-app/
│       ├── app/
│       │   ├── page.tsx      # Full UI — home, leaderboard, info tabs
│       │   └── globals.css   # Mobile-first iOS-style CSS
│       ├── hooks/
│       │   └── useKibo.ts    # wagmi hook wrapping all contract interactions
│       └── lib/
│           └── kibo-abi.ts   # ABI + addresses
└── kibo-sdk/
    └── src/index.ts          # Framework-agnostic TS SDK
```

---

## License

MIT
