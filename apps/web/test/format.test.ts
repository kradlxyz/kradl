import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  shortenAddress,
  formatEthValue,
  formatTokenAmount,
  formatCompactNumber,
  parseRevertError,
} from "../src/lib/format";

describe("@kradl/web format & error helpers", () => {
  it("shortens Ethereum addresses cleanly", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    assert.equal(shortenAddress(addr, 4), "0x1234...5678");
    assert.equal(shortenAddress("0x12", 4), "0x12");
  });

  it("formats wei and ETH values safely without throwing on invalid input", () => {
    assert.equal(formatEthValue(10n ** 18n), "1");
    assert.equal(formatEthValue(50_000_000_000_000n), "<0.0001");
    assert.equal(formatEthValue("0"), "0");
    assert.equal(formatEthValue("invalid-wei"), "0");
  });

  it("formats compact token numbers", () => {
    assert.equal(formatCompactNumber(1_250_000), "1.25M");
    assert.equal(formatCompactNumber(42_500), "42.50K");
    assert.equal(formatTokenAmount((250_000_000n * 10n ** 18n).toString()), "250.00M");
  });

  it("maps Solidity revert reasons and wallet rejections to user-friendly messages", () => {
    assert.match(parseRevertError(new Error("User rejected the request")), /cancelled/i);
    assert.match(parseRevertError(new Error("execution reverted: SlippageExceeded")), /slippage/i);
    assert.match(parseRevertError(new Error("AlreadyGraduated")), /graduated/i);
    assert.match(parseRevertError(new Error("NothingToClaim")), /no builder fees/i);
    assert.match(parseRevertError(new Error("insufficient funds for gas")), /insufficient eth/i);
  });
});
