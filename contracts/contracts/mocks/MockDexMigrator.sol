// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IDexMigrator} from "../interfaces/IDexMigrator.sol";

/**
 * @title MockDexMigrator
 * @notice Test-only DEX migrator that pulls tokens + ETH and returns a deterministic pool address.
 */
contract MockDexMigrator is IDexMigrator {
    using SafeERC20 for IERC20;

    mapping(address => uint256) public migratedEth;
    mapping(address => uint256) public migratedTokens;

    function migrate(
        address token,
        uint256 tokenAmount
    ) external payable override returns (address liquidityPool) {
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);
        migratedEth[token] += msg.value;
        migratedTokens[token] += tokenAmount;
        liquidityPool = address(uint160(uint256(keccak256(abi.encodePacked(token, block.number)))));
    }
}
