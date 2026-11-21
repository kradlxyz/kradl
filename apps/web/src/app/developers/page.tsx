import React from "react";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/projects",
    desc: "List launched apps with filtering (?chainId, ?category, ?status=verified, ?sort, ?search) and sparklines.",
  },
  {
    method: "GET",
    path: "/api/projects/{chainId}/{tokenAddress}",
    desc: "Full app showcase metadata, live bonding-curve reserves, and automated Trust & Safety report.",
  },
  {
    method: "GET",
    path: "/api/projects/{chainId}/{tokenAddress}/candles?interval=5m",
    desc: "OHLCV candlestick series (1m, 5m, 15m, 1h, 1d) for charts and trading bots.",
  },
  {
    method: "GET",
    path: "/api/projects/{chainId}/{tokenAddress}/trades",
    desc: "Recent on-chain buy/sell executions with exact wei amounts and fee splits.",
  },
  {
    method: "GET",
    path: "/api/leaderboard",
    desc: "Top apps by market cap/volume and top builders by ETH fees earned.",
  },
  {
    method: "GET",
    path: "/api/revenue",
    desc: "Public protocol revenue, daily volume breakdown, and verifiable fee events.",
  },
];

const TOKEN_GATE_SNIPPET = `import { createPublicClient, http, parseAbi } from "viem";

const client = createPublicClient({
  transport: http("https://robinhood-sepolia-rpc.publicnode.com"),
});

const ERC20_ABI = parseAbi(["function balanceOf(address) view returns (uint256)"]);

// Grant Pro access in any Web2 or Web3 app to holders of >= 10,000 project tokens
export async function hasProAccess(tokenAddress: \`0x\${string}\`, userWallet: \`0x\${string}\`) {
  const balance = await client.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [userWallet],
  });
  return balance >= 10_000n * 10n ** 18n;
}`;

export default function DevelopersPage() {
  return (
    <div className="max-w-4xl space-y-10">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="font-display font-bold text-3xl tracking-tight text-white">
          Developers &amp; Public API
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
          All Kradl read endpoints are public and require no API key. Use them to build analytics
          dashboards, bots, or integrate token-gated Pro access into any web, mobile, AI, or game
          application.
        </p>
      </div>

      {/* Public REST Endpoints */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-xl text-white">Public REST Endpoints</h2>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          {ENDPOINTS.map((ep) => (
            <div key={ep.path} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-[var(--accent-primary)]/12 text-[var(--accent-primary)] font-semibold">
                    {ep.method}
                  </span>
                  <code className="text-white">{ep.path}</code>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{ep.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Token-Gate Utility Snippet */}
      <section className="space-y-3">
        <h2 className="font-display font-semibold text-xl text-white">
          Add Token-Gated Utility to Your App
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Your app does not need to be a crypto app to use Kradl. Drop this snippet into your
          backend or frontend to check if a user holds your project&apos;s ERC-20 token and unlock
          Pro features, API quota, or community perks automatically:
        </p>
        <pre className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 overflow-x-auto text-xs font-mono text-[var(--text-primary)] leading-relaxed">
          <code>{TOKEN_GATE_SNIPPET}</code>
        </pre>
      </section>

      {/* Deployed Contracts */}
      <section className="space-y-3">
        <h2 className="font-display font-semibold text-xl text-white">Deployed Contracts</h2>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 font-mono text-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[var(--text-muted)]">Robinhood Chain Testnet (46630)</span>
            <span className="text-white">0x2FEE1b921F68A19bFdA0B587dff8bC245727D518</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[var(--text-muted)]">Robinhood Chain Mainnet (4663)</span>
            <span className="text-[var(--text-muted)]">Pending audit &amp; testnet sign-off</span>
          </div>
        </div>
      </section>
    </div>
  );
}
