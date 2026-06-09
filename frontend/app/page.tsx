"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useKibo } from "../hooks/useKibo";
import { formatUnits, parseUnits } from "viem";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardRow } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, X, Copy, Check, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const BADGE_LABEL = ["—", "Bronze", "Silver", "Gold", "Diamond"] as const;
const BADGE_BG    = ["", "bg-[#FDE68A]", "bg-[#E5E7EB]", "bg-[#FDE68A]", "bg-[#BAE6FD]"] as const;
const BADGE_EMOJI = ["", "🥉", "🥈", "🥇", "💎"] as const;

const R = 52;
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
    <div className="relative w-[176px] h-[176px]">
      <svg className="ring-svg absolute inset-0" viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring-track" cx="60" cy="60" r={R} />
        <circle
          className={cn("ring-progress", isComplete && "complete")}
          cx="60" cy="60" r={R}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[1.375rem] leading-none animate-flame-pulse mb-1">🔥</span>
        <span
          className="font-black text-[3rem] tracking-[-0.06em] tabular-nums leading-none text-white"
          style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.25)" }}
        >
          {streak}
        </span>
        <span className="text-[0.625rem] font-black uppercase tracking-[0.18em] text-white/55 mt-0.5">
          day streak
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
        <span className="skeleton w-[96px] h-[13px]" />
      </div>
      <span className="skeleton w-[64px] h-[13px]" />
    </CardRow>
  );
}

