import { createPublicClient, http, parseUnits, maxUint256 } from "viem";
import { celo } from "viem/chains";
import type { WalletClient, PublicClient, Address } from "viem";

export const KIBO_ADDRESS = "0xb103Ef63431753317BeFb1AAfCB7C6E0e0fbCe12" as Address;
export const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as Address;
export const DEPOSIT_AMOUNT = parseUnits("0.01", 18);

// Badge enum (mirrors contract)
export enum Badge { None = 0, Bronze = 1, Silver = 2, Gold = 3, Diamond = 4 }

export const KIBO_ABI = [
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
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUser",
    outputs: [
      { name: "streak",            type: "uint256" },
      { name: "lastDeposit",       type: "uint256" },
      { name: "totalDeposited",    type: "uint256" },
      { name: "longestStreak",     type: "uint256" },
      { name: "canDeposit",        type: "bool"    },
      { name: "lastClaimedStreak", type: "uint256" },
      { name: "shields",           type: "uint8"   },
      { name: "brokenStreak",      type: "uint256" },
      { name: "badge",             type: "uint8"   },
      { name: "rewardsClaimed",    type: "uint256" },
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
    name: "poolBalance",
    outputs: [{ name: "", type: "uint256" }],
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
] as const;

// ── Types ────────────────────────────────────────────────────────

export interface UserData {
  streak: bigint;
  lastDeposit: bigint;
  totalDeposited: bigint;
  longestStreak: bigint;
  canDeposit: boolean;
  lastClaimedStreak: bigint;
  shields: number;
  brokenStreak: bigint;
  badge: Badge;
  rewardsClaimed: bigint;
}

export interface LeaderboardEntry {
  address: Address;
  streak: bigint;
  totalDeposited: bigint;
}

// ── Client factory ───────────────────────────────────────────────

export function createKiboClient(rpcUrl = "https://felo-rpc.celo.org"): PublicClient {
  return createPublicClient({ chain: celo, transport: http(rpcUrl) }) as PublicClient;
}

// ── Read functions ───────────────────────────────────────────────

export async function getUser(address: Address, rpcUrl?: string): Promise<UserData> {
  const client = createKiboClient(rpcUrl);
  const r = await client.readContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "getUser",
    args: [address],
  });
  return {
    streak:            r[0],
    lastDeposit:       r[1],
    totalDeposited:    r[2],
    longestStreak:     r[3],
    canDeposit:        r[4],
    lastClaimedStreak: r[5],
    shields:           Number(r[6]),
    brokenStreak:      r[7],
    badge:             r[8] as Badge,
    rewardsClaimed:    r[9],
  };
}

export async function getLeaderboard(
  limit = 20,
  rpcUrl?: string,
): Promise<LeaderboardEntry[]> {
  const client = createKiboClient(rpcUrl);
  const [addrs, streaks, totals] = await client.readContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "getLeaderboard",
    args: [BigInt(limit)],
  });
  return addrs.map((addr, i) => ({
    address: addr,
    streak: streaks[i],
    totalDeposited: totals[i],
  }));
}

export async function getPendingReferralReward(
  address: Address,
  rpcUrl?: string,
): Promise<bigint> {
  const client = createKiboClient(rpcUrl);
  return client.readContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "pendingReferralReward",
    args: [address],
  });
}

// ── Write helpers ────────────────────────────────────────────────

async function ensureAllowance(
  publicClient: PublicClient,
  walletClient: WalletClient,
  amount: bigint,
): Promise<void> {
  const [account] = await walletClient.getAddresses();
  const allowance = await publicClient.readContract({
    address: CUSD_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account, KIBO_ADDRESS],
  });
  if (allowance < amount) {
    await walletClient.writeContract({
      address: CUSD_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [KIBO_ADDRESS, maxUint256],
      account,
      chain: celo,
    });
  }
}

// ── Write functions ──────────────────────────────────────────────

export async function deposit(
  walletClient: WalletClient,
  amount: bigint = DEPOSIT_AMOUNT,
  ref: Address = "0x0000000000000000000000000000000000000000",
  rpcUrl?: string,
): Promise<`0x${string}`> {
  const publicClient = createKiboClient(rpcUrl);
  await ensureAllowance(publicClient, walletClient, amount);
  const [account] = await walletClient.getAddresses();
  return walletClient.writeContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "deposit",
    args: [amount, ref as Address],
    account,
    chain: celo,
  });
}

export async function depositFor(
  walletClient: WalletClient,
  beneficiary: Address,
  amount: bigint = DEPOSIT_AMOUNT,
  rpcUrl?: string,
): Promise<`0x${string}`> {
  const publicClient = createKiboClient(rpcUrl);
  await ensureAllowance(publicClient, walletClient, amount);
  const [account] = await walletClient.getAddresses();
  return walletClient.writeContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "depositFor",
    args: [beneficiary, amount],
    account,
    chain: celo,
  });
}

export async function claimReward(
  walletClient: WalletClient,
): Promise<`0x${string}`> {
  const [account] = await walletClient.getAddresses();
  return walletClient.writeContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "claimReward",
    args: [],
    account,
    chain: celo,
  });
}

export async function recoverStreak(
  walletClient: WalletClient,
  rpcUrl?: string,
): Promise<`0x${string}`> {
  const [account] = await walletClient.getAddresses();
  // Recovery fee = brokenStreak × MIN_DEPOSIT (capped at 0.1 cUSD)
  // Ensure allowance covers max recovery fee
  const publicClient = createKiboClient(rpcUrl);
  await ensureAllowance(publicClient, walletClient, parseUnits("0.1", 18));
  return walletClient.writeContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "recoverStreak",
    args: [],
    account,
    chain: celo,
  });
}

export async function withdraw(
  walletClient: WalletClient,
): Promise<`0x${string}`> {
  const [account] = await walletClient.getAddresses();
  return walletClient.writeContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "withdraw",
    args: [],
    account,
    chain: celo,
  });
}

export async function claimReferralReward(
  walletClient: WalletClient,
): Promise<`0x${string}`> {
  const [account] = await walletClient.getAddresses();
  return walletClient.writeContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "claimReferralReward",
    args: [],
    account,
    chain: celo,
  });
}

export async function setGoal(
  walletClient: WalletClient,
  target: bigint,
): Promise<`0x${string}`> {
  const [account] = await walletClient.getAddresses();
  return walletClient.writeContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "setGoal",
    args: [target],
    account,
    chain: celo,
  });
}
