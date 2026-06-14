/* Hallmark · macrostructure: Letter · tone: neobrutalist-editorial · anchor hue: purple
 * display: Space Grotesk · accent-italic: Cormorant Garamond · body: DM Sans
 * pre-emit critique: P5 H5 E5 S5 R4 V5
 */
"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useKibo } from "../hooks/useKibo";
import { useToast } from "../hooks/useToast";
import { formatUnits, parseUnits } from "viem";
import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardRow } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LottieIcon } from "@/components/ui/lottie-icon";
import {
  Copy, Check, Wallet,
  Coins, Gift, HeartCrack, Zap, Trophy, Shield,
  Sparkles, Calendar, Target, DollarSign, Users,
  Award, Clock, Flame, Link, Mountain, Star, Medal,
  Home as HomeIcon, BarChart2, Settings, Globe, Share2, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

function fmtAmt(v: bigint, maxDp = 5): string {
  const n = parseFloat(formatUnits(v, 18));
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: maxDp });
}

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
      <p className="font-sans font-black text-[1rem] tracking-[-0.025em] text-[#09090B]">
        {children}
      </p>
    </div>
  );
}

function StreakCalendar({
  depositHistory,
}: {
  depositHistory: Array<{ streak: number; timestamp: number; txHash: `0x${string}` }>;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const depositDays = new Set(
    depositHistory.map((d) => {
      const date = new Date(d.timestamp * 1000);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return d;
  });

  const weekLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="px-5 py-4 flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1 mb-0.5">
        {weekLabels.map((l, i) => (
          <span key={i} className="text-center font-sans text-[0.5625rem] font-bold uppercase text-[#09090B]/25">
            {l}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {/* offset so first day lands on correct weekday */}
        {Array.from({ length: days[0].getDay() }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const isToday = day.getTime() === today.getTime();
          const has = depositDays.has(day.getTime());
          return (
            <div
              key={day.getTime()}
              title={day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              className={cn(
                "aspect-square rounded-[4px] transition-colors",
                has
                  ? "bg-[#7C3AED] border-2 border-[#5B21B6]"
                  : isToday
                  ? "bg-white border-2 border-[#FFE500]"
                  : "bg-[#F3F4F6] border border-[#E5E7EB]"
              )}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-[3px] bg-[#7C3AED]" />
          <span className="font-sans text-[0.625rem] text-[#09090B]/40 font-medium">Deposited</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-[3px] bg-white border-2 border-[#FFE500]" />
          <span className="font-sans text-[0.625rem] text-[#09090B]/40 font-medium">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-[3px] bg-[#F3F4F6] border border-[#E5E7EB]" />
          <span className="font-sans text-[0.625rem] text-[#09090B]/40 font-medium">Missed</span>
        </div>
      </div>
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
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [refParam, setRefParam] = useState<`0x${string}`>("0x0000000000000000000000000000000000000000");
  const [copied, setCopied] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [depositInput, setDepositInput] = useState("");
  const [sponsorAddr, setSponsorAddr] = useState("");
  const sponsorAddrValid =
    /^0x[0-9a-fA-F]{40}$/.test(sponsorAddr) &&
    sponsorAddr.toLowerCase() !== address?.toLowerCase();
  const { toasts, addToast, removeToast } = useToast();
  const prevCanClaim = useRef(false);
  const prevTxConfirmed = useRef(false);

  const isMiniPay = typeof window !== "undefined" && !!(window.ethereum as Record<string, unknown> | undefined)?.isMiniPay;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("ref");
    if (r && /^0x[0-9a-fA-F]{40}$/.test(r)) setRefParam(r as `0x${string}`);
  }, []);

  // Auto-connect when running inside MiniPay
  useEffect(() => {
    if (isMiniPay && !isConnected) {
      connect({ connector: injected() });
    }
  }, [isMiniPay, isConnected]);

  const {
    streak, longestStreak, totalDeposited, canDeposit, canClaim, nextDepositIn,
    cUSDBalance, shields, badge, brokenStreak, rewardsClaimed, leaderboard,
    isTxLoading, isLoading, error, clearError, deposit, claimReward, withdraw,
    recoverStreak, pendingReferralReward, referrer, claimReferralReward,
    savingsGoal, setGoal, depositFor, poolBalance, totalDepositors, depositHistory,
    txConfirmed, referralCount, totalReferralEarned,
  } = useKibo();

  // Toast on error
  useEffect(() => {
    if (error) { addToast(error, "error"); clearError(); }
  }, [error]);

  // Toast + confetti on tx success
  useEffect(() => {
    if (txConfirmed && !prevTxConfirmed.current) {
      addToast("Transaction confirmed!", "success");
    }
    prevTxConfirmed.current = !!txConfirmed;
  }, [txConfirmed]);

  // Confetti when milestone unlocked
  useEffect(() => {
    if (canClaim && !prevCanClaim.current) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ["#7C3AED", "#FFE500", "#22C55E", "#3B82F6"] });
    }
    prevCanClaim.current = canClaim;
  }, [canClaim]);

  const countdown     = formatCountdown(nextDepositIn);
  const savedAmount   = parseFloat(formatUnits(totalDeposited, 18));
  const balanceAmount = cUSDBalance ? fmtAmt(cUSDBalance) : "—";
  const goalPct       = savingsGoal > BigInt(0)
    ? Math.min(100, Number((totalDeposited * BigInt(100)) / savingsGoal))
    : 0;

  /* ── SSR guard ────────────────────────────────────────────── */
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-[#7C3AED] border-t-transparent animate-spin" />
      </div>
    );
  }

  /* ── CONNECT PAGE ─────────────────────────────────────────── */
  if (!isConnected) {
    return (
      <div className="min-h-screen overflow-x-clip flex flex-col bg-[#FAFAF8]">
        <AccentStripe height={8} />

        {/* Nav */}
        <header className="border-b-2 border-[#09090B] bg-white sticky top-0 z-20">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between px-6 h-[68px]">
            <div className="flex items-center gap-2.5">
              <Image src="/kibo.png" width={38} height={38} alt="Kibo"
                className="rounded-[10px] border-2 border-[#09090B] shadow-[2px_2px_0_#09090B]" />
              <span className="font-display font-bold text-[2rem] tracking-[-0.02em] text-[#09090B]">Kibo</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline font-sans text-[0.75rem] font-semibold text-[#09090B]/35 uppercase tracking-[0.12em]">
                Non-custodial · Open source
              </span>
              <div className="flex items-center gap-1.5 bg-[#DCFCE7] border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="font-sans text-[0.6875rem] font-black uppercase tracking-[0.1em] text-[#15803D]">
                  Live · Celo
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section
          className="relative overflow-hidden flex-1"
          style={{
            background: "#F7F5FF",
            backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.07) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        >
          {/* Decorative giant letterform */}
          <div
            aria-hidden
            className="absolute right-[-2%] top-[-5%] select-none pointer-events-none leading-none"
            style={{ fontSize: "min(60vw, 560px)", opacity: 0.04, fontFamily: "var(--font-cormorant)", fontWeight: 700, color: "#7C3AED", lineHeight: 1 }}
          >K</div>

          <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-10 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">

            {/* Left: typographic hero */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#EDE9FE] border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] rounded-full px-4 py-1.5 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                <span className="font-sans text-[0.6875rem] font-black uppercase tracking-[0.16em] text-[#6D28D9]">
                  DeFi Savings · Celo Network
                </span>
              </div>

              <h1
                className="font-display font-bold text-[#09090B] leading-[0.92] tracking-[-0.02em] [overflow-wrap:anywhere] min-w-0"
                style={{ fontSize: "clamp(3.25rem, 8.5vw, 7.5rem)" }}
              >
                Daily<br />Savings<br />
                <span style={{
                  textDecoration: "underline",
                  textDecorationColor: "#FFE500",
                  textDecorationThickness: "10px",
                  textUnderlineOffset: "6px",
                }}>Streak.</span>
              </h1>

              <p
                className="font-serif italic font-semibold text-[#7C3AED] leading-tight mt-6"
                style={{ fontSize: "clamp(1.5rem, 4vw, 3.25rem)" }}
              >
                On Celo.
              </p>

              <p className="font-sans text-[1.0625rem] font-medium text-[#09090B]/50 leading-[1.7] mt-6 max-w-[36ch]">
                Save 0.01–1 cUSD daily. Build a streak.<br />
                Earn rewards every 7 days on Celo mainnet.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <button
                  onClick={() => connect({ connector: injected() })}
                  className="h-[66px] px-10 bg-[#FFE500] text-[#09090B] font-black text-[1.1875rem] rounded-2xl border-[3px] border-[#09090B] shadow-[6px_6px_0_#09090B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_#09090B] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all duration-75 flex items-center gap-2.5 flex-shrink-0"
                >
                  <Wallet className="w-5 h-5" />
                  {isMiniPay ? "Open in MiniPay" : "Connect Wallet"}
                </button>
                {isMiniPay ? (
                  <div className="flex items-center gap-2 bg-[#DCFCE7] border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] rounded-full px-3 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                    <span className="font-sans text-[0.6875rem] font-black uppercase tracking-[0.1em] text-[#15803D]">MiniPay detected</span>
                  </div>
                ) : (
                  <p className="font-sans text-[0.8125rem] font-medium text-[#09090B]/35 leading-relaxed">
                    Works with MiniPay<br className="hidden sm:block" /> or any injected wallet
                  </p>
                )}
              </div>
            </div>

            {/* Right: mascot + floating chips + stat cards */}
            <div className="flex flex-col items-center lg:items-end gap-6">
              {/* Mascot with floating token chips */}
              <div className="relative">
                {/* cUSD chip */}
                <div className="absolute -top-5 -left-8 z-10 animate-float-sm">
                  <div className="bg-white border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] rounded-full px-3 py-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                    <span className="font-display font-black text-[0.75rem] text-[#09090B]">cUSD</span>
                  </div>
                </div>
                {/* Streak chip */}
                <div className="absolute -top-3 -right-8 z-10 animate-float-sm" style={{ animationDelay: "0.65s" }}>
                  <div className="bg-[#EDE9FE] border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span className="font-display font-black text-[0.75rem] text-[#7C3AED]">Streak</span>
                  </div>
                </div>
                {/* Celo chip */}
                <div className="absolute -bottom-4 -right-6 z-10 animate-float" style={{ animationDelay: "1.2s" }}>
                  <div className="bg-[#FFE500] border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] rounded-full px-3 py-1.5">
                    <span className="font-display font-black text-[0.75rem] text-[#09090B]">Celo ↗</span>
                  </div>
                </div>

                <div className="animate-float">
                  <div className="bg-[#FFE500] rounded-3xl p-5 inline-flex border-[3px] border-[#09090B] shadow-[10px_10px_0_#09090B]">
                    <Image src="/kibo.png" alt="Kibo" width={150} height={150} className="object-cover block" priority />
                  </div>
                </div>
              </div>

              {/* Stat cards — staggered float */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-[360px]">
                {[
                  { val: "0.01 cUSD", sub: "daily minimum", bg: "bg-[#FFFBEB]", tc: "text-[#CA8A04]" },
                  { val: "7 days",    sub: "per cycle",      bg: "bg-[#EDE9FE]", tc: "text-[#7C3AED]" },
                  { val: "20 hours",  sub: "cooldown",        bg: "bg-[#DBEAFE]", tc: "text-[#1D4ED8]" },
                  { val: "3 shields", sub: "protection",      bg: "bg-[#DCFCE7]", tc: "text-[#15803D]" },
                ].map(({ val, sub, bg, tc }, i) => (
                  <div key={sub}
                    className={cn("rounded-xl border-2 border-[#09090B] shadow-[3px_3px_0_#09090B] p-4 animate-float-sm", bg)}
                    style={{ animationDelay: `${i * 0.28}s` }}
                  >
                    <p className={cn("font-display font-bold text-[1.5rem] leading-none tracking-[-0.02em]", tc)}>{val}</p>
                    <p className="font-sans text-[0.75rem] font-medium text-[#09090B]/45 mt-2">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t-2 border-[#09090B] bg-white">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-14">
            <div className="flex items-center gap-4 mb-10">
              <p className="font-sans font-black text-[0.75rem] uppercase tracking-[0.22em] text-[#09090B]/30 flex-shrink-0">How it works</p>
              <div className="flex-1 h-[1.5px] bg-[#09090B]/10" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              {[
                { num: "01", heading: "Connect & deposit", body: "Deposit 0.01–1 cUSD daily. 20-hour cooldown between deposits keeps it intentional.", color: "#7C3AED" },
                { num: "02", heading: "Build your streak",  body: "Every day you deposit extends your streak. Miss a day? Use a shield to protect it safely.", color: "#3B82F6" },
                { num: "03", heading: "Claim rewards",      body: "Reach 7-day milestones to claim cUSD rewards. Longer streaks earn bigger bonuses.", color: "#22C55E" },
              ].map(({ num, heading, body, color }) => (
                <div key={num} className="flex flex-col gap-3">
                  <div className="flex items-end gap-3 mb-1">
                    <span
                      className="font-display font-bold tabular-nums flex-shrink-0"
                      style={{ fontSize: "5.5rem", lineHeight: 1, color: `${color}20` }}
                    >{num}</span>
                    <div className="mb-3 flex-1 h-[2px]" style={{ background: `${color}30` }} />
                  </div>
                  <p className="font-display font-bold text-[1.5rem] tracking-[-0.02em] text-[#09090B]">{heading}</p>
                  <p className="font-sans text-[1rem] font-medium text-[#09090B]/45 leading-[1.65]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t-2 border-[#09090B] bg-[#F7F5FF]">
          <div className="max-w-screen-xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/kibo.png" width={26} height={26} alt="" className="rounded-md opacity-35" />
              <span className="font-display font-bold text-[#09090B]/30 text-[1.25rem] tracking-[-0.02em]">Kibo</span>
            </div>
            <div className="flex items-center gap-5">
              {["Non-custodial", "Open source", "Celo Mainnet"].map((item, i) => (
                <div key={item} className="flex items-center gap-5">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-[#09090B]/15" />}
                  <span className="font-sans text-[0.6875rem] font-bold text-[#09090B]/30 uppercase tracking-[0.12em]">{item}</span>
                </div>
              ))}
            </div>
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
      <AccentStripe height={6} />

      {/* Top nav */}
      <nav className="sticky top-0 z-[100] bg-white border-b-2 border-[#09090B]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-6 h-[60px]">

          {/* Logo + nav tabs */}
          <div className="flex items-center gap-6 lg:gap-8">
            <div className="flex items-center gap-2">
              <Image src="/kibo.png" alt="Kibo" width={30} height={30}
                className="rounded-lg border-2 border-[#09090B] shadow-[1.5px_1.5px_0_#09090B] flex-shrink-0" />
              <span className="font-display font-bold text-[1.75rem] tracking-[-0.02em] text-[#09090B]">Kibo</span>
            </div>

            <div className="flex items-center gap-0.5" role="tablist">
              {TABS.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl font-sans font-semibold text-[0.9375rem] transition-all duration-100",
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

      <Toaster toasts={toasts} onRemove={removeToast} />

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
                      { label: "Saved",   value: fmtAmt(totalDeposited),              bg: "bg-[#DCFCE7]", tc: "text-[#15803D]" },
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
                <div className="rounded-2xl border-[3px] border-[#09090B] shadow-[4px_4px_0_#09090B] overflow-hidden bg-white">
                  {/* Purple header */}
                  <div className="px-4 py-3 bg-[#7C3AED]">
                    <span className="font-sans font-black text-[0.75rem] uppercase tracking-[0.12em] text-white">Deposit Amount</span>
                  </div>
                  {/* Big amount input */}
                  <div className="px-4 pt-4 pb-3 flex items-baseline gap-2 border-b-2 border-[#09090B]">
                    <Input
                      type="number" min="0" step="any"
                      value={depositInput}
                      onChange={(e) => setDepositInput(e.target.value)}
                      placeholder="0.00"
                      className="font-display font-bold tracking-[-0.04em] border-0 shadow-none p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ fontSize: "2.25rem", lineHeight: 1 }}
                      disabled={!canDeposit || isTxLoading}
                    />
                    <span className="font-sans text-[0.875rem] font-black text-[#09090B]/30 uppercase tracking-[0.1em] flex-shrink-0">cUSD</span>
                  </div>
                  {/* Quick amounts */}
                  <div className="flex gap-2 px-4 pt-3 pb-2">
                    {["0.1", "0.5", "1", "5"].map((v) => (
                      <button key={v}
                        onClick={() => setDepositInput(v)}
                        className={cn(
                          "flex-1 py-2 rounded-xl border-[1.5px] border-[#09090B] font-sans font-black text-[0.8125rem] transition-all",
                          depositInput === v
                            ? "bg-[#09090B] text-white"
                            : "bg-[#F3F4F6] text-[#09090B] shadow-[1.5px_1.5px_0_#09090B] hover:bg-[#E5E7EB]"
                        )}
                      >{v}</button>
                    ))}
                  </div>
                  {/* Deposit button */}
                  <div className="px-4 py-4">
                    <Button
                      className="w-full h-[52px] text-[1rem]"
                      onClick={() => {
                        const v = parseFloat(depositInput);
                        if (!v || v <= 0) return;
                        if (v < 0.01 || v > 1) {
                          addToast("Amount must be 0.01–1 cUSD", "error");
                          return;
                        }
                        // Self-referral: silently drop ref (hook also guards)
                        const effectiveRef: `0x${string}` =
                          refParam.toLowerCase() === address?.toLowerCase()
                            ? "0x0000000000000000000000000000000000000000"
                            : refParam;
                        deposit(parseUnits(String(v), 18), effectiveRef);
                      }}
                      disabled={!canDeposit || isTxLoading || !depositInput || parseFloat(depositInput) <= 0}
                    >
                      <Coins className="w-4 h-4" />
                      {isTxLoading ? "Processing…" : `Deposit ${depositInput || "0"} cUSD`}
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

              {/* Stats snapshot - full width */}
              <div className="md:col-span-2">
                <div className="rounded-2xl border-[3px] border-[#09090B] shadow-[5px_5px_0_#09090B] overflow-hidden">
                  <div className="grid grid-cols-2">
                    {/* My Balance */}
                    <div className="flex flex-col gap-1 px-5 py-4 bg-[#DCFCE7] border-b-2 border-r-2 border-[#09090B]">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#15803D]" />
                        <span className="font-sans text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[#09090B]/50">My Balance</span>
                      </div>
                      <span className="font-display font-black text-[1.375rem] tracking-[-0.03em] tabular-nums leading-none text-[#15803D]">
                        {balanceAmount}
                        <span className="font-sans font-semibold text-[0.6875rem] text-[#09090B]/40 ml-1">cUSD</span>
                      </span>
                    </div>
                    {/* My Savings */}
                    <div className="flex flex-col gap-1 px-5 py-4 bg-[#EDE9FE] border-b-2 border-[#09090B]">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-[#6D28D9]" />
                        <span className="font-sans text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[#09090B]/50">My Savings</span>
                      </div>
                      <span className="font-display font-black text-[1.375rem] tracking-[-0.03em] tabular-nums leading-none text-[#6D28D9]">
                        {fmtAmt(totalDeposited)}
                        <span className="font-sans font-semibold text-[0.6875rem] text-[#09090B]/40 ml-1">cUSD</span>
                      </span>
                    </div>
                    {/* Global Pool */}
                    <div className="flex flex-col gap-1 px-5 py-4 bg-[#DBEAFE] border-r-2 border-[#09090B]">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        <span className="font-sans text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[#09090B]/50">Global Pool</span>
                      </div>
                      <span className="font-display font-black text-[1.375rem] tracking-[-0.03em] tabular-nums leading-none text-[#1D4ED8]">
                        {poolBalance ? fmtAmt(poolBalance) : "—"}
                        <span className="font-sans font-semibold text-[0.6875rem] text-[#09090B]/40 ml-1">cUSD</span>
                      </span>
                    </div>
                    {/* Total Savers */}
                    <div className="flex flex-col gap-1 px-5 py-4 bg-[#FEF9C3]">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#CA8A04]" />
                        <span className="font-sans text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[#09090B]/50">Total Savers</span>
                      </div>
                      <span className="font-display font-black text-[1.375rem] tracking-[-0.03em] tabular-nums leading-none text-[#CA8A04]">
                        {totalDepositors || "—"}
                        <span className="font-sans font-semibold text-[0.6875rem] text-[#09090B]/40 ml-1">wallets</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

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
                          <span className="font-black text-[#6D28D9] tabular-nums">{fmtAmt(totalDeposited)} <span className="font-sans font-semibold text-[#09090B]/40 text-[0.8125rem]">cUSD</span></span>
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
                        {rewardsClaimed > BigInt(0) && (
                          <CardRow>
                            <div className="flex items-center gap-3">
                              <RowIcon bg="bg-[#DCFCE7]"><Gift className="w-4 h-4 text-[#15803D]" /></RowIcon>
                              <span className="font-semibold">Rewards earned</span>
                            </div>
                            <span className="font-black text-[#15803D] tabular-nums">
                              +{fmtAmt(rewardsClaimed)} <span className="font-sans font-semibold text-[#09090B]/40 text-[0.8125rem]">cUSD</span>
                            </span>
                          </CardRow>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Streak Calendar */}
              {depositHistory.length > 0 && (
                <div className="md:col-span-2">
                  <SectionLabel color="#7C3AED">30-Day Calendar</SectionLabel>
                  <Card>
                    <CardContent>
                      <StreakCalendar depositHistory={depositHistory} />
                    </CardContent>
                  </Card>
                </div>
              )}

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
                          <span className="font-black text-[#6D28D9]">{fmtAmt(totalDeposited)} cUSD</span>
                          <span className="font-sans font-semibold text-[#09090B]/45">Goal: {fmtAmt(savingsGoal)} cUSD</span>
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
                    {referralCount > 0 && (
                      <>
                        <CardRow>
                          <div className="flex items-center gap-3">
                            <RowIcon bg="bg-[#FEF9C3]"><Users className="w-4 h-4 text-[#CA8A04]" /></RowIcon>
                            <span className="font-semibold">Friends referred</span>
                          </div>
                          <span className="font-black text-[#CA8A04] tabular-nums">{referralCount}</span>
                        </CardRow>
                        <CardRow>
                          <div className="flex items-center gap-3">
                            <RowIcon bg="bg-[#DCFCE7]"><Coins className="w-4 h-4 text-[#15803D]" /></RowIcon>
                            <span className="font-semibold">Total earned</span>
                          </div>
                          <span className="font-black text-[#15803D] tabular-nums">{fmtAmt(totalReferralEarned)} <span className="font-sans font-semibold text-[#09090B]/40 text-[0.8125rem]">cUSD</span></span>
                        </CardRow>
                      </>
                    )}
                    {referrer && (
                      <CardRow>
                        <div className="flex items-center gap-3">
                          <RowIcon bg="bg-[#F5F3FF]"><Users className="w-4 h-4 text-[#6D28D9]" /></RowIcon>
                          <span className="font-semibold">Referred by</span>
                        </div>
                        <span className="font-mono text-[0.75rem] text-[#09090B]/45">{referrer.slice(0, 6)}…{referrer.slice(-4)}</span>
                      </CardRow>
                    )}
                    {refParam !== "0x0000000000000000000000000000000000000000" &&
                      refParam.toLowerCase() !== address?.toLowerCase() &&
                      !referrer && (
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
                          <span className="font-black text-[#15803D] tabular-nums">+{fmtAmt(pendingReferralReward)} cUSD</span>
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
                        onClick={() => {
                          if (!address) return;
                          navigator.clipboard.writeText(`${window.location.origin}?ref=${address}`);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
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
                        <p className="font-sans text-[0.75rem] font-bold text-[#DC2626]">
                          {sponsorAddr.toLowerCase() === address?.toLowerCase()
                            ? "Cannot sponsor yourself"
                            : "Invalid address"}
                        </p>
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

              {/* Deposit History */}
              {depositHistory.length > 0 && (
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <SectionLabel color="#7C3AED">Deposit History</SectionLabel>
                    <button
                      onClick={() => {
                        if (!address) return;
                        const origin = window.location.origin;
                        const refUrl = `${origin}?ref=${address}`;
                        const text = `🔥 ${streak}-day savings streak on Kibo!\nSaving on Celo every day → ${refUrl}`;
                        navigator.clipboard.writeText(text);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1.5 text-[0.75rem] font-bold text-[#7C3AED] hover:opacity-70 transition-opacity mb-3"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                      {copied ? "Copied!" : "Share streak"}
                    </button>
                  </div>
                  <Card>
                    <CardContent>
                      {depositHistory.slice(0, 10).map((entry) => (
                        <CardRow key={entry.txHash}>
                          <div className="flex items-center gap-3">
                            <RowIcon bg="bg-[#EDE9FE]">
                              <Flame className="w-4 h-4 text-[#7C3AED]" />
                            </RowIcon>
                            <div>
                              <span className="font-semibold">Day {entry.streak}</span>
                              <span className="font-sans text-[0.75rem] text-[#09090B]/40 ml-2">
                                {new Date(entry.timestamp * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </div>
                          <a
                            href={`https://celoscan.io/tx/${entry.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[0.75rem] font-bold text-[#7C3AED]/60 hover:text-[#7C3AED] transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="font-mono">{entry.txHash.slice(0, 8)}…</span>
                          </a>
                        </CardRow>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── LEADERBOARD ─────────────────────────────────────── */}
        {tab === "leaderboard" && (
          <div className="max-w-2xl mx-auto">
            {/* Ornamental header */}
            <div className="mb-8">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="font-sans font-black text-[0.6875rem] uppercase tracking-[0.2em] text-[#09090B]/30 mb-1">Global Rankings</p>
                  <h2 className="font-display font-bold text-[2.75rem] tracking-[-0.03em] text-[#09090B] leading-none">
                    Top <span className="font-serif italic font-semibold text-[#7C3AED]">Savers</span>
                  </h2>
                </div>
                <Trophy className="w-14 h-14 text-[#CA8A04]/15 flex-shrink-0" />
              </div>
              <div className="h-[3px] rounded-full" style={{ background: "linear-gradient(to right, #FFE500, #7C3AED, transparent)" }} />
            </div>

            {leaderboard && leaderboard[0].length > 0 ? (
              <Card>
                <CardContent>
                  {leaderboard[0].map((addr, i) => {
                    const RankIcon = i === 0 ? Trophy : i === 1 ? Medal : i === 2 ? Award : null;
                    const rankColor = i === 0 ? "text-[#CA8A04]" : i === 1 ? "text-[#6B7280]" : i === 2 ? "text-[#92400E]" : "text-[#09090B]/25";
                    return (
                      <div key={addr} className={cn(
                        "flex items-center gap-4 px-5 py-4 min-h-[72px] border-t-2 border-[#09090B] first:border-t-0",
                        i === 0 && "bg-[#FFFBEB]", i === 1 && "bg-[#F9FAFB]", i === 2 && "bg-[#FFF7ED]"
                      )}>
                        <div className={cn("w-9 flex items-center justify-center flex-shrink-0", rankColor)}>
                          {RankIcon ? <RankIcon className="w-6 h-6" /> : <span className="text-[1rem] font-black text-[#09090B]/25">#{i + 1}</span>}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] flex items-center justify-center text-[0.75rem] font-black text-[#6D28D9] flex-shrink-0">
                          {addr.slice(2, 4).toUpperCase()}
                        </div>
                        <span className="font-sans flex-1 text-[1rem] font-semibold tabular-nums truncate min-w-0 text-[#09090B]/60">
                          {addr.slice(0, 6)}…{addr.slice(-4)}
                        </span>
                        <div className="flex items-center gap-1.5 bg-[#FFE500] rounded-xl border-2 border-[#09090B] shadow-[2px_2px_0_#09090B] px-3 py-1.5 flex-shrink-0">
                          <Flame className="w-4 h-4 text-[#09090B]" />
                          <span className="text-[1rem] font-black text-[#09090B] tabular-nums">{Number(leaderboard[1][i])}</span>
                          <span className="font-sans text-[0.6875rem] font-bold text-[#09090B]/50">days</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center py-24 gap-5 border-2 border-[#09090B] shadow-[4px_4px_0_#09090B] rounded-2xl bg-white">
                <Mountain className="w-16 h-16 text-[#09090B]/12" />
                <div className="text-center">
                  <p className="font-display font-bold text-[1.5rem] text-[#09090B]/25 tracking-[-0.02em]">No savers yet.</p>
                  <p className="font-sans text-[0.9375rem] font-medium text-[#09090B]/30 mt-1">Be the first to reach the summit.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ────────────────────────────────────────── */}
        {tab === "settings" && (
          <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-8">

            {/* Editorial hero header */}
            <div className="relative overflow-hidden rounded-3xl border-[3px] border-[#09090B] shadow-[6px_6px_0_#09090B] bg-[#7C3AED]"
              style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #6D28D9 0%, #7C3AED 60%)" }}>
              <div aria-hidden className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
              <div aria-hidden className="absolute -top-6 right-16 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
              <div aria-hidden className="absolute top-4 -right-4 w-16 h-16 rounded-full bg-[#FFE500]/15 pointer-events-none" />
              <div className="relative z-10 px-7 py-8 flex items-center gap-6">
                <Image src="/kibo.png" alt="Kibo" width={80} height={80} className="flex-shrink-0 drop-shadow-xl" />
                <div>
                  <h2 className="font-display font-bold text-white text-[2.25rem] leading-none tracking-[-0.02em]">Kibo</h2>
                  <p className="font-serif italic text-[#FFE500] text-[1.375rem] leading-none mt-1.5">Daily savings, on Celo.</p>
                  <p className="font-sans text-white/60 text-[0.875rem] font-medium mt-2.5 leading-relaxed">
                    0.01–1 cUSD daily · 7-day streak cycles · Earn rewards
                  </p>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div>
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="font-display font-bold text-[1.75rem] tracking-[-0.025em] text-[#09090B] leading-none">
                  How it <span className="font-serif italic font-semibold text-[#7C3AED]">works</span>
                </h3>
                <div className="flex-1 h-[2px] rounded-full" style={{ background: "linear-gradient(to right, #7C3AED40, transparent)" }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { bg: "bg-[#DBEAFE]", border: "border-[#1D4ED8]", Icon: Calendar,  color: "text-[#1D4ED8]", label: "Daily deposit", val: "0.01–1 cUSD" },
                  { bg: "bg-[#FEF9C3]", border: "border-[#CA8A04]", Icon: Clock,      color: "text-[#CA8A04]", label: "Cooldown",      val: "20 hours" },
                  { bg: "bg-[#DCFCE7]", border: "border-[#15803D]", Icon: Shield,     color: "text-[#15803D]", label: "Shields",       val: "Skip 1 day" },
                  { bg: "bg-[#F5F3FF]", border: "border-[#6D28D9]", Icon: Users,      color: "text-[#6D28D9]", label: "Referral",      val: "5% of deposit" },
                  { bg: "bg-[#FEE2E2]", border: "border-[#DC2626]", Icon: HeartCrack, color: "text-[#DC2626]", label: "Recovery fee",  val: "streak × 0.01" },
                  { bg: "bg-[#FEF9C3]", border: "border-[#CA8A04]", Icon: Trophy,     color: "text-[#CA8A04]", label: "Milestones",    val: "Every 7 days" },
                ].map(({ bg, border, Icon, color, label, val }) => (
                  <div key={label} className={cn("rounded-2xl border-2 p-4 shadow-[3px_3px_0_#09090B]", bg, border)}>
                    <div className={cn("w-8 h-8 rounded-xl border border-[#09090B]/15 bg-white/50 flex items-center justify-center mb-3")}>
                      <Icon className={cn("w-4 h-4", color)} />
                    </div>
                    <p className="font-display font-bold text-[1.125rem] text-[#09090B] leading-tight">{val}</p>
                    <p className="font-sans text-[0.75rem] font-medium text-[#09090B]/50 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reward tiers */}
            <div>
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="font-display font-bold text-[1.75rem] tracking-[-0.025em] text-[#09090B] leading-none">
                  Reward <span className="font-serif italic font-semibold text-[#CA8A04]">tiers</span>
                </h3>
                <div className="flex-1 h-[2px] rounded-full" style={{ background: "linear-gradient(to right, #CA8A0440, transparent)" }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { bg: "bg-[#DCFCE7]", border: "border-[#15803D]", Icon: Award,  iconColor: "text-[#CA8A04]", valColor: "text-[#15803D]", day: "Day 7",   val: "+0.005 cUSD", sub: "per cycle" },
                  { bg: "bg-[#DBEAFE]", border: "border-[#1D4ED8]", Icon: Medal,  iconColor: "text-[#1D4ED8]", valColor: "text-[#1D4ED8]", day: "Day 14+", val: "+0.012 cUSD", sub: "per cycle" },
                  { bg: "bg-[#FEF9C3]", border: "border-[#CA8A04]", Icon: Trophy, iconColor: "text-[#CA8A04]", valColor: "text-[#CA8A04]", day: "Day 35+", val: "+0.025 cUSD", sub: "per cycle" },
                ].map(({ bg, border, Icon, iconColor, valColor, day, val, sub }) => (
                  <div key={day} className={cn("rounded-2xl border-2 p-4 shadow-[3px_3px_0_#09090B] flex flex-col gap-2", bg, border)}>
                    <div className="w-8 h-8 rounded-xl border border-[#09090B]/15 bg-white/50 flex items-center justify-center">
                      <Icon className={cn("w-4 h-4", iconColor)} />
                    </div>
                    <p className={cn("font-display font-bold text-[1.125rem] leading-tight", valColor)}>{val}</p>
                    <div>
                      <p className="font-sans text-[0.8125rem] font-black uppercase tracking-[0.08em] text-[#09090B] leading-none">{day}</p>
                      <p className="font-sans text-[0.6875rem] text-[#09090B]/45 mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div>
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="font-display font-bold text-[1.75rem] tracking-[-0.025em] text-[#09090B] leading-none">
                  <span className="font-serif italic font-semibold text-[#6D28D9]">Badges</span>
                </h3>
                <div className="flex-1 h-[2px] rounded-full" style={{ background: "linear-gradient(to right, #6D28D940, transparent)" }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { Icon: Award,  iconColor: "text-[#CA8A04]", bg: "bg-[#FDE68A]", border: "border-[#CA8A04]", label: "Bronze",  days: "30 days",  labelColor: "text-[#92400E]" },
                  { Icon: Medal,  iconColor: "text-[#6B7280]", bg: "bg-[#E5E7EB]", border: "border-[#6B7280]", label: "Silver",  days: "90 days",  labelColor: "text-[#374151]" },
                  { Icon: Trophy, iconColor: "text-[#CA8A04]", bg: "bg-[#FDE68A]", border: "border-[#CA8A04]", label: "Gold",    days: "180 days", labelColor: "text-[#92400E]" },
                  { Icon: Star,   iconColor: "text-[#3B82F6]", bg: "bg-[#BAE6FD]", border: "border-[#1D4ED8]", label: "Diamond", days: "365 days", labelColor: "text-[#1D4ED8]" },
                ].map(({ Icon, iconColor, bg, border, label, days, labelColor }) => (
                  <div key={label} className={cn("rounded-2xl border-2 p-4 shadow-[3px_3px_0_#09090B] flex flex-col items-center text-center gap-2", bg, border)}>
                    <div className="w-10 h-10 rounded-2xl bg-white/60 border border-[#09090B]/15 flex items-center justify-center">
                      <Icon className={cn("w-5 h-5", iconColor)} />
                    </div>
                    <p className={cn("font-display font-bold text-[1rem] leading-tight", labelColor)}>{label}</p>
                    <p className="font-sans text-[0.75rem] font-medium text-[#09090B]/50 leading-tight">{days}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contract */}
            <div>
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="font-display font-bold text-[1.75rem] tracking-[-0.025em] text-[#09090B] leading-none">Contract</h3>
                <div className="flex-1 h-[2px] rounded-full" style={{ background: "linear-gradient(to right, #09090B20, transparent)" }} />
              </div>
              <div className="rounded-2xl border-2 border-[#09090B] shadow-[4px_4px_0_#09090B] bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    <span className="font-sans text-[0.8125rem] font-bold text-[#09090B]">Celo Mainnet</span>
                  </div>
                  <span className="bg-[#DCFCE7] text-[#15803D] text-[0.6875rem] font-black px-2.5 py-1 rounded-lg border border-[#09090B]">Live</span>
                </div>
                <div className="bg-[#F7F5FF] rounded-xl border border-[#7C3AED]/20 px-4 py-3">
                  <span className="font-mono text-[0.75rem] text-[#7C3AED] break-all leading-relaxed select-all">
                    0xb103Ef63431753317BeFb1AAfCB7C6E0e0fbCe12
                  </span>
                </div>
                <p className="font-sans text-[0.75rem] text-[#09090B]/35 mt-2.5 font-medium">Tap address to select all and copy.</p>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
