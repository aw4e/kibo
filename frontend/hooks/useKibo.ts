import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useConfig,
  usePublicClient,
} from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { parseUnits, maxUint256 } from "viem";
import { KIBO_ADDRESS, CUSD_ADDRESS, KIBO_ABI, ERC20_ABI } from "../lib/kibo-abi";
import { useState, useEffect } from "react";

const DEFAULT_DEPOSIT = parseUnits("0.01", 18);

export function useKibo() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const wagmiConfig = useConfig();
  const publicClient = usePublicClient();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [depositHistory, setDepositHistory] = useState<Array<{
    streak: number;
    timestamp: number;
    txHash: `0x${string}`;
  }>>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [totalReferralEarned, setTotalReferralEarned] = useState(BigInt(0));
  // Force re-render every 30s so countdown ticks while deposit is pending
  const [, setTick] = useState(0);

  const { data: userData, refetch: refetchUser } = useReadContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "getUser",
    args: [address!],
    query: { enabled: !!address && !!KIBO_ADDRESS },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CUSD_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address!, KIBO_ADDRESS],
    query: { enabled: !!address && !!KIBO_ADDRESS },
  });

  const { data: cUSDBalance } = useReadContract({
    address: CUSD_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: leaderboard } = useReadContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "getLeaderboard",
    args: [BigInt(20)],
    query: { enabled: !!KIBO_ADDRESS, staleTime: 30_000 },
  });

  const { data: pendingReferralReward } = useReadContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "pendingReferralReward",
    args: [address!],
    query: { enabled: !!address && !!KIBO_ADDRESS },
  });

  const { data: referrer } = useReadContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "referrer",
    args: [address!],
    query: { enabled: !!address && !!KIBO_ADDRESS },
  });

  const { data: savingsGoal, refetch: refetchGoal } = useReadContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "savingsGoal",
    args: [address!],
    query: { enabled: !!address && !!KIBO_ADDRESS },
  });

  const { data: poolBalance } = useReadContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "poolBalance",
    query: { enabled: !!KIBO_ADDRESS, staleTime: 30_000 },
  });

  const { data: totalDepositors } = useReadContract({
    address: KIBO_ADDRESS,
    abi: KIBO_ABI,
    functionName: "totalDepositors",
    query: { enabled: !!KIBO_ADDRESS, staleTime: 30_000 },
  });

  const { isSuccess: txConfirmed, isLoading: isTxLoading } =
    useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (txConfirmed) {
      refetchUser();
      refetchAllowance();
      refetchGoal();
      setTxHash(undefined);
    }
  }, [txConfirmed, refetchUser, refetchAllowance, refetchGoal]);

  // Tick every 30s to keep countdown fresh
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Fetch referral stats from on-chain events
  useEffect(() => {
    if (!address || !publicClient || !KIBO_ADDRESS) return;
    let cancelled = false;
    publicClient.getContractEvents({
      address: KIBO_ADDRESS,
      abi: KIBO_ABI,
      eventName: "ReferralRewardAccrued",
      args: { ref: address },
      fromBlock: 0n,
    }).then(logs => {
      if (cancelled) return;
      setReferralCount(logs.length);
      setTotalReferralEarned(logs.reduce((sum, l) => sum + (l.args.amount ?? BigInt(0)), BigInt(0)));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [address, publicClient]);

  // Fetch deposit history from on-chain events
  useEffect(() => {
    if (!address || !publicClient || !KIBO_ADDRESS) return;
    let cancelled = false;
    publicClient.getContractEvents({
      address: KIBO_ADDRESS,
      abi: KIBO_ABI,
      eventName: "Deposited",
      args: { user: address },
      fromBlock: 0n,
    }).then(logs => {
      if (cancelled) return;
      setDepositHistory(
        [...logs].reverse().map(log => ({
          streak: Number(log.args.streak),
          timestamp: Number(log.args.timestamp),
          txHash: log.transactionHash!,
        }))
      );
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [address, publicClient, txConfirmed]);

  async function ensureApproval(amount: bigint) {
    if (!allowance || allowance < amount) {
      const hash = await writeContractAsync({
        address: CUSD_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [KIBO_ADDRESS, maxUint256],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      await refetchAllowance();
    }
  }

  async function deposit(
    amount: bigint = DEFAULT_DEPOSIT,
    ref: `0x${string}` = "0x0000000000000000000000000000000000000000",
  ) {
    setError(null);
    try {
      await ensureApproval(amount);
      const hash = await writeContractAsync({
        address: KIBO_ADDRESS,
        abi: KIBO_ABI,
        functionName: "deposit",
        args: [amount, ref],
      });
      setTxHash(hash);
    } catch (e: unknown) {
      setError(parseContractError(e));
    }
  }

  async function claimReward() {
    setError(null);
    try {
      const hash = await writeContractAsync({
        address: KIBO_ADDRESS,
        abi: KIBO_ABI,
        functionName: "claimReward",
      });
      setTxHash(hash);
    } catch (e: unknown) {
      setError(parseContractError(e));
    }
  }

  async function withdraw() {
    setError(null);
    try {
      const hash = await writeContractAsync({
        address: KIBO_ADDRESS,
        abi: KIBO_ABI,
        functionName: "withdraw",
      });
      setTxHash(hash);
    } catch (e: unknown) {
      setError(parseContractError(e));
    }
  }

  const streak = userData ? Number(userData[0]) : 0;
  const lastDeposit = userData ? Number(userData[1]) : 0;
  const totalDeposited = userData ? userData[2] : BigInt(0);
  const longestStreak = userData ? Number(userData[3]) : 0;
  const canDeposit = userData ? userData[4] : true;
  const lastClaimedStreak = userData ? Number(userData[5]) : 0;
  const shields = userData ? Number(userData[6]) : 0;
  const brokenStreak = userData ? Number(userData[7]) : 0;
  const badge = userData ? Number(userData[8]) : 0;
  const rewardsClaimed = userData ? userData[9] : BigInt(0);
  const canClaim = streak > 0 && streak % 7 === 0 && streak > lastClaimedStreak;
  const isLoading = !!address && !userData;

  // Guard: lastDeposit is Unix seconds (~1.7e9). Multiplying by 1000 for ms is safe
  // as long as value is a plausible timestamp (< year 2100 = 4.1e9 seconds).
  const nextDepositIn =
    lastDeposit > 0 && lastDeposit < 4_102_444_800
      ? Math.max(0, lastDeposit * 1000 + 20 * 60 * 60 * 1000 - Date.now())
      : 0;

  async function recoverStreak() {
    setError(null);
    try {
      await ensureApproval(parseUnits("0.1", 18));
      const hash = await writeContractAsync({
        address: KIBO_ADDRESS,
        abi: KIBO_ABI,
        functionName: "recoverStreak",
      });
      setTxHash(hash);
    } catch (e: unknown) {
      setError(parseContractError(e));
    }
  }

  async function depositFor(
    beneficiary: `0x${string}`,
    amount: bigint = DEFAULT_DEPOSIT,
  ) {
    setError(null);
    try {
      await ensureApproval(amount);
      const hash = await writeContractAsync({
        address: KIBO_ADDRESS,
        abi: KIBO_ABI,
        functionName: "depositFor",
        args: [beneficiary, amount],
      });
      setTxHash(hash);
    } catch (e: unknown) {
      setError(parseContractError(e));
    }
  }

  async function setGoal(target: bigint) {
    setError(null);
    try {
      const hash = await writeContractAsync({
        address: KIBO_ADDRESS,
        abi: KIBO_ABI,
        functionName: "setGoal",
        args: [target],
      });
      setTxHash(hash);
    } catch (e: unknown) {
      setError(parseContractError(e));
    }
  }

  async function claimReferralReward() {
    setError(null);
    try {
      const hash = await writeContractAsync({
        address: KIBO_ADDRESS,
        abi: KIBO_ABI,
        functionName: "claimReferralReward",
      });
      setTxHash(hash);
    } catch (e: unknown) {
      setError(parseContractError(e));
    }
  }

  return {
    streak,
    longestStreak,
    totalDeposited,
    canDeposit,
    canClaim,
    nextDepositIn,
    cUSDBalance,
    shields,
    badge,
    brokenStreak,
    rewardsClaimed,
    leaderboard,
    isTxLoading,
    isLoading,
    error,
    clearError: () => setError(null),
    deposit,
    claimReward,
    withdraw,
    recoverStreak,
    depositFor,
    setGoal,
    claimReferralReward,
    refetchUser,
    pendingReferralReward: pendingReferralReward ?? BigInt(0),
    referrer: (referrer && referrer !== "0x0000000000000000000000000000000000000000") ? referrer as string : null,
    savingsGoal: savingsGoal ?? BigInt(0),
    poolBalance: poolBalance ?? BigInt(0),
    totalDepositors: totalDepositors ? Number(totalDepositors) : 0,
    depositHistory,
    txConfirmed,
    referralCount,
    totalReferralEarned,
  };
}

function parseContractError(e: unknown): string {
  if (typeof e === "object" && e !== null) {
    const err = e as Record<string, unknown>;
    // User rejected in wallet
    if (err.code === 4001 || err.name === "UserRejectedRequestError") {
      return "Transaction cancelled.";
    }
    // Contract revert with named error
    const msg = String(err.shortMessage ?? err.message ?? "");
    if (msg.includes("TooSoon")) return "Deposit cooldown active. Try again later.";
    if (msg.includes("PoolEmpty")) return "Reward pool is empty. Try again later.";
    if (msg.includes("NeedMilestone")) return "No milestone reached yet.";
    if (msg.includes("AlreadyClaimed")) return "Reward already claimed for this streak.";
    if (msg.includes("NothingToWithdraw")) return "No balance to withdraw.";
    if (msg.includes("AmountOutOfRange")) return "Deposit amount out of range.";
    if (msg.includes("NoStreakToRecover")) return "No broken streak to recover.";
    if (msg.includes("RecoveryPending")) return "Beneficiary has a pending streak recovery.";
    if (msg.includes("Paused")) return "Contract is paused. Try again later.";
    if (msg) return msg.slice(0, 120);
  }
  return "Transaction failed. Please try again.";
}
