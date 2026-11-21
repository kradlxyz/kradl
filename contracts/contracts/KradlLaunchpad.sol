// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {KradlToken} from "./KradlToken.sol";
import {IDexMigrator} from "./interfaces/IDexMigrator.sol";

/**
 * @title KradlLaunchpad
 * @notice Multi-chain EVM App & Project Token Launchpad with Constant-Product Bonding Curve,
 *         0.5% Platform + 0.5% Creator continuous fee split, and 2% DEX Graduation fee.
 */
contract KradlLaunchpad is ReentrancyGuard, Ownable2Step {
    using SafeERC20 for IERC20;

    // =========================================================================
    // Constants
    // =========================================================================

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant PLATFORM_FEE_BPS = 50; // 0.5%
    uint256 public constant CREATOR_FEE_BPS = 50; // 0.5%
    uint256 public constant TOTAL_TRADE_FEE_BPS = 100; // 1.0%
    uint256 public constant GRADUATION_FEE_BPS = 200; // 2.0%

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 1e18;
    uint256 public constant CURVE_SUPPLY = 800_000_000 * 1e18;
    uint256 public constant DEX_RESERVE_SUPPLY = 200_000_000 * 1e18;

    uint256 public constant MAX_NAME_LEN = 64;
    uint256 public constant MAX_SYMBOL_LEN = 16;
    uint256 public constant MAX_URI_LEN = 256;

    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // =========================================================================
    // Structs
    // =========================================================================

    struct CurveState {
        address creator;
        uint256 virtualEthReserve;
        uint256 virtualTokenReserve;
        uint256 realEthReserve;
        uint256 realTokenReserve;
        uint256 dexTokenReserve;
        uint256 graduationThreshold;
        uint64 createdAt;
        bool graduated;
        address liquidityPool;
    }

    struct PendingMigration {
        uint256 ethAmount;
        uint256 tokenAmount;
        bool pending;
    }

    // =========================================================================
    // State Variables
    // =========================================================================

    uint256 public defaultVirtualEthReserve;
    uint256 public defaultVirtualTokenReserve;
    uint256 public defaultGraduationThreshold;
    uint256 public creationFee;

    address public dexMigrator;

    uint256 public platformFeesAccrued;
    mapping(address => uint256) public creatorFeesAccrued;

    mapping(address => CurveState) public curves;
    mapping(address => PendingMigration) public pendingMigrations;
    address[] public allTokens;

    // =========================================================================
    // Events
    // =========================================================================

    event ProjectLaunched(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        string metadataUri,
        uint256 virtualEthReserve,
        uint256 virtualTokenReserve,
        uint256 graduationThreshold,
        uint256 timestamp
    );

    event Trade(
        address indexed token,
        address indexed trader,
        bool isBuy,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 platformFee,
        uint256 creatorFee,
        uint256 virtualEthReserve,
        uint256 virtualTokenReserve,
        uint256 realEthReserve,
        uint256 timestamp
    );

    event ProjectGraduated(
        address indexed token,
        uint256 ethMigrated,
        uint256 tokensMigrated,
        uint256 graduationFee,
        address liquidityPool,
        uint256 timestamp
    );

    event PendingMigrationExecuted(
        address indexed token,
        uint256 ethMigrated,
        uint256 tokensMigrated,
        address liquidityPool,
        uint256 timestamp
    );

    event CreatorFeesClaimed(address indexed creator, uint256 amount, uint256 timestamp);
    event PlatformFeesClaimed(address indexed recipient, uint256 amount, uint256 timestamp);
    event CurveDefaultsUpdated(
        uint256 virtualEthReserve,
        uint256 virtualTokenReserve,
        uint256 graduationThreshold,
        uint256 creationFee
    );
    event DexMigratorUpdated(address indexed newMigrator);

    // =========================================================================
    // Custom Errors
    // =========================================================================

    error InvalidConfig();
    error EmptyInput();
    error InsufficientCreationFee();
    error UnknownToken();
    error AlreadyGraduated();
    error ZeroAmount();
    error SlippageExceeded();
    error InsufficientLiquidity();
    error NothingToClaim();
    error EthTransferFailed();
    error MigratorNotSet();
    error NoPendingMigration();

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor(
        address initialOwner_,
        uint256 virtualEthReserve_,
        uint256 virtualTokenReserve_,
        uint256 graduationThreshold_,
        uint256 creationFee_
    ) Ownable(initialOwner_) {
        if (
            virtualEthReserve_ == 0 ||
            virtualTokenReserve_ < CURVE_SUPPLY ||
            graduationThreshold_ == 0
        ) {
            revert InvalidConfig();
        }
        defaultVirtualEthReserve = virtualEthReserve_;
        defaultVirtualTokenReserve = virtualTokenReserve_;
        defaultGraduationThreshold = graduationThreshold_;
        creationFee = creationFee_;
    }

    // =========================================================================
    // Launch Function
    // =========================================================================

    /**
     * @notice Launch a new project token on a Kradl Bonding Curve.
     *         Any msg.value above creationFee is automatically used for an initial creator buy.
     */
    function launchProject(
        string calldata name_,
        string calldata symbol_,
        string calldata metadataUri_,
        uint256 minInitialTokensOut_
    ) external payable nonReentrant returns (address token) {
        if (
            bytes(name_).length == 0 ||
            bytes(name_).length > MAX_NAME_LEN ||
            bytes(symbol_).length == 0 ||
            bytes(symbol_).length > MAX_SYMBOL_LEN ||
            bytes(metadataUri_).length > MAX_URI_LEN
        ) {
            revert EmptyInput();
        }
        if (msg.value < creationFee) {
            revert InsufficientCreationFee();
        }

        if (creationFee > 0) {
            platformFeesAccrued += creationFee;
        }

        KradlToken newToken = new KradlToken(name_, symbol_, msg.sender);
        token = address(newToken);

        curves[token] = CurveState({
            creator: msg.sender,
            virtualEthReserve: defaultVirtualEthReserve,
            virtualTokenReserve: defaultVirtualTokenReserve,
            realEthReserve: 0,
            realTokenReserve: CURVE_SUPPLY,
            dexTokenReserve: DEX_RESERVE_SUPPLY,
            graduationThreshold: defaultGraduationThreshold,
            createdAt: uint64(block.timestamp),
            graduated: false,
            liquidityPool: address(0)
        });
        allTokens.push(token);

        emit ProjectLaunched(
            token,
            msg.sender,
            name_,
            symbol_,
            metadataUri_,
            defaultVirtualEthReserve,
            defaultVirtualTokenReserve,
            defaultGraduationThreshold,
            block.timestamp
        );

        uint256 initialBuyEth = msg.value - creationFee;
        if (initialBuyEth > 0) {
            _buy(token, msg.sender, initialBuyEth, minInitialTokensOut_);
        }
    }

    // =========================================================================
    // Trading Functions
    // =========================================================================

    function buy(address token, uint256 minTokensOut) external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        _buy(token, msg.sender, msg.value, minTokensOut);
    }

    function sell(
        address token,
        uint256 tokensIn,
        uint256 minEthOut
    ) external nonReentrant {
        if (tokensIn == 0) revert ZeroAmount();
        CurveState storage curve = curves[token];
        if (curve.creator == address(0)) revert UnknownToken();
        if (curve.graduated) revert AlreadyGraduated();
        if (curve.realEthReserve == 0) revert InsufficientLiquidity();

        uint256 grossEthOut = (tokensIn * curve.virtualEthReserve) /
            (curve.virtualTokenReserve + tokensIn);
        if (grossEthOut > curve.realEthReserve) {
            grossEthOut = curve.realEthReserve;
        }
        if (grossEthOut == 0) revert InsufficientLiquidity();

        uint256 platformFee = (grossEthOut * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 creatorFee = (grossEthOut * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netEthOut = grossEthOut - platformFee - creatorFee;

        if (netEthOut < minEthOut) revert SlippageExceeded();

        // Effects (CEI)
        curve.virtualEthReserve -= grossEthOut;
        curve.virtualTokenReserve += tokensIn;
        curve.realEthReserve -= grossEthOut;
        curve.realTokenReserve += tokensIn;

        platformFeesAccrued += platformFee;
        creatorFeesAccrued[curve.creator] += creatorFee;

        emit Trade(
            token,
            msg.sender,
            false,
            grossEthOut,
            tokensIn,
            platformFee,
            creatorFee,
            curve.virtualEthReserve,
            curve.virtualTokenReserve,
            curve.realEthReserve,
            block.timestamp
        );

        // Interactions
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokensIn);
        _sendEth(msg.sender, netEthOut);
    }

    // =========================================================================
    // Pull-Payment Fee Claims
    // =========================================================================

    function claimCreatorFees() external nonReentrant {
        uint256 amount = creatorFeesAccrued[msg.sender];
        if (amount == 0) revert NothingToClaim();

        creatorFeesAccrued[msg.sender] = 0;
        emit CreatorFeesClaimed(msg.sender, amount, block.timestamp);
        _sendEth(msg.sender, amount);
    }

    function claimPlatformFees(address recipient) external onlyOwner nonReentrant {
        if (recipient == address(0)) revert InvalidConfig();
        uint256 amount = platformFeesAccrued;
        if (amount == 0) revert NothingToClaim();

        platformFeesAccrued = 0;
        emit PlatformFeesClaimed(recipient, amount, block.timestamp);
        _sendEth(recipient, amount);
    }

    // =========================================================================
    // Admin & Migration Helpers
    // =========================================================================

    function setCurveDefaults(
        uint256 virtualEthReserve_,
        uint256 virtualTokenReserve_,
        uint256 graduationThreshold_,
        uint256 creationFee_
    ) external onlyOwner {
        if (
            virtualEthReserve_ == 0 ||
            virtualTokenReserve_ < CURVE_SUPPLY ||
            graduationThreshold_ == 0
        ) {
            revert InvalidConfig();
        }
        defaultVirtualEthReserve = virtualEthReserve_;
        defaultVirtualTokenReserve = virtualTokenReserve_;
        defaultGraduationThreshold = graduationThreshold_;
        creationFee = creationFee_;

        emit CurveDefaultsUpdated(
            virtualEthReserve_,
            virtualTokenReserve_,
            graduationThreshold_,
            creationFee_
        );
    }

    function setDexMigrator(address newMigrator) external onlyOwner {
        dexMigrator = newMigrator;
        emit DexMigratorUpdated(newMigrator);
    }

    function executePendingMigration(address token) external onlyOwner nonReentrant {
        if (dexMigrator == address(0)) revert MigratorNotSet();
        PendingMigration storage pm = pendingMigrations[token];
        if (!pm.pending) revert NoPendingMigration();

        uint256 ethAmount = pm.ethAmount;
        uint256 tokenAmount = pm.tokenAmount;

        // Effects
        pm.ethAmount = 0;
        pm.tokenAmount = 0;
        pm.pending = false;

        // Interactions
        IERC20(token).forceApprove(dexMigrator, tokenAmount);
        address pool = IDexMigrator(dexMigrator).migrate{value: ethAmount}(token, tokenAmount);
        curves[token].liquidityPool = pool;

        emit PendingMigrationExecuted(token, ethAmount, tokenAmount, pool, block.timestamp);
    }

    // =========================================================================
    // View / Quote Helpers
    // =========================================================================

    function totalProjects() external view returns (uint256) {
        return allTokens.length;
    }

    function quoteBuy(
        address token,
        uint256 grossEthIn
    )
        external
        view
        returns (
            uint256 tokensOut,
            uint256 platformFee,
            uint256 creatorFee,
            uint256 ethRefund,
            bool willGraduate
        )
    {
        CurveState storage curve = curves[token];
        if (curve.creator == address(0) || curve.graduated || grossEthIn == 0) {
            return (0, 0, 0, grossEthIn, curve.graduated);
        }

        uint256 netEthIn;
        (netEthIn, platformFee, creatorFee, ethRefund) = _computeBuyAmounts(curve, grossEthIn);

        tokensOut = (netEthIn * curve.virtualTokenReserve) / (curve.virtualEthReserve + netEthIn);
        if (tokensOut > curve.realTokenReserve) {
            tokensOut = curve.realTokenReserve;
        }
        willGraduate =
            curve.realEthReserve + netEthIn >= curve.graduationThreshold ||
            tokensOut >= curve.realTokenReserve;
    }

    function quoteSell(
        address token,
        uint256 tokensIn
    )
        external
        view
        returns (uint256 netEthOut, uint256 platformFee, uint256 creatorFee)
    {
        CurveState storage curve = curves[token];
        if (
            curve.creator == address(0) ||
            curve.graduated ||
            tokensIn == 0 ||
            curve.realEthReserve == 0
        ) {
            return (0, 0, 0);
        }

        uint256 grossEthOut = (tokensIn * curve.virtualEthReserve) /
            (curve.virtualTokenReserve + tokensIn);
        if (grossEthOut > curve.realEthReserve) {
            grossEthOut = curve.realEthReserve;
        }

        platformFee = (grossEthOut * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        creatorFee = (grossEthOut * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
        netEthOut = grossEthOut - platformFee - creatorFee;
    }

    // =========================================================================
    // Internal Logic
    // =========================================================================

    function _buy(
        address token,
        address buyer,
        uint256 grossEthIn,
        uint256 minTokensOut
    ) internal {
        CurveState storage curve = curves[token];
        if (curve.creator == address(0)) revert UnknownToken();
        if (curve.graduated) revert AlreadyGraduated();

        (
            uint256 netEthIn,
            uint256 platformFee,
            uint256 creatorFee,
            uint256 ethRefund
        ) = _computeBuyAmounts(curve, grossEthIn);

        uint256 tokensOut = (netEthIn * curve.virtualTokenReserve) /
            (curve.virtualEthReserve + netEthIn);
        if (tokensOut > curve.realTokenReserve) {
            tokensOut = curve.realTokenReserve;
        }
        if (tokensOut == 0 || tokensOut < minTokensOut) revert SlippageExceeded();

        // Effects (CEI)
        curve.virtualEthReserve += netEthIn;
        curve.virtualTokenReserve -= tokensOut;
        curve.realEthReserve += netEthIn;
        curve.realTokenReserve -= tokensOut;

        platformFeesAccrued += platformFee;
        creatorFeesAccrued[curve.creator] += creatorFee;

        emit Trade(
            token,
            buyer,
            true,
            netEthIn,
            tokensOut,
            platformFee,
            creatorFee,
            curve.virtualEthReserve,
            curve.virtualTokenReserve,
            curve.realEthReserve,
            block.timestamp
        );

        bool shouldGraduate =
            curve.realEthReserve >= curve.graduationThreshold ||
            curve.realTokenReserve == 0;

        // Interactions
        IERC20(token).safeTransfer(buyer, tokensOut);

        if (ethRefund > 0) {
            _sendEth(buyer, ethRefund);
        }

        if (shouldGraduate) {
            _graduate(token);
        }
    }

    function _computeBuyAmounts(
        CurveState storage curve,
        uint256 grossEthIn
    )
        internal
        view
        returns (
            uint256 netEthIn,
            uint256 platformFee,
            uint256 creatorFee,
            uint256 ethRefund
        )
    {
        uint256 remainingEth = curve.graduationThreshold > curve.realEthReserve
            ? curve.graduationThreshold - curve.realEthReserve
            : 0;

        platformFee = (grossEthIn * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        creatorFee = (grossEthIn * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
        netEthIn = grossEthIn - platformFee - creatorFee;

        if (netEthIn > remainingEth) {
            uint256 grossNeeded = (remainingEth * BPS_DENOMINATOR +
                (BPS_DENOMINATOR - TOTAL_TRADE_FEE_BPS - 1)) /
                (BPS_DENOMINATOR - TOTAL_TRADE_FEE_BPS);
            if (grossNeeded > grossEthIn) {
                grossNeeded = grossEthIn;
            }
            platformFee = (grossNeeded * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
            creatorFee = (grossNeeded * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
            netEthIn = grossNeeded - platformFee - creatorFee;
            if (netEthIn > remainingEth) {
                netEthIn = remainingEth;
            }
            // Exact accounting: grossEthIn == netEthIn + platformFee + creatorFee + ethRefund
            ethRefund = grossEthIn - (netEthIn + platformFee + creatorFee);
        }
    }

    function _graduate(address token) internal {
        CurveState storage curve = curves[token];
        uint256 ethAvailable = curve.realEthReserve;
        uint256 tokensForDex = curve.dexTokenReserve;
        uint256 unsoldCurveTokens = curve.realTokenReserve;

        uint256 graduationFee = (ethAvailable * GRADUATION_FEE_BPS) / BPS_DENOMINATOR;
        uint256 ethForDex = ethAvailable - graduationFee;

        // Effects (CEI)
        curve.graduated = true;
        curve.realEthReserve = 0;
        curve.realTokenReserve = 0;
        curve.dexTokenReserve = 0;
        platformFeesAccrued += graduationFee;

        // Burn any unpurchased curve tokens so DEX allocation remains exact
        if (unsoldCurveTokens > 0) {
            IERC20(token).safeTransfer(DEAD_ADDRESS, unsoldCurveTokens);
        }

        address pool = address(0);
        if (dexMigrator != address(0)) {
            IERC20(token).forceApprove(dexMigrator, tokensForDex);
            pool = IDexMigrator(dexMigrator).migrate{value: ethForDex}(token, tokensForDex);
            curve.liquidityPool = pool;
        } else {
            pendingMigrations[token] = PendingMigration({
                ethAmount: ethForDex,
                tokenAmount: tokensForDex,
                pending: true
            });
        }

        emit ProjectGraduated(
            token,
            ethForDex,
            tokensForDex,
            graduationFee,
            pool,
            block.timestamp
        );
    }

    function _sendEth(address to, uint256 amount) internal {
        (bool ok, ) = payable(to).call{value: amount}("");
        if (!ok) revert EthTransferFailed();
    }
}
