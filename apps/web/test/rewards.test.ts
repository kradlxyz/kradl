import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeSeasonRewards,
  getRewardTier,
  POINTS_CONFIG,
  validateReferralBinding,
} from "../src/lib/rewards";

const ALICE = "0x1111111111111111111111111111111111111111";
const BOB = "0x2222222222222222222222222222222222222222";
const SYBIL = "0x3333333333333333333333333333333333333333";

describe("@kradl/web rewards & referral engine", () => {
  it("computes launch, update (with anti-spam cap), trading, and early supporter points accurately", () => {
    const results = computeSeasonRewards(
      [
        {
          walletAddress: ALICE,
          verifiedLaunches: 1,
          unverifiedLaunches: 0,
          // 25 updates on 1 project must be capped at MAX_UPDATES_PER_PROJECT (10)
          updatesPerProject: [25],
          totalVolumeWei: 50_000_000_000_000_000n, // 0.05 ETH -> 500 pts
          uniqueProjectsTraded: 2, // 300 pts
          tradeCount: 3,
        },
      ],
      []
    );

    assert.equal(results.length, 1);
    const alice = results[0];
    assert.equal(alice.launchPoints, 1000);
    assert.equal(alice.updatePoints, POINTS_CONFIG.MAX_UPDATES_PER_PROJECT * POINTS_CONFIG.UPDATE_PTS);
    assert.equal(alice.tradingPoints, 500);
    assert.equal(alice.earlySupporterPoints, 300);
    assert.equal(alice.totalPoints, 2300);
    assert.equal(alice.tier, "Builder");
  });

  it("enforces anti-Sybil referral rules: empty wallets award 0 pts, active wallets award bonus + 15% trading share", () => {
    const results = computeSeasonRewards(
      [
        {
          walletAddress: BOB,
          verifiedLaunches: 0,
          unverifiedLaunches: 0,
          updatesPerProject: [],
          totalVolumeWei: 100_000_000_000_000_000n, // 0.1 ETH -> 1000 trading pts
          uniqueProjectsTraded: 1,
          tradeCount: 2,
        },
      ],
      [
        { referrerAddress: ALICE, refereeAddress: BOB }, // active
        { referrerAddress: ALICE, refereeAddress: SYBIL }, // empty Sybil wallet
      ]
    );

    const alice = results.find((r) => r.walletAddress === ALICE);
    assert.ok(alice);
    assert.equal(alice.activeReferralsCount, 1);
    assert.equal(alice.pendingReferralsCount, 1);
    // 250 bonus + 15% of Bob's 1000 trading pts (150) = 400
    assert.equal(alice.referralPoints, 400);
    assert.equal(alice.totalPoints, 400);
    assert.equal(alice.tier, "Supporter");
  });

  it("blocks self-referrals, duplicate bindings, invalid addresses, and circular loops", () => {
    const selfRef = validateReferralBinding({
      referrerAddress: ALICE,
      refereeAddress: ALICE,
      existingReferrerForReferee: null,
      referrerOfReferrer: null,
    });
    assert.equal(selfRef.ok, false);

    const duplicate = validateReferralBinding({
      referrerAddress: ALICE,
      refereeAddress: BOB,
      existingReferrerForReferee: SYBIL,
      referrerOfReferrer: null,
    });
    assert.equal(duplicate.ok, false);

    const circular = validateReferralBinding({
      referrerAddress: ALICE,
      refereeAddress: BOB,
      existingReferrerForReferee: null,
      referrerOfReferrer: BOB,
    });
    assert.equal(circular.ok, false);

    const invalid = validateReferralBinding({
      referrerAddress: "not-an-address",
      refereeAddress: BOB,
      existingReferrerForReferee: null,
      referrerOfReferrer: null,
    });
    assert.equal(invalid.ok, false);

    const valid = validateReferralBinding({
      referrerAddress: ALICE.toUpperCase().replace("0X", "0x"),
      refereeAddress: BOB,
      existingReferrerForReferee: null,
      referrerOfReferrer: null,
    });
    assert.equal(valid.ok, true);
  });

  it("assigns reward tiers deterministically", () => {
    assert.equal(getRewardTier(0), "Explorer");
    assert.equal(getRewardTier(300), "Supporter");
    assert.equal(getRewardTier(1500), "Builder");
    assert.equal(getRewardTier(5000), "Genesis");
  });
});
