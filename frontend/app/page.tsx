"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useKibo } from "../hooks/useKibo";
import { formatUnits, parseUnits } from "viem";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardRow } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, X, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const BADGE_LABEL = ["—", "Bronze", "Silver", "Gold", "Diamond"] as const;
const BADGE_COLOR = [
  "",
  "bg-[#CD7F32]",
  "bg-[#C0C0C0]",
  "bg-[#FFD700]",
  "bg-[#B9F2FF]",
] as const;

const R = 54;
const CIRCUMFERENCE = 2 * Math.PI * R;

function formatCountdown(ms: number): string | null {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function StreakRing({ streak }: { streak: number }) {
  const milestone = 7;
  const daysIntoMilestone = streak % milestone || (streak > 0 ? milestone : 0);
  const progress = daysIntoMilestone / milestone;
  const offset = CIRCUMFERENCE * (1 - progress);
  const isComplete = streak > 0 && streak % milestone === 0;

  return (
    <div className="relative w-[180px] h-[180px]">
      <svg className="ring-svg absolute inset-0" viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring-track" cx="60" cy="60" r={R} />
        <circle
          className={cn("ring-progress", isComplete && "complete")}
          cx="60" cy="60" r={R}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2px]">
        <span className="text-[1.5rem] leading-none animate-flame-pulse" role="img" aria-label="fire">🔥</span>
        <span className="font-black text-[3.25rem] tracking-[-0.06em] tabular-nums leading-none text-white"
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
          {streak}
        </span>
        <span className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-white/60">
          days
        </span>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <CardRow>
      <div className="flex items-center gap-3">
        <span className="skeleton w-[32px] h-[32px] rounded-lg" />
        <span className="skeleton w-[100px] h-[14px]" />
      </div>
      <span className="skeleton w-[70px] h-[14px]" />
    </CardRow>
  );
}

function RowIcon({ children, color }: { children: string; color: string }) {
  return (
    <span className={cn(
      "w-[32px] h-[32px] rounded-lg flex items-center justify-center text-base flex-shrink-0",
      "border-[1.5px] border-[#09090B] shadow-[1.5px_1.5px_0_#09090B]",
      color
    )}>
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 px-1">
      <div className="w-2.5 h-2.5 bg-[#FFE500] rounded-sm border border-[#09090B] flex-shrink-0" />
      <p className="text-[0.6875rem] font-black uppercase tracking-[0.14em] text-[#09090B]">
        {children}
      </p>
    </div>
  );
}