function RowIcon({ children, bg = "bg-[#F3F4F6]" }: { children: string; bg?: string }) {
  return (
    <span className={cn(
      "w-[32px] h-[32px] rounded-lg flex items-center justify-center text-base flex-shrink-0",
      "border-[1.5px] border-[#09090B] shadow-[1.5px_1.5px_0_#09090B]",
      bg
    )}>
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 px-1">
      <div className="w-2 h-2 bg-[#FFE500] rounded-[3px] border border-[#09090B] flex-shrink-0" />
      <p className="text-[0.6875rem] font-black uppercase tracking-[0.14em] text-[#09090B]/70">
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

  const countdown     = formatCountdown(nextDepositIn);
  const savedAmount   = parseFloat(formatUnits(totalDeposited, 18));
  const balanceAmount = cUSDBalance ? parseFloat(formatUnits(cUSDBalance, 18)).toFixed(2) : "—";
  const goalPct       = savingsGoal > BigInt(0)
    ? Math.min(100, Number((totalDeposited * BigInt(100)) / savingsGoal))
    : 0;

  /* ── CONNECT PAGE ────────────────────────────────────────── */
  /* Hallmark · pre-emit critique: P4 H5 E4 S5 R4 V5 */
  if (!isConnected) {
    return (
      <div className="relative min-h-dvh bg-[#FAFAF8] overflow-x-clip overflow-y-hidden flex flex-col">

        {/* Soft aurora — premium, not harsh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[120vw] max-w-[680px] h-[55vh] rounded-[50%] bg-violet-300/14 blur-[90px]" />
          <div className="absolute top-[50%] right-[-8%] w-[45vw] max-w-[260px] aspect-square rounded-full bg-blue-200/10 blur-[70px]" />
          <div className="absolute bottom-[10%] left-[-5%] w-[40vw] max-w-[220px] aspect-square rounded-full bg-violet-200/8 blur-[60px]" />
        </div>

        {/* Floating accents — sparse, minimal */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
          <span className="absolute top-[10%] right-[8%]   text-lg opacity-[0.14] animate-spin-slow">🪙</span>
          <span className="absolute top-[42%] left-[5%]    text-base opacity-[0.11] animate-sparkle" style={{ animationDelay: "1.4s" }}>✦</span>
          <span className="absolute bottom-[22%] right-[6%] text-base opacity-[0.16] animate-float-sm" style={{ animationDelay: "0.7s" }}>💎</span>
          <span className="absolute bottom-[38%] left-[7%]  text-sm opacity-[0.10] animate-spin-slow-r">⬡</span>
        </div>

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-6">
          <span className="text-[0.9375rem] font-black tracking-[-0.02em] text-[#09090B]">KIBO</span>
          <span className="bg-[#09090B] text-white text-[0.5625rem] font-black px-2.5 py-[5px] rounded-full tracking-wider">
            CELO MAINNET
          </span>
        </div>

        {/* Main */}
        <div className="relative z-10 flex flex-col items-center flex-1 px-6 pt-8 pb-10 text-center">

          {/* Mascot in neobrutalist yellow card */}
          <div className="mb-7 animate-float">
            <div className="bg-[#FFE500] border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] rounded-2xl p-4 inline-flex items-center justify-center">
              <Image
                src="/kibo.png"
                alt="Kibo mascot"
                width={84}
                height={84}
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-[4.75rem] font-black tracking-[-0.06em] text-[#09090B] leading-[0.9] mb-4">
            KIBO
          </h1>

          {/* Tagline */}
          <p className="font-jakarta text-[1.0625rem] font-medium text-[#09090B]/50 leading-relaxed mb-8 max-w-[258px]">
            Save small. Build habits.<br />Earn rewards every 7 days.
          </p>

          {/* Feature grid — neobrutalist cards on clean bg */}
          <div className="grid grid-cols-2 gap-2 w-full max-w-[300px] mb-8">
            {[
              { icon: "🔥", label: "Daily Streaks",   desc: "20h cooldown",       bg: "bg-[#EDE9FE]" },
              { icon: "🏆", label: "Rewards",          desc: "Every 7 days",       bg: "bg-[#FEF9C3]" },
              { icon: "🛡️", label: "Streak Shields",  desc: "Miss without reset",  bg: "bg-[#DBEAFE]" },
              { icon: "💎", label: "On-chain Badges",  desc: "30/90/180/365d",     bg: "bg-[#DCFCE7]" },
            ].map(({ icon, label, desc, bg }) => (
              <div
                key={label}
                className={cn("rounded-xl border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] px-3 py-3 text-left", bg)}
              >
                <span className="text-xl block mb-1">{icon}</span>
                <p className="text-[#09090B] text-[0.8125rem] font-bold leading-tight">{label}</p>
                <p className="font-jakarta text-[#09090B]/45 text-[0.6875rem] font-medium mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="w-full max-w-[300px] flex flex-col gap-3">
            <button
              onClick={() => connect({ connector: injected() })}
              className="w-full h-[52px] bg-[#FFE500] text-[#09090B] font-black text-[1.0625rem] rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#09090B] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all duration-75 flex items-center justify-center gap-2.5"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </button>
            <p className="font-jakarta text-[#09090B]/28 text-[0.6875rem] font-semibold text-center tracking-wide">
              Non-custodial · Open source · Celo Mainnet
            </p>
          </div>

        </div>

        {/* Bottom strip */}
        <div className="relative z-10 flex items-center justify-center gap-5 pb-8 pt-2">
          {["🔥 Save Daily", "🏔️ Reach Summit", "💰 Earn Rewards"].map((t) => (
            <span key={t} className="text-[#09090B]/20 text-[0.6875rem] font-bold">{t}</span>
          ))}
        </div>

      </div>
    );
  }

  /* ── MAIN APP ────────────────────────────────────────────── */
  const isNewUser = !isLoading && streak === 0 && savedAmount === 0;

  return (
    <div
      className="app-shell flex flex-col max-w-app mx-auto min-h-dvh relative overflow-hidden"
      style={{
        background: "#FAFAF5",
        backgroundImage: "radial-gradient(circle, rgba(9,9,11,0.055) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {/* Navbar */}
      <nav className="sticky top-0 z-[100] flex items-center justify-between px-4 py-2.5 bg-white border-b-[3px] border-[#09090B]">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] flex-shrink-0">
            <Image src="/kibo.png" alt="Kibo" fill sizes="36px" className="object-cover" />
          </div>
          <span className="text-[1.1875rem] font-black tracking-[-0.03em]">KIBO</span>
          {streak > 0 && (
            <span className="bg-[#FFE500] text-[#09090B] text-[0.625rem] font-black px-2 py-0.5 rounded-md border border-[#09090B] shadow-[1px_1px_0_#09090B]">
              🔥 {streak}d
            </span>
          )}
        </div>
        <button
          className="bg-[#09090B] text-white rounded-xl px-3 py-1.5 text-[0.6875rem] font-black border-2 border-[#09090B] shadow-[2px_2px_0_rgba(0,0,0,0.25)] hover:bg-[#1a1a1a] active:scale-[0.97] transition-all duration-75 font-mono tracking-wide"
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

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >

        {/* ── HOME ───────────────────────────────────────────── */}
        {tab === "home" && (
          <>
            {/* Hero card */}
            <div className="mx-4 mt-4 mb-4">
              {isNewUser ? (
                /* New user onboarding card */
                <div className="rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] overflow-hidden bg-gradient-to-br from-[#EDE9FE] via-[#DDD6FE] to-[#DBEAFE]">
                  <div className="px-6 pt-6 pb-5 flex flex-col items-center gap-3 text-center">
                    <div className="animate-float">
                      <Image src="/kibo.png" alt="Kibo" width={80} height={80} className="drop-shadow-lg" />
                    </div>
                    <div>
                      <p className="text-[1.25rem] font-black text-[#09090B]">Welcome to Kibo!</p>
                      <p className="text-[0.875rem] text-[#09090B]/55 font-medium mt-1 leading-relaxed">
                        Deposit 0.01 cUSD to start your savings streak.<br />
                        Earn rewards every 7 days. 🏔️
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Active streak card */
                <div className="rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] overflow-hidden">
                  <div className="bg-gradient-to-br from-[#6D28D9] via-[#5B21B6] to-[#1D4ED8] px-6 pt-6 pb-5 flex flex-col items-center gap-3">
                    {isLoading ? (
                      <div className="w-[176px] h-[176px] rounded-full skeleton" />
                    ) : (
                      <StreakRing streak={streak} />
                    )}
                    <p className="text-[1rem] font-bold text-white/90 text-center">
                      {isLoading ? " " : streak % 7 === 0 && streak > 0
                        ? "Milestone reached! 🎉"
                        : `${7 - (streak % 7)} day${7 - (streak % 7) !== 1 ? "s" : ""} to next milestone`}
                    </p>
                    {canClaim && <Badge variant="milestone">🏆 Reward ready!</Badge>}
                  </div>
                  {/* Mini stats strip */}
                  <div className="bg-white grid grid-cols-3 divide-x-2 divide-[#09090B] border-t-[2px] border-[#09090B]">
                    {[
                      { label: "Best",    value: `${longestStreak}d` },
                      { label: "Shields", value: `${"🛡️".repeat(shields) || "—"}` },
                      { label: "Saved",   value: `${savedAmount.toFixed(2)}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col items-center py-3 gap-0.5">
                        <span className="text-[0.875rem] font-black text-[#09090B]">{value}</span>
                        <span className="text-[0.5625rem] font-black uppercase tracking-[0.12em] text-[#09090B]/40">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Streak Recovery */}
            {!isLoading && brokenStreak > 0 && streak === 0 && (
              <div className="mx-4 mb-4">
                <div className="rounded-2xl border-[3px] border-[#F59E0B] shadow-[4px_4px_0_#F59E0B] bg-[#FFFBEB] overflow-hidden">
                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <span className="text-2xl flex-shrink-0">💔</span>
                      <div>
                        <p className="text-[0.9375rem] font-black text-[#09090B]">Streak broken</p>
                        <p className="text-[0.8125rem] text-[#09090B]/55 mt-0.5">
                          Pay {Math.min(brokenStreak * 0.01, 0.1).toFixed(3)} cUSD to restore your {brokenStreak}-day streak
                        </p>
                      </div>
                    </div>
                    <Button variant="warning" onClick={recoverStreak} disabled={isTxLoading}>
                      {isTxLoading ? "Processing…" : `⚡ Recover ${brokenStreak}-day streak`}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-4 pb-4 flex flex-col gap-2.5">
              {canClaim && (
                <Button variant="success" onClick={claimReward} disabled={isTxLoading}>
                  🎁 Claim milestone reward
                </Button>
              )}
              <Button onClick={() => deposit(undefined, refParam)} disabled={!canDeposit || isTxLoading}>
                {isTxLoading ? "Processing…" : canDeposit ? "💰 Deposit 0.01 cUSD" : "💰 Deposit 0.01 cUSD"}
              </Button>
              {!canDeposit && countdown && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[0.8125rem] font-semibold text-[#09090B]/45">Next deposit in</span>
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

            {/* Overview */}
            <div className="px-4 pb-4">
              <SectionLabel>Overview</SectionLabel>
              <Card>
                <CardContent>
                  {isLoading ? (
                    <><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                  ) : (
                    <>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon bg="bg-[#EDE9FE]">💰</RowIcon><span className="font-semibold">Total saved</span></div>
                        <span className="font-black text-[#6D28D9] tabular-nums">{savedAmount.toFixed(3)} <span className="font-semibold text-[#09090B]/40">cUSD</span></span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon bg="bg-[#FEF9C3]">🏆</RowIcon><span className="font-semibold">Best streak</span></div>
                        <span className="font-black tabular-nums">{longestStreak} <span className="font-semibold text-[#09090B]/40">days</span></span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon bg="bg-[#DCFCE7]">💵</RowIcon><span className="font-semibold">cUSD balance</span></div>
                        <span className="font-semibold text-[#09090B]/50 tabular-nums">{balanceAmount}</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon bg="bg-[#DBEAFE]">🛡️</RowIcon><span className="font-semibold">Shields</span></div>
                        <span className="font-black">
                          {"🛡️".repeat(shields) || "—"}
                          <span className="text-[0.8125rem] font-semibold text-[#09090B]/35 ml-1">{shields}/3</span>
                        </span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon bg={badge > 0 ? BADGE_BG[badge] : "bg-[#F3F4F6]"}>
                            {badge > 0 ? BADGE_EMOJI[badge] : "🏅"}
                          </RowIcon>
                          <span className="font-semibold">Badge</span>
                        </div>
                        <span className={cn("font-black", badge > 0 ? "text-[#6D28D9]" : "text-[#09090B]/35 font-semibold")}>
                          {badge > 0 ? BADGE_LABEL[badge] : "None yet"}
                        </span>
                      </CardRow>
                      {parseFloat(formatUnits(rewardsClaimed, 18)) > 0 && (
                        <CardRow>
                          <div className="flex items-center gap-3"><RowIcon bg="bg-[#DCFCE7]">🎁</RowIcon><span className="font-semibold">Rewards earned</span></div>
                          <span className="font-black text-[#15803D] tabular-nums">
                            +{parseFloat(formatUnits(rewardsClaimed, 18)).toFixed(4)} <span className="font-semibold text-[#09090B]/40">cUSD</span>
                          </span>
                        </CardRow>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Progress */}
            <div className="px-4 pb-4">
              <SectionLabel>Progress</SectionLabel>
              <Card>
                <CardContent>
                  {isLoading ? (
                    <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                  ) : (
                    <>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon bg="bg-[#F5F3FF]">🎯</RowIcon><span className="font-semibold">Next milestone</span></div>
                        <span className="font-black tabular-nums">Day {streak === 0 ? 7 : Math.ceil((streak + 1) / 7) * 7}</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon bg="bg-[#EDE9FE]">✨</RowIcon><span className="font-semibold">Milestones hit</span></div>
                        <span className="font-black text-[#6D28D9] tabular-nums">{Math.floor(streak / 7)}</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon bg="bg-[#FEF9C3]">📅</RowIcon><span className="font-semibold">Days this cycle</span></div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 7 }).map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-2.5 h-2.5 rounded-[3px] border border-[#09090B]",
                                  i < (streak % 7 || (streak > 0 ? 7 : 0))
                                    ? "bg-[#FFE500]"
                                    : "bg-white"
                                )}
                              />
                            ))}
                          </div>
                          <span className="font-black tabular-nums text-[0.875rem]">
                            {streak % 7 || (streak > 0 ? 7 : 0)}/7
                          </span>
                        </div>
                      </CardRow>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Savings Goal */}
            <div className="px-4 pb-4">
              <SectionLabel>Savings Goal</SectionLabel>
              <Card>
                <CardContent>
                  {savingsGoal > BigInt(0) ? (
                    <div className="px-5 py-4 border-b-2 border-[#09090B] flex flex-col gap-3">
                      <div className="flex justify-between text-[0.75rem]">
                        <span className="font-black text-[#6D28D9]">{parseFloat(formatUnits(totalDeposited, 18)).toFixed(3)} cUSD</span>
                        <span className="font-semibold text-[#09090B]/45">Goal: {parseFloat(formatUnits(savingsGoal, 18)).toFixed(2)} cUSD</span>
                      </div>
                      <Progress value={goalPct} />
                      <p className="text-[0.6875rem] font-black text-[#6D28D9] text-right">{goalPct}% complete</p>
                    </div>
                  ) : (
                    <p className="px-5 py-4 text-[0.8125rem] font-semibold text-[#09090B]/35 border-b-2 border-[#09090B]">
                      No goal set yet. Set a target to track your progress.
                    </p>
                  )}
                  <div className="flex gap-2 px-5 py-4">
                    <Input
                      type="number" min="0.01" step="0.01"
                      placeholder="Target in cUSD"
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
            <div className="px-4 pb-4">
              <SectionLabel>Referral</SectionLabel>
              <Card>
                <CardContent>
                  {referrer && (
                    <CardRow>
                      <div className="flex items-center gap-3"><RowIcon bg="bg-[#F5F3FF]">👥</RowIcon><span className="font-semibold">Referred by</span></div>
                      <span className="font-mono text-[0.75rem] text-[#09090B]/45">{referrer.slice(0, 6)}…{referrer.slice(-4)}</span>
                    </CardRow>
                  )}
                  {refParam !== "0x0000000000000000000000000000000000000000" && !referrer && (
                    <div className="flex items-center gap-2 mx-5 my-3 px-3 py-2 bg-[#EDE9FE] rounded-xl border-[1.5px] border-[#09090B] text-[0.8125rem] text-[#6D28D9] font-bold">
                      <span>🔗</span>
                      <span>Invite code: {refParam.slice(0, 6)}…{refParam.slice(-4)}</span>
                    </div>
                  )}
                  {pendingReferralReward > BigInt(0) && (
                    <>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon bg="bg-[#DCFCE7]">💸</RowIcon><span className="font-semibold">Referral reward</span></div>
                        <span className="font-black text-[#15803D] tabular-nums">+{parseFloat(formatUnits(pendingReferralReward, 18)).toFixed(4)} cUSD</span>
                      </CardRow>
                      <div className="px-5 pb-4 pt-1">
                        <Button variant="success" onClick={claimReferralReward} disabled={isTxLoading}>Claim referral reward</Button>
                      </div>
                    </>
                  )}
                  <div className="px-5 py-4 border-t-2 border-[#09090B]">
                    <p className="text-[0.75rem] font-bold text-[#09090B]/45 mb-3">
                      Earn 5% of your friend&apos;s first deposit when they use your link.
                    </p>
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
                      {copied ? <><Check className="h-4 w-4" /> Link copied!</> : <><Copy className="h-4 w-4" /> Copy invite link</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sponsor */}
            <div className="px-4 pb-4">
              <SectionLabel>Sponsor a Friend</SectionLabel>
              <Card>
                <CardContent>
                  <p className="px-5 pt-4 pb-3 text-[0.8125rem] font-medium text-[#09090B]/50 leading-relaxed border-b-2 border-[#09090B]">
                    Pay 0.01 cUSD on behalf of another address — boosts their streak without them spending anything.
                  </p>
                  <div className="px-5 py-4 flex flex-col gap-3">
                    <Input
                      placeholder="0x… wallet address"
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
                      {isTxLoading ? "Processing…" : "👥 Sponsor deposit"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* ── LEADERBOARD ─────────────────────────────────────── */}
        {tab === "leaderboard" && (
          <div className="pt-4 px-4 pb-4">
            <SectionLabel>Top Savers</SectionLabel>
            {leaderboard && leaderboard[0].length > 0 ? (
              <Card>
                <CardContent>
                  {leaderboard[0].map((addr, i) => (
                    <div
                      key={addr}
                      className={cn(
                        "flex items-center gap-3 px-5 py-3 min-h-[56px] border-t-2 border-[#09090B] first:border-t-0",
                        i === 0 && "bg-[#FFFBEB]",
                        i === 1 && "bg-[#F9FAFB]",
                        i === 2 && "bg-[#FFF7ED]",
                      )}
                    >
                      <span className={cn(
                        "w-8 text-center text-[1rem] font-black flex-shrink-0",
                        i < 3 ? "" : "text-[#09090B]/35 text-[0.875rem]"
                      )}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] flex items-center justify-center text-[0.6875rem] font-black text-[#6D28D9] flex-shrink-0">
                        {addr.slice(2, 4).toUpperCase()}
                      </div>
                      <span className="flex-1 text-[0.875rem] font-semibold tabular-nums truncate min-w-0 text-[#09090B]/60">
                        {addr.slice(0, 6)}…{addr.slice(-4)}
                      </span>
                      <div className="flex items-center gap-1 bg-[#FFE500] rounded-lg border-[1.5px] border-[#09090B] shadow-[1.5px_1.5px_0_#09090B] px-2 py-0.5 flex-shrink-0">
                        <span className="text-[0.875rem] font-black text-[#09090B] tabular-nums">{Number(leaderboard[1][i])}</span>
                        <span className="text-sm">🔥</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center py-16 gap-4">
                <Image src="/kibo.png" alt="Kibo" width={64} height={64} className="opacity-40" />
                <p className="text-center text-[#09090B]/35 font-semibold text-sm">
                  No deposits yet.<br />Be the first to reach the summit! 🏔️
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ────────────────────────────────────────── */}
        {tab === "settings" && (
          <div className="pt-4 px-4 pb-4 flex flex-col gap-4">

            {/* Mascot card */}
            <div className="rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] overflow-hidden bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE]">
              <div className="flex items-center gap-4 px-5 py-4">
                <Image src="/kibo.png" alt="Kibo mascot" width={56} height={56} className="flex-shrink-0" />
                <div>
                  <p className="font-black text-[#09090B] text-[0.9375rem]">Kibo</p>
                  <p className="text-[0.8125rem] text-[#09090B]/55 font-medium leading-relaxed mt-0.5">
                    Save 0.01–1 cUSD daily on Celo. Build habits. Earn rewards every 7 days.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <SectionLabel>How it works</SectionLabel>
              <Card>
                <CardContent>
                  {[
                    { bg: "bg-[#DBEAFE]", icon: "📅", label: "Daily deposit", val: "0.0001–1 cUSD" },
                    { bg: "bg-[#FEF9C3]", icon: "⏱️", label: "Cooldown",       val: "20 hours" },
                    { bg: "bg-[#DBEAFE]", icon: "🛡️", label: "Shields",        val: "Skip 1 day" },
                    { bg: "bg-[#F5F3FF]", icon: "👥", label: "Referral",        val: "5% of deposit" },
                    { bg: "bg-[#DCFCE7]", icon: "💔", label: "Recovery fee",   val: "streak × 0.01" },
                  ].map(({ bg, icon, label, val }) => (
                    <CardRow key={label}>
                      <div className="flex items-center gap-3"><RowIcon bg={bg}>{icon}</RowIcon><span className="font-semibold">{label}</span></div>
                      <span className="font-bold text-[#09090B]/50">{val}</span>
                    </CardRow>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div>
              <SectionLabel>Reward Tiers</SectionLabel>
              <Card>
                <CardContent>
                  {[
                    { bg: "bg-[#DCFCE7]", icon: "🏅", label: "Day 7",   val: "+0.005 cUSD" },
                    { bg: "bg-[#DCFCE7]", icon: "🥈", label: "Day 14+", val: "+0.012 cUSD" },
                    { bg: "bg-[#FEF9C3]", icon: "🏆", label: "Day 35+", val: "+0.025 cUSD" },
                  ].map(({ bg, icon, label, val }) => (
                    <CardRow key={label}>
                      <div className="flex items-center gap-3"><RowIcon bg={bg}>{icon}</RowIcon><span className="font-semibold">{label}</span></div>
                      <span className="font-black text-[#15803D]">{val}</span>
                    </CardRow>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div>
              <SectionLabel>Badges</SectionLabel>
              <Card>
                <CardContent>
                  {[
                    { icon: "🥉", label: "Bronze",  days: 30 },
                    { icon: "🥈", label: "Silver",  days: 90 },
                    { icon: "🥇", label: "Gold",    days: 180 },
                    { icon: "💎", label: "Diamond", days: 365 },
                  ].map(({ icon, label, days }) => (
                    <CardRow key={label}>
                      <div className="flex items-center gap-3"><RowIcon bg="bg-[#F3F4F6]">{icon}</RowIcon><span className="font-semibold">{label}</span></div>
                      <span className="font-bold text-[#09090B]/50">{days} day streak</span>
                    </CardRow>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div>
              <SectionLabel>Contract</SectionLabel>
              <Card>
                <CardContent>
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.75rem] font-bold text-[#09090B]/50">Celo Mainnet</span>
                      <span className="bg-[#DCFCE7] text-[#15803D] text-[0.625rem] font-black px-2 py-0.5 rounded-md border border-[#09090B]">Live</span>
                    </div>
                    <span className="font-mono text-[0.6875rem] text-[#09090B]/40 break-all leading-relaxed">
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
        style={{ height: "calc(64px + env(safe-area-inset-bottom, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        role="tablist"
      >
        {([
          { id: "home" as Tab,        icon: "🏠", label: "Home" },
          { id: "leaderboard" as Tab, icon: "🏆", label: "Board" },
          { id: "settings" as Tab,    icon: "⚙️", label: "Info" },
        ]).map(({ id, icon, label }) => (
          <button
            key={id}
            className="flex flex-col items-center gap-0.5 flex-1 pt-2.5 pb-1 transition-all duration-[120ms]"
            onClick={() => setTab(id)}
            role="tab"
            aria-selected={tab === id}
          >
            <span className={cn("text-[1.375rem] leading-none transition-all duration-[120ms]", tab !== id && "grayscale opacity-30")}>
              {icon}
            </span>
            <span className={cn("text-[0.5625rem] font-black uppercase tracking-widest transition-all duration-[120ms]", tab === id ? "text-[#6D28D9]" : "text-[#09090B]/30")}>
              {label}
            </span>
            <div className={cn("h-[3px] w-6 rounded-full mt-0.5 transition-all duration-[120ms]", tab === id ? "bg-[#FFE500] border border-[#09090B]" : "bg-transparent")} />
          </button>
        ))}
      </div>
    </div>
  );
}
