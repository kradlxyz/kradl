import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CURVE_SUPPLY,
  quoteBuy,
  quoteSell,
  getSpotPriceWei,
  getCurveProgressBps,
  getChainConfig,
  getTxExplorerUrl,
  getAddressExplorerUrl,
  getLaunchpadAddress,
} from "../dist/index.js";

const ONE_ETH = 10n ** 18n;

function makeDefaultCurve() {
  return {
    virtualEthReserve: (15n * ONE_ETH) / 10n, // 1.5 ETH
    virtualTokenReserve: 1_073_000_000n * ONE_ETH,
    realEthReserve: 0n,
    realTokenReserve: CURVE_SUPPLY,
    graduationThreshold: 5n * ONE_ETH,
  };
}

describe("@kradl/shared bondingCurve math", () => {
  it("computes exact 0.5% platform + 0.5% creator fee split on buy", () => {
    const curve = makeDefaultCurve();
    const quote = quoteBuy(curve, ONE_ETH);

    assert.equal(quote.platformFee, (ONE_ETH * 50n) / 10_000n);
    assert.equal(quote.creatorFee, (ONE_ETH * 50n) / 10_000n);
    assert.equal(quote.netEthIn, ONE_ETH - quote.platformFee - quote.creatorFee);
    assert.equal(quote.ethRefund, 0n);
    assert.equal(quote.willGraduate, false);
    assert.ok(quote.tokensOut > 0n);
    assert.ok(quote.tokensOut <= curve.realTokenReserve);
  });

  it("caps buy at graduation threshold, sets willGraduate, and preserves exact wei refund invariant", () => {
    const curve = makeDefaultCurve();
    const hugeBuy = 8n * ONE_ETH;
    const quote = quoteBuy(curve, hugeBuy);

    assert.equal(quote.willGraduate, true);
    assert.equal(quote.netEthIn, curve.graduationThreshold);
    assert.ok(quote.ethRefund > 2n * ONE_ETH);
    assert.equal(quote.grossEthUsed + quote.ethRefund, hugeBuy);
  });

  it("handles zero, negative, and already-graduated buy inputs safely", () => {
    const curve = makeDefaultCurve();
    assert.equal(quoteBuy(curve, 0n).tokensOut, 0n);
    assert.equal(quoteBuy(curve, -10n).tokensOut, 0n);

    const graduated = { ...curve, realEthReserve: curve.graduationThreshold };
    const qGrad = quoteBuy(graduated, ONE_ETH);
    assert.equal(qGrad.tokensOut, 0n);
    assert.equal(qGrad.ethRefund, ONE_ETH);
    assert.equal(qGrad.willGraduate, true);
  });

  it("computes exact sell quote with 0.5% + 0.5% fees and caps at realEthReserve", () => {
    const curve = makeDefaultCurve();
    const buyQ = quoteBuy(curve, ONE_ETH);

    const afterBuyCurve = {
      ...curve,
      virtualEthReserve: curve.virtualEthReserve + buyQ.netEthIn,
      virtualTokenReserve: curve.virtualTokenReserve - buyQ.tokensOut,
      realEthReserve: curve.realEthReserve + buyQ.netEthIn,
      realTokenReserve: curve.realTokenReserve - buyQ.tokensOut,
    };

    const sellQ = quoteSell(afterBuyCurve, buyQ.tokensOut);
    assert.equal(sellQ.platformFee, (sellQ.grossEthOut * 50n) / 10_000n);
    assert.equal(sellQ.creatorFee, (sellQ.grossEthOut * 50n) / 10_000n);
    assert.equal(sellQ.netEthOut, sellQ.grossEthOut - sellQ.platformFee - sellQ.creatorFee);
    assert.ok(sellQ.grossEthOut <= afterBuyCurve.realEthReserve);
    // Round-trip buy -> sell must always return less than initial gross ETH (no arbitrage)
    assert.ok(sellQ.netEthOut < ONE_ETH);
  });

  it("computes spot price and curve progress bps accurately", () => {
    const curve = makeDefaultCurve();
    assert.ok(getSpotPriceWei(curve) > 0n);
    assert.equal(getCurveProgressBps(curve), 0);

    const half = { ...curve, realEthReserve: (25n * ONE_ETH) / 10n };
    assert.equal(getCurveProgressBps(half), 5_000);

    const over = { ...curve, realEthReserve: 10n * ONE_ETH };
    assert.equal(getCurveProgressBps(over), 10_000);
  });
});

describe("@kradl/shared chains & contracts config", () => {
  it("resolves Robinhood Chain & Base configs and explorer URLs", () => {
    assert.equal(getChainConfig(4663)?.name, "Robinhood Chain");
    assert.equal(getChainConfig(46630)?.isTestnet, true);
    assert.equal(getChainConfig(8453)?.name, "Base");
    assert.equal(
      getTxExplorerUrl(46630, "0xabc"),
      "https://explorer.testnet.chain.robinhood.com/tx/0xabc"
    );
    assert.equal(
      getAddressExplorerUrl(8453, "0x123"),
      "https://basescan.org/address/0x123"
    );
    assert.equal(getTxExplorerUrl(31337, "0xabc"), null);
  });

  it("validates launchpad contract address from env and defaults", () => {
    const validAddr = "0x1234567890abcdef1234567890abcdef12345678";
    assert.equal(
      getLaunchpadAddress(46630, { NEXT_PUBLIC_LAUNCHPAD_ADDRESS_46630: validAddr }),
      validAddr
    );
    assert.equal(
      getLaunchpadAddress(46630, { NEXT_PUBLIC_LAUNCHPAD_ADDRESS_46630: "not-an-address" }),
      "0x2FEE1b921F68A19bFdA0B587dff8bC245727D518"
    );
    assert.equal(
      getLaunchpadAddress(999999, { NEXT_PUBLIC_LAUNCHPAD_ADDRESS_999999: "not-an-address" }),
      null
    );
  });
});
