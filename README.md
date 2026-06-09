# Kibo

Daily micro-savings app on Celo. Deposit 0.01 cUSD every day, build your streak, earn rewards at milestones.

Built for MiniPay's 14M+ users.

## How it works

1. Connect your MiniPay or Celo wallet
2. Deposit 0.01 cUSD daily
3. Hit 7 consecutive days to claim a reward
4. Miss a day and your streak resets

## Stack

- Smart contract: Solidity 0.8.20 on Celo mainnet
- Frontend: Next.js 15, wagmi v2, viem
- Payments: cUSD (Celo native stablecoin)
- MiniPay compatible

## Contract

Network: Celo Mainnet (chainId 42220)
Address: see `.env.example`
cUSD: `0x765DE816845861e75A25fCA122bb6898B8B1282a`

## Development

```bash
# Install
yarn

# Run frontend
yarn dev

# Compile contracts
yarn compile

# Deploy to Alfajores testnet
cp .env.example .env
# fill in PRIVATE_KEY and CELOSCAN_API_KEY
yarn deploy:alfajores

# Deploy to mainnet
yarn deploy:celo
```

## SDK

```bash
npm install kibo-sdk
```

```ts
import { getUser, deposit } from "kibo-sdk";

const user = await getUser("0x...");
console.log(user.streak, user.canDeposit);
```

## License

MIT
