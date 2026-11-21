// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title KradlVestingVault
 * @notice Non-custodial, immutable linear token vesting vault for Kradl project builders.
 *         Allows creators to lock their tokens on-chain with a cliff + linear release schedule
 *         to prove long-term alignment and prevent early dumps.
 */
contract KradlVestingVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct VestingLock {
        address token;
        address beneficiary;
        uint256 totalAmount;
        uint256 claimedAmount;
        uint64 startTime;
        uint64 cliffDuration;
        uint64 duration;
    }

    uint256 public nextLockId;
    mapping(uint256 => VestingLock) public locks;
    mapping(address => uint256[]) public tokenLocks;
    mapping(address => uint256[]) public beneficiaryLocks;

    event LockCreated(
        uint256 indexed lockId,
        address indexed token,
        address indexed beneficiary,
        uint256 amount,
        uint64 startTime,
        uint64 cliffDuration,
        uint64 duration
    );

    event TokensClaimed(
        uint256 indexed lockId,
        address indexed beneficiary,
        uint256 amount
    );

    error InvalidParams();
    error NotBeneficiary();
    error NothingClaimable();

    /**
     * @notice Lock ERC-20 tokens into an immutable linear vesting schedule.
     * @param token ERC-20 token address
     * @param beneficiary Recipient allowed to claim vested tokens
     * @param amount Total token amount (in wei)
     * @param cliffDuration Seconds before any tokens become claimable (can be 0)
     * @param duration Total vesting duration in seconds (must be >= cliffDuration and > 0)
     */
    function createLock(
        address token,
        address beneficiary,
        uint256 amount,
        uint64 cliffDuration,
        uint64 duration
    ) external nonReentrant returns (uint256 lockId) {
        if (
            token == address(0) ||
            beneficiary == address(0) ||
            amount == 0 ||
            duration == 0 ||
            cliffDuration > duration
        ) {
            revert InvalidParams();
        }

        lockId = nextLockId++;
        uint64 startTime = uint64(block.timestamp);

        locks[lockId] = VestingLock({
            token: token,
            beneficiary: beneficiary,
            totalAmount: amount,
            claimedAmount: 0,
            startTime: startTime,
            cliffDuration: cliffDuration,
            duration: duration
        });

        tokenLocks[token].push(lockId);
        beneficiaryLocks[beneficiary].push(lockId);

        emit LockCreated(lockId, token, beneficiary, amount, startTime, cliffDuration, duration);

        // Pull tokens after state update (CEI)
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Returns the currently claimable token amount for a lock.
     */
    function claimableAmount(uint256 lockId) public view returns (uint256) {
        VestingLock storage lock = locks[lockId];
        if (lock.totalAmount == 0) return 0;

        uint256 elapsed = block.timestamp > lock.startTime ? block.timestamp - lock.startTime : 0;
        if (elapsed < lock.cliffDuration) {
            return 0;
        }

        uint256 vested;
        if (elapsed >= lock.duration) {
            vested = lock.totalAmount;
        } else {
            vested = (lock.totalAmount * elapsed) / lock.duration;
        }

        return vested > lock.claimedAmount ? vested - lock.claimedAmount : 0;
    }

    /**
     * @notice Claim all currently vested tokens for a lock.
     */
    function claim(uint256 lockId) external nonReentrant {
        VestingLock storage lock = locks[lockId];
        if (msg.sender != lock.beneficiary) revert NotBeneficiary();

        uint256 amount = claimableAmount(lockId);
        if (amount == 0) revert NothingClaimable();

        // Effects before interaction (CEI)
        lock.claimedAmount += amount;

        emit TokensClaimed(lockId, lock.beneficiary, amount);
        IERC20(lock.token).safeTransfer(lock.beneficiary, amount);
    }

    function getTokenLockIds(address token) external view returns (uint256[] memory) {
        return tokenLocks[token];
    }

    function getBeneficiaryLockIds(address beneficiary) external view returns (uint256[] memory) {
        return beneficiaryLocks[beneficiary];
    }
}
