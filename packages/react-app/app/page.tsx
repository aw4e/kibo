"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useKibo } from "../hooks/useKibo";
import { formatUnits } from "viem";
import { useState } from "react";

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

type Tab = "home" | "leaderboard";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [tab, setTab] = useState<Tab>("home");

  const {
    streak,
    longestStreak,
    totalDeposited,
    canDeposit,
    canClaim,
    nextDepositIn,
    cUSDBalance,
    shields,
    leaderboard,
    isTxLoading,
    deposit,
    claimReward,
    withdraw,
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

      <div className="app-content">

        {/* ── HOME TAB ────────────────────────────────────── */}
        {tab === "home" && (
          <>
            <div className="streak-hero">
              <StreakRing streak={streak} />

              <p className="hero-caption">
                {streak === 0
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
              </div>
            </div>

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
                  onClick={deposit}
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
        <button className="tab-btn" disabled role="tab" aria-selected={false}>
          <span className="tab-icon">⚙️</span>
          <span className="tab-label">Settings</span>
        </button>
      </div>
    </div>
  );
}
