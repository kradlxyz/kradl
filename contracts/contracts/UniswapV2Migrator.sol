// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IDexMigrator} from "./interfaces/IDexMigrator.sol";

interface IUniswapV2Router02 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity);
}

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

/**
 * @title UniswapV2Migrator
 * @notice Production DEX graduation adapter for KradlLaunchpad.
 *         Automatically pairs graduated ETH + 200M reserved tokens on any Uniswap V2-compatible
 *         DEX (Uniswap V2 on Base, Aerodrome V2, or Robinhood Chain DEX) and permanently burns
 *         the LP tokens to 0x...dEaD so liquidity can never be rugged.
 */
contract UniswapV2Migrator is IDexMigrator, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    address public immutable launchpad;
    IUniswapV2Router02 public immutable router;
    IUniswapV2Factory public immutable factory;
    address public immutable weth;

    event LiquidityMigrated(
        address indexed token,
        address indexed liquidityPool,
        uint256 amountToken,
        uint256 amountEth,
        uint256 liquidityBurned
    );

    error OnlyLaunchpad();
    error InvalidParams();
    error PoolCreationFailed();

    constructor(address launchpad_, address router_) {
        if (launchpad_ == address(0) || router_ == address(0)) revert InvalidParams();
        launchpad = launchpad_;
        router = IUniswapV2Router02(router_);
        address factoryAddr = router.factory();
        address wethAddr = router.WETH();
        if (factoryAddr == address(0) || wethAddr == address(0)) revert InvalidParams();
        factory = IUniswapV2Factory(factoryAddr);
        weth = wethAddr;
    }

    /**
     * @notice Called exclusively by KradlLaunchpad upon bonding curve graduation.
     *         Creates/resolves the V2 pair, adds liquidity, and burns LP tokens permanently.
     */
    function migrate(
        address token,
        uint256 tokenAmount
    ) external payable override nonReentrant returns (address liquidityPool) {
        if (msg.sender != launchpad) revert OnlyLaunchpad();
        if (token == address(0) || tokenAmount == 0 || msg.value == 0) revert InvalidParams();

        // Pull reserved tokens from launchpad
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Ensure V2 pair exists (resistant to front-run createPair griefing)
        liquidityPool = factory.getPair(token, weth);
        if (liquidityPool == address(0)) {
            liquidityPool = factory.createPair(token, weth);
        }
        if (liquidityPool == address(0)) revert PoolCreationFailed();

        // Approve router, add liquidity, and mint LP tokens directly to DEAD_ADDRESS
        IERC20(token).forceApprove(address(router), tokenAmount);

        (uint256 usedTokens, uint256 usedEth, uint256 liquidity) = router.addLiquidityETH{
            value: msg.value
        }(token, tokenAmount, 0, 0, DEAD_ADDRESS, block.timestamp);

        // Clear any leftover approval
        IERC20(token).forceApprove(address(router), 0);

        // Burn any leftover dust tokens so nothing remains trapped in migrator
        if (tokenAmount > usedTokens) {
            IERC20(token).safeTransfer(DEAD_ADDRESS, tokenAmount - usedTokens);
        }

        // Return any unused ETH dust back to launchpad
        if (msg.value > usedEth) {
            (bool ok, ) = payable(launchpad).call{value: msg.value - usedEth}("");
            require(ok, "ETH dust refund failed");
        }

        emit LiquidityMigrated(token, liquidityPool, usedTokens, usedEth, liquidity);
    }

    receive() external payable {}
}
