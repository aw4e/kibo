// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Kibo {
    IERC20 public constant cUSD = IERC20(0x765DE816845861e75A25fCA122bb6898B8B1282a);

    uint256 public constant MIN_DEPOSIT       = 0.0001 ether;
    uint256 public constant MAX_DEPOSIT       = 1 ether;
    uint256 public constant COOLDOWN          = 20 hours;
    uint256 public constant STREAK_THRESHOLD  = 7;
    uint256 public constant REWARD_AMOUNT     = 0.005 ether;

    // Custom errors — no string storage, ~50 gas cheaper per revert
    error AmountOutOfRange();
    error TooSoon();
    error PoolEmpty();
    error NeedMilestone();
    error AlreadyClaimed();
    error NothingToWithdraw();
    error NotOwner();
    error TransferFailed();

    // Packed into 2 storage slots instead of 5+mapping
    // slot 1: streak(32) + longestStreak(32) + lastClaimedStreak(32) + lastDeposit(40) + isDepositor(8) = 144 bits
    // slot 2: totalDeposited(128) = 128 bits
    struct UserData {
        uint32  streak;
        uint32  longestStreak;
        uint32  lastClaimedStreak;
        uint40  lastDeposit;
        bool    isDepositor;
        uint128 totalDeposited;
    }

    mapping(address => UserData) public users;
    address[] public depositors;
    address public owner;

    event Deposited(address indexed user, uint32 streak, uint40 timestamp);
    event StreakBroken(address indexed user, uint32 oldStreak);
    event RewardClaimed(address indexed user, uint32 streak, uint256 reward);
    event PoolFunded(uint256 amount);

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

        // Break streak if > 48h gap (missed a day)
        if (u.lastDeposit != 0 && ts > u.lastDeposit + 48 hours) {
            emit StreakBroken(msg.sender, u.streak);
            u.streak = 0;
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
        if (cUSD.balanceOf(address(this)) < REWARD_AMOUNT) revert PoolEmpty();

        // CEI: state before external call
        u.lastClaimedStreak = uint32(u.streak);

        if (!cUSD.transfer(msg.sender, REWARD_AMOUNT)) revert TransferFailed();
        emit RewardClaimed(msg.sender, u.streak, REWARD_AMOUNT);
    }

    function withdraw() external {
        UserData storage u = users[msg.sender];
        uint128 amount = u.totalDeposited;
        if (amount == 0) revert NothingToWithdraw();

        u.totalDeposited = 0;
        u.streak = 0;
        u.lastDeposit = 0;

        if (!cUSD.transfer(msg.sender, amount)) revert TransferFailed();
    }

    function fundPool(uint256 amount) external onlyOwner {
        if (!cUSD.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        emit PoolFunded(amount);
    }

    function getUser(address user) external view returns (
        uint256 streak,
        uint256 lastDeposit,
        uint256 totalDeposited,
        uint256 longestStreak,
        bool    canDeposit,
        uint256 lastClaimedStreak
    ) {
        UserData storage u = users[user];
        return (
            u.streak,
            u.lastDeposit,
            u.totalDeposited,
            u.longestStreak,
            uint40(block.timestamp) >= u.lastDeposit + COOLDOWN,
            u.lastClaimedStreak
        );
    }

    function getLeaderboard(uint256 limit) external view returns (
        address[] memory addrs,
        uint256[] memory streaks,
        uint256[] memory totals
    ) {
        uint256 count = depositors.length < limit ? depositors.length : limit;
        addrs  = new address[](count);
        streaks = new uint256[](count);
        totals  = new uint256[](count);

        for (uint256 i; i < count;) {
            address a = depositors[i];
            addrs[i]   = a;
            streaks[i] = users[a].streak;
            totals[i]  = users[a].totalDeposited;
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
