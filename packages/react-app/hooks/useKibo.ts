import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, maxUint256 } from "viem";
import { KIBO_ADDRESS, CUSD_ADDRESS, KIBO_ABI, ERC20_ABI } from "../lib/kibo-abi";
import { useState, useEffect } from "react";

const DEPOSIT_AMOUNT = parseUnits("0.01", 18);

export function useKibo() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

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
    query: { enabled: !!KIBO_ADDRESS },
  });

  const { isSuccess: txConfirmed, isLoading: isTxLoading } =
    useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (txConfirmed) {
      refetchUser();
      refetchAllowance();
      setTxHash(undefined);
    }
  }, [txConfirmed, refetchUser, refetchAllowance]);

  async function ensureApproval() {
    if (!allowance || allowance < DEPOSIT_AMOUNT) {
      const hash = await writeContractAsync({
        address: CUSD_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [KIBO_ADDRESS, maxUint256],
      });
      setTxHash(hash);
      await refetchAllowance();
    }
  }

  async function deposit() {
    await ensureApproval();
    const hash = await writeContractAsync({
      address: KIBO_ADDRESS,
      abi: KIBO_ABI,
      functionName: "deposit",
    });
    setTxHash(hash);
  }

  async function claimReward() {
    const hash = await writeContractAsync({
      address: KIBO_ADDRESS,
      abi: KIBO_ABI,
      functionName: "claimReward",
    });
    setTxHash(hash);
  }

  async function withdraw() {
    const hash = await writeContractAsync({
      address: KIBO_ADDRESS,
      abi: KIBO_ABI,
      functionName: "withdraw",
    });
    setTxHash(hash);
  }

  const streak = userData ? Number(userData[0]) : 0;
  const lastDeposit = userData ? Number(userData[1]) : 0;
  const totalDeposited = userData ? userData[2] : BigInt(0);
  const longestStreak = userData ? Number(userData[3]) : 0;
  const canDeposit = userData ? userData[4] : true;
  const canClaim = streak > 0 && streak % 7 === 0;

  const nextDepositIn =
    lastDeposit > 0
      ? Math.max(0, lastDeposit * 1000 + 20 * 60 * 60 * 1000 - Date.now())
      : 0;

  return {
    streak,
    longestStreak,
    totalDeposited,
    canDeposit,
    canClaim,
    nextDepositIn,
    cUSDBalance,
    leaderboard,
    isTxLoading,
    deposit,
    claimReward,
    withdraw,
  };
}
