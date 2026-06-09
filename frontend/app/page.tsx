/* Hallmark · macrostructure: Workbench · tone: editorial-typographic · anchor hue: purple
 * pre-emit critique: P5 H5 E5 S5 R4 V5
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
  Home as HomeIcon, BarChart2, Settings,
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

function StreakRing({ streak, size = 220 }: { streak: number; size?: number }) {
  const milestone = 7;
  const daysIntoMilestone = streak % milestone || (streak > 0 ? milestone : 0);
  const progress = daysIntoMilestone / milestone;
  const offset = CIRCUMFERENCE * (1 - progress);
  const isComplete = streak > 0 && streak % milestone === 0;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="ring-svg absolute inset-0" viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring-track" cx="60" cy="60" r={R} />
        <circle className={cn("ring-progress", isComplete && "complete")}
          cx="60" cy="60" r={R}
          strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <LottieIcon path="/lotties/fire.json" size={34} />
        <span
          className="font-display font-bold tracking-[-0.06em] tabular-nums leading-none text-white mt-1"
          style={{ fontSize: size * 0.27, textShadow: "2px 2px 0 rgba(0,0,0,0.25)" }}
        >
          {streak}
        </span>
        <span className="font-sans text-[0.625rem] font-bold uppercase tracking-[0.18em] text-white/55 mt-0.5">
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

function SectionLabel({ children, color = "#7C3AED" }: { children: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-[3px] h-[18px] rounded-full flex-shrink-0" style={{ background: color }} />
      <p className="font-sans font-black text-[0.875rem] tracking-[-0.025em] text-[#09090B]">
        {children}
      </p>
    </div>
  );
}

type Tab = "home" | "leaderboard" | "settings";

const TABS: { id: Tab; Icon: React.ElementType; label: string }[] = [
  { id: "home",        Icon: HomeIcon, label: "Home"  },
  { id: "leaderboard", Icon: BarChart2, label: "Board" },
  { id: "settings",    Icon: Settings, label: "Info"  },
];

/* ── Top accent stripe ────────────────────────────────────── */
function AccentStripe({ height = 5 }: { height?: number }) {
  return (
    <div className="flex" style={{ height }}>
      <div className="flex-1 bg-[#7C3AED]" />
      <div className="flex-1 bg-[#FFE500]" />
      <div className="flex-1 bg-[#22C55E]" />
      <div className="flex-1 bg-[#3B82F6]" />
    </div>
  );
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [tab, setTab] = useState<Tab>("home");
  const [refParam, setRefParam] = useState<`0x${string}`>("0x0000000000000000000000000000000000000000");
  const [copied, setCopied] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [depositInput, setDepositInput] = useState("0.01");
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
      <div className="min-h-screen bg-[#FAFAF8] overflow-x-clip flex flex-col">
        <AccentStripe height={5} />

        {/* Nav */}
        <header className="border-b-2 border-[#09090B] bg-white">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between px-6 h-[64px]">
            <div className="flex items-center gap-2.5">
              <Image src="/kibo.png" width={34} height={34} alt="Kibo"
                className="rounded-[8px] border-2 border-[#09090B] shadow-[2px_2px_0_#09090B]" />
              <span className="font-display font-bold text-[1.75rem] tracking-[-0.02em] text-[#09090B]">Kibo</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline font-sans text-[0.6875rem] font-semibold text-[#09090B]/40 uppercase tracking-[0.1em]">
                Non-custodial · Open source
              </span>
              <span className="font-sans text-[0.6875rem] font-black uppercase tracking-[0.1em] bg-[#09090B] text-white px-3 py-1.5 rounded-full">
                Celo Mainnet
              </span>
            </div>
          </div>
        </header>

        {/* Hero: 2-column split */}
        <main className="max-w-screen-xl mx-auto w-full px-6 lg:px-12 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start flex-1">

          {/* Left: typographic hero */}
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-8">
              <div className="animate-float">
                <div className="bg-[#FFE500] border-2 border-[#09090B] shadow-[3px_3px_0_#09090B] rounded-xl p-2 inline-flex">
                  <Image src="/kibo.png" alt="" width={36} height={36} className="object-cover block" priority />
                </div>
              </div>
              <span className="font-sans text-[0.6875rem] font-black uppercase tracking-[0.16em] text-[#7C3AED]">
                Daily Savings · Celo Network
              </span>
            </div>

            {/* Display heading with Cormorant */}
            <h1
              className="font-display font-bold text-[#09090B] leading-[0.88] tracking-[-0.02em] [overflow-wrap:anywhere] min-w-0"
              style={{ fontSize: "clamp(3.75rem, 8vw, 7.5rem)" }}
            >
              Daily<br />Savings<br />
              <span className="relative inline-block">
                Streak.
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 right-0 rounded-[2px]"
                  style={{ height: "10px", background: "#FFE500", border: "1.5px solid #09090B", zIndex: -1 }}
                />
              </span>
            </h1>

            {/* Cormorant italic sub-headline */}
            <p
              className="font-display italic font-semibold text-[#7C3AED] leading-tight mt-5"
              style={{ fontSize: "clamp(1.875rem, 4vw, 3.5rem)" }}
            >
              On Celo.
            </p>

            <p className="font-sans text-[1rem] font-medium text-[#09090B]/50 leading-[1.7] mt-6 max-w-[38ch]">
              Save 0.01 cUSD daily. Build a streak.<br />
              Earn rewards every 7 days on Celo mainnet.
            </p>

            <button
              onClick={() => connect({ connector: injected() })}
              className="mt-9 h-[58px] px-8 bg-[#FFE500] text-[#09090B] font-black text-[1.0625rem] rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#09090B] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all duration-75 flex items-center gap-2.5"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </button>
          </div>

          {/* Right: 2×2 feature cards */}
          <div className="grid grid-cols-2 gap-3.5 pt-4 lg:pt-16">
            {[
              { bg: "bg-[#FFE500]", Icon: Coins,   val: "0.01 cUSD",  sub: "daily minimum",    border: "border-[#09090B]" },
              { bg: "bg-[#EDE9FE]", Icon: Trophy,  val: "7 days",     sub: "per streak cycle", border: "border-[#09090B]" },
              { bg: "bg-[#DBEAFE]", Icon: Clock,   val: "20 hours",   sub: "cooldown between", border: "border-[#09090B]" },
              { bg: "bg-[#DCFCE7]", Icon: Shield,  val: "3 shields",  sub: "skip days safely", border: "border-[#09090B]" },
            ].map(({ bg, Icon, val, sub }) => (
              <div key={sub} className={cn(bg, "border-2 border-[#09090B] shadow-[4px_4px_0_#09090B] rounded-2xl p-5 lg:p-6")}>
                <Icon className="w-5 h-5 mb-3 text-[#09090B]" />
                <p
                  className="font-display font-bold text-[#09090B] tracking-[-0.025em] leading-none"
                  style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
                >
                  {val}
                </p>
                <p className="font-sans text-[0.6875rem] font-medium text-[#09090B]/50 mt-1.5">{sub}</p>
              </div>
            ))}
          </div>
        </main>

        {/* Footer strip */}
        <footer className="border-t-2 border-[#09090B] bg-white mt-auto">
          <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-center gap-6">
            {["Non-custodial", "Open source", "Celo Mainnet"].map((item, i) => (
              <div key={item} className="flex items-center gap-6">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-[#09090B]/20" />}
                <span className="font-sans text-[0.6875rem] font-bold text-[#09090B]/35 uppercase tracking-[0.12em]">{item}</span>
              </div>
            ))}
          </div>
        </footer>
      </div>
    );
  }

  /* ── MAIN APP ─────────────────────────────────────────────── */
  const isNewUser = !isLoading && streak === 0 && savedAmount === 0;

  return (
    <div
      className="min-h-screen overflow-x-clip"
      style={{
        background: "#F7F5FF",
        backgroundImage: "radial-gradient(circle, rgba(109,40,217,0.06) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <AccentStripe height={4} />

      {/* Top nav */}
      <nav className="sticky top-0 z-[100] bg-white border-b-2 border-[#09090B]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-6 h-[60px]">

          {/* Logo + nav tabs */}
          <div className="flex items-center gap-6 lg:gap-8">
            <div className="flex items-center gap-2">
              <Image src="/kibo.png" alt="Kibo" width={30} height={30}
                className="rounded-lg border-2 border-[#09090B] shadow-[1.5px_1.5px_0_#09090B] flex-shrink-0" />
              <span className="font-display font-bold text-[1.5rem] tracking-[-0.02em] text-[#09090B]">Kibo</span>
            </div>

            <div className="flex items-center gap-0.5" role="tablist">
              {TABS.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-sans font-semibold text-[0.8125rem] transition-all duration-100",
                    tab === id
                      ? "bg-[#09090B] text-white"
                      : "text-[#09090B]/45 hover:text-[#09090B] hover:bg-[#09090B]/5"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: streak badge + wallet */}
          <div className="flex items-center gap-2.5">
            {streak > 0 && (
              <span className="hidden sm:flex items-center gap-1.5 bg-[#FFE500] border-[1.5px] border-[#09090B] shadow-[1.5px_1.5px_0_#09090B] rounded-xl px-2.5 py-1.5 font-black text-[0.75rem] text-[#09090B]">
                <Flame className="w-3.5 h-3.5" />
                {streak}d streak
              </span>
            )}
            <button
              onClick={() => disconnect()}
              className="font-mono text-[0.6875rem] font-bold bg-[#09090B] text-white rounded-xl px-3 py-1.5 hover:bg-[#222] transition-colors duration-75 active:scale-95"
            >
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </button>
          </div>
        </div>
      </nav>

      {/* Error banner */}
      {error && (
        <div className="max-w-screen-xl mx-auto px-6 pt-4" role="alert">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#FEE2E2] border-2 border-[#09090B] shadow-[3px_3px_0_#09090B] rounded-xl animate-slide-down">
            <AlertCircle className="h-4 w-4 text-[#DC2626] flex-shrink-0" />
            <span className="font-sans flex-1 text-[0.8125rem] font-bold text-[#DC2626]">{error}</span>
            <button onClick={clearError} className="text-[#DC2626]/60 p-0.5 rounded" aria-label="Dismiss">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-screen-xl mx-auto px-6 py-8">

        {/* ── HOME ───────────────────────────────────────────── */}
        {tab === "home" && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

            {/* Left col: streak hero + actions */}
            <div className="flex flex-col gap-4">

              {isNewUser ? (
                <div className="rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] overflow-hidden bg-gradient-to-br from-[#EDE9FE] via-[#DDD6FE] to-[#DBEAFE]">
                  <div className="px-6 pt-8 pb-7 flex flex-col items-center gap-4 text-center">
                    <div className="animate-float">
                      <Image src="/kibo.png" alt="Kibo" width={88} height={88} className="drop-shadow-lg" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-[1.625rem] tracking-[-0.025em] text-[#09090B]">Welcome to Kibo!</p>
                      <p className="font-sans text-[0.875rem] text-[#09090B]/55 font-medium mt-1.5 leading-relaxed">
                        Deposit 0.01 cUSD to start your<br />savings streak. Earn every 7 days.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] overflow-hidden">
                  {/* Ring area */}
                  <div className="bg-gradient-to-br from-[#6D28D9] via-[#5B21B6] to-[#1D4ED8] px-6 pt-8 pb-6 flex flex-col items-center gap-3">
                    {isLoading ? (
                      <div className="w-[220px] h-[220px] rounded-full skeleton" />
                    ) : (
                      <StreakRing streak={streak} size={220} />
                    )}
                    <p className="font-sans text-[0.9375rem] font-bold text-white/90 text-center">
                      {isLoading ? " " : streak % 7 === 0 && streak > 0
                        ? "Milestone reached!"
                        : `${7 - (streak % 7)} day${7 - (streak % 7) !== 1 ? "s" : ""} to next milestone`}
                    </p>
                    {canClaim && <Badge variant="milestone">Reward ready!</Badge>}
                  </div>
                  {/* Colored stat bar */}
                  <div className="grid grid-cols-3 border-t-[2px] border-[#09090B]">
                    {[
                      { label: "Best",    value: `${longestStreak}d`,                 bg: "bg-[#EDE9FE]", tc: "text-[#6D28D9]" },
                      { label: "Shields", value: shields > 0 ? `${shields}/3` : "—", bg: "bg-[#DBEAFE]", tc: "text-[#1D4ED8]" },
                      { label: "Saved",   value: `${savedAmount.toFixed(2)}`,         bg: "bg-[#DCFCE7]", tc: "text-[#15803D]" },
                    ].map(({ label, value, bg, tc }, i) => (
                      <div key={label} className={cn(
                        "flex flex-col items-center py-4 gap-0.5",
                        bg,
                        i > 0 && "border-l-2 border-[#09090B]"
                      )}>
                        <span className={cn("font-display font-bold text-[1.375rem] tracking-[-0.03em] tabular-nums leading-none", tc)}>
                          {value}
                        </span>
                        <span className="font-sans text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-[#09090B]/50 mt-0.5">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Streak recovery */}
              {!isLoading && brokenStreak > 0 && streak === 0 && (
                <div className="rounded-2xl border-[3px] border-[#F59E0B] shadow-[4px_4px_0_#F59E0B] bg-[#FFFBEB] overflow-hidden">
                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <HeartCrack className="w-6 h-6 text-[#DC2626] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-display font-bold text-[1.125rem] text-[#09090B]">Streak broken</p>
                        <p className="font-sans text-[0.8125rem] text-[#09090B]/55 mt-0.5">
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
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                {canClaim && (
                  <Button variant="success" onClick={claimReward} disabled={isTxLoading}>
                    <Gift className="w-4 h-4" />
                    Claim milestone reward
                  </Button>
                )}
                {/* Deposit amount + button */}
                <div className="rounded-2xl border-2 border-[#09090B] shadow-[3px_3px_0_#09090B] overflow-hidden bg-white">
                  <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                    <span className="font-sans text-[0.6875rem] font-bold text-[#09090B]/50 uppercase tracking-[0.1em]">Amount</span>
                    <span className="ml-auto font-sans text-[0.6875rem] font-medium text-[#09090B]/35">0.01 – 1 cUSD</span>
                  </div>
                  <div className="flex gap-2 px-3 pb-3">
                    <Input
                      type="number" min="0.01" max="1" step="0.01"
                      value={depositInput}
                      onChange={(e) => setDepositInput(e.target.value)}
                      className="font-sans font-bold text-[1rem] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      disabled={!canDeposit || isTxLoading}
                    />
                    <Button
                      className="px-4 flex-shrink-0"
                      onClick={() => {
                        const v = parseFloat(depositInput);
                        if (!v || v < 0.01 || v > 1) return;
                        deposit(parseUnits(String(v), 18), refParam);
                      }}
                      disabled={!canDeposit || isTxLoading || !depositInput || parseFloat(depositInput) < 0.01 || parseFloat(depositInput) > 1}
                    >
                      <Coins className="w-4 h-4" />
                      {isTxLoading ? "Processing…" : "Deposit"}
                    </Button>
                  </div>
                </div>
                {!canDeposit && countdown && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-sans text-[0.8125rem] font-medium text-[#09090B]/45">Next deposit in</span>
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
            </div>

            {/* Right col: dashboard cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">

              {/* Overview - full width */}
              <div className="md:col-span-2">
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
                          <span className="font-black text-[#6D28D9] tabular-nums">{savedAmount.toFixed(3)} <span className="font-sans font-semibold text-[#09090B]/40 text-[0.8125rem]">cUSD</span></span>
                        </CardRow>
                        <CardRow>
                          <div className="flex items-center gap-3">
                            <RowIcon bg="bg-[#FEF9C3]"><Trophy className="w-4 h-4 text-[#CA8A04]" /></RowIcon>
                            <span className="font-semibold">Best streak</span>
                          </div>
                          <span className="font-black tabular-nums">{longestStreak} <span className="font-sans font-semibold text-[#09090B]/40 text-[0.8125rem]">days</span></span>
                        </CardRow>
                        <CardRow>
                          <div className="flex items-center gap-3">
                            <RowIcon bg="bg-[#DCFCE7]"><DollarSign className="w-4 h-4 text-[#15803D]" /></RowIcon>
                            <span className="font-semibold">cUSD balance</span>
                          </div>
                          <span className="font-sans font-semibold text-[#09090B]/50 tabular-nums">{balanceAmount}</span>
                        </CardRow>
                        <CardRow>
                          <div className="flex items-center gap-3">
                            <RowIcon bg="bg-[#DBEAFE]"><Shield className="w-4 h-4 text-[#1D4ED8]" /></RowIcon>
                            <span className="font-semibold">Shields</span>
                          </div>
                          <span className="font-black">
                            {shields > 0 ? `${shields}/3` : "—"}
                            {shields > 0 && <span className="font-sans text-[0.8125rem] font-semibold text-[#09090B]/35 ml-1">active</span>}
                          </span>
                        </CardRow>
                        <CardRow>
                          <div className="flex items-center gap-3">
                            <RowIcon bg={badge > 0 ? BADGE_BG[badge] : "bg-[#F3F4F6]"}>
                              {badge > 0 && BADGE_ICON[badge] ? (
                                (() => { const Icon = BADGE_ICON[badge]!; return <Icon className="w-4 h-4 text-[#6D28D9]" />; })()
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
                              +{parseFloat(formatUnits(rewardsClaimed, 18)).toFixed(4)} <span className="font-sans font-semibold text-[#09090B]/40 text-[0.8125rem]">cUSD</span>
                            </span>
                          </CardRow>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Progress */}
              <div>
                <SectionLabel color="#1D4ED8">Progress</SectionLabel>
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
              <div>
                <SectionLabel color="#15803D">Savings Goal</SectionLabel>
                <Card>
                  <CardContent>
                    {savingsGoal > BigInt(0) ? (
                      <div className="px-5 py-4 border-b-2 border-[#09090B] flex flex-col gap-3">
                        <div className="flex justify-between text-[0.75rem]">
                          <span className="font-black text-[#6D28D9]">{parseFloat(formatUnits(totalDeposited, 18)).toFixed(3)} cUSD</span>
                          <span className="font-sans font-semibold text-[#09090B]/45">Goal: {parseFloat(formatUnits(savingsGoal, 18)).toFixed(2)} cUSD</span>
                        </div>
                        <Progress value={goalPct} />
                        <p className="font-sans text-[0.6875rem] font-bold text-[#6D28D9] text-right">{goalPct}% complete</p>
                      </div>
                    ) : (
                      <p className="font-sans px-5 py-4 text-[0.8125rem] font-medium text-[#09090B]/35 border-b-2 border-[#09090B]">
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
              <div>
                <SectionLabel color="#CA8A04">Referral</SectionLabel>
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
                      <p className="font-sans text-[0.75rem] font-medium text-[#09090B]/45 mb-3">
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
              <div>
                <SectionLabel color="#DC2626">Sponsor a Friend</SectionLabel>
                <Card>
                  <CardContent>
                    <p className="font-sans px-5 pt-4 pb-3 text-[0.8125rem] font-medium text-[#09090B]/50 leading-relaxed border-b-2 border-[#09090B]">
                      Pay 0.01 cUSD on behalf of another address — boosts their streak without them spending anything.
                    </p>
                    <div className="px-5 py-4 flex flex-col gap-3">
                      <Input placeholder="0x… wallet address" value={sponsorAddr}
                        onChange={(e) => setSponsorAddr(e.target.value)}
                        error={!!(sponsorAddr && !sponsorAddrValid)} spellCheck={false} className="font-mono text-sm" />
                      {sponsorAddr && !sponsorAddrValid && (
                        <p className="font-sans text-[0.75rem] font-bold text-[#DC2626]">Invalid address</p>
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

            </div>
          </div>
        )}

        {/* ── LEADERBOARD ─────────────────────────────────────── */}
        {tab === "leaderboard" && (
          <div className="max-w-2xl mx-auto">
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
                          {RankIcon ? <RankIcon className="w-5 h-5" /> : <span className="text-[0.875rem] font-black text-[#09090B]/35">#{i + 1}</span>}
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] flex items-center justify-center text-[0.6875rem] font-black text-[#6D28D9] flex-shrink-0">
                          {addr.slice(2, 4).toUpperCase()}
                        </div>
                        <span className="font-sans flex-1 text-[0.875rem] font-semibold tabular-nums truncate min-w-0 text-[#09090B]/60">
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
              <div className="flex flex-col items-center py-20 gap-4">
                <Mountain className="w-16 h-16 text-[#09090B]/15" />
                <p className="font-sans text-center text-[#09090B]/35 font-semibold text-sm">
                  No deposits yet.<br />Be the first to reach the summit.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ────────────────────────────────────────── */}
        {tab === "settings" && (
          <div className="max-w-3xl mx-auto flex flex-col gap-6">

            {/* Vibrant info card */}
            <div className="rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] overflow-hidden bg-[#7C3AED] relative">
              <div aria-hidden className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
              <div aria-hidden className="absolute -bottom-8 right-12 w-20 h-20 rounded-full bg-white/10" />
              <div className="flex items-center gap-5 px-6 py-6 relative z-10">
                <Image src="/kibo.png" alt="Kibo" width={64} height={64} className="flex-shrink-0 drop-shadow-lg" />
                <div>
                  <p className="font-display font-bold text-white text-[1.5rem] tracking-[-0.02em]">Kibo</p>
                  <p className="font-sans text-[0.875rem] text-white/70 font-medium leading-relaxed mt-0.5">
                    Save 0.01–1 cUSD daily on Celo.<br />Build habits. Earn rewards every 7 days.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* How it works — colorful 2×3 mini cards */}
              <div>
                <SectionLabel>How it works</SectionLabel>
                <div className="rounded-2xl border-2 border-[#09090B] shadow-[4px_4px_0_#09090B] overflow-hidden bg-white p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { bg: "bg-[#DBEAFE]", border: "border-[#1D4ED8]", Icon: Calendar,  color: "text-[#1D4ED8]", label: "Daily deposit", val: "0.001–1 cUSD" },
                      { bg: "bg-[#FEF9C3]", border: "border-[#CA8A04]", Icon: Clock,      color: "text-[#CA8A04]", label: "Cooldown",      val: "20 hours" },
                      { bg: "bg-[#DCFCE7]", border: "border-[#15803D]", Icon: Shield,     color: "text-[#15803D]", label: "Shields",       val: "Skip 1 day" },
                      { bg: "bg-[#F5F3FF]", border: "border-[#6D28D9]", Icon: Users,      color: "text-[#6D28D9]", label: "Referral",      val: "5% of deposit" },
                      { bg: "bg-[#FEE2E2]", border: "border-[#DC2626]", Icon: HeartCrack, color: "text-[#DC2626]", label: "Recovery fee",  val: "streak × 0.01" },
                      { bg: "bg-[#FEF9C3]", border: "border-[#CA8A04]", Icon: Trophy,     color: "text-[#CA8A04]", label: "Milestones",    val: "Every 7 days" },
                    ].map(({ bg, border, Icon, color, label, val }) => (
                      <div key={label} className={cn("rounded-xl border-2 p-3 shadow-[2px_2px_0_#09090B]", bg, border)}>
                        <Icon className={cn("w-4 h-4 mb-1.5", color)} />
                        <p className="font-sans font-black text-[0.875rem] text-[#09090B] leading-tight">{val}</p>
                        <p className="font-sans text-[0.625rem] font-medium text-[#09090B]/50 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reward Tiers + Badges stacked */}
              <div className="flex flex-col gap-4">
                <div>
                  <SectionLabel color="#CA8A04">Reward Tiers</SectionLabel>
                  <div className="rounded-2xl border-2 border-[#09090B] shadow-[4px_4px_0_#09090B] overflow-hidden bg-white p-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { bg: "bg-[#DCFCE7]", border: "border-[#15803D]", Icon: Award,  color: "text-[#CA8A04]", day: "Day 7",   val: "+0.005" },
                        { bg: "bg-[#DBEAFE]", border: "border-[#1D4ED8]", Icon: Medal,  color: "text-[#9CA3AF]", day: "Day 14+", val: "+0.012" },
                        { bg: "bg-[#FEF9C3]", border: "border-[#CA8A04]", Icon: Trophy, color: "text-[#CA8A04]", day: "Day 35+", val: "+0.025" },
                      ].map(({ bg, border, Icon, color, day, val }) => (
                        <div key={day} className={cn("rounded-xl border-2 p-3 text-center shadow-[2px_2px_0_#09090B]", bg, border)}>
                          <Icon className={cn("w-4 h-4 mx-auto mb-1.5", color)} />
                          <p className="font-sans font-black text-[0.875rem] text-[#15803D] leading-tight">{val}</p>
                          <p className="font-sans text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-[#09090B]/50 mt-0.5">{day}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <SectionLabel color="#6D28D9">Badges</SectionLabel>
                  <div className="rounded-2xl border-2 border-[#09090B] shadow-[4px_4px_0_#09090B] overflow-hidden bg-white p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { Icon: Award,  color: "text-[#CA8A04]", bg: "bg-[#FDE68A]", border: "border-[#CA8A04]", label: "Bronze",  days: "30 days"  },
                        { Icon: Medal,  color: "text-[#9CA3AF]", bg: "bg-[#E5E7EB]", border: "border-[#6B7280]", label: "Silver",  days: "90 days"  },
                        { Icon: Trophy, color: "text-[#CA8A04]", bg: "bg-[#FDE68A]", border: "border-[#CA8A04]", label: "Gold",    days: "180 days" },
                        { Icon: Star,   color: "text-[#60A5FA]", bg: "bg-[#BAE6FD]", border: "border-[#1D4ED8]", label: "Diamond", days: "365 days" },
                      ].map(({ Icon, color, bg, border, label, days }) => (
                        <div key={label} className={cn("rounded-xl border-2 p-3 shadow-[2px_2px_0_#09090B] flex items-center gap-2.5", bg, border)}>
                          <div className="w-8 h-8 rounded-lg bg-white/60 border border-[#09090B]/20 flex items-center justify-center flex-shrink-0">
                            <Icon className={cn("w-4 h-4", color)} />
                          </div>
                          <div>
                            <p className="font-sans font-black text-[0.875rem] text-[#09090B] leading-tight">{label}</p>
                            <p className="font-sans text-[0.625rem] font-medium text-[#09090B]/55 leading-tight">{days}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract — full width */}
              <div className="md:col-span-2">
                <SectionLabel color="#6B7280">Contract</SectionLabel>
                <Card>
                  <CardContent>
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-sans text-[0.75rem] font-bold text-[#09090B]/50">Celo Mainnet</span>
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
          </div>
        )}

      </main>
    </div>
  );
}
