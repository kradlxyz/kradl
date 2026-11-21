// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title KradlMerkleDistributor
 * @notice Non-custodial, multi-campaign Merkle Airdrop distributor for Kradl Season rewards
 *         and builder community airdrops. Uses double-hashed leaves (OpenZeppelin standard)
 *         and packed bitmaps for gas-efficient claim tracking.
 */
contract KradlMerkleDistributor is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Campaign {
        address creator;
        address token;
        bytes32 merkleRoot;
        uint256 totalAmount;
        uint256 remainingAmount;
        uint64 deadline;
    }

    uint256 public nextCampaignId;
    mapping(uint256 => Campaign) public campaigns;
    // campaignId => wordIndex => bitmap
    mapping(uint256 => mapping(uint256 => uint256)) private _claimedBitMap;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        address indexed token,
        bytes32 merkleRoot,
        uint256 totalAmount,
        uint64 deadline
    );

    event Claimed(
        uint256 indexed campaignId,
        uint256 indexed index,
        address indexed account,
        uint256 amount
    );

    event CampaignSwept(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );

    error InvalidParams();
    error CampaignNotFound();
    error CampaignExpired();
    error CampaignActive();
    error AlreadyClaimed();
    error InvalidProof();
    error NotCreator();
    error InsufficientRemaining();

    /**
     * @notice Create and fund a new Merkle airdrop campaign.
     * @param token ERC-20 token to distribute
     * @param merkleRoot Root of the double-hashed Merkle tree
     * @param totalAmount Total tokens funded into the campaign
     * @param deadline Unix timestamp after which claims close and creator may sweep unclaimed tokens
     */
    function createCampaign(
        address token,
        bytes32 merkleRoot,
        uint256 totalAmount,
        uint64 deadline
    ) external nonReentrant returns (uint256 campaignId) {
        if (
            token == address(0) ||
            merkleRoot == bytes32(0) ||
            totalAmount == 0 ||
            deadline <= block.timestamp
        ) {
            revert InvalidParams();
        }

        campaignId = nextCampaignId++;
        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            token: token,
            merkleRoot: merkleRoot,
            totalAmount: totalAmount,
            remainingAmount: totalAmount,
            deadline: deadline
        });

        emit CampaignCreated(campaignId, msg.sender, token, merkleRoot, totalAmount, deadline);

        // Pull tokens after state update (CEI)
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);
    }

    /**
     * @notice Check whether a given leaf index has already been claimed for a campaign.
     */
    function isClaimed(uint256 campaignId, uint256 index) public view returns (bool) {
        uint256 wordIndex = index >> 8;
        uint256 bitIndex = index & 0xff;
        uint256 word = _claimedBitMap[campaignId][wordIndex];
        uint256 mask = (1 << bitIndex);
        return (word & mask) == mask;
    }

    /**
     * @notice Claim tokens for a verified leaf in an active campaign.
     * @dev Anyone may submit the proof on behalf of `account`; tokens always transfer to `account`.
     */
    function claim(
        uint256 campaignId,
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external nonReentrant {
        Campaign storage c = campaigns[campaignId];
        if (c.token == address(0)) revert CampaignNotFound();
        if (block.timestamp > c.deadline) revert CampaignExpired();
        if (isClaimed(campaignId, index)) revert AlreadyClaimed();
        if (amount == 0 || amount > c.remainingAmount) revert InsufficientRemaining();

        // Double-hash leaf to prevent second-preimage attacks
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(index, account, amount))));
        if (!MerkleProof.verifyCalldata(merkleProof, c.merkleRoot, leaf)) {
            revert InvalidProof();
        }

        // Effects before interaction (CEI)
        uint256 wordIndex = index >> 8;
        uint256 bitIndex = index & 0xff;
        _claimedBitMap[campaignId][wordIndex] |= (1 << bitIndex);
        c.remainingAmount -= amount;

        emit Claimed(campaignId, index, account, amount);
        IERC20(c.token).safeTransfer(account, amount);
    }

    /**
     * @notice Sweep unclaimed tokens back to the campaign creator after the deadline has passed.
     */
    function sweepExpired(uint256 campaignId) external nonReentrant {
        Campaign storage c = campaigns[campaignId];
        if (c.token == address(0)) revert CampaignNotFound();
        if (msg.sender != c.creator) revert NotCreator();
        if (block.timestamp <= c.deadline) revert CampaignActive();

        uint256 remaining = c.remainingAmount;
        if (remaining == 0) revert InsufficientRemaining();

        // Effects before interaction (CEI)
        c.remainingAmount = 0;

        emit CampaignSwept(campaignId, c.creator, remaining);
        IERC20(c.token).safeTransfer(c.creator, remaining);
    }
}
