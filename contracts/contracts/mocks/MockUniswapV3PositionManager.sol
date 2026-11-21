// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {INonfungiblePositionManager} from "../UniswapV3Migrator.sol";

contract MockWETH9 is ERC20 {
    constructor() ERC20("Wrapped Ether", "WETH") {}

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }
}

contract MockUniswapV3PositionManager is INonfungiblePositionManager {
    using SafeERC20 for IERC20;

    uint256 public nextTokenId = 1;
    mapping(bytes32 => address) public pools;

    address public lastRecipient;
    uint160 public lastSqrtPriceX96;
    int24 public lastTickLower;
    int24 public lastTickUpper;
    uint256 public lastAmount0;
    uint256 public lastAmount1;

    function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint24 fee,
        uint160 sqrtPriceX96
    ) external payable override returns (address pool) {
        require(token0 < token1, "UNSORTED");
        require(sqrtPriceX96 > 0, "ZERO_PRICE");
        bytes32 key = keccak256(abi.encodePacked(token0, token1, fee));
        pool = pools[key];
        if (pool == address(0)) {
            pool = address(uint160(uint256(keccak256(abi.encodePacked(key, block.timestamp)))));
            pools[key] = pool;
        }
        lastSqrtPriceX96 = sqrtPriceX96;
    }

    function mint(
        MintParams calldata params
    )
        external
        payable
        override
        returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)
    {
        require(params.deadline >= block.timestamp, "EXPIRED");
        require(params.token0 < params.token1, "UNSORTED");

        IERC20(params.token0).safeTransferFrom(msg.sender, address(this), params.amount0Desired);
        IERC20(params.token1).safeTransferFrom(msg.sender, address(this), params.amount1Desired);

        tokenId = nextTokenId++;
        liquidity = 1_000_000;
        amount0 = params.amount0Desired;
        amount1 = params.amount1Desired;

        lastRecipient = params.recipient;
        lastTickLower = params.tickLower;
        lastTickUpper = params.tickUpper;
        lastAmount0 = amount0;
        lastAmount1 = amount1;
    }
}
