export const KIBO_ADDRESS = process.env.NEXT_PUBLIC_KIBO_ADDRESS as `0x${string}`;
export const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`;

export const KIBO_ABI = [
  // Write functions
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "ref",    type: "address" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "beneficiary", type: "address" },
      { name: "amount",      type: "uint256" },
    ],
    name: "depositFor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "recoverStreak",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimReferralReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "fundPool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "target", type: "uint128" }],
    name: "setGoal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // View functions
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUser",
    outputs: [
      { name: "streak",           type: "uint256" },
      { name: "lastDeposit",      type: "uint256" },
      { name: "totalDeposited",   type: "uint256" },
      { name: "longestStreak",    type: "uint256" },
      { name: "canDeposit",       type: "bool"    },
      { name: "lastClaimedStreak", type: "uint256" },
      { name: "shields",          type: "uint8"   },
      { name: "brokenStreak",     type: "uint256" },
      { name: "badge",            type: "uint8"   }, // Badge enum as uint8
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getBadge",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "limit", type: "uint256" }],
    name: "getLeaderboard",
    outputs: [
      { name: "addrs",   type: "address[]" },
      { name: "streaks", type: "uint256[]" },
      { name: "totals",  type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalDepositors",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "poolBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "referrer",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "pendingReferralReward",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "savingsGoal",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: "user",      type: "address" },
      { indexed: false, name: "streak",    type: "uint32"  },
      { indexed: false, name: "timestamp", type: "uint40"  },
    ],
    name: "Deposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: "payer",       type: "address" },
      { indexed: true,  name: "beneficiary", type: "address" },
      { indexed: false, name: "streak",      type: "uint32"  },
      { indexed: false, name: "timestamp",   type: "uint40"  },
    ],
    name: "DepositedFor",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: "user",   type: "address" },
      { indexed: false, name: "streak", type: "uint32"  },
      { indexed: false, name: "reward", type: "uint256" },
    ],
    name: "RewardClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: "user",      type: "address" },
      { indexed: false, name: "oldStreak", type: "uint32"  },
    ],
    name: "StreakBroken",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: "user",   type: "address" },
      { indexed: false, name: "streak", type: "uint32"  },
      { indexed: false, name: "fee",    type: "uint256" },
    ],
    name: "StreakRecovered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: "user",  type: "address" },
      { indexed: false, name: "badge", type: "uint8"   }, // Badge enum
    ],
    name: "BadgeEarned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: "ref",      type: "address" },
      { indexed: true,  name: "referee",  type: "address" },
      { indexed: false, name: "amount",   type: "uint256" },
    ],
    name: "ReferralRewardAccrued",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: "user",           type: "address" },
      { indexed: false, name: "totalDeposited", type: "uint128" },
    ],
    name: "GoalReached",
    type: "event",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Badge enum mapping (matches contract)
export const BADGE = {
  0: "None",
  1: "Bronze",
  2: "Silver",
  3: "Gold",
  4: "Diamond",
} as const;

export type BadgeLevel = keyof typeof BADGE;
