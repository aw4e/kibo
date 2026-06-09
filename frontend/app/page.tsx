/* Hallmark · macrostructure: Letter · tone: playful-typographic · anchor hue: purple
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 */
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
import { LottieIcon } from "@/components/ui/lottie-icon";
import {
  AlertCircle, X, Copy, Check, Wallet,
  Coins, Gift, HeartCrack, Zap, Trophy, Shield,
  Sparkles, Calendar, Target, DollarSign, Users,
  Award, Clock, Flame, Link, Mountain, Star, Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BADGE_LABEL = ["—", "Bronze", "Silver", "Gold", "Diamond"] as const;
const BADGE_BG    = ["", "bg-[#FDE68A]", "bg-[#E5E7EB]", "bg-[#FDE68A]", "bg-[#BAE6FD]"] as const;
const BADGE_ICON  = [null, Award, Medal, Trophy, Star] as const;

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
        <circle className={cn("ring-progress", isComplete && "complete")}
          cx="60" cy="60" r={R}
          strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <LottieIcon path="/lotties/fire.json" size={28} />
        <span className="font-black text-[3rem] tracking-[-0.06em] tabular-nums leading-none text-white mt-0.5"
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.25)" }}>
          {streak}
        </span>
        <span className="font-jakarta text-[0.625rem] font-bold uppercase tracking-[0.18em] text-white/55 mt-0.5">
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

function RowIcon({ children, bg = "bg-[#F3F4F6]" }: { children: React.ReactNode; bg?: string }) {
  return (
    <span className={cn(
      "w-[32px] h-[32px] rounded-lg flex items-center justify-center flex-shrink-0",
      "border-[1.5px] border-[#09090B] shadow-[1.5px_1.5px_0_#09090B]",
      bg
    )}>
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 px-0.5">
      <div className="w-1.5 h-1.5 rounded-[2px] bg-[#FFE500] border border-[#09090B] flex-shrink-0" />
      <p className="font-jakarta text-[0.625rem] font-bold uppercase tracking-[0.18em] text-[#09090B]/50">
        {children}
      </p>
    </div>
  );
}

type Tab = "home" | "leaderboard" | "settings";

