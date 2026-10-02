<p align="center">
  <img src="assets/Kibo.png" alt="Kibo" width="120" />
</p>

<h1 align="center">Kibo</h1>

<p align="center">
  <strong>Daily micro-savings on BNB Smart Chain testnet.</strong><br/>
  Deposit tUSD every day, build your streak, earn rewards at milestones.
</p>

<p align="center">
  <a href="https://testnet.bscscan.com">
    <img src="https://img.shields.io/badge/BNB-Testnet-F0B90B?logo=binance&logoColor=000" alt="BNB Testnet" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License" />
  <img src="https://img.shields.io/badge/Stack-Next.js%2016%20%2B%20wagmi%20v2-black?logo=nextdotjs" alt="Stack" />
</p>

---

## What it does

Kibo turns saving into a streak game:

| Action | Result |
|--------|--------|
| Deposit 0.01 to 1 tUSD | Streak +1, 20h cooldown starts |
| Hit day 7, 14, 21... | Claim milestone reward from shared pool |
| Miss a day | Streak resets (shields absorb 1 miss) |
| Reach 30 / 90 / 180 / 365 days | Earn Bronze, Silver, Gold, Diamond badge |
| Broke your streak? | Pay a small recovery fee to restore it |
| Invite a friend | Earn 5% of their first deposit |
| Sponsor a friend | Pay their daily deposit for them |
| Set a savings goal | On-chain target with live progress bar |

---

## Features

- **Streak system**: 20h cooldown, milestone rewards every 7 days, escalating tiers
- **Streak shields**: up to 3 miss-absorbers earned at milestones
- **Streak recovery**: pay `brokenStreak x 0.01 tUSD` (capped at 0.1) to restore
- **Badge system**: Bronze (30d), Silver (90d), Gold (180d), Diamond (365d), stored on-chain
- **Savings goal**: set a tUSD target, track progress with a live bar
- **Referral system**: 5% of referee's first deposit credited to referrer, claimable anytime
- **Sponsor deposit**: `depositFor(address)` pays a friend's daily deposit
- **Leaderboard**: top 20 savers by streak, read directly from contract
- **Non-custodial**: funds sit in contract, withdrawable anytime

---

## Contract

| | |
|---|---|
| **Network** | BNB Smart Chain Testnet (chainId 97) |
| **Kibo** | [`0x6A7163F90eB6c49E7c172Dff1B20F2F0c433Fa33`](https://testnet.bscscan.com/address/0x6A7163F90eB6c49E7c172Dff1B20F2F0c433Fa33) |
| **tUSD** | [`0xEC5548229414F70eCA5b6041d16b88A173a5916E`](https://testnet.bscscan.com/address/0xEC5548229414F70eCA5b6041d16b88A173a5916E) (MockERC20, open mint) |

---

## Stack

```
sc/           Solidity 0.8.20, Hardhat, deployed to BNB testnet
frontend/     Next.js 16, React 19, wagmi v2, viem, shadcn/ui, Tailwind CSS
kibo-sdk/     Framework-agnostic TypeScript SDK
```

---

## Quick start

```bash
# Install all workspaces
yarn

# Run the frontend locally
cd frontend
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) and connect any injected wallet.

### Environment

```bash
cp .env.example .env
```

```env
NEXT_PUBLIC_KIBO_ADDRESS=
NEXT_PUBLIC_TOKEN_ADDRESS=
PRIVATE_KEY=           # only needed for deploy
ETHERSCAN_API_KEY=     # only needed for verify
```

### Contract deploy

```bash
# Deploy (network name goes last)
yarn deploy bnbTestnet

# Verify on BscScan
yarn verify bnbTestnet <kibo> <token>
```

---

## SDK

```bash
npm install kibo-sdk
```

```ts
import { getUser, deposit, depositFor, setGoal, recoverStreak, claimReferralReward } from "kibo-sdk";

// Read
const user = await getUser("0xYourAddress");
console.log(user.streak);         // current streak (days)
console.log(user.badge);          // Badge: None / Bronze / Silver / Gold / Diamond
console.log(user.brokenStreak);   // recoverable broken streak
console.log(user.rewardsClaimed); // total tUSD claimed (bigint, 18 decimals)

// Write - pass a viem WalletClient
await deposit(walletClient);
await deposit(walletClient, parseUnits("0.05", 18), referrerAddr);
await depositFor(walletClient, friendAddr);
await setGoal(walletClient, parseUnits("10", 18));
await recoverStreak(walletClient);
await claimReferralReward(walletClient);
```

---

## Reward tiers

| Milestone | Reward |
|-----------|--------|
| Day 7 | 0.1 tUSD |
| Day 14+ | 0.25 tUSD |
| Day 35+ | 0.5 tUSD |

Rewards come from a shared pool funded by a 0.5% fee on each deposit.

---

## Project structure

```
kibo/
├── sc/
│   ├── contracts/Kibo.sol       # Main savings contract
│   ├── deploy/                  # Hardhat deploy scripts
│   └── hardhat.config.ts
├── frontend/
│   ├── app/page.tsx             # Full UI (home, leaderboard, info tabs)
│   ├── components/ui/           # shadcn/ui components
│   ├── hooks/useKibo.ts         # wagmi hook for all contract interactions
│   └── lib/kibo-abi.ts          # ABI + contract addresses
└── kibo-sdk/
    └── src/index.ts             # Framework-agnostic TS SDK
```

---

## License

MIT
