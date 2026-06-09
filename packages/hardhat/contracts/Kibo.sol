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

    // Tiered milestone rewards — scales with commitment
    uint256 public constant REWARD_TIER1 = 0.005 ether;  // day 7
    uint256 public constant REWARD_TIER2 = 0.012 ether;  // day 14+
    uint256 public constant REWARD_TIER3 = 0.025 ether;  // day 30+

    error AmountOutOfRange();
    error TooSoon();
    error PoolEmpty();
    error NeedMilestone();
    error AlreadyClaimed();
    error NothingToWithdraw();
    error NotOwner();
    error TransferFailed();

    // slot 1: streak(32) + longestStreak(32) + lastClaimedStreak(32) + lastDeposit(40) + isDepositor(8) + shields(8) = 152 bits
    // slot 2: totalDeposited(128) = 128 bits
    struct UserData {
        uint32  streak;
        uint32  longestStreak;
        uint32  lastClaimedStreak;
        uint40  lastDeposit;
        bool    isDepositor;
        uint8   shields;
        uint128 totalDeposited;
    }

    mapping(address => UserData) public users;
    address[] public depositors;
    address public owner;

    event Deposited(address indexed user, uint32 streak, uint40 timestamp);
    event StreakBroken(address indexed user, uint32 oldStreak);
    event ShieldUsed(address indexed user, uint32 streak, uint8 shieldsLeft);
    event RewardClaimed(address indexed user, uint32 streak, uint256 reward);
    event PoolFunded(address indexed funder, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function deposit(uint256 amount) external {
        if (amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) revert AmountOutOfRange();

        UserData storage u = users[msg.sender];
        uint40 ts = uint40(block.timestamp);

        if (ts < u.lastDeposit + COOLDOWN) revert TooSoon();

        // Missed a day — shield absorbs the break if available
        if (u.lastDeposit != 0 && ts > u.lastDeposit + 48 hours) {
            if (u.shields > 0) {
                unchecked { u.shields--; }
                emit ShieldUsed(msg.sender, u.streak, u.shields);
            } else {
                emit StreakBroken(msg.sender, u.streak);
                u.streak = 0;
            }
        }

        if (!cUSD.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();

        unchecked { u.streak++; }
        u.lastDeposit = ts;
        u.totalDeposited += uint128(amount);

        if (u.streak > u.longestStreak) u.longestStreak = u.streak;

        if (!u.isDepositor) {
            u.isDepositor = true;
            depositors.push(msg.sender);
        }

        emit Deposited(msg.sender, u.streak, ts);
    }

    function claimReward() external {
        UserData storage u = users[msg.sender];
        if (u.streak < STREAK_THRESHOLD || u.streak % STREAK_THRESHOLD != 0) revert NeedMilestone();
        if (u.streak <= u.lastClaimedStreak) revert AlreadyClaimed();

        uint256 reward = _rewardAmount(u.streak);
        if (cUSD.balanceOf(address(this)) < reward) revert PoolEmpty();

        // CEI: state before external call; earn a shield on milestone
        u.lastClaimedStreak = uint32(u.streak);
        if (u.shields < MAX_SHIELDS) unchecked { u.shields++; }

        if (!cUSD.transfer(msg.sender, reward)) revert TransferFailed();
        emit RewardClaimed(msg.sender, u.streak, reward);
    }

    function withdraw() external {
        UserData storage u = users[msg.sender];
        uint128 amount = u.totalDeposited;
        if (amount == 0) revert NothingToWithdraw();

        u.totalDeposited = 0;
        u.streak = 0;
        u.lastDeposit = 0;
        u.shields = 0;

        if (!cUSD.transfer(msg.sender, amount)) revert TransferFailed();
    }

    // Anyone can fund the reward pool
    function fundPool(uint256 amount) external {
        if (!cUSD.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        emit PoolFunded(msg.sender, amount);
    }

    function _rewardAmount(uint32 streak) internal pure returns (uint256) {
        if (streak >= 30) return REWARD_TIER3;
        if (streak >= 14) return REWARD_TIER2;
        return REWARD_TIER1;
    }

    function getUser(address user) external view returns (
        uint256 streak,
        uint256 lastDeposit,
        uint256 totalDeposited,
        uint256 longestStreak,
        bool    canDeposit,
        uint256 lastClaimedStreak,
        uint8   shields
    ) {
        UserData storage u = users[user];
        return (
            u.streak,
            u.lastDeposit,
            u.totalDeposited,
            u.longestStreak,
            uint40(block.timestamp) >= u.lastDeposit + COOLDOWN,
            u.lastClaimedStreak,
            u.shields
        );
    }

    // Returns top-N depositors sorted by streak descending
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

        // Partial selection sort — only sort enough to fill `count` slots
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

    function totalDepositors() external view returns (uint256) {
        return depositors.length;
    }

    function poolBalance() external view returns (uint256) {
        return cUSD.balanceOf(address(this));
    }
}
