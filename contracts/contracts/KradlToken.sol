// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title KradlToken
 * @notice Standard fair-launch ERC-20 token created by KradlLaunchpad.
 *         Anti-rug by design: fixed 1B supply minted once to the launchpad,
 *         no owner, no additional minting, no pause, no blacklist, no transfer tax.
 */
contract KradlToken is ERC20, ERC20Permit {
    uint256 public constant FIXED_SUPPLY = 1_000_000_000 * 1e18;

    address public immutable launchpad;
    address public immutable creator;

    constructor(
        string memory name_,
        string memory symbol_,
        address creator_
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        launchpad = msg.sender;
        creator = creator_;
        _mint(msg.sender, FIXED_SUPPLY);
    }
}
