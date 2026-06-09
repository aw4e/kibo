"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useKibo } from "../hooks/useKibo";
import { formatUnits } from "viem";
import { useState, useEffect } from "react";

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
    <div className="ring-wrap">
      <svg className="ring-svg" viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring-track" cx="60" cy="60" r={R} />
        <circle
          className={`ring-progress${isComplete ? " complete" : ""}`}
          cx="60" cy="60" r={R}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-inner">
        <span className="ring-flame" role="img" aria-label="fire">🔥</span>
        <span className="ring-number">{streak}</span>
        <span className="ring-days">days</span>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="card-row">
      <div className="card-row-left">
        <span className="skeleton skeleton-icon" />
        <span className="skeleton skeleton-label" />
      </div>
      <span className="skeleton skeleton-value" />
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
    pendingReferralReward,
    referrer,
    claimReferralReward,
  } = useKibo();

  const countdown = formatCountdown(nextDepositIn);
  const savedAmount = parseFloat(formatUnits(totalDeposited, 18));
  const balanceAmount = cUSDBalance
    ? parseFloat(formatUnits(cUSDBalance, 18)).toFixed(2)
    : "—";

  if (!isConnected) {
    return (
      <div className="app-shell">
        <div className="connect-screen">
          <div className="connect-icon" role="img" aria-label="mountain">⛰️</div>
          <h1 className="connect-title">Kibo</h1>
          <p className="connect-sub">
            Deposit 0.01 cUSD daily.<br />Build your streak. Reach the summit.
          </p>
          <button
            className="btn-primary connect-btn"
            onClick={() => connect({ connector: injected() })}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <nav className="nav-bar">
        <span className="nav-title">Kibo</span>
        <button className="nav-wallet" onClick={() => disconnect()}>
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </button>
      </nav>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-banner-icon">⚠️</span>
          <span className="error-banner-text">{error}</span>
          <button className="error-banner-close" onClick={clearError} aria-label="Dismiss">✕</button>
        </div>
      )}

      <div className="app-content">

        {/* ── HOME TAB ────────────────────────────────────── */}
        {tab === "home" && (
          <>
            <div className="streak-hero">
              <StreakRing streak={streak} />

              <p className="hero-caption">
                {isLoading
                  ? " "
                  : streak === 0
                  ? "Start your streak today"
                  : streak % 7 === 0
                  ? "Milestone reached!"
                  : `${7 - (streak % 7)} day${7 - (streak % 7) > 1 ? "s" : ""} to next milestone`}
              </p>

              {canClaim && (
                <span className="milestone-pill">🏆 Reward ready</span>
              )}
            </div>

            {/* Stats */}
            <div className="section">
              <p className="section-header">Overview</p>
              <div className="card-group">
                {isLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : (
                  <>
                    <div className="card-row">
                      <div className="card-row-left">
                        <span className="row-icon icon-blue">💰</span>
                        <span className="row-label">Total saved</span>
                      </div>
                      <span className="row-value is-accent">
                        {savedAmount.toFixed(3)} cUSD
                      </span>
                    </div>
                    <div className="card-row">
                      <div className="card-row-left">
                        <span className="row-icon icon-orange">🏆</span>
                        <span className="row-label">Best streak</span>
                      </div>
                      <span className="row-value">
                        {longestStreak} days
                      </span>
                    </div>
                    <div className="card-row">
                      <div className="card-row-left">
                        <span className="row-icon icon-green">💵</span>
                        <span className="row-label">cUSD balance</span>
                      </div>
                      <span className="row-value is-muted">{balanceAmount}</span>
                    </div>
                    <div className="card-row">
                      <div className="card-row-left">
                        <span className="row-icon icon-blue">🛡️</span>
                        <span className="row-label">Streak shields</span>
                      </div>
                      <span className="row-value">
                        {"🛡️".repeat(shields) || "—"}
                        <span className="row-sub"> {shields}/3</span>
                      </span>
                    </div>
                    <div className="card-row">
                      <div className="card-row-left">
                        <span className="row-icon icon-orange">{badge > 0 ? BADGE_EMOJI[badge] : "🏅"}</span>
                        <span className="row-label">Badge</span>
                      </div>
                      <span className={`row-value${badge > 0 ? " is-accent" : " is-muted"}`}>
                        {badge > 0 ? `${BADGE_EMOJI[badge]} ${BADGE_LABEL[badge]}` : "None yet"}
                      </span>
                    </div>
                    {parseFloat(formatUnits(rewardsClaimed, 18)) > 0 && (
                      <div className="card-row">
                        <div className="card-row-left">
                          <span className="row-icon icon-green">🎁</span>
                          <span className="row-label">Rewards earned</span>
                        </div>
                        <span className="row-value is-accent">
                          {parseFloat(formatUnits(rewardsClaimed, 18)).toFixed(4)} cUSD
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Streak Recovery */}
            {!isLoading && brokenStreak > 0 && streak === 0 && (
              <div className="section">
                <div className="recovery-card">
                  <div className="recovery-header">
                    <span className="recovery-icon">💔</span>
                    <div>
                      <p className="recovery-title">Streak broken</p>
                      <p className="recovery-sub">
                        Pay {Math.min(brokenStreak * 0.01, 0.1).toFixed(3)} cUSD to restore your {brokenStreak}-day streak
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn-warning"
                    onClick={recoverStreak}
                    disabled={isTxLoading}
                  >
                    {isTxLoading ? "Processing…" : `Recover ${brokenStreak}-day streak`}
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="section">
              <div className="btn-stack">
                {canClaim && (
                  <button
                    className="btn-success"
                    onClick={claimReward}
                    disabled={isTxLoading}
                  >
                    🎁 Claim 7-day reward
                  </button>
                )}

                <button
                  className="btn-primary"
                  onClick={() => deposit(undefined, refParam)}
                  disabled={!canDeposit || isTxLoading}
                >
                  {isTxLoading ? "Processing…" : "Deposit 0.01 cUSD"}
                </button>

                {!canDeposit && countdown && (
                  <p className="hint-text">
                    Next deposit in{" "}
                    <span className="countdown-inline">⏱ {countdown}</span>
                  </p>
                )}

                {savedAmount > 0 && (
                  <button
                    className="btn-ghost"
                    onClick={withdraw}
                    disabled={isTxLoading}
                  >
                    Withdraw savings
                  </button>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="section">
              <p className="section-header">Progress</p>
              <div className="card-group">
                {isLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : (
                  <>
                    <div className="card-row">
                      <div className="card-row-left">
                        <span className="row-icon icon-purple">🎯</span>
                        <span className="row-label">Next milestone</span>
                      </div>
                      <span className="row-value">
                        Day {streak === 0 ? 7 : Math.ceil((streak + 1) / 7) * 7}
                      </span>
                    </div>
                    <div className="card-row">
                      <div className="card-row-left">
                        <span className="row-icon icon-blue">✨</span>
                        <span className="row-label">Milestones hit</span>
                      </div>
                      <span className="row-value is-accent">
                        {Math.floor(streak / 7)}
                      </span>
                    </div>
                    <div className="card-row">
                      <div className="card-row-left">
                        <span className="row-icon icon-orange">📅</span>
                        <span className="row-label">Days this cycle</span>
                      </div>
                      <span className="row-value">
                        {streak % 7 || (streak > 0 ? 7 : 0)} / 7
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Referral */}
            <div className="section">
              <p className="section-header">Referral</p>
              <div className="card-group">
                {referrer && (
                  <div className="card-row">
                    <div className="card-row-left">
                      <span className="row-icon icon-purple">👥</span>
                      <span className="row-label">Referred by</span>
                    </div>
                    <span className="row-value is-muted" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                      {referrer.slice(0, 6)}…{referrer.slice(-4)}
                    </span>
                  </div>
                )}
                {refParam !== "0x0000000000000000000000000000000000000000" && !referrer && (
                  <div className="referral-chip">
                    <span>🔗</span>
                    <span>Invite code applied: {refParam.slice(0, 6)}…{refParam.slice(-4)}</span>
                  </div>
                )}
                {pendingReferralReward > BigInt(0) && (
                  <>
                    <div className="card-row">
                      <div className="card-row-left">
                        <span className="row-icon icon-green">💸</span>
                        <span className="row-label">Referral reward</span>
                      </div>
                      <span className="row-value is-accent">
                        {parseFloat(formatUnits(pendingReferralReward, 18)).toFixed(4)} cUSD
                      </span>
                    </div>
                    <button
                      className="btn-success"
                      onClick={claimReferralReward}
                      disabled={isTxLoading}
                    >
                      Claim referral reward
                    </button>
                  </>
                )}
                <div className="referral-invite-row">
                  <p className="referral-invite-label">Your invite link</p>
                  <button
                    className="btn-ghost referral-copy-btn"
                    onClick={() => {
                      if (!address) return;
                      const url = `${window.location.origin}?ref=${address}`;
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    disabled={!address}
                  >
                    {copied ? "Copied!" : "📋 Copy invite link"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── LEADERBOARD TAB ─────────────────────────────── */}
        {tab === "leaderboard" && (
          <div style={{ paddingTop: 8 }}>
            <div className="section">
              <p className="section-header">Top Savers</p>
              {leaderboard && leaderboard[0].length > 0 ? (
                <div className="card-group">
                  {leaderboard[0].map((addr, i) => (
                    <div key={addr} className="lb-row">
                      <span className={`lb-rank-badge${i < 3 ? " top" : ""}`}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                      <div className="lb-avatar" aria-hidden="true">
                        {addr.slice(2, 4).toUpperCase()}
                      </div>
                      <span className="lb-addr">
                        {addr.slice(0, 6)}…{addr.slice(-4)}
                      </span>
                      <span className="lb-streak-val">
                        {Number(leaderboard[1][i])} 🔥
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  No deposits yet.<br />Be the first! 🔥
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ────────────────────────────────── */}
        {tab === "settings" && (
          <div style={{ paddingTop: 8 }}>
            <div className="section">
              <p className="section-header">How it works</p>
              <div className="card-group">
                <div className="card-row">
                  <div className="card-row-left">
                    <span className="row-icon icon-blue">📅</span>
                    <span className="row-label">Daily deposit</span>
                  </div>
                  <span className="row-value is-muted">0.0001–1 cUSD</span>
                </div>
                <div className="card-row">
                  <div className="card-row-left">
                    <span className="row-icon icon-orange">⏱️</span>
                    <span className="row-label">Cooldown</span>
                  </div>
                  <span className="row-value is-muted">20 hours</span>
                </div>
                <div className="card-row">
                  <div className="card-row-left">
                    <span className="row-icon icon-blue">🛡️</span>
                    <span className="row-label">Shields</span>
                  </div>
                  <span className="row-value is-muted">Skip 1 day, keep streak</span>
                </div>
              </div>
            </div>

            <div className="section">
              <p className="section-header">Rewards</p>
              <div className="card-group">
                <div className="card-row">
                  <div className="card-row-left">
                    <span className="row-icon icon-green">🏅</span>
                    <span className="row-label">Day 7 milestone</span>
                  </div>
                  <span className="row-value is-accent">+0.005 cUSD</span>
                </div>
                <div className="card-row">
                  <div className="card-row-left">
                    <span className="row-icon icon-green">🥈</span>
                    <span className="row-label">Day 14+ milestone</span>
                  </div>
                  <span className="row-value is-accent">+0.012 cUSD</span>
                </div>
                <div className="card-row">
                  <div className="card-row-left">
                    <span className="row-icon icon-orange">🏆</span>
                    <span className="row-label">Day 35+ milestone</span>
                  </div>
                  <span className="row-value is-accent">+0.025 cUSD</span>
                </div>
              </div>
            </div>

            <div className="section">
              <p className="section-header">Contract</p>
              <div className="card-group">
                <div className="card-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                  <span className="row-label">Celo Mainnet</span>
                  <span className="row-value is-muted" style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
                    0x765c96F44c2d82EB5C6609e2a09220600e1C8006
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Tab Bar ────────────────────────────────────────── */}
      <div className="tab-bar" role="tablist">
        <button
          className={`tab-btn${tab === "home" ? " active" : ""}`}
          onClick={() => setTab("home")}
          role="tab"
          aria-selected={tab === "home"}
        >
          <span className="tab-icon">🏠</span>
          <span className="tab-label">Home</span>
        </button>
        <button
          className={`tab-btn${tab === "leaderboard" ? " active" : ""}`}
          onClick={() => setTab("leaderboard")}
          role="tab"
          aria-selected={tab === "leaderboard"}
        >
          <span className="tab-icon">🏆</span>
          <span className="tab-label">Leaderboard</span>
        </button>
        <button
          className={`tab-btn${tab === "settings" ? " active" : ""}`}
          onClick={() => setTab("settings")}
          role="tab"
          aria-selected={tab === "settings"}
        >
          <span className="tab-icon">⚙️</span>
          <span className="tab-label">Info</span>
        </button>
      </div>
    </div>
  );
}
