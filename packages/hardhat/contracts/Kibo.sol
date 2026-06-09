// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Kibo {
    IERC20 public constant cUSD = IERC20(0x765DE816845861e75A25fCA122bb6898B8B1282a);

    uint256 public constant MIN_DEPOSIT = 0.0001 ether; // 0.0001 cUSD minimum
    uint256 public constant MAX_DEPOSIT = 1 ether;     // 1 cUSD maximum
    uint256 public constant COOLDOWN = 20 hours;
    uint256 public constant STREAK_REWARD_THRESHOLD = 7;
    uint256 public constant REWARD_AMOUNT = 0.005 ether; // 0.005 cUSD reward per 7-day streak

    struct UserData {
        uint256 streak;
        uint256 lastDeposit;
        uint256 totalDeposited;
        uint256 longestStreak;
        uint256 lastClaimedStreak;
    }

    mapping(address => UserData) public users;
    address[] public depositors;
    mapping(address => bool) public hasDeposited;

    address public owner;

    event Deposited(address indexed user, uint256 streak, uint256 timestamp);
    event StreakBroken(address indexed user, uint256 oldStreak);
    event RewardClaimed(address indexed user, uint256 streak, uint256 reward);
    event PoolFunded(uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function deposit(uint256 amount) external {
        require(amount >= MIN_DEPOSIT && amount <= MAX_DEPOSIT, "Amount out of range");

        UserData storage u = users[msg.sender];

        require(
            block.timestamp >= u.lastDeposit + COOLDOWN,
            "Too soon: wait 20h between deposits"
        );

        // Break streak if > 48h gap (missed a day)
        if (u.lastDeposit != 0 && block.timestamp > u.lastDeposit + 48 hours) {
            emit StreakBroken(msg.sender, u.streak);
            u.streak = 0;
        }

        require(
            cUSD.transferFrom(msg.sender, address(this), amount),
            "cUSD transfer failed"
        );

        u.streak++;
        u.lastDeposit = block.timestamp;
        u.totalDeposited += amount;

        if (u.streak > u.longestStreak) {
            u.longestStreak = u.streak;
        }

        if (!hasDeposited[msg.sender]) {
            hasDeposited[msg.sender] = true;
            depositors.push(msg.sender);
        }

        emit Deposited(msg.sender, u.streak, block.timestamp);
    }

    function claimReward() external {
        UserData storage u = users[msg.sender];
        require(u.streak >= STREAK_REWARD_THRESHOLD, "Need 7-day streak");
        require(u.streak % STREAK_REWARD_THRESHOLD == 0, "Not at milestone");
        require(u.streak > u.lastClaimedStreak, "Already claimed this milestone");

        uint256 reward = REWARD_AMOUNT;
        require(cUSD.balanceOf(address(this)) >= reward, "Pool empty");

        // CEI: update state before external call
        u.lastClaimedStreak = u.streak;

        require(cUSD.transfer(msg.sender, reward), "Reward transfer failed");
        emit RewardClaimed(msg.sender, u.streak, reward);
    }

    function withdraw() external {
        UserData storage u = users[msg.sender];
        uint256 amount = u.totalDeposited;
        require(amount > 0, "Nothing to withdraw");

        u.totalDeposited = 0;
        u.streak = 0;
        u.lastDeposit = 0;

        cUSD.transfer(msg.sender, amount);
    }

    function fundPool(uint256 amount) external onlyOwner {
        require(cUSD.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit PoolFunded(amount);
    }

    function getUser(address user) external view returns (
        uint256 streak,
        uint256 lastDeposit,
        uint256 totalDeposited,
        uint256 longestStreak,
        bool canDeposit,
        uint256 lastClaimedStreak
    ) {
        UserData memory u = users[user];
        return (
            u.streak,
            u.lastDeposit,
            u.totalDeposited,
            u.longestStreak,
            block.timestamp >= u.lastDeposit + COOLDOWN,
            u.lastClaimedStreak
        );
    }

    function getLeaderboard(uint256 limit) external view returns (
        address[] memory addrs,
        uint256[] memory streaks,
        uint256[] memory totals
    ) {
        uint256 count = depositors.length < limit ? depositors.length : limit;
        addrs = new address[](count);
        streaks = new uint256[](count);
        totals = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            addrs[i] = depositors[i];
            streaks[i] = users[depositors[i]].streak;
            totals[i] = users[depositors[i]].totalDeposited;
        }
    }

    function totalDepositors() external view returns (uint256) {
        return depositors.length;
    }

    function poolBalance() external view returns (uint256) {
        return cUSD.balanceOf(address(this));
    }
}
