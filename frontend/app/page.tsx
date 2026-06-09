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
const BADGE_EMOJI = ["", "🥉", "🥈", "🥇", "💎"] as const;

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
    <div className="relative w-[188px] h-[188px] [filter:drop-shadow(0_8px_24px_hsl(221_83%_53%/0.18))]">
      <svg className="ring-svg" viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring-track" cx="60" cy="60" r={R} />
        <circle
          className={cn("ring-progress", isComplete && "complete")}
          cx="60" cy="60" r={R}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1px]">
        <span className="text-[1.625rem] leading-none animate-flame-pulse" role="img" aria-label="fire">🔥</span>
        <span className="font-bold text-[clamp(2.5rem,12vw,3.25rem)] tracking-[-0.04em] tabular-nums leading-none">
          {streak}
        </span>
        <span className="text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
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
        <span className="skeleton w-[30px] h-[30px] rounded-lg" />
        <span className="skeleton w-[100px] h-[14px]" />
      </div>
      <span className="skeleton w-[70px] h-[14px]" />
    </CardRow>
  );
}

function RowIcon({ children, color }: { children: string; color: string }) {
  return (
    <span className={cn("w-[30px] h-[30px] rounded-lg flex items-center justify-center text-base flex-shrink-0", color)}>
      {children}
    </span>
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

  if (!isConnected) {
    return (
      <div className="app-shell flex items-center justify-center min-h-dvh bg-background max-w-app mx-auto">
        <div className="flex flex-col items-center text-center gap-5 px-8">
          <span className="text-6xl animate-float [filter:drop-shadow(0_4px_20px_hsl(221_83%_53%/0.25))]" role="img" aria-label="mountain">
            ⛰️
          </span>
          <h1 className="text-[clamp(1.875rem,6vw,2.125rem)] font-bold tracking-[-0.035em]">Kibo</h1>
          <p className="text-[1rem] text-muted-foreground leading-[1.55] max-w-[260px]">
            Deposit 0.01 cUSD daily.<br />Build your streak. Reach the summit.
          </p>
          <Button className="w-full max-w-[280px]" onClick={() => connect({ connector: injected() })}>
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell flex flex-col max-w-app mx-auto min-h-dvh bg-background relative overflow-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-[100] flex items-center justify-between px-5 py-4 bg-background/90 backdrop-blur-xl border-b border-border/60">
        <span className="text-[1.375rem] font-bold tracking-[-0.025em]">Kibo</span>
        <button
          className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-[0.75rem] font-medium"
          onClick={() => disconnect()}
        >
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </button>
      </nav>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-destructive/10 border-b border-destructive/30 animate-slide-down" role="alert">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <span className="flex-1 text-[0.8125rem] font-medium text-destructive">{error}</span>
          <button onClick={clearError} className="text-muted-foreground p-0.5" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: "calc(49px + env(safe-area-inset-bottom, 0px) + 2rem)" }}
      >
        {/* ── HOME TAB ────────────────────────────────────── */}
        {tab === "home" && (
          <>
            {/* Streak hero */}
            <div className="flex flex-col items-center px-5 py-8 gap-4">
              <StreakRing streak={streak} />
              <p className="text-[1.25rem] font-semibold text-center">
                {isLoading
                  ? " "
                  : streak === 0
                  ? "Start your streak today"
                  : streak % 7 === 0
                  ? "Milestone reached!"
                  : `${7 - (streak % 7)} day${7 - (streak % 7) > 1 ? "s" : ""} to next milestone`}
              </p>
              {canClaim && <Badge variant="milestone">🏆 Reward ready</Badge>}
            </div>

            {/* Overview */}
            <div className="px-5 pb-5">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-widest text-muted-foreground px-1 pb-1 mb-0.5">Overview</p>
              <Card>
                <CardContent>
                  {isLoading ? (
                    <><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                  ) : (
                    <>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon color="bg-primary/10">💰</RowIcon><span>Total saved</span></div>
                        <span className="font-semibold text-primary tabular-nums">{savedAmount.toFixed(3)} cUSD</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon color="bg-orange-400/18">🏆</RowIcon><span>Best streak</span></div>
                        <span className="font-semibold tabular-nums">{longestStreak} days</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon color="bg-success/10">💵</RowIcon><span>cUSD balance</span></div>
                        <span className="font-normal text-muted-foreground tabular-nums">{balanceAmount}</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon color="bg-primary/10">🛡️</RowIcon><span>Streak shields</span></div>
                        <span className="font-semibold tabular-nums">
                          {"🛡️".repeat(shields) || "—"}
                          <span className="text-[0.8125rem] font-normal text-muted-foreground"> {shields}/3</span>
                        </span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon color="bg-orange-400/18">{badge > 0 ? BADGE_EMOJI[badge] : "🏅"}</RowIcon><span>Badge</span></div>
                        <span className={cn("font-semibold", badge > 0 ? "text-primary" : "text-muted-foreground font-normal")}>
                          {badge > 0 ? `${BADGE_EMOJI[badge]} ${BADGE_LABEL[badge]}` : "None yet"}
                        </span>
                      </CardRow>
                      {parseFloat(formatUnits(rewardsClaimed, 18)) > 0 && (
                        <CardRow>
                          <div className="flex items-center gap-3"><RowIcon color="bg-success/10">🎁</RowIcon><span>Rewards earned</span></div>
                          <span className="font-semibold text-[hsl(var(--success))] tabular-nums">
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
              <div className="px-5 pb-5">
                <Card className="bg-warning/10 border border-warning/40">
                  <CardContent className="p-5 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <span className="text-2xl flex-shrink-0 mt-0.5">💔</span>
                      <div>
                        <p className="text-[0.9375rem] font-semibold">Streak broken</p>
                        <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
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
            <div className="px-5 pb-5 flex flex-col gap-2">
              {canClaim && (
                <Button variant="success" onClick={claimReward} disabled={isTxLoading}>
                  🎁 Claim 7-day reward
                </Button>
              )}
              <Button onClick={() => deposit(undefined, refParam)} disabled={!canDeposit || isTxLoading}>
                {isTxLoading ? "Processing…" : "Deposit 0.01 cUSD"}
              </Button>
              {!canDeposit && countdown && (
                <p className="text-center text-[0.8125rem] text-muted-foreground py-1">
                  Next deposit in{" "}
                  <span className="inline-flex items-center gap-1 bg-muted rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium tabular-nums">
                    ⏱ {countdown}
                  </span>
                </p>
              )}
              {savedAmount > 0 && (
                <Button variant="ghost" onClick={withdraw} disabled={isTxLoading}>
                  Withdraw savings
                </Button>
              )}
            </div>

            {/* Progress */}
            <div className="px-5 pb-5">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-widest text-muted-foreground px-1 pb-1 mb-0.5">Progress</p>
              <Card>
                <CardContent>
                  {isLoading ? (
                    <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                  ) : (
                    <>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon color="bg-purple-400/14">🎯</RowIcon><span>Next milestone</span></div>
                        <span className="font-semibold tabular-nums">Day {streak === 0 ? 7 : Math.ceil((streak + 1) / 7) * 7}</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon color="bg-primary/10">✨</RowIcon><span>Milestones hit</span></div>
                        <span className="font-semibold text-primary tabular-nums">{Math.floor(streak / 7)}</span>
                      </CardRow>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon color="bg-orange-400/18">📅</RowIcon><span>Days this cycle</span></div>
                        <span className="font-semibold tabular-nums">{streak % 7 || (streak > 0 ? 7 : 0)} / 7</span>
                      </CardRow>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Savings Goal */}
            <div className="px-5 pb-5">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-widest text-muted-foreground px-1 pb-1 mb-0.5">Savings Goal</p>
              <Card>
                <CardContent>
                  {savingsGoal > BigInt(0) ? (
                    <div className="px-5 py-4 flex flex-col gap-3">
                      <div className="flex justify-between text-[0.75rem]">
                        <span className="font-semibold text-primary">
                          {parseFloat(formatUnits(totalDeposited, 18)).toFixed(3)} cUSD
                        </span>
                        <span className="text-muted-foreground">
                          Goal: {parseFloat(formatUnits(savingsGoal, 18)).toFixed(2)} cUSD
                        </span>
                      </div>
                      <Progress value={goalPct} />
                    </div>
                  ) : (
                    <p className="px-5 py-4 text-[0.8125rem] text-muted-foreground">No goal set yet.</p>
                  )}
                  <div className="flex gap-2 px-5 pb-4 border-t border-border pt-3">
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
                      className="rounded-xl px-5 h-11 flex-shrink-0"
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
            <div className="px-5 pb-5">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-widest text-muted-foreground px-1 pb-1 mb-0.5">Referral</p>
              <Card>
                <CardContent>
                  {referrer && (
                    <CardRow>
                      <div className="flex items-center gap-3"><RowIcon color="bg-purple-400/14">👥</RowIcon><span>Referred by</span></div>
                      <span className="font-mono text-[0.75rem] text-muted-foreground">
                        {referrer.slice(0, 6)}…{referrer.slice(-4)}
                      </span>
                    </CardRow>
                  )}
                  {refParam !== "0x0000000000000000000000000000000000000000" && !referrer && (
                    <div className="flex items-center gap-2 mx-5 my-3 px-3 py-2 bg-primary/10 rounded-xl text-[0.8125rem] text-primary font-medium">
                      <span>🔗</span>
                      <span>Invite code applied: {refParam.slice(0, 6)}…{refParam.slice(-4)}</span>
                    </div>
                  )}
                  {pendingReferralReward > BigInt(0) && (
                    <>
                      <CardRow>
                        <div className="flex items-center gap-3"><RowIcon color="bg-success/10">💸</RowIcon><span>Referral reward</span></div>
                        <span className="font-semibold text-[hsl(var(--success))] tabular-nums">
                          {parseFloat(formatUnits(pendingReferralReward, 18)).toFixed(4)} cUSD
                        </span>
                      </CardRow>
                      <div className="px-5 pb-3 pt-1">
                        <Button variant="success" onClick={claimReferralReward} disabled={isTxLoading}>
                          Claim referral reward
                        </Button>
                      </div>
                    </>
                  )}
                  <div className="px-5 py-3 border-t border-border">
                    <p className="text-[0.75rem] text-muted-foreground mb-2">Your invite link</p>
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
                      {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy invite link</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sponsor a Friend */}
            <div className="px-5 pb-5">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-widest text-muted-foreground px-1 pb-1 mb-0.5">Sponsor a Friend</p>
              <Card>
                <CardContent>
                  <p className="px-5 pt-4 pb-3 text-[0.8125rem] text-muted-foreground leading-relaxed border-b border-border">
                    Deposit 0.01 cUSD on behalf of another address to boost their streak.
                  </p>
                  <div className="px-5 py-3 flex flex-col gap-2">
                    <Input
                      placeholder="0x… friend's address"
                      value={sponsorAddr}
                      onChange={(e) => setSponsorAddr(e.target.value)}
                      error={!!(sponsorAddr && !sponsorAddrValid)}
                      spellCheck={false}
                      className="font-mono text-sm"
                    />
                    {sponsorAddr && !sponsorAddrValid && (
                      <p className="text-[0.75rem] text-destructive">Invalid address</p>
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

        {/* ── LEADERBOARD TAB ─────────────────────────────── */}
        {tab === "leaderboard" && (
          <div className="pt-2 px-5 pb-5">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-widest text-muted-foreground px-1 pb-1 mb-0.5">Top Savers</p>
            {leaderboard && leaderboard[0].length > 0 ? (
              <Card>
                <CardContent>
                  {leaderboard[0].map((addr, i) => (
                    <div key={addr} className="flex items-center gap-3 px-5 py-3 min-h-[52px] border-t border-border first:border-t-0">
                      <span className={cn("w-7 text-center text-[0.9375rem] font-bold flex-shrink-0", i < 3 ? "text-primary" : "text-muted-foreground")}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-[0.6875rem] font-bold text-primary tracking-wide flex-shrink-0">
                        {addr.slice(2, 4).toUpperCase()}
                      </div>
                      <span className="flex-1 text-[1rem] tabular-nums truncate min-w-0">
                        {addr.slice(0, 6)}…{addr.slice(-4)}
                      </span>
                      <span className="text-[0.9375rem] font-bold text-muted-foreground tabular-nums flex-shrink-0">
                        {Number(leaderboard[1][i])} 🔥
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12 text-muted-foreground">No deposits yet.<br />Be the first! 🔥</div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ────────────────────────────────── */}
        {tab === "settings" && (
          <div className="pt-2 px-5 pb-5 flex flex-col gap-5">
            <div>
              <p className="text-[0.8125rem] font-semibold uppercase tracking-widest text-muted-foreground px-1 pb-1 mb-0.5">How it works</p>
              <Card>
                <CardContent>
                  <CardRow>
                    <div className="flex items-center gap-3"><RowIcon color="bg-primary/10">📅</RowIcon><span>Daily deposit</span></div>
                    <span className="text-muted-foreground font-normal">0.0001–1 cUSD</span>
                  </CardRow>
                  <CardRow>
                    <div className="flex items-center gap-3"><RowIcon color="bg-orange-400/18">⏱️</RowIcon><span>Cooldown</span></div>
                    <span className="text-muted-foreground font-normal">20 hours</span>
                  </CardRow>
                  <CardRow>
                    <div className="flex items-center gap-3"><RowIcon color="bg-primary/10">🛡️</RowIcon><span>Shields</span></div>
                    <span className="text-muted-foreground font-normal">Skip 1 day, keep streak</span>
                  </CardRow>
                </CardContent>
              </Card>
            </div>
            <div>
              <p className="text-[0.8125rem] font-semibold uppercase tracking-widest text-muted-foreground px-1 pb-1 mb-0.5">Rewards</p>
              <Card>
                <CardContent>
                  <CardRow>
                    <div className="flex items-center gap-3"><RowIcon color="bg-success/10">🏅</RowIcon><span>Day 7 milestone</span></div>
                    <span className="font-semibold text-[hsl(var(--success))]">+0.005 cUSD</span>
                  </CardRow>
                  <CardRow>
                    <div className="flex items-center gap-3"><RowIcon color="bg-success/10">🥈</RowIcon><span>Day 14+ milestone</span></div>
                    <span className="font-semibold text-[hsl(var(--success))]">+0.012 cUSD</span>
                  </CardRow>
                  <CardRow>
                    <div className="flex items-center gap-3"><RowIcon color="bg-orange-400/18">🏆</RowIcon><span>Day 35+ milestone</span></div>
                    <span className="font-semibold text-[hsl(var(--success))]">+0.025 cUSD</span>
                  </CardRow>
                </CardContent>
              </Card>
            </div>
            <div>
              <p className="text-[0.8125rem] font-semibold uppercase tracking-widest text-muted-foreground px-1 pb-1 mb-0.5">Contract</p>
              <Card>
                <CardContent>
                  <div className="px-5 py-4 flex flex-col gap-1">
                    <span className="text-muted-foreground">Celo Mainnet</span>
                    <span className="font-mono text-[0.75rem] text-muted-foreground break-all">
                      0x765c96F44c2d82EB5C6609e2a09220600e1C8006
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app flex items-start justify-around pt-1 bg-background/90 backdrop-blur-xl border-t border-border z-[200]"
        style={{ height: "calc(49px + env(safe-area-inset-bottom, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        role="tablist"
      >
        {([
          { id: "home" as Tab, icon: "🏠", label: "Home" },
          { id: "leaderboard" as Tab, icon: "🏆", label: "Leaderboard" },
          { id: "settings" as Tab, icon: "⚙️", label: "Info" },
        ]).map(({ id, icon, label }) => (
          <button
            key={id}
            className="flex flex-col items-center gap-0.5 px-8 py-1 border-none bg-transparent active:scale-[0.88] transition-transform duration-[120ms]"
            onClick={() => setTab(id)}
            role="tab"
            aria-selected={tab === id}
          >
            <span className={cn("text-2xl leading-none transition-all duration-[120ms]", tab !== id && "grayscale opacity-40")}>
              {icon}
            </span>
            <span className={cn("text-[0.625rem] font-medium transition-colors duration-[120ms]", tab === id ? "text-primary font-semibold" : "text-muted-foreground")}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
