// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IDexMigrator
 * @notice Pluggable per-chain DEX liquidity migration adapter (e.g. Uniswap V2/V3/V4).
 */
interface IDexMigrator {
    /**
     * @notice Receives graduated ETH and token reserves, creates a liquidity pool,
     *         permanently locks/burns LP tokens, and returns the created pool address.
     */
    function migrate(address token, uint256 tokenAmount) external payable returns (address liquidityPool);
}
