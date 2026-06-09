// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Kibo {
    IERC20 public constant cUSD = IERC20(0x765DE816845861e75A25fCA122bb6898B8B1282a);

    uint256 public constant MIN_DEPOSIT      = 0.0001 ether;
    uint256 public constant MAX_DEPOSIT      = 1 ether;
    uint256 public constant COOLDOWN         = 20 hours;
    uint256 public constant STREAK_THRESHOLD = 7;
    uint8   public constant MAX_SHIELDS      = 3;
    uint256 public constant MAX_RECOVERY_FEE = 0.1 ether;
    uint256 public constant PRECISION_WINDOW = 2 hours;
    uint256 public constant POOL_FEE_BPS     = 50;   // 0.5% of each deposit auto-routed to pool

    // Owner-adjustable reward tiers
    uint256 public rewardTier1 = 0.005 ether;  // streak 7–13
    uint256 public rewardTier2 = 0.012 ether;  // streak 14–34
    uint256 public rewardTier3 = 0.025 ether;  // streak 35–48 (threshold: >=35)
    uint256 public rewardTier4 = 0.05 ether;   // streak 49+

    // Owner-adjustable rates (basis points, 1 bps = 0.01%)
    uint256 public referralRewardBps    = 500;  // 5% of referee's first deposit → referrer (from pool)
    uint256 public withdrawalPenaltyBps = 500;  // 5% penalty on early withdrawal

    address public owner;
    address public pendingOwner;
    bool    public paused;
    uint256 public poolFunds;

    // ── Errors ───────────────────────────────────────────────────

    error AmountOutOfRange();
    error TooSoon();
    error PoolEmpty();
    error NeedMilestone();
    error AlreadyClaimed();
    error NothingToWithdraw();
    error TransferFailed();
    error Paused();
    error Unauthorized();
    error NoStreakToRecover();
    error RecoveryPending();
    error InvalidAddress();
    error BpsOutOfRange();
    error InvalidTiers();

    // ── Storage ──────────────────────────────────────────────────

    // Slot 1: streak(32)+longestStreak(32)+lastClaimedStreak(32)+brokenStreak(32)
    //         +lastDeposit(40)+isDepositor(8)+shields(8) = 184 bits
    // Slot 2: totalDeposited(128)
    struct UserData {
        uint32  streak;
        uint32  longestStreak;
        uint32  lastClaimedStreak;
        uint32  brokenStreak;
        uint40  lastDeposit;
        bool    isDepositor;
        uint8   shields;
        uint128 totalDeposited;
    }

    enum Badge { None, Bronze, Silver, Gold, Diamond }

    mapping(address => UserData) public users;
    mapping(address => address)  public referrer;
    mapping(address => uint256)  public pendingReferralReward;
    mapping(address => uint128)  public savingsGoal;
    mapping(address => uint256)  public totalRewardsClaimed;

    address[] public depositors;

    // ── Events ───────────────────────────────────────────────────

    event Deposited(address indexed user, uint32 streak, uint40 timestamp);
    event DepositedFor(address indexed payer, address indexed beneficiary, uint32 streak, uint40 timestamp);
    event StreakBroken(address indexed user, uint32 oldStreak);
    event StreakRecovered(address indexed user, uint32 streak, uint256 fee);
    event ShieldUsed(address indexed user, uint32 streak, uint8 shieldsLeft);
    event PrecisionShield(address indexed user, uint8 shields);
    event RewardClaimed(address indexed user, uint32 streak, uint256 reward);
    event ReferralRewardAccrued(address indexed ref, address indexed referee, uint256 amount);
    event ReferralRewardClaimed(address indexed ref, uint256 amount);
    event PoolFunded(address indexed funder, uint256 amount);
    event Withdrawn(address indexed user, uint256 payout, uint256 penalty);
    event GoalSet(address indexed user, uint128 target);
    event GoalReached(address indexed user, uint128 totalDeposited);
    event BadgeEarned(address indexed user, Badge badge);
    event RewardTiersUpdated(uint256 t1, uint256 t2, uint256 t3, uint256 t4);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ── Modifiers ────────────────────────────────────────────────

    modifier notPaused() {
        if (paused) revert Paused();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ── Owner functions ──────────────────────────────────────────

    function pause() external onlyOwner { paused = true; }
    function unpause() external onlyOwner { paused = false; }

    // 2-step ownership transfer — prevents accidental loss of contract control
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert Unauthorized();
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    function setRewardTiers(uint256 t1, uint256 t2, uint256 t3, uint256 t4) external onlyOwner {
        if (t1 == 0 || t2 <= t1 || t3 <= t2 || t4 <= t3) revert InvalidTiers();
        rewardTier1 = t1; rewardTier2 = t2; rewardTier3 = t3; rewardTier4 = t4;
        emit RewardTiersUpdated(t1, t2, t3, t4);
    }

    function setReferralRewardBps(uint256 bps) external onlyOwner {
        if (bps > 1000) revert BpsOutOfRange();
        referralRewardBps = bps;
    }

    function setWithdrawalPenaltyBps(uint256 bps) external onlyOwner {
        if (bps > 1000) revert BpsOutOfRange();
        withdrawalPenaltyBps = bps;
    }

    // ── Deposit ──────────────────────────────────────────────────

    // ref = referrer address; pass address(0) if none.
    // Referrer locked on first deposit and cannot change.
    function deposit(uint256 amount, address ref) external notPaused {
        if (amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) revert AmountOutOfRange();

        UserData storage u = users[msg.sender];
        uint40 ts = uint40(block.timestamp);
        if (ts < u.lastDeposit + COOLDOWN) revert TooSoon();

        bool isFirst = !u.isDepositor;

        // Register referrer on very first deposit.
        // Block self-referral and circular referral (A→B→A).
        if (isFirst && ref != address(0) && ref != msg.sender
            && referrer[ref] != msg.sender) {
            referrer[msg.sender] = ref;
        }

        if (!cUSD.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        _processDeposit(msg.sender, amount, ts);

        // Accrue referral reward on first deposit — 5% of deposit from pool (pull pattern).
        // Silently skips if pool is insufficient rather than reverting.
        if (isFirst) {
            address r = referrer[msg.sender];
            uint256 refBps = referralRewardBps;
            if (r != address(0) && refBps > 0) {
                uint256 refAmount = (amount * refBps) / 10_000;
                if (poolFunds >= refAmount) {
                    unchecked { poolFunds -= refAmount; }
                    unchecked { pendingReferralReward[r] += refAmount; }
                    emit ReferralRewardAccrued(r, msg.sender, refAmount);
                }
            }
        }

        emit Deposited(msg.sender, u.streak, ts);
    }

    // Anyone can deposit on behalf of a beneficiary (enables automation / scheduled bots).
    // Cannot be used while beneficiary has a pending streak recovery — prevents griefing.
    function depositFor(address beneficiary, uint256 amount) external notPaused {
        if (beneficiary == address(0)) revert InvalidAddress();
        if (amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) revert AmountOutOfRange();

        UserData storage ub = users[beneficiary];
        if (ub.brokenStreak > 0 && ub.streak == 0) revert RecoveryPending();

        uint40 ts = uint40(block.timestamp);
        if (ts < ub.lastDeposit + COOLDOWN) revert TooSoon();

        if (!cUSD.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        _processDeposit(beneficiary, amount, ts);
        emit DepositedFor(msg.sender, beneficiary, ub.streak, ts);
    }

    function _processDeposit(address user, uint256 amount, uint40 ts) internal {
        UserData storage u = users[user];

        // Auto-route 0.5% to reward pool; user's balance tracks net amount
        uint256 fee = (amount * POOL_FEE_BPS) / 10_000;
        unchecked { poolFunds += fee; }
        uint256 net = amount - fee;

        // Missed a day — shield absorbs the break if available
        if (u.lastDeposit != 0 && ts > u.lastDeposit + 48 hours) {
            if (u.shields > 0) {
                unchecked { u.shields--; }
                emit ShieldUsed(user, u.streak, u.shields);
            } else {
                u.brokenStreak = u.streak;
                emit StreakBroken(user, u.streak);
                u.streak = 0;
            }
        }

        // Precision bonus: deposited within PRECISION_WINDOW after cooldown → earn shield
        if (u.lastDeposit > 0 && ts <= u.lastDeposit + COOLDOWN + PRECISION_WINDOW) {
            if (u.shields < MAX_SHIELDS) {
                unchecked { u.shields++; }
                emit PrecisionShield(user, u.shields);
            }
        }

        unchecked { u.streak++; }
        u.lastDeposit = ts;
        u.totalDeposited += uint128(net);

        if (u.streak > u.longestStreak) {
            u.longestStreak = u.streak;
            _checkBadge(user, u.longestStreak);
        }

        if (!u.isDepositor) {
            u.isDepositor = true;
            depositors.push(user);
        }

        uint128 goal = savingsGoal[user];
        if (goal > 0 && u.totalDeposited >= goal) {
            savingsGoal[user] = 0;
            emit GoalReached(user, u.totalDeposited);
        }
    }

    // ── Claim reward ─────────────────────────────────────────────

    function claimReward() external notPaused {
        UserData storage u = users[msg.sender];
        uint32 streak = u.streak; // cache to avoid multiple SLOADs
        if (streak < STREAK_THRESHOLD || streak % STREAK_THRESHOLD != 0) revert NeedMilestone();
        if (streak <= u.lastClaimedStreak) revert AlreadyClaimed();

        uint256 reward = _rewardAmount(streak);
        if (poolFunds < reward) revert PoolEmpty();

        // CEI: all state updates before external calls
        u.lastClaimedStreak = streak;
        if (u.shields < MAX_SHIELDS) { unchecked { u.shields++; } }
        unchecked { poolFunds -= reward; }
        unchecked { totalRewardsClaimed[msg.sender] += reward; }

        if (!cUSD.transfer(msg.sender, reward)) revert TransferFailed();
        emit RewardClaimed(msg.sender, streak, reward);
    }

    // ── Streak recovery ──────────────────────────────────────────

    // Restore broken streak by paying fee = brokenStreak × MIN_DEPOSIT (capped at MAX_RECOVERY_FEE).
    // Only available while current streak is 0 (before starting a new streak after the break).
    // Recovery fee goes entirely to the pool — not counted as user deposit.
    function recoverStreak() external notPaused {
        UserData storage u = users[msg.sender];
        if (u.brokenStreak == 0 || u.streak > 0) revert NoStreakToRecover();

        uint32 recovered = u.brokenStreak;
        uint256 fee = uint256(recovered) * MIN_DEPOSIT;
        if (fee > MAX_RECOVERY_FEE) fee = MAX_RECOVERY_FEE;

        if (!cUSD.transferFrom(msg.sender, address(this), fee)) revert TransferFailed();

        u.streak = recovered;
        u.brokenStreak = 0;
        unchecked { poolFunds += fee; }

        emit StreakRecovered(msg.sender, recovered, fee);
    }

    // ── Withdraw ─────────────────────────────────────────────────

    // Penalty tiers to prevent reward-cycle farming:
    //   · Never claimed milestone           → full withdrawalPenaltyBps (default 5%)
    //   · Claimed but earned >= deposited   → full penalty (closed the loop, farmed the pool)
    //   · Committed saver (deposited > earned) → reduced penalty (1%, owner-adjustable)
    function withdraw() external {
        UserData storage u = users[msg.sender];
        uint128 amount = u.totalDeposited;
        if (amount == 0) revert NothingToWithdraw();

        uint256 earned = totalRewardsClaimed[msg.sender];
        bool isCommittedSaver = u.lastClaimedStreak > 0 && uint256(amount) > earned;

        uint256 penaltyBps = isCommittedSaver
            ? withdrawalPenaltyBps / 5
            : withdrawalPenaltyBps;

        uint256 penalty = (uint256(amount) * penaltyBps) / 10_000;
        uint256 payout  = uint256(amount) - penalty;

        // CEI — full state reset including longestStreak so badges re-earn on return
        u.totalDeposited    = 0;
        u.streak            = 0;
        u.longestStreak     = 0;
        u.lastDeposit       = 0;
        u.shields           = 0;
        u.lastClaimedStreak = 0;
        u.brokenStreak      = 0;
        totalRewardsClaimed[msg.sender] = 0;

        if (penalty > 0) { unchecked { poolFunds += penalty; } }

        if (!cUSD.transfer(msg.sender, payout)) revert TransferFailed();
        emit Withdrawn(msg.sender, payout, penalty);
    }

    // ── Pool & referral ──────────────────────────────────────────

    function fundPool(uint256 amount) external {
        if (!cUSD.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        unchecked { poolFunds += amount; }
        emit PoolFunded(msg.sender, amount);
    }

    function claimReferralReward() external {
        uint256 amount = pendingReferralReward[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        pendingReferralReward[msg.sender] = 0;
        if (!cUSD.transfer(msg.sender, amount)) revert TransferFailed();
        emit ReferralRewardClaimed(msg.sender, amount);
    }

    // ── Savings goal ─────────────────────────────────────────────

    function setGoal(uint128 target) external {
        savingsGoal[msg.sender] = target;
        emit GoalSet(msg.sender, target);
    }

    // ── Internal helpers ─────────────────────────────────────────

    function _rewardAmount(uint32 streak) internal view returns (uint256) {
        if (streak >= 49) return rewardTier4;
        if (streak >= 35) return rewardTier3;
        if (streak >= 14) return rewardTier2;
        return rewardTier1;
    }

    function _getBadge(uint32 longest) internal pure returns (Badge) {
        if (longest >= 365) return Badge.Diamond;
        if (longest >= 180) return Badge.Gold;
        if (longest >= 90)  return Badge.Silver;
        if (longest >= 30)  return Badge.Bronze;
        return Badge.None;
    }

    // Emits BadgeEarned only on exact threshold crossing (longestStreak is monotonic)
    function _checkBadge(address user, uint32 longest) internal {
        if (longest == 30 || longest == 90 || longest == 180 || longest == 365) {
            emit BadgeEarned(user, _getBadge(longest));
        }
    }

    // ── Views ────────────────────────────────────────────────────

    function getBadge(address user) external view returns (Badge) {
        return _getBadge(users[user].longestStreak);
    }

    function getUser(address user) external view returns (
        uint256 streak,
        uint256 lastDeposit,
        uint256 totalDeposited,
        uint256 longestStreak,
        bool    canDeposit,
        uint256 lastClaimedStreak,
        uint8   shields,
        uint256 brokenStreak,
        Badge   badge,
        uint256 rewardsClaimed
    ) {
        UserData storage u = users[user];
        return (
            u.streak,
            u.lastDeposit,
            u.totalDeposited,
            u.longestStreak,
            uint40(block.timestamp) >= u.lastDeposit + COOLDOWN,
            u.lastClaimedStreak,
            u.shields,
            u.brokenStreak,
            _getBadge(u.longestStreak),
            totalRewardsClaimed[user]
        );
    }

    function getLeaderboard(uint256 limit) external view returns (
        address[] memory addrs,
        uint256[] memory streaks,
        uint256[] memory totals
    ) {
        uint256 total = depositors.length;
        uint256 scope = total < 200 ? total : 200;
        uint256 count = scope < limit ? scope : limit;

        address[] memory a = new address[](scope);
        uint256[] memory s = new uint256[](scope);
        uint256[] memory t = new uint256[](scope);

        for (uint256 i; i < scope;) {
            address addr = depositors[i];
            a[i] = addr;
            s[i] = users[addr].streak;
            t[i] = users[addr].totalDeposited;
            unchecked { i++; }
        }

        // Partial selection sort — only sort the top `count` slots
        for (uint256 i; i < count;) {
            uint256 best = i;
            for (uint256 j = i + 1; j < scope;) {
                if (s[j] > s[best]) best = j;
                unchecked { j++; }
            }
            if (best != i) {
                (a[i], a[best]) = (a[best], a[i]);
                (s[i], s[best]) = (s[best], s[i]);
                (t[i], t[best]) = (t[best], t[i]);
            }
            unchecked { i++; }
        }

        if (count == scope) {
            addrs   = a;
            streaks = s;
            totals  = t;
        } else {
            addrs   = new address[](count);
            streaks = new uint256[](count);
            totals  = new uint256[](count);
            for (uint256 i; i < count;) {
                addrs[i]   = a[i];
                streaks[i] = s[i];
                totals[i]  = t[i];
                unchecked { i++; }
            }
        }
    }

    function totalDepositors() external view returns (uint256) {
        return depositors.length;
    }

    function poolBalance() external view returns (uint256) {
        return poolFunds;
    }
}
