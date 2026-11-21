import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeProjectTrustReport } from "../src/lib/trustScore";

const ONE_MILLION_TOKENS = (1_000_000n * 10n ** 18n).toString();
const FIFTY_MILLION_TOKENS = (50_000_000n * 10n ** 18n).toString(); // 5% of 1B
const FIVE_HUNDRED_MILLION_TOKENS = (500_000_000n * 10n ** 18n).toString(); // 50% of 1B

describe("@kradl/web trust & safety scanner", () => {
  it("rates verified apps with healthy holder distribution as low risk", () => {
    const report = computeProjectTrustReport({
      creatorAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      isVerified: true,
      liveUrl: "https://novasql.dev",
      githubUrl: "https://github.com/novasql/novasql",
      graduated: false,
      launchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      updateCount: 2,
      holders: [
        { walletAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", balance: FIFTY_MILLION_TOKENS },
        { walletAddress: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", balance: ONE_MILLION_TOKENS },
      ],
    });

    assert.equal(report.builderHoldingPct, 5);
    assert.equal(report.top10ConcentrationPct, 5.1);
    assert.equal(report.isConcentrated, false);
    assert.equal(report.isNewLaunch, false);
    assert.equal(report.riskLevel, "low");
    assert.equal(report.checks.fixedSupply, true);
    assert.equal(report.checks.hasChangelog, true);
  });

  it("flags elevated risk when top-10 concentration exceeds 40%", () => {
    const report = computeProjectTrustReport({
      creatorAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      isVerified: true,
      liveUrl: "https://app.example.com",
      githubUrl: "https://github.com/org/repo",
      graduated: false,
      launchedAt: new Date(),
      updateCount: 0,
      holders: [
        {
          walletAddress: "0xcccccccccccccccccccccccccccccccccccccccc",
          balance: FIVE_HUNDRED_MILLION_TOKENS,
        },
      ],
    });

    assert.equal(report.builderHoldingPct, 0);
    assert.equal(report.top10ConcentrationPct, 50);
    assert.equal(report.isConcentrated, true);
    assert.equal(report.isNewLaunch, true);
    assert.equal(report.riskLevel, "elevated");
  });

  it("flags elevated risk for unverified projects with no live app or GitHub proof", () => {
    const report = computeProjectTrustReport({
      creatorAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      isVerified: false,
      liveUrl: null,
      githubUrl: null,
      graduated: false,
      launchedAt: new Date(),
      updateCount: 0,
      holders: [],
    });

    assert.equal(report.riskLevel, "elevated");
    assert.equal(report.checks.liveAppVerified, false);
    assert.equal(report.checks.githubVerified, false);
  });
});