type Tab = "home" | "leaderboard" | "settings";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [tab, setTab] = useState<Tab>("home");
  const [refParam, setRefParam] = useState<`0x${string}`>("0x0000000000000000000000000000000000000000");
  const [copied, setCopied] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [sponsorAddr, setSponsorAddr] = useState("");
  const sponsorAddrValid = /^0x[0-9a-fA-F]{40}$/.test(sponsorAddr);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("ref");
    if (r && /^0x[0-9a-fA-F]{40}$/.test(r)) {
      setRefParam(r as `0x${string}`);
    }
  }, []);

  const {
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
    clearError,
    deposit,
    claimReward,
    withdraw,
    recoverStreak,
    pendingReferralReward,
    referrer,
    claimReferralReward,
    savingsGoal,
    setGoal,
    depositFor,
  } = useKibo();

  const countdown = formatCountdown(nextDepositIn);
  const savedAmount = parseFloat(formatUnits(totalDeposited, 18));
  const balanceAmount = cUSDBalance
    ? parseFloat(formatUnits(cUSDBalance, 18)).toFixed(2)
    : "—";
  const goalPct =
    savingsGoal > BigInt(0)
      ? Math.min(100, Number((totalDeposited * BigInt(100)) / savingsGoal))
      : 0;

  /* ── CONNECT PAGE ──────────────────────────────────────────────── */
  if (!isConnected) {
    return (
      <div className="relative min-h-dvh bg-[#0B0614] overflow-hidden flex flex-col items-center justify-center px-6 py-12">
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] max-w-[380px] max-h-[380px] rounded-full bg-violet-600/30 blur-[90px]" />
          <div className="absolute top-[25%] right-[-12%] w-[48vw] h-[48vw] max-w-[340px] max-h-[340px] rounded-full bg-blue-500/25 blur-[80px]" />
          <div className="absolute bottom-[-8%] left-[15%] w-[42vw] h-[42vw] max-w-[300px] max-h-[300px] rounded-full bg-purple-600/20 blur-[80px]" />
          <div className="absolute top-[55%] left-[-5%] w-[30vw] h-[30vw] max-w-[200px] max-h-[200px] rounded-full bg-indigo-400/15 blur-[60px]" />
        </div>

        {/* Floating Web3 icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
          <span className="absolute top-[10%] left-[7%]  text-3xl animate-float"        style={{ animationDelay: "0s" }}>💰</span>
          <span className="absolute top-[15%] right-[8%] text-2xl animate-spin-slow"    style={{ animationDelay: "0s" }}>🪙</span>
          <span className="absolute top-[36%] left-[5%]  text-xl  animate-sparkle"      style={{ animationDelay: "1.5s" }}>✦</span>
          <span className="absolute top-[56%] right-[6%] text-3xl animate-float"        style={{ animationDelay: "0.7s" }}>💎</span>
          <span className="absolute bottom-[26%] left-[9%] text-2xl animate-float-sm"   style={{ animationDelay: "2s" }}>🔗</span>
          <span className="absolute bottom-[14%] right-[13%] text-2xl animate-sparkle"  style={{ animationDelay: "0.4s" }}>⭐</span>
          <span className="absolute top-[50%] right-[4%]  text-xl  animate-float-sm"    style={{ animationDelay: "2.8s" }}>◈</span>
          <span className="absolute top-[7%]   right-[25%] text-xl  animate-sparkle"    style={{ animationDelay: "1.1s" }}>✨</span>
          <span className="absolute bottom-[40%] right-[18%] text-xl animate-float"     style={{ animationDelay: "3.2s" }}>◆</span>
          <span className="absolute bottom-[55%] left-[18%] text-lg animate-spin-slow-r" style={{ animationDelay: "0s" }}>⬡</span>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
          {/* Logo card */}
          <div className="animate-float mb-7" style={{ animationDelay: "0s" }}>
            <div className="w-20 h-20 bg-[#FFE500] rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] flex items-center justify-center text-4xl">
              ⛰️
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-[5.5rem] font-black tracking-[-0.05em] text-white leading-none mb-3"
            style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.35)" }}
          >
            KIBO
          </h1>

          {/* Tagline */}
          <p className="text-white/70 text-[1rem] font-semibold leading-relaxed mb-8">
            Save daily on Celo.<br />Build streaks. Earn rewards.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {[
              { icon: "🔥", label: "Daily Streaks" },
              { icon: "🏆", label: "Rewards" },
              { icon: "🛡️", label: "Shields" },
              { icon: "💎", label: "Badges" },
              { icon: "👥", label: "Referrals" },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="bg-white/10 backdrop-blur-sm text-white text-[0.8125rem] font-semibold px-3 py-1.5 rounded-full border border-white/20"
              >
                {icon} {label}
              </span>
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={() => connect({ connector: injected() })}
            className="w-full h-14 bg-[#FFE500] text-[#09090B] font-black text-[1.0625rem] rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#09090B] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all duration-75 flex items-center justify-center gap-2 mb-3"
          >
            <span className="text-xl">🔗</span>
            Connect Wallet
          </button>

          <p className="text-white/30 text-[0.75rem] font-medium">
            Powered by Celo · Non-custodial · Open source
          </p>
        </div>
      </div>
    );
  }

  /* ── MAIN APP ──────────────────────────────────────────────────── */
  return (
    <div className="app-shell flex flex-col max-w-app mx-auto min-h-dvh bg-background relative overflow-hidden">

      {/* Navbar */}
      <nav className="sticky top-0 z-[100] flex items-center justify-between px-5 py-3 bg-white border-b-[3px] border-[#09090B]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FFE500] rounded-lg border-[2px] border-[#09090B] shadow-[2px_2px_0_#09090B] flex items-center justify-center text-base leading-none">
            ⛰️
          </div>
          <span className="text-[1.25rem] font-black tracking-[-0.03em]">KIBO</span>
        </div>
        <button
          className="bg-[#FFE500] text-[#09090B] rounded-xl px-3 py-1.5 text-[0.75rem] font-black border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_#09090B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
          onClick={() => disconnect()}
        >
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </button>
      </nav>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-5 py-3 bg-[#FEE2E2] border-b-[3px] border-[#09090B] animate-slide-down" role="alert">
          <AlertCircle className="h-4 w-4 text-[#DC2626] flex-shrink-0" />
          <span className="flex-1 text-[0.8125rem] font-bold text-[#DC2626]">{error}</span>
          <button onClick={clearError} className="text-[#DC2626]/60 p-0.5" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >

        {/* ── HOME ──────────────────────────────────────────── */}
        {tab === "home" && (
          <>
            {/* Streak hero card */}
            <div className="mx-5 mt-5 mb-4">
              <div className="rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] overflow-hidden">
                <div className="bg-gradient-to-br from-[#7C3AED] via-[#5B21B6] to-[#2563EB] px-6 pt-6 pb-5 flex flex-col items-center gap-3">
                  <StreakRing streak={streak} />
                  <p className="text-[1.0625rem] font-bold text-white text-center">
                    {isLoading
                      ? " "
                      : streak === 0
                      ? "Start your streak today 🚀"
                      : streak % 7 === 0
                      ? "Milestone reached! 🎉"
                      : `${7 - (streak % 7)} day${7 - (streak % 7) > 1 ? "s" : ""} to next milestone`}
                  </p>
                  {canClaim && (
                    <Badge variant="milestone">🏆 Reward ready!</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Overview */}
            <div className="px-5 pb-4">
              <SectionLabel>Overview</SectionLabel>
              <Card>
                <CardContent>
                  {isLoading ? (
                    <><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                  ) : (
                    <>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon color="bg-[#EDE9FE]">💰</RowIcon>
                          <span className="font-semibold">Total saved</span>
                        </div>
                        <span className="font-black text-[#7C3AED] tabular-nums">{savedAmount.toFixed(3)} cUSD</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon color="bg-[#FEF9C3]">🏆</RowIcon>
                          <span className="font-semibold">Best streak</span>
                        </div>
                        <span className="font-black tabular-nums">{longestStreak} days</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon color="bg-[#DCFCE7]">💵</RowIcon>
                          <span className="font-semibold">cUSD balance</span>
                        </div>
                        <span className="font-semibold text-[#09090B]/50 tabular-nums">{balanceAmount}</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon color="bg-[#DBEAFE]">🛡️</RowIcon>
                          <span className="font-semibold">Streak shields</span>
                        </div>
                        <span className="font-black tabular-nums">
                          {"🛡️".repeat(shields) || "—"}
                          <span className="text-[0.8125rem] font-semibold text-[#09090B]/40"> {shields}/3</span>
                        </span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon color={badge > 0 ? BADGE_COLOR[badge] : "bg-[#F3F4F6]"}>
                            {badge > 0 ? ["", "🥉", "🥈", "🥇", "💎"][badge] : "🏅"}
                          </RowIcon>
                          <span className="font-semibold">Badge</span>
                        </div>
                        <span className={cn("font-black", badge > 0 ? "text-[#7C3AED]" : "text-[#09090B]/40 font-semibold")}>
                          {badge > 0 ? BADGE_LABEL[badge] : "None yet"}
                        </span>
                      </CardRow>
                      {parseFloat(formatUnits(rewardsClaimed, 18)) > 0 && (
                        <CardRow>
                          <div className="flex items-center gap-3">
                            <RowIcon color="bg-[#DCFCE7]">🎁</RowIcon>
                            <span className="font-semibold">Rewards earned</span>
                          </div>
                          <span className="font-black text-[#16A34A] tabular-nums">
                            {parseFloat(formatUnits(rewardsClaimed, 18)).toFixed(4)} cUSD
                          </span>
                        </CardRow>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Streak Recovery */}
            {!isLoading && brokenStreak > 0 && streak === 0 && (
              <div className="px-5 pb-4">
                <Card className="border-[#F59E0B] shadow-[4px_4px_0_#F59E0B] bg-[#FEF9C3]">
                  <CardContent className="p-5 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <span className="text-2xl flex-shrink-0 mt-0.5">💔</span>
                      <div>
                        <p className="text-[0.9375rem] font-black">Streak broken</p>
                        <p className="text-[0.8125rem] text-[#09090B]/60 mt-0.5">
                          Pay {Math.min(brokenStreak * 0.01, 0.1).toFixed(3)} cUSD to restore your {brokenStreak}-day streak
                        </p>
                      </div>
                    </div>
                    <Button variant="warning" onClick={recoverStreak} disabled={isTxLoading}>
                      {isTxLoading ? "Processing…" : `Recover ${brokenStreak}-day streak`}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Actions */}
            <div className="px-5 pb-4 flex flex-col gap-3">
              {canClaim && (
                <Button variant="success" onClick={claimReward} disabled={isTxLoading}>
                  🎁 Claim 7-day reward
                </Button>
              )}
              <Button onClick={() => deposit(undefined, refParam)} disabled={!canDeposit || isTxLoading}>
                {isTxLoading ? "Processing…" : "Deposit 0.01 cUSD"}
              </Button>
              {!canDeposit && countdown && (
                <div className="flex items-center justify-center gap-2 py-1">
                  <span className="text-[0.8125rem] font-semibold text-[#09090B]/50">Next deposit in</span>
                  <span className="bg-[#FFE500] text-[#09090B] text-[0.75rem] font-black px-2.5 py-0.5 rounded-lg border-[1.5px] border-[#09090B] shadow-[1.5px_1.5px_0_#09090B]">
                    ⏱ {countdown}
                  </span>
                </div>
              )}
              {savedAmount > 0 && (
                <Button variant="ghost" onClick={withdraw} disabled={isTxLoading}>
                  Withdraw savings
                </Button>
              )}
            </div>

            {/* Progress */}
            <div className="px-5 pb-4">
              <SectionLabel>Progress</SectionLabel>
              <Card>
                <CardContent>
                  {isLoading ? (
                    <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                  ) : (
                    <>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon color="bg-[#F5F3FF]">🎯</RowIcon>
                          <span className="font-semibold">Next milestone</span>
                        </div>
                        <span className="font-black tabular-nums">Day {streak === 0 ? 7 : Math.ceil((streak + 1) / 7) * 7}</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon color="bg-[#EDE9FE]">✨</RowIcon>
                          <span className="font-semibold">Milestones hit</span>
                        </div>
                        <span className="font-black text-[#7C3AED] tabular-nums">{Math.floor(streak / 7)}</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon color="bg-[#FEF9C3]">📅</RowIcon>
                          <span className="font-semibold">Days this cycle</span>
                        </div>
                        <span className="font-black tabular-nums">{streak % 7 || (streak > 0 ? 7 : 0)} / 7</span>
                      </CardRow>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Savings Goal */}
            <div className="px-5 pb-4">
              <SectionLabel>Savings Goal</SectionLabel>
              <Card>
                <CardContent>
                  {savingsGoal > BigInt(0) ? (
                    <div className="px-5 py-4 flex flex-col gap-3 border-b-2 border-[#09090B]">
                      <div className="flex justify-between text-[0.75rem]">
                        <span className="font-black text-[#7C3AED]">
                          {parseFloat(formatUnits(totalDeposited, 18)).toFixed(3)} cUSD
                        </span>
                        <span className="font-semibold text-[#09090B]/50">
                          Goal: {parseFloat(formatUnits(savingsGoal, 18)).toFixed(2)} cUSD
                        </span>
                      </div>
                      <Progress value={goalPct} />
                    </div>
                  ) : (
                    <p className="px-5 py-4 text-[0.8125rem] font-semibold text-[#09090B]/40 border-b-2 border-[#09090B]">
                      No goal set yet.
                    </p>
                  )}
                  <div className="flex gap-2 px-5 py-4">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Target (cUSD)"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      size="sm"
                      className="px-5 flex-shrink-0"
                      onClick={() => {
                        const val = parseFloat(goalInput);
                        if (!val || val <= 0) return;
                        setGoal(parseUnits(String(val), 18));
                        setGoalInput("");
                      }}
                      disabled={isTxLoading || !goalInput}
                    >
                      Set
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Referral */}
            <div className="px-5 pb-4">
              <SectionLabel>Referral</SectionLabel>
              <Card>
                <CardContent>
                  {referrer && (
                    <CardRow>
                      <div className="flex items-center gap-3">
                        <RowIcon color="bg-[#F5F3FF]">👥</RowIcon>
                        <span className="font-semibold">Referred by</span>
                      </div>
                      <span className="font-mono text-[0.75rem] text-[#09090B]/50">
                        {referrer.slice(0, 6)}…{referrer.slice(-4)}
                      </span>
                    </CardRow>
                  )}
                  {refParam !== "0x0000000000000000000000000000000000000000" && !referrer && (
                    <div className="flex items-center gap-2 mx-5 my-3 px-3 py-2 bg-[#EDE9FE] rounded-xl border-[1.5px] border-[#09090B] text-[0.8125rem] text-[#7C3AED] font-bold">
                      <span>🔗</span>
                      <span>Invite code applied: {refParam.slice(0, 6)}…{refParam.slice(-4)}</span>
                    </div>
                  )}
                  {pendingReferralReward > BigInt(0) && (
                    <>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon color="bg-[#DCFCE7]">💸</RowIcon>
                          <span className="font-semibold">Referral reward</span>
                        </div>
                        <span className="font-black text-[#16A34A] tabular-nums">
                          {parseFloat(formatUnits(pendingReferralReward, 18)).toFixed(4)} cUSD
                        </span>
                      </CardRow>
                      <div className="px-5 pb-4 pt-1">
                        <Button variant="success" onClick={claimReferralReward} disabled={isTxLoading}>
                          Claim referral reward
                        </Button>
                      </div>
                    </>
                  )}
                  <div className="px-5 py-4 border-t-2 border-[#09090B]">
                    <p className="text-[0.75rem] font-bold text-[#09090B]/50 mb-3">Your invite link</p>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (!address) return;
                        navigator.clipboard.writeText(`${window.location.origin}?ref=${address}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      disabled={!address}
                    >
                      {copied
                        ? <><Check className="h-4 w-4" /> Copied!</>
                        : <><Copy className="h-4 w-4" /> Copy invite link</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sponsor */}
            <div className="px-5 pb-4">
              <SectionLabel>Sponsor a Friend</SectionLabel>
              <Card>
                <CardContent>
                  <p className="px-5 pt-4 pb-3 text-[0.8125rem] font-semibold text-[#09090B]/50 leading-relaxed border-b-2 border-[#09090B]">
                    Deposit 0.01 cUSD on behalf of another address to boost their streak.
                  </p>
                  <div className="px-5 py-4 flex flex-col gap-3">
                    <Input
                      placeholder="0x… friend's address"
                      value={sponsorAddr}
                      onChange={(e) => setSponsorAddr(e.target.value)}
                      error={!!(sponsorAddr && !sponsorAddrValid)}
                      spellCheck={false}
                      className="font-mono text-sm"
                    />
                    {sponsorAddr && !sponsorAddrValid && (
                      <p className="text-[0.75rem] font-bold text-[#DC2626]">Invalid address</p>
                    )}
                    <Button
                      onClick={() => {
                        if (!sponsorAddrValid) return;
                        depositFor(sponsorAddr as `0x${string}`);
                        setSponsorAddr("");
                      }}
                      disabled={isTxLoading || !sponsorAddrValid}
                    >
                      {isTxLoading ? "Processing…" : "Sponsor deposit"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* ── LEADERBOARD ───────────────────────────────────── */}
        {tab === "leaderboard" && (
          <div className="pt-5 px-5 pb-5">
            <SectionLabel>Top Savers</SectionLabel>
            {leaderboard && leaderboard[0].length > 0 ? (
              <Card>
                <CardContent>
                  {leaderboard[0].map((addr, i) => (
                    <div
                      key={addr}
                      className="flex items-center gap-3 px-5 py-3 min-h-[56px] border-t-2 border-[#09090B] first:border-t-0"
                    >
                      <span className={cn(
                        "w-8 text-center text-[0.9375rem] font-black flex-shrink-0",
                        i < 3 ? "text-[#7C3AED]" : "text-[#09090B]/40"
                      )}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] flex items-center justify-center text-[0.6875rem] font-black text-[#7C3AED] tracking-wide flex-shrink-0">
                        {addr.slice(2, 4).toUpperCase()}
                      </div>
                      <span className="flex-1 text-[0.9375rem] font-semibold tabular-nums truncate min-w-0 text-[#09090B]/70">
                        {addr.slice(0, 6)}…{addr.slice(-4)}
                      </span>
                      <div className="flex items-center gap-1 bg-[#FFE500] rounded-lg border-[1.5px] border-[#09090B] shadow-[1.5px_1.5px_0_#09090B] px-2 py-0.5">
                        <span className="text-[0.875rem] font-black text-[#09090B] tabular-nums">
                          {Number(leaderboard[1][i])}
                        </span>
                        <span className="text-sm">🔥</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-16 text-[#09090B]/40 font-semibold">
                No deposits yet.<br />
                <span className="text-2xl mt-2 block">🔥</span>
                Be the first!
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ──────────────────────────────────────── */}
        {tab === "settings" && (
          <div className="pt-5 px-5 pb-5 flex flex-col gap-5">
            <div>
              <SectionLabel>How it works</SectionLabel>
              <Card>
                <CardContent>
                  <CardRow>
                    <div className="flex items-center gap-3">
                      <RowIcon color="bg-[#DBEAFE]">📅</RowIcon>
                      <span className="font-semibold">Daily deposit</span>
                    </div>
                    <span className="font-bold text-[#09090B]/50">0.0001–1 cUSD</span>
                  </CardRow>
                  <CardRow>
                    <div className="flex items-center gap-3">
                      <RowIcon color="bg-[#FEF9C3]">⏱️</RowIcon>
                      <span className="font-semibold">Cooldown</span>
                    </div>
                    <span className="font-bold text-[#09090B]/50">20 hours</span>
                  </CardRow>
                  <CardRow>
                    <div className="flex items-center gap-3">
                      <RowIcon color="bg-[#DBEAFE]">🛡️</RowIcon>
                      <span className="font-semibold">Shields</span>
                    </div>
                    <span className="font-bold text-[#09090B]/50">Skip 1 day</span>
                  </CardRow>
                  <CardRow>
                    <div className="flex items-center gap-3">
                      <RowIcon color="bg-[#F5F3FF]">👥</RowIcon>
                      <span className="font-semibold">Referral</span>
                    </div>
                    <span className="font-bold text-[#09090B]/50">5% of deposit</span>
                  </CardRow>
                </CardContent>
              </Card>
            </div>

            <div>
              <SectionLabel>Rewards</SectionLabel>
              <Card>
                <CardContent>
                  <CardRow>
                    <div className="flex items-center gap-3">
                      <RowIcon color="bg-[#DCFCE7]">🏅</RowIcon>
                      <span className="font-semibold">Day 7 milestone</span>
                    </div>
                    <span className="font-black text-[#16A34A]">+0.005 cUSD</span>
                  </CardRow>
                  <CardRow>
                    <div className="flex items-center gap-3">
                      <RowIcon color="bg-[#DCFCE7]">🥈</RowIcon>
                      <span className="font-semibold">Day 14+ milestone</span>
                    </div>
                    <span className="font-black text-[#16A34A]">+0.012 cUSD</span>
                  </CardRow>
                  <CardRow>
                    <div className="flex items-center gap-3">
                      <RowIcon color="bg-[#FEF9C3]">🏆</RowIcon>
                      <span className="font-semibold">Day 35+ milestone</span>
                    </div>
                    <span className="font-black text-[#16A34A]">+0.025 cUSD</span>
                  </CardRow>
                </CardContent>
              </Card>
            </div>

            <div>
              <SectionLabel>Badges</SectionLabel>
              <Card>
                <CardContent>
                  {[
                    { icon: "🥉", label: "Bronze", days: 30 },
                    { icon: "🥈", label: "Silver", days: 90 },
                    { icon: "🥇", label: "Gold",   days: 180 },
                    { icon: "💎", label: "Diamond", days: 365 },
                  ].map(({ icon, label, days }) => (
                    <CardRow key={label}>
                      <div className="flex items-center gap-3">
                        <RowIcon color="bg-[#F3F4F6]">{icon}</RowIcon>
                        <span className="font-semibold">{label}</span>
                      </div>
                      <span className="font-bold text-[#09090B]/50">{days} days</span>
                    </CardRow>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div>
              <SectionLabel>Contract</SectionLabel>
              <Card>
                <CardContent>
                  <div className="px-5 py-4 flex flex-col gap-1">
                    <span className="font-bold text-[#09090B]/50 text-sm">Celo Mainnet</span>
                    <span className="font-mono text-[0.75rem] text-[#09090B]/50 break-all">
                      0xb103Ef63431753317BeFb1AAfCB7C6E0e0fbCe12
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app flex items-start justify-around bg-white border-t-[3px] border-[#09090B] z-[200]"
        style={{ height: "calc(60px + env(safe-area-inset-bottom, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        role="tablist"
      >
        {([
          { id: "home" as Tab,        icon: "🏠", label: "Home" },
          { id: "leaderboard" as Tab, icon: "🏆", label: "Board" },
          { id: "settings" as Tab,    icon: "⚙️", label: "Info" },
        ]).map(({ id, icon, label }) => (
          <button
            key={id}
            className="flex flex-col items-center gap-0.5 flex-1 pt-2 pb-1 border-none bg-transparent transition-all duration-[120ms]"
            onClick={() => setTab(id)}
            role="tab"
            aria-selected={tab === id}
          >
            <span className={cn(
              "text-[1.375rem] leading-none transition-all duration-[120ms]",
              tab !== id && "grayscale opacity-35"
            )}>
              {icon}
            </span>
            <span className={cn(
              "text-[0.625rem] font-black uppercase tracking-widest transition-colors duration-[120ms]",
              tab === id ? "text-[#7C3AED]" : "text-[#09090B]/35"
            )}>
              {label}
            </span>
            {tab === id && (
              <div className="w-1.5 h-1.5 bg-[#FFE500] rounded-full border border-[#09090B] mt-0.5" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
