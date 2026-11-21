// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IDexMigrator} from "./interfaces/IDexMigrator.sol";

interface IWETH9 is IERC20 {
    function deposit() external payable;
}

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint24 fee,
        uint160 sqrtPriceX96
    ) external payable returns (address pool);

    function mint(
        MintParams calldata params
    ) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);
}

/**
 * @title UniswapV3Migrator
 * @notice Production Uniswap V3 graduation adapter for KradlLaunchpad (primary adapter for
 *         Robinhood Chain Mainnet 4663 and Base Mainnet 8453).
 *         Wraps graduated ETH into WETH, creates/initializes the 1% fee tier full-range V3 pool,
 *         and mints the LP Position NFT directly to 0x...dEaD (permanent liquidity lock).
 */
contract UniswapV3Migrator is IDexMigrator, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    uint24 public constant POOL_FEE = 10_000; // 1.00% fee tier (tickSpacing = 200)
    int24 public constant MIN_TICK = -887_200;
    int24 public constant MAX_TICK = 887_200;

    address public immutable launchpad;
    INonfungiblePositionManager public immutable positionManager;
    IWETH9 public immutable weth;

    event LiquidityMigratedV3(
        address indexed token,
        address indexed liquidityPool,
        uint256 indexed positionTokenId,
        uint128 liquidity,
        uint256 amountTokenUsed,
        uint256 amountWethUsed
    );

    error OnlyLaunchpad();
    error InvalidParams();
    error PoolCreationFailed();

    constructor(address launchpad_, address positionManager_, address weth_) {
        if (launchpad_ == address(0) || positionManager_ == address(0) || weth_ == address(0)) {
            revert InvalidParams();
        }
        launchpad = launchpad_;
        positionManager = INonfungiblePositionManager(positionManager_);
        weth = IWETH9(weth_);
    }

    /**
     * @notice Computes exact Uniswap V3 sqrtPriceX96 = sqrt(amount1 / amount0) * 2^96
     *         without uint256 overflow across realistic token/ETH supply ratios.
     */
    function computeSqrtPriceX96(uint256 amount0, uint256 amount1) public pure returns (uint160) {
        if (amount0 == 0 || amount1 == 0) revert InvalidParams();
        uint256 ratioX128 = Math.mulDiv(amount1, uint256(1) << 128, amount0);
        uint256 sqrtX64 = Math.sqrt(ratioX128);
        return uint160(sqrtX64 << 32);
    }

    /**
     * @notice Called exclusively by KradlLaunchpad upon bonding curve graduation.
     */
    function migrate(
        address token,
        uint256 tokenAmount
    ) external payable override nonReentrant returns (address liquidityPool) {
        if (msg.sender != launchpad) revert OnlyLaunchpad();
        if (token == address(0) || token == address(weth) || tokenAmount == 0 || msg.value == 0) {
            revert InvalidParams();
        }

        // Pull reserved tokens & wrap graduated ETH to WETH
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);
        weth.deposit{value: msg.value}();

        bool tokenIsToken0 = token < address(weth);
        address token0 = tokenIsToken0 ? token : address(weth);
        address token1 = tokenIsToken0 ? address(weth) : token;
        uint256 amount0Desired = tokenIsToken0 ? tokenAmount : msg.value;
        uint256 amount1Desired = tokenIsToken0 ? msg.value : tokenAmount;

        uint160 sqrtPriceX96 = computeSqrtPriceX96(amount0Desired, amount1Desired);

        liquidityPool = positionManager.createAndInitializePoolIfNecessary(
            token0,
            token1,
            POOL_FEE,
            sqrtPriceX96
        );
        if (liquidityPool == address(0)) revert PoolCreationFailed();

        IERC20(token0).forceApprove(address(positionManager), amount0Desired);
        IERC20(token1).forceApprove(address(positionManager), amount1Desired);

        (uint256 positionTokenId, uint128 liquidity, uint256 amount0Used, uint256 amount1Used) =
            positionManager.mint(
                INonfungiblePositionManager.MintParams({
                    token0: token0,
                    token1: token1,
                    fee: POOL_FEE,
                    tickLower: MIN_TICK,
                    tickUpper: MAX_TICK,
                    amount0Desired: amount0Desired,
                    amount1Desired: amount1Desired,
                    amount0Min: 0,
                    amount1Min: 0,
                    recipient: DEAD_ADDRESS,
                    deadline: block.timestamp
                })
            );

        // Clear residual approvals
        IERC20(token0).forceApprove(address(positionManager), 0);
        IERC20(token1).forceApprove(address(positionManager), 0);

        uint256 tokenUsed = tokenIsToken0 ? amount0Used : amount1Used;
        uint256 wethUsed = tokenIsToken0 ? amount1Used : amount0Used;

        // Burn any leftover dust tokens so nothing remains trapped
        if (tokenAmount > tokenUsed) {
            IERC20(token).safeTransfer(DEAD_ADDRESS, tokenAmount - tokenUsed);
        }
        if (msg.value > wethUsed) {
            IERC20(address(weth)).safeTransfer(launchpad, msg.value - wethUsed);
        }

        emit LiquidityMigratedV3(
            token,
            liquidityPool,
            positionTokenId,
            liquidity,
            tokenUsed,
            wethUsed
        );
    }

    receive() external payable {}
}
