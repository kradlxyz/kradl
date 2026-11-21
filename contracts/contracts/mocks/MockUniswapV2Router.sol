// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockUniswapV2Factory & MockUniswapV2Router
 * @notice Test-only Uniswap V2 mocks to verify full KradlLaunchpad -> UniswapV2Migrator graduation.
 */
contract MockUniswapV2Factory {
    mapping(address => mapping(address => address)) public getPair;

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(getPair[tokenA][tokenB] == address(0), "PAIR_EXISTS");
        pair = address(uint160(uint256(keccak256(abi.encodePacked(tokenA, tokenB, block.timestamp)))));
        getPair[tokenA][tokenB] = pair;
        getPair[tokenB][tokenA] = pair;
    }
}

contract MockUniswapV2Router {
    using SafeERC20 for IERC20;

    address public immutable factory;
    address public immutable WETH;

    address public lastTo;
    uint256 public lastLiquidity;
    uint256 public lastEth;
    uint256 public lastTokens;

    constructor(address factory_, address weth_) {
        factory = factory_;
        WETH = weth_;
    }

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256,
        uint256,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity) {
        require(deadline >= block.timestamp, "EXPIRED");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amountTokenDesired);
        amountToken = amountTokenDesired;
        amountETH = msg.value;
        liquidity = amountTokenDesired / 1000;
        lastTo = to;
        lastLiquidity = liquidity;
        lastEth = amountETH;
        lastTokens = amountToken;
    }
}
