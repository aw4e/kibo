import { createPublicClient, createWalletClient, http, parseUnits, maxUint256 } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

export const KIBO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
export const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`;
export const DEPOSIT_AMOUNT = parseUnits("0.01", 18);

export const KIBO_ABI = [
  { inputs: [], name: "deposit", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "claimReward", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUser",
    outputs: [
      { name: "streak", type: "uint256" },
      { name: "lastDeposit", type: "uint256" },
      { name: "totalDeposited", type: "uint256" },
      { name: "longestStreak", type: "uint256" },
      { name: "canDeposit", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function createKiboClient(rpcUrl = "https://felo-rpc.celo.org") {
  return createPublicClient({ chain: celo, transport: http(rpcUrl) });
}

export async function getUser(address: `0x${string}`, rpcUrl?: string) {
  const client = createKiboClient(rpcUrl);
  return client.readContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "getUser",
    args: [address],
  });
}

export async function deposit(privateKey: `0x${string}`, rpcUrl?: string) {
  const account = privateKeyToAccount(privateKey);
  const client = createPublicClient({ chain: celo, transport: http(rpcUrl) });
  const wallet = createWalletClient({ account, chain: celo, transport: http(rpcUrl) });

  const allowance = await client.readContract({
    address: CUSD_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account.address, KIBO_ADDRESS],
  });

  if (allowance < DEPOSIT_AMOUNT) {
    await wallet.writeContract({
      address: CUSD_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [KIBO_ADDRESS, maxUint256],
    });
  }

  return wallet.writeContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "deposit",
  });
}
