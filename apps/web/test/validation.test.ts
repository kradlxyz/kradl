import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSafeHttpUrl, isValidGithubRepoUrl } from "../src/lib/validation";

describe("@kradl/web security URL validators", () => {
  it("allows http/https URLs and blocks javascript:/data: XSS schemes", () => {
    assert.equal(isSafeHttpUrl("https://kradl.xyz"), true);
    assert.equal(isSafeHttpUrl("http://localhost:3000"), true);
    assert.equal(isSafeHttpUrl("javascript:alert(1)"), false);
    assert.equal(isSafeHttpUrl("data:text/html,<script>alert(1)</script>"), false);
    assert.equal(isSafeHttpUrl("vbscript:msgbox(1)"), false);
    assert.equal(isSafeHttpUrl("not-a-url"), false);
  });

  it("prevents Verified Builder Badge spoofing via fake github.com substrings", () => {
    assert.equal(isValidGithubRepoUrl("https://github.com/kradl-org/app"), true);
    assert.equal(isValidGithubRepoUrl("https://www.github.com/kradl-org/app"), true);
    // Spoofing attempts MUST fail
    assert.equal(isValidGithubRepoUrl("https://evil.com/?q=github.com/org/repo"), false);
    assert.equal(isValidGithubRepoUrl("https://github.com.evil.com/org/repo"), false);
    assert.equal(isValidGithubRepoUrl("http://github.com/org/repo"), false);
    assert.equal(isValidGithubRepoUrl("https://github.com/only-user"), false);
  });
});
