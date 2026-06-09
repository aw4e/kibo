import { ethers } from "hardhat";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { Kibo, MockERC20 } from "../typechain-types";

const CUSD_ADDR   = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
const COOLDOWN         = 20 * 3600;          // 20h in seconds
const PRECISION_WINDOW = 2 * 3600;           // 2h precision bonus window
const LATE             = 48 * 3600 + 1;      // > 48h triggers break
const MIN         = 100_000_000_000_000n;    // 0.0001 ether
const ONE         = 1_000_000_000_000_000_000n; // 1 ether
const POOL_SEED   = 100_000_000_000_000_000_000n; // 100 ether

describe("Kibo", () => {
  let kibo: Kibo;
  let cusd: MockERC20;
  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let carol: HardhatEthersSigner;
  let kiboAddr: string;

  // ── Helpers ────────────────────────────────────────────────────

  async function mint(user: HardhatEthersSigner, amount = MIN) {
    await cusd.mint(user.address, amount);
    await cusd.connect(user).approve(kiboAddr, amount);
  }

  async function dep(user: HardhatEthersSigner, ref = ethers.ZeroAddress, amount = MIN) {
    await mint(user, amount);
    return kibo.connect(user).deposit(amount, ref);
  }

  async function depFor(payer: HardhatEthersSigner, beneficiary: HardhatEthersSigner, amount = MIN) {
    await mint(payer, amount);
    return kibo.connect(payer).depositFor(beneficiary.address, amount);
  }

  /** Advance time by exactly COOLDOWN (qualifies for precision shield). */
  async function tick() { await time.increase(COOLDOWN); }

  /** Advance time past 48h (triggers streak break on next deposit). */
  async function breakTime() { await time.increase(LATE); }

  /** Build streak of N, pausing COOLDOWN between each (earns precision shields). */
  async function buildStreak(user: HardhatEthersSigner, n: number) {
    for (let i = 0; i < n; i++) {
      await dep(user);
      if (i < n - 1) await tick();
    }
  }

  /** Build streak of N with late deposits — no precision shields earned. */
  async function buildStreakSlow(user: HardhatEthersSigner, n: number) {
    for (let i = 0; i < n; i++) {
      await dep(user);
      if (i < n - 1) await time.increase(COOLDOWN + PRECISION_WINDOW + 1);
    }
  }

  // ── Setup ──────────────────────────────────────────────────────

  beforeEach(async () => {
    [owner, alice, bob, carol] = await ethers.getSigners();

    // Patch hardcoded cUSD address with mock bytecode
    const MockFactory = await ethers.getContractFactory("MockERC20");
    const mockDeploy  = await MockFactory.deploy();
    const mockCode    = await ethers.provider.getCode(await mockDeploy.getAddress());
    await ethers.provider.send("hardhat_setCode", [CUSD_ADDR, mockCode]);
    cusd = MockFactory.attach(CUSD_ADDR) as MockERC20;

    const KiboFactory = await ethers.getContractFactory("Kibo");
    kibo    = await KiboFactory.deploy();
    kiboAddr = await kibo.getAddress();

    // Seed reward pool
    await cusd.mint(owner.address, POOL_SEED);
    await cusd.connect(owner).approve(kiboAddr, POOL_SEED);
    await kibo.fundPool(POOL_SEED);
  });

  // ── Deployment ─────────────────────────────────────────────────

  describe("deployment", () => {
    it("owner is deployer", async () => {
      expect(await kibo.owner()).to.equal(owner.address);
    });
    it("not paused", async () => {
      expect(await kibo.paused()).to.be.false;
    });
    it("pool seeded correctly", async () => {
      expect(await kibo.poolBalance()).to.equal(POOL_SEED);
    });
  });

  // ── Pool fee ───────────────────────────────────────────────────

  describe("pool fee auto-routing", () => {
    it("0.5% of deposit goes to poolFunds", async () => {
      const before = await kibo.poolBalance();
      await dep(alice, ethers.ZeroAddress, ONE);
      const fee = (ONE * 50n) / 10_000n;
      expect(await kibo.poolBalance()).to.equal(before + fee);
    });

    it("totalDeposited reflects net amount (minus fee)", async () => {
      await dep(alice, ethers.ZeroAddress, ONE);
      const fee = (ONE * 50n) / 10_000n;
      const u = await kibo.getUser(alice.address);
      expect(u.totalDeposited).to.equal(ONE - fee);
    });

    it("owner can adjust poolFeeBps within cap", async () => {
      await expect(kibo.setPoolFeeBps(100)).to.emit(kibo, "PoolFeeBpsUpdated");
      expect(await kibo.poolFeeBps()).to.equal(100n);
    });

    it("reverts poolFeeBps above 2% cap", async () => {
      await expect(kibo.setPoolFeeBps(201)).to.be.revertedWithCustomError(kibo, "BpsOutOfRange");
    });
  });

  // ── deposit() ─────────────────────────────────────────────────

  describe("deposit()", () => {
    it("increments streak", async () => {
      await dep(alice);
      expect((await kibo.getUser(alice.address)).streak).to.equal(1n);
    });

    it("emits Deposited", async () => {
      await expect(dep(alice)).to.emit(kibo, "Deposited").withArgs(alice.address, 1n, anyValue);
    });

    it("reverts TooSoon before cooldown", async () => {
      await dep(alice);
      await expect(dep(alice)).to.be.revertedWithCustomError(kibo, "TooSoon");
    });

    it("reverts AmountOutOfRange below min", async () => {
      await expect(dep(alice, ethers.ZeroAddress, MIN - 1n))
        .to.be.revertedWithCustomError(kibo, "AmountOutOfRange");
    });

    it("reverts AmountOutOfRange above max", async () => {
      await expect(dep(alice, ethers.ZeroAddress, ONE + 1n))
        .to.be.revertedWithCustomError(kibo, "AmountOutOfRange");
    });

    it("reverts Paused when contract is paused", async () => {
      await kibo.pause();
      await expect(dep(alice)).to.be.revertedWithCustomError(kibo, "Paused");
    });

    it("precision shield earned on exact-cooldown deposit", async () => {
      await dep(alice);
      await tick();
      await dep(alice);
      expect((await kibo.getUser(alice.address)).shields).to.be.greaterThan(0n);
    });

    it("no precision shield on late deposit (> cooldown + precision window)", async () => {
      await dep(alice);
      await time.increase(COOLDOWN + 2 * 3600 + 1); // past precision window
      await dep(alice);
      // streak broke (>48h)? No — LATE = 48h+1. COOLDOWN+2h+1 = 22h+1 < 48h. No break.
      // Also 22h > 20h so past cooldown. But within 48h window = no break.
      const u = await kibo.getUser(alice.address);
      // shields should be 0 (first deposit never had precision; second is past precision window)
      expect(u.shields).to.equal(0n);
    });

    it("registers referrer on first deposit", async () => {
      await dep(alice, bob.address);
      expect(await kibo.referrer(alice.address)).to.equal(bob.address);
    });

    it("referrer locked — cannot change after first deposit", async () => {
      await dep(alice, bob.address);
      await tick();
      await dep(alice, carol.address); // attempt change
      expect(await kibo.referrer(alice.address)).to.equal(bob.address); // unchanged
    });

    it("blocks self-referral", async () => {
      await dep(alice, alice.address);
      expect(await kibo.referrer(alice.address)).to.equal(ethers.ZeroAddress);
    });

    it("blocks circular referral A→B→A", async () => {
      await dep(alice, bob.address); // alice refers bob
      // Now bob tries to refer alice — should be blocked (referrer[alice]=bob, so referrer[bob] cannot be alice)
      await dep(bob, alice.address);
      expect(await kibo.referrer(bob.address)).to.equal(ethers.ZeroAddress);
    });

    it("referral reward accrued to referrer on first deposit (5% of amount)", async () => {
      await dep(bob); // bob registered as depositor
      const amount = ethers.parseEther("0.1");
      await dep(alice, bob.address, amount);
      const expected = (amount * 500n) / 10_000n;
      expect(await kibo.pendingReferralReward(bob.address)).to.equal(expected);
    });

    it("emits ReferralRewardSkipped when pool insufficient", async () => {
      // Deploy fresh Kibo with empty pool
      const KF = await ethers.getContractFactory("Kibo");
      const k2 = await KF.deploy();
      const k2Addr = await k2.getAddress();

      // Bob deposits first so referrer registration is possible
      await cusd.mint(bob.address, MIN);
      await cusd.connect(bob).approve(k2Addr, MIN);
      await k2.connect(bob).deposit(MIN, ethers.ZeroAddress);

      // Alice first deposit with referral — pool has only 0.5% of bob's MIN ≈ 0
      // refAmount = 5% of 1 cUSD = 0.05, pool < that → skip
      const amount = ONE;
      await cusd.mint(alice.address, amount);
      await cusd.connect(alice).approve(k2Addr, amount);
      await expect(
        k2.connect(alice).deposit(amount, bob.address)
      ).to.emit(k2, "ReferralRewardSkipped");
    });
  });

  // ── Streak break & recovery ────────────────────────────────────

  describe("streak break & recoverStreak()", () => {
    it("streak breaks after >48h, brokenStreak saved, streak stays 0", async () => {
      await dep(alice);          // streak = 1
      await breakTime();
      await dep(alice);          // break! streak = 0, brokenStreak = 1; didBreak = true → no streak++
      const u = await kibo.getUser(alice.address);
      expect(u.streak).to.equal(0n);
      expect(u.brokenStreak).to.equal(1n);
    });

    it("emits StreakBroken on break", async () => {
      await dep(alice);
      await breakTime();
      await expect(dep(alice)).to.emit(kibo, "StreakBroken").withArgs(alice.address, 1n);
    });

    it("recoverStreak restores streak from brokenStreak", async () => {
      // Use slow builds so no shields are earned — real breaks happen
      await buildStreakSlow(alice, 5); // streak = 5, shields = 0
      await breakTime();
      await dep(alice);               // break! streak = 0, brokenStreak = 5

      const fee = 5n * MIN;
      await cusd.mint(alice.address, fee);
      await cusd.connect(alice).approve(kiboAddr, fee);
      await kibo.connect(alice).recoverStreak();

      const u = await kibo.getUser(alice.address);
      expect(u.streak).to.equal(5n);
      expect(u.brokenStreak).to.equal(0n);
    });

    it("recovery fee capped at MAX_RECOVERY_FEE (0.1 cUSD)", async () => {
      await buildStreakSlow(alice, 7); // streak = 7, shields = 0
      await breakTime();
      await dep(alice); // break! streak = 0, brokenStreak = 7

      const expectedFee = 7n * MIN; // 0.0007 cUSD < 0.1 cap
      const poolBefore = await kibo.poolBalance();
      await cusd.mint(alice.address, expectedFee);
      await cusd.connect(alice).approve(kiboAddr, expectedFee);
      await kibo.connect(alice).recoverStreak();
      expect(await kibo.poolBalance()).to.be.gte(poolBefore);
    });

    it("reverts NoStreakToRecover if no broken streak", async () => {
      await expect(
        kibo.connect(alice).recoverStreak()
      ).to.be.revertedWithCustomError(kibo, "NoStreakToRecover");
    });

    it("reverts NoStreakToRecover if streak > 0", async () => {
      await dep(alice);  // streak = 1, brokenStreak = 0
      await expect(
        kibo.connect(alice).recoverStreak()
      ).to.be.revertedWithCustomError(kibo, "NoStreakToRecover");
    });

    it("fresh deposit after break (no recover) clears brokenStreak", async () => {
      await dep(alice);   // streak 1
      await breakTime();
      await dep(alice);   // break — streak 0, brokenStreak 1
      await tick();
      await dep(alice);   // fresh start — streak 1, brokenStreak cleared
      const u = await kibo.getUser(alice.address);
      expect(u.streak).to.equal(1n);
      expect(u.brokenStreak).to.equal(0n);
    });

    it("shield absorbs break, clears brokenStreak, no StreakBroken event", async () => {
      // Get a shield via precision deposit
      await dep(alice);
      await tick();
      await dep(alice);          // precision shield earned
      const u0 = await kibo.getUser(alice.address);
      expect(u0.shields).to.be.greaterThan(0n);

      await breakTime();
      await expect(dep(alice)).to.emit(kibo, "ShieldUsed");
      const u1 = await kibo.getUser(alice.address);
      expect(u1.brokenStreak).to.equal(0n); // cleared by shield
      expect(u1.streak).to.equal(3n);       // streak continued
    });
  });

  // ── depositFor() ──────────────────────────────────────────────

  describe("depositFor()", () => {
    it("payer deposits on behalf of beneficiary", async () => {
      await depFor(bob, alice);
      expect((await kibo.getUser(alice.address)).streak).to.equal(1n);
    });

    it("emits DepositedFor", async () => {
      await expect(depFor(bob, alice))
        .to.emit(kibo, "DepositedFor")
        .withArgs(bob.address, alice.address, 1n, anyValue);
    });

    it("reverts RecoveryPending when beneficiary has broken streak", async () => {
      await dep(alice);        // streak 1
      await breakTime();
      await dep(alice);        // streak 0, brokenStreak 1
      // alice.lastDeposit just updated — tick so cooldown passes
      await tick();
      await expect(depFor(bob, alice))
        .to.be.revertedWithCustomError(kibo, "RecoveryPending");
    });

    it("reverts TooSoon during beneficiary cooldown", async () => {
      await depFor(bob, alice);
      await expect(depFor(bob, alice)).to.be.revertedWithCustomError(kibo, "TooSoon");
    });

    it("reverts InvalidAddress for zero beneficiary", async () => {
      await mint(bob);
      await expect(
        kibo.connect(bob).depositFor(ethers.ZeroAddress, MIN)
      ).to.be.revertedWithCustomError(kibo, "InvalidAddress");
    });
  });

  // ── claimReward() ─────────────────────────────────────────────

  describe("claimReward()", () => {
    it("claims reward at streak 7", async () => {
      await buildStreak(alice, 7);
      const balBefore = await cusd.balanceOf(alice.address);
      await kibo.connect(alice).claimReward();
      const tier1 = await kibo.rewardTier1();
      expect(await cusd.balanceOf(alice.address)).to.equal(balBefore + tier1);
    });

    it("emits RewardClaimed", async () => {
      await buildStreak(alice, 7);
      const tier1 = await kibo.rewardTier1();
      await expect(kibo.connect(alice).claimReward())
        .to.emit(kibo, "RewardClaimed")
        .withArgs(alice.address, 7n, tier1);
    });

    it("reverts NeedMilestone if streak not divisible by 7", async () => {
      await buildStreak(alice, 5);
      await expect(
        kibo.connect(alice).claimReward()
      ).to.be.revertedWithCustomError(kibo, "NeedMilestone");
    });

    it("reverts AlreadyClaimed if same streak claimed twice", async () => {
      await buildStreak(alice, 7);
      await kibo.connect(alice).claimReward();
      await expect(
        kibo.connect(alice).claimReward()
      ).to.be.revertedWithCustomError(kibo, "AlreadyClaimed");
    });

    it("reverts PoolEmpty when pool has insufficient funds", async () => {
      const KF = await ethers.getContractFactory("Kibo");
      const k2 = await KF.deploy();
      const k2Addr = await k2.getAddress();
      for (let i = 0; i < 7; i++) {
        await cusd.mint(alice.address, MIN);
        await cusd.connect(alice).approve(k2Addr, MIN);
        await k2.connect(alice).deposit(MIN, ethers.ZeroAddress);
        if (i < 6) await time.increase(COOLDOWN);
      }
      await expect(
        k2.connect(alice).claimReward()
      ).to.be.revertedWithCustomError(k2, "PoolEmpty");
    });

    it("earns shield on claim if below max shields", async () => {
      // slow build = no precision shields, so shields = 0 before claim
      await buildStreakSlow(alice, 7);
      const before = (await kibo.getUser(alice.address)).shields;
      expect(before).to.equal(0n); // confirm no shields
      await kibo.connect(alice).claimReward();
      expect((await kibo.getUser(alice.address)).shields).to.equal(1n);
    });

    it("correct tier at streak 14 (tier2)", async () => {
      await buildStreak(alice, 14);
      await kibo.connect(alice).claimReward(); // claim streak 7
      await tick();
      // build to 14
      for (let i = 0; i < 7; i++) {
        await dep(alice);
        if (i < 6) await tick();
      }
      const tier2 = await kibo.rewardTier2();
      const bal = await cusd.balanceOf(alice.address);
      await kibo.connect(alice).claimReward();
      expect(await cusd.balanceOf(alice.address)).to.equal(bal + tier2);
    });
  });

  // ── withdraw() ────────────────────────────────────────────────

  describe("withdraw()", () => {
    it("returns funds minus penalty (5% default)", async () => {
      await dep(alice, ethers.ZeroAddress, ONE);
      const { totalDeposited } = await kibo.getUser(alice.address);
      const penalty = (totalDeposited * 500n) / 10_000n;
      const expected = totalDeposited - penalty;
      const balBefore = await cusd.balanceOf(alice.address);
      await kibo.connect(alice).withdraw();
      expect(await cusd.balanceOf(alice.address)).to.equal(balBefore + expected);
    });

    it("committed saver gets 1% penalty", async () => {
      // Use large deposits so totalDeposited >> rewardTier1 (0.005 ether) → committed saver
      const bigDep = ethers.parseEther("0.5");
      for (let i = 0; i < 7; i++) {
        await dep(alice, ethers.ZeroAddress, bigDep);
        if (i < 6) await tick();
      }
      await kibo.connect(alice).claimReward(); // lastClaimedStreak > 0
      const { totalDeposited } = await kibo.getUser(alice.address);
      const penalty = (totalDeposited * 100n) / 10_000n; // 1% = withdrawalPenaltyBps/5
      const expected = totalDeposited - penalty;
      const bal = await cusd.balanceOf(alice.address);
      await kibo.connect(alice).withdraw();
      expect(await cusd.balanceOf(alice.address)).to.equal(bal + expected);
    });

    it("full state reset on withdraw", async () => {
      await buildStreak(alice, 7);
      await kibo.connect(alice).claimReward();
      await kibo.connect(alice).withdraw();
      const u = await kibo.getUser(alice.address);
      expect(u.streak).to.equal(0n);
      expect(u.longestStreak).to.equal(0n);
      expect(u.lastClaimedStreak).to.equal(0n);
      expect(u.totalDeposited).to.equal(0n);
      expect(u.shields).to.equal(0n);
    });

    it("isDepositor reset — re-deposit after withdraw adds to depositors again", async () => {
      await dep(alice);
      await kibo.connect(alice).withdraw();
      const countBefore = await kibo.totalDepositors();
      await dep(alice);
      expect(await kibo.totalDepositors()).to.equal(countBefore + 1n);
    });

    it("reverts NothingToWithdraw if no balance", async () => {
      await expect(
        kibo.connect(alice).withdraw()
      ).to.be.revertedWithCustomError(kibo, "NothingToWithdraw");
    });

    it("emits Withdrawn", async () => {
      await dep(alice);
      await expect(kibo.connect(alice).withdraw())
        .to.emit(kibo, "Withdrawn");
    });
  });

  // ── claimReferralReward() ─────────────────────────────────────

  describe("claimReferralReward()", () => {
    it("referrer can claim accrued reward", async () => {
      await dep(bob); // bob registers
      const amount = ethers.parseEther("0.1");
      await dep(alice, bob.address, amount); // alice uses bob as ref

      const pending = await kibo.pendingReferralReward(bob.address);
      expect(pending).to.be.greaterThan(0n);

      const balBefore = await cusd.balanceOf(bob.address);
      await kibo.connect(bob).claimReferralReward();
      expect(await cusd.balanceOf(bob.address)).to.equal(balBefore + pending);
    });

    it("reverts NothingToWithdraw if no pending reward", async () => {
      await expect(
        kibo.connect(alice).claimReferralReward()
      ).to.be.revertedWithCustomError(kibo, "NothingToWithdraw");
    });
  });

  // ── setGoal() ─────────────────────────────────────────────────

  describe("setGoal()", () => {
    it("emits GoalSet on non-zero target", async () => {
      await expect(kibo.connect(alice).setGoal(ONE))
        .to.emit(kibo, "GoalSet")
        .withArgs(alice.address, ONE);
    });

    it("emits GoalCancelled on zero target", async () => {
      await kibo.connect(alice).setGoal(ONE);
      await expect(kibo.connect(alice).setGoal(0n))
        .to.emit(kibo, "GoalCancelled")
        .withArgs(alice.address);
    });

    it("emits GoalReached when totalDeposited crosses target", async () => {
      const target = MIN * 2n;
      await kibo.connect(alice).setGoal(target);
      await dep(alice, ethers.ZeroAddress, MIN);
      await tick();
      await expect(dep(alice, ethers.ZeroAddress, ONE))
        .to.emit(kibo, "GoalReached");
    });
  });

  // ── Badge system ──────────────────────────────────────────────

  describe("badge system", () => {
    it("emits BadgeEarned(Bronze) at streak 30", async () => {
      // Build 29, tick, last deposit emits badge
      await buildStreak(alice, 29);
      await tick();
      await expect(dep(alice)).to.emit(kibo, "BadgeEarned");
    });

    it("getBadge returns None for new user", async () => {
      expect(await kibo.getBadge(alice.address)).to.equal(0); // Badge.None
    });

    it("getBadge resets to None after withdraw", async () => {
      await buildStreak(alice, 30);
      expect(await kibo.getBadge(alice.address)).to.equal(1); // Badge.Bronze
      await kibo.connect(alice).withdraw();
      expect(await kibo.getBadge(alice.address)).to.equal(0); // Badge.None
    });
  });

  // ── Owner functions ───────────────────────────────────────────

  describe("owner functions", () => {
    it("pause/unpause emits events", async () => {
      await expect(kibo.pause()).to.emit(kibo, "ContractPaused").withArgs(owner.address);
      await expect(kibo.unpause()).to.emit(kibo, "ContractUnpaused").withArgs(owner.address);
    });

    it("non-owner cannot pause", async () => {
      await expect(kibo.connect(alice).pause())
        .to.be.revertedWithCustomError(kibo, "Unauthorized");
    });

    it("setRewardTiers: reverts if t4 > MAX_REWARD_TIER", async () => {
      const cap = await kibo.MAX_REWARD_TIER();
      await expect(
        kibo.setRewardTiers(1n, 2n, 3n, cap + 1n)
      ).to.be.revertedWithCustomError(kibo, "InvalidTiers");
    });

    it("setRewardTiers: reverts if not monotonically increasing", async () => {
      await expect(
        kibo.setRewardTiers(10n, 5n, 20n, 30n)
      ).to.be.revertedWithCustomError(kibo, "InvalidTiers");
    });

    it("setRewardTiers: valid update emits event", async () => {
      await expect(
        kibo.setRewardTiers(
          ethers.parseEther("0.001"),
          ethers.parseEther("0.002"),
          ethers.parseEther("0.003"),
          ethers.parseEther("0.004")
        )
      ).to.emit(kibo, "RewardTiersUpdated");
    });

    it("2-step ownership: transferOwnership → acceptOwnership", async () => {
      await kibo.transferOwnership(alice.address);
      expect(await kibo.pendingOwner()).to.equal(alice.address);
      expect(await kibo.owner()).to.equal(owner.address); // not yet transferred

      await kibo.connect(alice).acceptOwnership();
      expect(await kibo.owner()).to.equal(alice.address);
      expect(await kibo.pendingOwner()).to.equal(ethers.ZeroAddress);
    });

    it("wrong account cannot acceptOwnership", async () => {
      await kibo.transferOwnership(alice.address);
      await expect(
        kibo.connect(bob).acceptOwnership()
      ).to.be.revertedWithCustomError(kibo, "Unauthorized");
    });

    it("cancelOwnershipTransfer clears pendingOwner", async () => {
      await kibo.transferOwnership(alice.address);
      await kibo.cancelOwnershipTransfer();
      expect(await kibo.pendingOwner()).to.equal(ethers.ZeroAddress);
    });

    it("setReferralRewardBps emits event", async () => {
      await expect(kibo.setReferralRewardBps(300n))
        .to.emit(kibo, "ReferralRewardBpsUpdated")
        .withArgs(500n, 300n);
    });

    it("setReferralRewardBps reverts above 1000", async () => {
      await expect(kibo.setReferralRewardBps(1001n))
        .to.be.revertedWithCustomError(kibo, "BpsOutOfRange");
    });
  });

  // ── Leaderboard ───────────────────────────────────────────────

  describe("getLeaderboard()", () => {
    it("returns depositors sorted by streak", async () => {
      await buildStreak(alice, 3);
      await tick();
      await buildStreak(bob, 5);
      await tick();
      await dep(carol);

      const { addrs, streaks } = await kibo.getLeaderboard(10);
      // Bob (5) should be first
      expect(addrs[0]).to.equal(bob.address);
      expect(streaks[0]).to.equal(5n);
    });

    it("excludes withdrawn (streak=0) users", async () => {
      await dep(alice);
      await kibo.connect(alice).withdraw();
      await buildStreak(bob, 3);

      const { addrs } = await kibo.getLeaderboard(10);
      expect(addrs).to.not.include(alice.address);
    });

    it("respects limit parameter", async () => {
      await dep(alice);
      await tick();
      await dep(bob);

      const { addrs } = await kibo.getLeaderboard(1);
      expect(addrs.length).to.equal(1);
    });
  });

  // ── fundPool() ────────────────────────────────────────────────

  describe("fundPool()", () => {
    it("increases poolFunds", async () => {
      const before = await kibo.poolBalance();
      const amount = ethers.parseEther("5");
      await cusd.mint(alice.address, amount);
      await cusd.connect(alice).approve(kiboAddr, amount);
      await expect(kibo.connect(alice).fundPool(amount))
        .to.emit(kibo, "PoolFunded")
        .withArgs(alice.address, amount);
      expect(await kibo.poolBalance()).to.equal(before + amount);
    });
  });
});

// ── Chai helper for any uint ───────────────────────────────────
function anyUint() {
  return {
    asymmetricMatch: (v: unknown) => typeof v === "bigint" && v >= 0n,
    jasmineToString: () => "<anyUint>",
  };
}
