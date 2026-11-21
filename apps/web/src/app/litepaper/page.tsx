import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, ShieldCheck, ArrowRight, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Litepaper · Kradl",
  description:
    "Kradl Litepaper v1.0: Why Kradl exists, bonding curve math, 0.5% continuous ETH builder fees, automatic DEX liquidity lock, anti-rug vesting vault, and Season 1 rewards.",
};

const SECTIONS = [
  { id: "why", label: "01. The Why" },
  { id: "token", label: "02. Fair-Launch Token" },
  { id: "math", label: "03. Bonding Curve Math" },
  { id: "revenue", label: "04. Revenue & Builder Fees" },
  { id: "graduation", label: "05. Auto DEX Lock" },
  { id: "antirug", label: "06. Anti-Rug & Trust" },
  { id: "developers", label: "07. Web2 & Web3 API" },
  { id: "rewards", label: "08. Season 1 & Airdrops" },
  { id: "security", label: "09. Security & Contracts" },
  { id: "roadmap", label: "10. Multi-Chain Roadmap" },
] as const;

export default function LitepaperPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Sticky Sidebar TOC */}
      <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-24 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5" />
          Litepaper v1.0
        </div>
        <nav className="space-y-1">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block px-2.5 py-1.5 rounded-lg text-xs font-mono text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              {s.label}
            </a>
          ))}
        </nav>
        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
          <Link
            href="/launch"
            className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold bg-white text-[#09090B] hover:bg-zinc-200 transition-colors"
          >
            Launch an App <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <a
            href="https://github.com/kradlxyz/kradl/blob/main/docs/LITEPAPER.md"
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-mono text-[var(--text-muted)] hover:text-white border border-[var(--border-subtle)] transition-colors"
          >
            Read on GitHub <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </aside>

      {/* Main Litepaper Content */}
      <article className="lg:col-span-9 space-y-10 max-w-3xl">
        {/* Hero */}
        <header className="space-y-4 border-b border-[var(--border-subtle)] pb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Kradl Protocol Litepaper · Version 1.0
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
            Fund real apps from block one.
          </h1>
          <p className="text-base text-[var(--text-secondary)] leading-relaxed">
            Kradl is a non-custodial, multi-chain EVM app &amp; project launchpad on{" "}
            <span className="text-white font-medium">Robinhood Chain</span> and{" "}
            <span className="text-white font-medium">Base</span>. It combines transparent software
            discovery with continuous ETH builder fees, immutable anti-rug vesting, and permanent
            DEX liquidity locks.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              Supply: <span className="text-white">1B Fixed</span>
            </span>
            <span className="px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              Builder Fee: <span className="text-emerald-400">0.5% ETH</span>
            </span>
            <span className="px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              LP Lock: <span className="text-white">Permanent Burn</span>
            </span>
            <span className="px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              Tests: <span className="text-emerald-400">40/40 Passing</span>
            </span>
          </div>
        </header>

        {/* 01. The Why */}
        <section id="why" className="scroll-mt-24 space-y-4">
          <h2 className="font-display font-bold text-xl text-white">
            01. Executive Summary &amp; The Why
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Independent software builders and early-stage teams face two broken funding options:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
              <div className="text-xs font-mono text-rose-400 uppercase">Traditional VC</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Months of pitching, geography bias, gatekept networks, and heavy equity dilution
                before a builder can even ship v1 to real users.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
              <div className="text-xs font-mono text-rose-400 uppercase">Meme Launchpads</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Instant liquidity, but designed for anonymous memes — rampant rug pulls, zero
                product verification, and incentives that reward dumping over shipping.
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            <span className="text-white font-medium">Kradl solves both.</span> Any working Web2 or
            Web3 application — AI agent, SaaS tool, developer SDK, or indie game — can launch a
            fair-launch ERC-20 token in under 60 seconds, attach verifiable Live App &amp; GitHub
            proof, lock creator tokens on-chain, and earn{" "}
            <span className="text-emerald-400 font-mono">0.5% ETH</span> from every buy and sell
            continuously without dumping supply.
          </p>
        </section>

        {/* 02. Token Standard */}
        <section id="token" className="scroll-mt-24 space-y-4">
          <h2 className="font-display font-bold text-xl text-white">
            02. Fair-Launch Token Standard (<span className="font-mono text-base">KradlToken</span>)
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Every project launched via <code className="font-mono text-white">KradlLaunchpad</code>{" "}
            deploys a clean, non-upgradeable ERC-20 contract with hard-coded investor protections:
          </p>
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <tbody className="divide-y divide-[var(--border-subtle)]">
                <tr>
                  <td className="py-3 px-4 text-[var(--text-muted)]">Total Supply</td>
                  <td className="py-3 px-4 text-white">1,000,000,000 (1B fixed, 18 decimals)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-[var(--text-muted)]">Bonding Curve Supply</td>
                  <td className="py-3 px-4 text-white">800,000,000 (80%)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-[var(--text-muted)]">DEX Graduation Reserve</td>
                  <td className="py-3 px-4 text-white">200,000,000 (20%)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-[var(--text-muted)]">Hidden Functions</td>
                  <td className="py-3 px-4 text-emerald-400">
                    None — no mint, no tax, no blacklist, no pause, no proxy
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 03. Bonding Curve Math */}
        <section id="math" className="scroll-mt-24 space-y-4">
          <h2 className="font-display font-bold text-xl text-white">
            03. Bonding Curve Mathematics
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Tokens trade directly against a constant-product virtual AMM (
            <code className="font-mono text-white">x · y = k</code>) until the ETH graduation target
            is met:
          </p>
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs space-y-2 text-[var(--text-secondary)]">
            <div className="text-white">k = virtualEthReserve × virtualTokenReserve</div>
            <div>Buy: tokensOut = Y_v − floor(k / (X_v + netEthIn))</div>
            <div>Sell: grossEthOut = X_v − floor(k / (Y_v + tokensIn))</div>
            <div className="text-emerald-400">
              Graduation cap: excess ETH above graduationThreshold is refunded atomically in the
              same tx.
            </div>
          </div>
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                  <th className="py-2.5 px-4">Parameter</th>
                  <th className="py-2.5 px-4">Testnet (46630)</th>
                  <th className="py-2.5 px-4">Mainnet Default (4663 / 8453)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-white">
                <tr>
                  <td className="py-2.5 px-4 text-[var(--text-muted)]">Virtual ETH Reserve</td>
                  <td className="py-2.5 px-4">0.05 ETH</td>
                  <td className="py-2.5 px-4">1.0 ETH</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[var(--text-muted)]">Virtual Token Reserve</td>
                  <td className="py-2.5 px-4">1,073,000,000</td>
                  <td className="py-2.5 px-4">1,073,000,000</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[var(--text-muted)]">Graduation Threshold</td>
                  <td className="py-2.5 px-4">0.15 ETH</td>
                  <td className="py-2.5 px-4">3.0 ETH</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 04. Revenue Model */}
        <section id="revenue" className="scroll-mt-24 space-y-4">
          <h2 className="font-display font-bold text-xl text-white">
            04. Protocol Revenue &amp; Continuous Builder Fees
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Every buy and sell carries a transparent <span className="text-white font-mono">1.0%</span>{" "}
            total fee split evenly between the builder and the protocol — plus a one-time{" "}
            <span className="text-white font-mono">2.0%</span> fee upon DEX graduation. Launching an
            app costs <span className="text-emerald-400 font-mono">0 ETH</span> (gas only).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="text-2xl font-bold text-emerald-400">0.5%</div>
              <div className="text-xs text-white mt-1">Builder Fee (ETH)</div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-sans">
                Claimable anytime via pull-payment in Dashboard — funds development without selling
                tokens.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="text-2xl font-bold text-white">0.5%</div>
              <div className="text-xs text-white mt-1">Protocol Treasury</div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-sans">
                Publicly audited on{" "}
                <Link href="/revenue" className="underline text-white">
                  /revenue
                </Link>{" "}
                for infrastructure, security, and ecosystem grants.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="text-2xl font-bold text-white">2.0%</div>
              <div className="text-xs text-white mt-1">Graduation Fee</div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-sans">
                Charged once when 98% of raised ETH + 200M tokens migrate to permanently locked DEX
                liquidity.
              </p>
            </div>
          </div>
        </section>

        {/* 05. Auto DEX Graduation */}
        <section id="graduation" className="scroll-mt-24 space-y-4">
          <h2 className="font-display font-bold text-xl text-white">
            05. Automatic DEX Graduation &amp; Permanent LP Lock
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            When a project reaches 100% of its bonding curve, <code className="font-mono text-white">KradlLaunchpad</code>{" "}
            executes an atomic migration through a chain-specific <code className="font-mono text-white">IDexMigrator</code>:
          </p>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)] list-disc pl-5">
            <li>
              <span className="text-white font-medium">Robinhood Chain Mainnet (4663) — UniswapV3Migrator:</span>{" "}
              Wraps ETH to WETH, initializes a full-range 1% Uniswap V3 pool, and mints the LP
              Position NFT directly to <code className="font-mono text-emerald-400">0x000...dEaD</code>.
            </li>
            <li>
              <span className="text-white font-medium">Base Mainnet (8453) — UniswapV2Migrator:</span>{" "}
              Pairs ETH + 200M tokens on Uniswap V2 (resistant to front-run{" "}
              <code className="font-mono text-white">createPair</code> griefing) and burns LP tokens
              permanently to <code className="font-mono text-emerald-400">0x000...dEaD</code>.
            </li>
            <li>
              <span className="text-white font-medium">DEXScreener Auto-Detection:</span> On Mainnet,
              graduated pools are automatically indexed by DEXScreener, GeckoTerminal, and DexTools
              with permanently locked liquidity.
            </li>
          </ul>
        </section>

        {/* 06. Anti-Rug Architecture */}
        <section id="antirug" className="scroll-mt-24 space-y-4">
          <h2 className="font-display font-bold text-xl text-white">
            06. Anti-Rug Architecture &amp; Trust Layer
          </h2>
          <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
            <p>
              <strong className="text-white">KradlVestingVault:</strong> Builders can lock their
              token allocation on-chain with immutable cliff + linear vesting schedules (e.g., 30d
              cliff · 180d linear or 90d cliff · 365d linear). Locks can never be shortened or
              cancelled, and immediately award the{" "}
              <span className="font-mono text-emerald-400">CREATOR LOCKED</span> badge.
            </p>
            <p>
              <strong className="text-white">Trust &amp; Safety Scanner:</strong> Every project page
              continuously computes builder holding %, top-10 concentration %, fixed-supply/no-tax
              contract guarantees, Live App URL validity, strict <code className="font-mono text-white">github.com</code>{" "}
              repo verification, and on-chain vesting lock status.
            </p>
          </div>
        </section>

        {/* 07. Web2 & Web3 API */}
        <section id="developers" className="scroll-mt-24 space-y-4">
          <h2 className="font-display font-bold text-xl text-white">
            07. Web2 &amp; Web3 Developer Ecosystem
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Any Web2 SaaS, AI tool, or indie game can integrate its Kradl token in minutes using our
            zero-key public JSON API and 5-line <code className="font-mono text-white">viem</code>{" "}
            token-gating helper documented at{" "}
            <Link href="/developers" className="text-white underline">
              /developers
            </Link>
            .
          </p>
        </section>

        {/* 08. Season 1 Rewards */}
        <section id="rewards" className="scroll-mt-24 space-y-4">
          <h2 className="font-display font-bold text-xl text-white">
            08. Season 1 Rewards, Anti-Sybil Referrals &amp; Merkle Airdrops
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Season 1 Points on{" "}
            <Link href="/rewards" className="text-white underline">
              /rewards
            </Link>{" "}
            are computed deterministically from real indexed on-chain activity and snapshot into our
            verified <code className="font-mono text-white">KradlMerkleDistributor</code> contract:
          </p>
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                  <th className="py-2.5 px-4">Activity</th>
                  <th className="py-2.5 px-4">Reward</th>
                  <th className="py-2.5 px-4">Anti-Abuse Guardrail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                <tr>
                  <td className="py-2.5 px-4 text-white">Verified App Launch</td>
                  <td className="py-2.5 px-4 text-emerald-400">+1,000 pts</td>
                  <td className="py-2.5 px-4">On-chain event + GitHub &amp; Live URL</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-white">Changelog Update</td>
                  <td className="py-2.5 px-4 text-emerald-400">+50 pts</td>
                  <td className="py-2.5 px-4">Capped at 10 updates per project</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-white">Trading Volume</td>
                  <td className="py-2.5 px-4 text-emerald-400">+100 pts / 0.01 ETH</td>
                  <td className="py-2.5 px-4">Exact BigInt wei accounting</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-white">Early Supporter</td>
                  <td className="py-2.5 px-4 text-emerald-400">+150 pts</td>
                  <td className="py-2.5 px-4">Per unique project traded</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-white">Active Referral</td>
                  <td className="py-2.5 px-4 text-emerald-400">+250 pts + 15%</td>
                  <td className="py-2.5 px-4">Empty Sybil wallets earn 0 pts</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 09. Security & Verified Contracts */}
        <section id="security" className="scroll-mt-24 space-y-4">
          <h2 className="font-display font-bold text-xl text-white">
            09. Security Architecture &amp; Verified Contracts
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            All contracts are compiled with Solidity <code className="font-mono text-white">0.8.24</code>{" "}
            (<code className="font-mono text-white">cancun</code>) using OpenZeppelin v5 (
            <code className="font-mono text-white">ReentrancyGuard</code>,{" "}
            <code className="font-mono text-white">SafeERC20</code>,{" "}
            <code className="font-mono text-white">Ownable2Step</code>,{" "}
            <code className="font-mono text-white">MerkleProof</code>), covered by{" "}
            <span className="text-emerald-400 font-mono">40/40</span> automated unit tests.
          </p>
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                  <th className="py-2.5 px-4">Contract (Robinhood Mainnet 4663)</th>
                  <th className="py-2.5 px-4">Verified Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {[
                  {
                    name: "KradlLaunchpad",
                    addr: "0x2FEE1b921F68A19bFdA0B587dff8bC245727D518",
                  },
                  {
                    name: "UniswapV3Migrator",
                    addr: "0xD02a30af2430FD2CCE14987016819AeD4744d20f",
                  },
                  {
                    name: "KradlVestingVault",
                    addr: "0x94DD22D82Ae5f4370BCEBF97F94A505D413a70F5",
                  },
                  {
                    name: "KradlMerkleDistributor",
                    addr: "0xd352961fc0b140F73142FF8EB20B59c077d6e8bF",
                  },
                ].map((c) => (
                  <tr key={c.name}>
                    <td className="py-2.5 px-4 text-white">{c.name}</td>
                    <td className="py-2.5 px-4">
                      <a
                        href={`https://robinhoodchain.blockscout.com/address/${c.addr}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline"
                      >
                        {c.addr} <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 10. Roadmap */}
        <section id="roadmap" className="scroll-mt-24 space-y-4">
          <h2 className="font-display font-bold text-xl text-white">10. Multi-Chain Roadmap</h2>
          <div className="space-y-3 text-xs">
            {[
              {
                phase: "Phase 1 · Live",
                title: "Public Testnet & Season 1 Rewards",
                desc: "Robinhood Chain Testnet (46630), verified contracts, Trust & Safety Scanner, Creator Vesting Vault, and Anti-Sybil Season 1 Points.",
                active: true,
              },
              {
                phase: "Phase 2 · Live",
                title: "Robinhood Chain Mainnet (4663)",
                desc: "Production launch with UniswapV3Migrator (permanent LP NFT burn → DEXScreener) and Season 1 Mainnet Genesis rewards.",
                active: true,
              },
              {
                phase: "Phase 3",
                title: "Base Mainnet (8453) & Season 1 Merkle Airdrop",
                desc: "Multi-chain expansion with UniswapV2Migrator and 1-click trustless Season 1 claiming via KradlMerkleDistributor.",
                active: false,
              },
              {
                phase: "Phase 4",
                title: "Builder Ecosystem V2",
                desc: "Atomic Launch + Auto-Vesting in one transaction, Self-Serve Builder Airdrop Studio, and optional Milestone Escrow modules.",
                active: false,
              },
            ].map((item) => (
              <div
                key={item.phase}
                className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[11px] uppercase ${
                        item.active ? "text-emerald-400" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {item.phase}
                    </span>
                    <span className="font-display font-semibold text-sm text-white">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <footer className="pt-6 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] leading-relaxed">
          <strong className="text-[var(--text-secondary)]">Disclaimer:</strong> Kradl is
          non-custodial, open-source software infrastructure. Kradl does not custody user funds,
          does not endorse any third-party project, and makes no guarantees of token value or
          returns. All on-chain interactions are irreversible and executed at your own risk.
        </footer>
      </article>
    </div>
  );
}