const TABS: { id: Tab; lottie: string; label: string }[] = [
  { id: "home",        lottie: "/lotties/home.json",   label: "Home"  },
  { id: "leaderboard", lottie: "/lotties/trophy.json", label: "Board" },
  { id: "settings",    lottie: "/lotties/gear.json",   label: "Info"  },
];

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
    if (r && /^0x[0-9a-fA-F]{40}$/.test(r)) setRefParam(r as `0x${string}`);
  }, []);

  const {
    streak, longestStreak, totalDeposited, canDeposit, canClaim, nextDepositIn,
    cUSDBalance, shields, badge, brokenStreak, rewardsClaimed, leaderboard,
    isTxLoading, isLoading, error, clearError, deposit, claimReward, withdraw,
    recoverStreak, pendingReferralReward, referrer, claimReferralReward,
    savingsGoal, setGoal, depositFor,
  } = useKibo();

  const countdown     = formatCountdown(nextDepositIn);
  const savedAmount   = parseFloat(formatUnits(totalDeposited, 18));
  const balanceAmount = cUSDBalance ? parseFloat(formatUnits(cUSDBalance, 18)).toFixed(2) : "—";
  const goalPct       = savingsGoal > BigInt(0)
    ? Math.min(100, Number((totalDeposited * BigInt(100)) / savingsGoal))
    : 0;

  /* ── CONNECT PAGE ─────────────────────────────────────────── */
  if (!isConnected) {
    return (
      <div className="relative min-h-dvh bg-white flex flex-col overflow-x-clip">

        {/* Subtle violet aurora */}
        <div aria-hidden className="pointer-events-none absolute top-0 inset-x-0 h-[50vh] bg-gradient-to-b from-violet-50 to-transparent" />

        {/* Nav */}
        <header className="relative z-10 flex items-center justify-between px-5 pt-6">
          <div className="flex items-center gap-2">
            <Image src="/kibo.png" width={24} height={24} alt=""
              className="rounded-[6px] border-[1.5px] border-[#09090B]" />
            <span className="font-black text-[0.9375rem] tracking-[-0.03em] text-[#09090B]">KIBO</span>
          </div>
          <span className="font-jakarta text-[0.5625rem] font-bold uppercase tracking-[0.14em] bg-[#09090B] text-white px-2.5 py-[5px] rounded-full">
            Celo Mainnet
          </span>
        </header>

        {/* Eyebrow + mascot */}
        <div className="relative z-10 px-5 pt-8 flex items-center gap-3">
          <div className="animate-float flex-shrink-0">
            <div className="bg-[#FFE500] border-2 border-[#09090B] shadow-[3px_3px_0_#09090B] rounded-xl p-2 inline-flex">
              <Image src="/kibo.png" alt="Kibo mascot" width={40} height={40}
                className="object-cover block" priority />
            </div>
          </div>
          <p className="font-jakarta text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#7C3AED]">
            Daily Savings · Celo Network
          </p>
        </div>

        {/* Display type hero */}
        <div className="relative z-10 px-5 pt-5 pb-1">
          <h1
            className="font-black tracking-[-0.055em] text-[#09090B] leading-[0.88] [overflow-wrap:anywhere] min-w-0"
            style={{ fontSize: "clamp(3.875rem, 16.5vw, 5rem)" }}
          >
            Daily<br />Savings<br />Streak.
          </h1>
          <p
            className="font-black tracking-[-0.045em] text-[#7C3AED] leading-tight mt-2"
            style={{ fontSize: "clamp(2.125rem, 9vw, 2.75rem)" }}
          >
            On Celo.
          </p>
        </div>

        {/* Tagline */}
        <p className="relative z-10 font-jakarta px-5 pt-5 text-[0.9375rem] font-medium text-[#09090B]/50 leading-[1.6]">
          Save 0.01 cUSD daily. Build a streak.<br />Earn rewards every 7 days.
        </p>

        {/* Feature table */}
        <div className="relative z-10 mx-5 mt-6 border-y-2 border-[#09090B] divide-y-2 divide-[#09090B]">
          {[
            ["Daily deposit",  "0.01 – 1 cUSD"],
            ["Cooldown",       "20 hours"],
            ["Streak reward",  "Every 7 days"],
            ["Shields",        "Skip 1 day safely"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-3.5">
              <span className="font-jakarta text-[0.875rem] font-medium text-[#09090B]/45">{label}</span>
              <span className="text-[0.875rem] font-black text-[#09090B]">{value}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="relative z-10 px-5 pt-6 pb-10 flex flex-col gap-3 mt-auto">
          <button
            onClick={() => connect({ connector: injected() })}
            className="w-full h-[56px] bg-[#FFE500] text-[#09090B] font-black text-[1.0625rem] rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#09090B] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all duration-75 flex items-center justify-center gap-2.5"
          >
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </button>
          <p className="font-jakarta text-center text-[#09090B]/28 text-[0.6875rem] font-medium tracking-wide">
            Non-custodial · Open source · Celo Mainnet
          </p>
        </div>

      </div>
    );
  }

  /* ── MAIN APP ─────────────────────────────────────────────── */
  const isNewUser = !isLoading && streak === 0 && savedAmount === 0;

  return (
    <div
      className="app-shell flex flex-col max-w-app mx-auto min-h-dvh relative overflow-x-clip"
      style={{
        background: "#FAFAF5",
        backgroundImage: "radial-gradient(circle, rgba(9,9,11,0.055) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {/* Navbar */}
      <nav className="sticky top-0 z-[100] flex items-center justify-between px-4 h-[52px] bg-white border-b-2 border-[#09090B]">
        <div className="flex items-center gap-2">
          <Image src="/kibo.png" alt="Kibo" width={28} height={28}
            className="rounded-lg border-2 border-[#09090B] shadow-[1.5px_1.5px_0_#09090B] flex-shrink-0" />
          <span className="font-black tracking-[-0.04em] text-[1rem] text-[#09090B]">KIBO</span>
          {streak > 0 && (
            <span className="bg-[#FFE500] text-[#09090B] text-[0.5625rem] font-black px-2 py-[3px] rounded-md border border-[#09090B] shadow-[1px_1px_0_#09090B] flex items-center gap-1">
              <Flame className="w-2.5 h-2.5" />
              {streak}d
            </span>
          )}
        </div>
        <button
          onClick={() => disconnect()}
          className="font-jakarta text-[0.625rem] font-bold bg-[#09090B] text-white rounded-lg px-2.5 py-[5px] hover:bg-[#222] transition-colors duration-75 active:scale-95"
        >
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </button>
      </nav>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-5 py-3 bg-[#FEE2E2] border-b-2 border-[#09090B] animate-slide-down" role="alert">
          <AlertCircle className="h-4 w-4 text-[#DC2626] flex-shrink-0" />
          <span className="font-jakarta flex-1 text-[0.8125rem] font-bold text-[#DC2626]">{error}</span>
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
                <div className="rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] overflow-hidden bg-gradient-to-br from-[#EDE9FE] via-[#DDD6FE] to-[#DBEAFE]">
                  <div className="px-6 pt-6 pb-5 flex flex-col items-center gap-3 text-center">
                    <div className="animate-float">
                      <Image src="/kibo.png" alt="Kibo" width={80} height={80} className="drop-shadow-lg" />
                    </div>
                    <div>
                      <p className="text-[1.25rem] font-black text-[#09090B]">Welcome to Kibo!</p>
                      <p className="font-jakarta text-[0.875rem] text-[#09090B]/55 font-medium mt-1 leading-relaxed">
                        Deposit 0.01 cUSD to start your savings streak.<br />Earn rewards every 7 days.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] overflow-hidden">
                  <div className="bg-gradient-to-br from-[#6D28D9] via-[#5B21B6] to-[#1D4ED8] px-6 pt-6 pb-5 flex flex-col items-center gap-3">
                    {isLoading ? (
                      <div className="w-[176px] h-[176px] rounded-full skeleton" />
                    ) : (
                      <StreakRing streak={streak} />
                    )}
                    <p className="font-jakarta text-[1rem] font-bold text-white/90 text-center">
                      {isLoading ? " " : streak % 7 === 0 && streak > 0
                        ? "Milestone reached!"
                        : `${7 - (streak % 7)} day${7 - (streak % 7) !== 1 ? "s" : ""} to next milestone`}
                    </p>
                    {canClaim && <Badge variant="milestone">Reward ready!</Badge>}
                  </div>
                  <div className="bg-white grid grid-cols-3 divide-x-2 divide-[#09090B] border-t-[2px] border-[#09090B]">
                    {[
                      { label: "Best",    value: `${longestStreak}d` },
                      { label: "Shields", value: shields > 0 ? `${shields}/3` : "—" },
                      { label: "Saved",   value: `${savedAmount.toFixed(2)}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col items-center py-3 gap-0.5">
                        <span className="text-[0.875rem] font-black text-[#09090B]">{value}</span>
                        <span className="font-jakarta text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-[#09090B]/40">{label}</span>
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
                      <HeartCrack className="w-6 h-6 text-[#DC2626] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[0.9375rem] font-black text-[#09090B]">Streak broken</p>
                        <p className="font-jakarta text-[0.8125rem] text-[#09090B]/55 mt-0.5">
                          Pay {Math.min(brokenStreak * 0.01, 0.1).toFixed(3)} cUSD to restore your {brokenStreak}-day streak
                        </p>
                      </div>
                    </div>
                    <Button variant="warning" onClick={recoverStreak} disabled={isTxLoading}>
                      <Zap className="w-4 h-4" />
                      {isTxLoading ? "Processing…" : `Recover ${brokenStreak}-day streak`}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-4 pb-4 flex flex-col gap-2.5">
              {canClaim && (
                <Button variant="success" onClick={claimReward} disabled={isTxLoading}>
                  <Gift className="w-4 h-4" />
                  Claim milestone reward
                </Button>
              )}
              <Button onClick={() => deposit(undefined, refParam)} disabled={!canDeposit || isTxLoading}>
                <Coins className="w-4 h-4" />
                {isTxLoading ? "Processing…" : "Deposit 0.01 cUSD"}
              </Button>
              {!canDeposit && countdown && (
                <div className="flex items-center justify-center gap-2">
                  <span className="font-jakarta text-[0.8125rem] font-medium text-[#09090B]/45">Next deposit in</span>
                  <span className="bg-[#FFE500] text-[#09090B] text-[0.75rem] font-black px-2.5 py-0.5 rounded-lg border-[1.5px] border-[#09090B] shadow-[1.5px_1.5px_0_#09090B] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {countdown}
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
                        <div className="flex items-center gap-3">
                          <RowIcon bg="bg-[#EDE9FE]"><Coins className="w-4 h-4 text-[#6D28D9]" /></RowIcon>
                          <span className="font-semibold">Total saved</span>
                        </div>
                        <span className="font-black text-[#6D28D9] tabular-nums">{savedAmount.toFixed(3)} <span className="font-jakarta font-semibold text-[#09090B]/40 text-[0.8125rem]">cUSD</span></span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon bg="bg-[#FEF9C3]"><Trophy className="w-4 h-4 text-[#CA8A04]" /></RowIcon>
                          <span className="font-semibold">Best streak</span>
                        </div>
                        <span className="font-black tabular-nums">{longestStreak} <span className="font-jakarta font-semibold text-[#09090B]/40 text-[0.8125rem]">days</span></span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon bg="bg-[#DCFCE7]"><DollarSign className="w-4 h-4 text-[#15803D]" /></RowIcon>
                          <span className="font-semibold">cUSD balance</span>
                        </div>
                        <span className="font-jakarta font-semibold text-[#09090B]/50 tabular-nums">{balanceAmount}</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon bg="bg-[#DBEAFE]"><Shield className="w-4 h-4 text-[#1D4ED8]" /></RowIcon>
                          <span className="font-semibold">Shields</span>
                        </div>
                        <span className="font-black">
                          {shields > 0 ? `${shields}/3` : "—"}
                          {shields > 0 && <span className="font-jakarta text-[0.8125rem] font-semibold text-[#09090B]/35 ml-1">active</span>}
                        </span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon bg={badge > 0 ? BADGE_BG[badge] : "bg-[#F3F4F6]"}>
                            {badge > 0 && BADGE_ICON[badge] ? (
                              (() => {
                                const Icon = BADGE_ICON[badge]!;
                                return <Icon className="w-4 h-4 text-[#6D28D9]" />;
                              })()
                            ) : (
                              <Award className="w-4 h-4 text-[#09090B]/30" />
                            )}
                          </RowIcon>
                          <span className="font-semibold">Badge</span>
                        </div>
                        <span className={cn("font-black", badge > 0 ? "text-[#6D28D9]" : "text-[#09090B]/35 font-semibold")}>
                          {badge > 0 ? BADGE_LABEL[badge] : "None yet"}
                        </span>
                      </CardRow>
                      {parseFloat(formatUnits(rewardsClaimed, 18)) > 0 && (
                        <CardRow>
                          <div className="flex items-center gap-3">
                            <RowIcon bg="bg-[#DCFCE7]"><Gift className="w-4 h-4 text-[#15803D]" /></RowIcon>
                            <span className="font-semibold">Rewards earned</span>
                          </div>
                          <span className="font-black text-[#15803D] tabular-nums">
                            +{parseFloat(formatUnits(rewardsClaimed, 18)).toFixed(4)} <span className="font-jakarta font-semibold text-[#09090B]/40 text-[0.8125rem]">cUSD</span>
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
                        <div className="flex items-center gap-3">
                          <RowIcon bg="bg-[#F5F3FF]"><Target className="w-4 h-4 text-[#6D28D9]" /></RowIcon>
                          <span className="font-semibold">Next milestone</span>
                        </div>
                        <span className="font-black tabular-nums">Day {streak === 0 ? 7 : Math.ceil((streak + 1) / 7) * 7}</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon bg="bg-[#EDE9FE]"><Sparkles className="w-4 h-4 text-[#6D28D9]" /></RowIcon>
                          <span className="font-semibold">Milestones hit</span>
                        </div>
                        <span className="font-black text-[#6D28D9] tabular-nums">{Math.floor(streak / 7)}</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon bg="bg-[#FEF9C3]"><Calendar className="w-4 h-4 text-[#CA8A04]" /></RowIcon>
                          <span className="font-semibold">Days this cycle</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 7 }).map((_, i) => (
                              <div key={i} className={cn("w-2.5 h-2.5 rounded-[3px] border border-[#09090B]",
                                i < (streak % 7 || (streak > 0 ? 7 : 0)) ? "bg-[#FFE500]" : "bg-white")} />
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
                        <span className="font-jakarta font-semibold text-[#09090B]/45">Goal: {parseFloat(formatUnits(savingsGoal, 18)).toFixed(2)} cUSD</span>
                      </div>
                      <Progress value={goalPct} />
                      <p className="font-jakarta text-[0.6875rem] font-bold text-[#6D28D9] text-right">{goalPct}% complete</p>
                    </div>
                  ) : (
                    <p className="font-jakarta px-5 py-4 text-[0.8125rem] font-medium text-[#09090B]/35 border-b-2 border-[#09090B]">
                      No goal set yet. Set a target to track your progress.
                    </p>
                  )}
                  <div className="flex gap-2 px-5 py-4">
                    <Input type="number" min="0.01" step="0.01" placeholder="Target in cUSD"
                      value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <Button size="sm" className="px-5 flex-shrink-0"
                      onClick={() => { const v = parseFloat(goalInput); if (!v || v <= 0) return; setGoal(parseUnits(String(v), 18)); setGoalInput(""); }}
                      disabled={isTxLoading || !goalInput}>
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
                      <div className="flex items-center gap-3">
                        <RowIcon bg="bg-[#F5F3FF]"><Users className="w-4 h-4 text-[#6D28D9]" /></RowIcon>
                        <span className="font-semibold">Referred by</span>
                      </div>
                      <span className="font-mono text-[0.75rem] text-[#09090B]/45">{referrer.slice(0, 6)}…{referrer.slice(-4)}</span>
                    </CardRow>
                  )}
                  {refParam !== "0x0000000000000000000000000000000000000000" && !referrer && (
                    <div className="flex items-center gap-2 mx-5 my-3 px-3 py-2 bg-[#EDE9FE] rounded-xl border-[1.5px] border-[#09090B] text-[0.8125rem] text-[#6D28D9] font-bold">
                      <Link className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Invite code: {refParam.slice(0, 6)}…{refParam.slice(-4)}</span>
                    </div>
                  )}
                  {pendingReferralReward > BigInt(0) && (
                    <>
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon bg="bg-[#DCFCE7]"><Coins className="w-4 h-4 text-[#15803D]" /></RowIcon>
                          <span className="font-semibold">Referral reward</span>
                        </div>
                        <span className="font-black text-[#15803D] tabular-nums">+{parseFloat(formatUnits(pendingReferralReward, 18)).toFixed(4)} cUSD</span>
                      </CardRow>
                      <div className="px-5 pb-4 pt-1">
                        <Button variant="success" onClick={claimReferralReward} disabled={isTxLoading}>Claim referral reward</Button>
                      </div>
                    </>
                  )}
                  <div className="px-5 py-4 border-t-2 border-[#09090B]">
                    <p className="font-jakarta text-[0.75rem] font-medium text-[#09090B]/45 mb-3">
                      Earn 5% of your friend&apos;s first deposit when they use your link.
                    </p>
                    <Button variant="ghost"
                      onClick={() => { if (!address) return; navigator.clipboard.writeText(`${window.location.origin}?ref=${address}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      disabled={!address}>
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
                  <p className="font-jakarta px-5 pt-4 pb-3 text-[0.8125rem] font-medium text-[#09090B]/50 leading-relaxed border-b-2 border-[#09090B]">
                    Pay 0.01 cUSD on behalf of another address — boosts their streak without them spending anything.
                  </p>
                  <div className="px-5 py-4 flex flex-col gap-3">
                    <Input placeholder="0x… wallet address" value={sponsorAddr}
                      onChange={(e) => setSponsorAddr(e.target.value)}
                      error={!!(sponsorAddr && !sponsorAddrValid)} spellCheck={false} className="font-mono text-sm" />
                    {sponsorAddr && !sponsorAddrValid && (
                      <p className="font-jakarta text-[0.75rem] font-bold text-[#DC2626]">Invalid address</p>
                    )}
                    <Button onClick={() => { if (!sponsorAddrValid) return; depositFor(sponsorAddr as `0x${string}`); setSponsorAddr(""); }}
                      disabled={isTxLoading || !sponsorAddrValid}>
                      <Users className="w-4 h-4" />
                      {isTxLoading ? "Processing…" : "Sponsor deposit"}
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
                  {leaderboard[0].map((addr, i) => {
                    const RankIcon = i === 0 ? Trophy : i === 1 ? Medal : i === 2 ? Award : null;
                    const rankColor = i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-[#09090B]/35";
                    return (
                      <div key={addr} className={cn(
                        "flex items-center gap-3 px-5 py-3 min-h-[56px] border-t-2 border-[#09090B] first:border-t-0",
                        i === 0 && "bg-[#FFFBEB]", i === 1 && "bg-[#F9FAFB]", i === 2 && "bg-[#FFF7ED]"
                      )}>
                        <div className={cn("w-8 flex items-center justify-center flex-shrink-0", rankColor)}>
                          {RankIcon ? (
                            <RankIcon className="w-5 h-5" />
                          ) : (
                            <span className="text-[0.875rem] font-black text-[#09090B]/35">#{i + 1}</span>
                          )}
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] flex items-center justify-center text-[0.6875rem] font-black text-[#6D28D9] flex-shrink-0">
                          {addr.slice(2, 4).toUpperCase()}
                        </div>
                        <span className="font-jakarta flex-1 text-[0.875rem] font-semibold tabular-nums truncate min-w-0 text-[#09090B]/60">
                          {addr.slice(0, 6)}…{addr.slice(-4)}
                        </span>
                        <div className="flex items-center gap-1 bg-[#FFE500] rounded-lg border-[1.5px] border-[#09090B] shadow-[1.5px_1.5px_0_#09090B] px-2 py-0.5 flex-shrink-0">
                          <Flame className="w-3 h-3 text-[#09090B]" />
                          <span className="text-[0.875rem] font-black text-[#09090B] tabular-nums">{Number(leaderboard[1][i])}</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center py-16 gap-4">
                <Mountain className="w-16 h-16 text-[#09090B]/15" />
                <p className="font-jakarta text-center text-[#09090B]/35 font-semibold text-sm">
                  No deposits yet.<br />Be the first to reach the summit.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ────────────────────────────────────────── */}
        {tab === "settings" && (
          <div className="pt-4 px-4 pb-4 flex flex-col gap-4">
            <div className="rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] overflow-hidden bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE]">
              <div className="flex items-center gap-4 px-5 py-4">
                <Image src="/kibo.png" alt="Kibo mascot" width={56} height={56} className="flex-shrink-0" />
                <div>
                  <p className="font-black text-[#09090B] text-[0.9375rem]">Kibo</p>
                  <p className="font-jakarta text-[0.8125rem] text-[#09090B]/55 font-medium leading-relaxed mt-0.5">
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
                    { bg: "bg-[#DBEAFE]", Icon: Calendar,   color: "text-[#1D4ED8]", label: "Daily deposit", val: "0.001–1 cUSD" },
                    { bg: "bg-[#FEF9C3]", Icon: Clock,       color: "text-[#CA8A04]", label: "Cooldown",      val: "20 hours" },
                    { bg: "bg-[#DBEAFE]", Icon: Shield,      color: "text-[#1D4ED8]", label: "Shields",       val: "Skip 1 day" },
                    { bg: "bg-[#F5F3FF]", Icon: Users,       color: "text-[#6D28D9]", label: "Referral",      val: "5% of deposit" },
                    { bg: "bg-[#FEE2E2]", Icon: HeartCrack,  color: "text-[#DC2626]", label: "Recovery fee",  val: "streak × 0.01" },
                  ].map(({ bg, Icon, color, label, val }) => (
                    <CardRow key={label}>
                      <div className="flex items-center gap-3">
                        <RowIcon bg={bg}><Icon className={cn("w-4 h-4", color)} /></RowIcon>
                        <span className="font-semibold">{label}</span>
                      </div>
                      <span className="font-jakarta font-bold text-[#09090B]/50">{val}</span>
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
                    { bg: "bg-[#DCFCE7]", Icon: Award,   color: "text-[#CA8A04]", label: "Day 7",   val: "+0.005 cUSD" },
                    { bg: "bg-[#DCFCE7]", Icon: Medal,   color: "text-[#9CA3AF]", label: "Day 14+", val: "+0.012 cUSD" },
                    { bg: "bg-[#FEF9C3]", Icon: Trophy,  color: "text-[#CA8A04]", label: "Day 35+", val: "+0.025 cUSD" },
                  ].map(({ bg, Icon, color, label, val }) => (
                    <CardRow key={label}>
                      <div className="flex items-center gap-3">
                        <RowIcon bg={bg}><Icon className={cn("w-4 h-4", color)} /></RowIcon>
                        <span className="font-semibold">{label}</span>
                      </div>
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
                    { Icon: Award,   color: "text-[#CA8A04]", bg: "bg-[#FDE68A]", label: "Bronze",  days: 30  },
                    { Icon: Medal,   color: "text-[#9CA3AF]", bg: "bg-[#E5E7EB]", label: "Silver",  days: 90  },
                    { Icon: Trophy,  color: "text-[#CA8A04]", bg: "bg-[#FDE68A]", label: "Gold",    days: 180 },
                    { Icon: Star,    color: "text-[#60A5FA]", bg: "bg-[#BAE6FD]", label: "Diamond", days: 365 },
                  ].map(({ Icon, color, bg, label, days }) => (
                    <CardRow key={label}>
                      <div className="flex items-center gap-3">
                        <RowIcon bg={bg}><Icon className={cn("w-4 h-4", color)} /></RowIcon>
                        <span className="font-semibold">{label}</span>
                      </div>
                      <span className="font-jakarta font-bold text-[#09090B]/50">{days} day streak</span>
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
                      <span className="font-jakarta text-[0.75rem] font-bold text-[#09090B]/50">Celo Mainnet</span>
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
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app flex items-start justify-around bg-white border-t-2 border-[#09090B] z-[200]"
        style={{ height: "calc(64px + env(safe-area-inset-bottom, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        role="tablist"
      >
        {TABS.map(({ id, lottie, label }) => (
          <button key={id}
            className="flex flex-col items-center gap-0.5 flex-1 pt-2 pb-1 transition-all duration-[120ms]"
            onClick={() => setTab(id)} role="tab" aria-selected={tab === id}>
            <div className={cn("transition-all duration-[120ms]", tab !== id && "opacity-30 grayscale")}>
              <LottieIcon path={lottie} size={28} autoplay={tab === id} loop={tab === id} />
            </div>
            <span className={cn("font-jakarta text-[0.5625rem] font-bold uppercase tracking-widest transition-all duration-[120ms]",
              tab === id ? "text-[#6D28D9]" : "text-[#09090B]/30")}>
              {label}
            </span>
            <div className={cn("h-[3px] w-6 rounded-full mt-0.5 transition-all duration-[120ms]",
              tab === id ? "bg-[#FFE500] border border-[#09090B]" : "bg-transparent")} />
          </button>
        ))}
      </div>
    </div>
  );
}
