# Kradl Litepaper v1.0

**Fund real apps from block one.**  
*A non-custodial, multi-chain EVM app & project launchpad on Robinhood Chain and Base.*

- **Live App:** https://kradl.xyz
- **Litepaper (Web):** https://kradl.xyz/litepaper
- **GitHub:** https://github.com/kradlxyz/kradl
- **X / Twitter:** https://x.com/kradlxyz

---

## 1. Executive Summary & The Why

Software builders face a broken funding landscape:

- **Traditional venture capital** is slow, geography-biased, and demands heavy equity dilution before an indie developer or small team can even ship v1.
- **First-generation token launchpads** (e.g., pump.fun) solved instant liquidity, but optimized exclusively for anonymous memes — resulting in rampant rug pulls, zero product accountability, and misaligned incentives where creators only profit by dumping their own token.

**Kradl bridges Product Hunt and continuous on-chain funding.**

On Kradl, any builder shipping real software — whether a **Web2 SaaS, AI agent, developer tool, or Web3 protocol** — can launch a fair-launch ERC-20 token in under 60 seconds, prove authenticity through verifiable links and on-chain vesting locks, and earn **0.5% in ETH from every buy and sell continuously** without ever needing to dump their token supply.

---

## 2. Token Standard & Fair-Launch Guarantees (`KradlToken`)

Every project deployed through `KradlLaunchpad` mints a standardized, immutable `KradlToken` ERC-20 contract:

| Parameter | Specification |
| --- | --- |
| Total Supply | `1,000,000,000` (1B fixed, 18 decimals) |
| Bonding Curve Allocation | `800,000,000` (80%) |
| Reserved DEX Liquidity | `200,000,000` (20%) |
| Mint / Burn / Tax / Blacklist | **None** (hard-coded immutable ERC-20) |
| Admin / Pause / Upgrade Proxy | **None** |
| Presale / Private Allocation | **None** (100% fair launch from block one) |

---

## 3. Bonding Curve Mathematics ($x \cdot y = k$)

Before DEX graduation, every Kradl token trades directly against a deterministic constant-product virtual AMM inside `KradlLaunchpad`:

$$k = X_v \cdot Y_v$$

Where $X_v$ is the virtual ETH reserve and $Y_v$ is the virtual token reserve.

### Buy Execution
1. A trader submits `grossEthIn` ETH.
2. Total `1.0%` trading fee is split cleanly:
   - `0.5%` → `platformFeesAccrued` (Protocol Treasury)
   - `0.5%` → `creatorFeesAccrued[creator]` (Builder Pull-Payment)
3. The remaining `99.0%` (`netEthIn`) enters the bonding curve:
   $$\Delta y = Y_v - \left\lfloor \frac{X_v \cdot Y_v}{X_v + \Delta x_{\text{net}}} \right\rfloor$$
4. If the trade crosses `graduationThreshold`, the contract automatically caps `netEthIn` to the exact remaining ETH needed, **refunds excess ETH atomically in the same transaction**, and triggers DEX graduation.

### Sell Execution
1. A trader submits `tokensIn` tokens.
2. Gross ETH output is computed from the curve (capped at `realEthReserve`):
   $$\Delta x_{\text{gross}} = X_v - \left\lfloor \frac{X_v \cdot Y_v}{Y_v + \Delta y} \right\rfloor$$
3. `0.5%` Protocol Fee and `0.5%` Builder Fee are deducted, and `99.0%` net ETH is transferred to the trader.

### Curve Parameters

| Parameter | Testnet (`46630`) | Mainnet Default (`4663` / `8453`) |
| --- | --- | --- |
| Virtual ETH Reserve ($X_{v,0}$) | `0.05 ETH` | `1.0 ETH` |
| Virtual Token Reserve ($Y_{v,0}$) | `1,073,000,000` | `1,073,000,000` |
| Graduation Threshold | `0.15 ETH` | `3.0 ETH` |
| Creation Fee | `0 ETH` | `0 ETH` |

---

## 4. Revenue Model & Continuous Builder Funding

Kradl's protocol revenue comes strictly from real on-chain trading and graduation activity:

| Fee Type | Rate | Recipient | Mechanism |
| --- | --- | --- | --- |
| Builder Trading Fee | **0.50%** | Project Creator | Accrued in ETH via `claimCreatorFees()` pull-payment |
| Protocol Trading Fee | **0.50%** | Kradl Treasury | Accrued in ETH, publicly audited on `/revenue` |
| DEX Graduation Fee | **2.00%** | Kradl Treasury | Deducted once upon automatic DEX liquidity migration |
| App Launch Fee | **0.00%** | — | Permissionless & free (gas only) |

Because builders earn **ETH directly from volume**, their economic incentive aligns with shipping updates, growing real users, and sustaining long-term trading activity — rather than dumping tokens on early supporters.

---

## 5. Automatic DEX Graduation & Permanent Liquidity Lock

Once a project reaches `100%` of its `graduationThreshold`:

1. Bonding curve trading closes permanently for that token.
2. `2.0%` graduation fee is routed to protocol treasury.
3. `98.0%` of raised ETH + `200,000,000` reserved tokens migrate atomically through Kradl's pluggable `IDexMigrator` adapter:
   - **Robinhood Chain Mainnet (`4663`) — `UniswapV3Migrator`:** Wraps ETH into WETH, creates/initializes a `1.0%` fee-tier full-range Uniswap V3 pool (`tickLower = -887200`, `tickUpper = 887200`) with overflow-safe `sqrtPriceX96` math, and **mints the LP Position NFT directly to `0x000000000000000000000000000000000000dEaD`**.
   - **Base Mainnet (`8453`) — `UniswapV2Migrator`:** Pairs ETH + tokens on Uniswap V2 (resistant to front-run `createPair` griefing) and **burns LP tokens permanently to `0x000...dEaD`**.
4. Once live on Mainnet DEXs, graduated pools are automatically indexed by **DEXScreener, GeckoTerminal, and DexTools** with permanently locked liquidity.
5. If a chain's DEX migrator is not yet configured (e.g., early Testnet), funds are safely parked in `pendingMigrations` until migration is enabled — zero funds can ever be lost.

---

## 6. Anti-Rug Architecture & Trust Layer

Kradl replaces blind speculation with verifiable on-chain proof:

### A. `KradlVestingVault` (On-Chain Creator Token Lock)
Builders who buy tokens at launch (or afterward) can lock any portion into `KradlVestingVault` with an immutable **cliff + linear release schedule** (e.g., `30d cliff · 180d linear` or `90d cliff · 365d linear`):
- Locks are **non-custodial and immutable** — neither the creator nor Kradl can cancel or shorten a lock.
- Creators may add multiple lock tranches over time.
- Active locks immediately unlock the **`Creator Locked`** badge and `✓ Vesting lock` check in the Trust & Safety Scan.

### B. Automated Trust & Safety Scanner
Every project page runs real-time on-chain and metadata checks:
- **Builder Holding %** and **Top 10 Holder Concentration %** (flags elevated risk when top-10 > 40%)
- **Fixed 1B Supply** & **No Mint / No Tax** contract verification
- **Live App URL** (strict `http/https`, blocks XSS schemes) & **GitHub Repository** (strict `github.com` hostname check to prevent badge spoofing)
- **On-Chain Vesting Lock** status

### C. Build-in-Public Accountability
Builders authenticate via **Sign-In With Ethereum (SIWE)** to publish versioned changelogs (`Updates`), update project links (`Edit Details`), and engage with token-holder-badged community members (`BUILDER` / `HOLDER` tags).

---

## 7. Web2 & Web3 Developer Ecosystem (`/developers`)

Kradl is built so **Web2 apps can adopt on-chain tokens in 5 minutes**:
- **Zero-Key Public REST API:** `/api/projects`, `/api/projects/[chainId]/[address]`, `/api/revenue`, `/api/rewards`.
- **5-Line Token-Gate Integration:** Any SaaS, AI tool, or game can check `balanceOf(userAddress)` via `viem` to unlock Pro tiers, API quotas, or community perks for token holders.

---

## 8. Season 1 Rewards, Anti-Sybil Referrals & Merkle Airdrops

To bootstrap real builders and early supporters transparently, Kradl runs deterministic **Season 1 Points** on `/rewards`:

| Action | Points | Guardrail |
| --- | --- | --- |
| Verified App Launch (`Live URL + GitHub`) | `+1,000 pts` | On-chain `ProjectLaunched` indexed |
| Unverified App Launch | `+500 pts` | On-chain `ProjectLaunched` indexed |
| Build-in-Public Changelog Update | `+50 pts` | Capped at `10` updates per project (anti-spam) |
| On-Chain Trading Volume | `+100 pts / 0.01 ETH` | Exact `BigInt` wei calculation |
| Early Supporter (Unique App Traded) | `+150 pts` | Per unique project |
| Active Referral (`kradl.xyz/?ref=0x...`) | `+250 pts + 15%` trade pts | **Anti-Sybil:** empty wallets award `0 pts` |

### Anti-Abuse Referral Rules
- Referrals require SIWE authentication and are **immutable once bound**.
- Self-referrals (`referrer == referee`), duplicate bindings, and circular loops (`A → B → A`) are strictly rejected.

### `KradlMerkleDistributor` (On-Chain Airdrop Vault)
At the close of Season 1, points snapshot into a double-hashed Merkle root published to `KradlMerkleDistributor`:
- Packed bitmap prevents double-claiming with O(1) gas cost.
- Multi-campaign architecture allows **any Kradl builder** to fund and run trustless community airdrops for their own early users.
- Unclaimed tokens can only be swept by the campaign creator after the campaign `deadline` passes.

---

## 9. Security Architecture & Verified Contracts

- **Solidity `0.8.24` (`cancun`) + OpenZeppelin v5:** `ReentrancyGuard`, `SafeERC20`, `Ownable2Step`, `MerkleProof`, strict Checks-Effects-Interactions (CEI), pull-payment ETH withdrawals, and string-length bounds to prevent indexer event bloat.
- **Automated Test Suite:** `40/40` passing tests (`20` Solidity + `7` Shared BigInt curve math + `13` Web security, trust scanner & anti-Sybil rewards tests).
- **Web & Infrastructure Hardening:** SIWE domain-bound HttpOnly JWT sessions, strict URL/hostname sanitization, CSP/frame security headers, Cloudflare DDoS protection & Full (Strict) TLS, UFW firewall, SSH key-only access, and automated daily encrypted-channel PostgreSQL backups.
- **Mainnet Ownership:** Before Mainnet public liquidity scales, `KradlLaunchpad` ownership transfers via `Ownable2Step` to a **Safe Multisig**.

### Verified Contracts — Robinhood Chain Testnet (`46630`)

| Contract | Address | Explorer |
| --- | --- | --- |
| `KradlLaunchpad` | `0x2FEE1b921F68A19bFdA0B587dff8bC245727D518` | [Blockscout](https://explorer.testnet.chain.robinhood.com/address/0x2FEE1b921F68A19bFdA0B587dff8bC245727D518) |
| `KradlVestingVault` | `0xD02a30af2430FD2CCE14987016819AeD4744d20f` | [Blockscout](https://explorer.testnet.chain.robinhood.com/address/0xD02a30af2430FD2CCE14987016819AeD4744d20f) |
| `KradlMerkleDistributor` | `0xe66D459b6E4E5b70Cb6129f827869E3e5D38E60C` | [Blockscout](https://explorer.testnet.chain.robinhood.com/address/0xe66D459b6E4E5b70Cb6129f827869E3e5D38E60C) |

---

## 10. Multi-Chain Roadmap

- **Phase 1 — Public Testnet & Season 1 *(Live)*:** Robinhood Chain Testnet (`46630`), verified contracts, Trust & Safety Scanner, Vesting Vault, Season 1 Points & Referrals.
- **Phase 2 — Robinhood Chain Mainnet (`4663`):** Full suite deployment with `UniswapV3Migrator` (permanent LP NFT burn → DEXScreener), Safe Multisig ownership, and Genesis Mainnet builders.
- **Phase 3 — Base Mainnet (`8453`) & Season 1 Airdrop:** Multi-chain expansion with `UniswapV2Migrator` and 1-click Season 1 Merkle Airdrop claiming.
- **Phase 4 — Builder Ecosystem V2:** Atomic Launch + Auto-Vesting in 1 tx, Self-Serve Builder Airdrop Studio, and optional Milestone-Based Escrow modules.

---

## Disclaimer

Kradl is non-custodial, open-source software infrastructure. Kradl does not custody user funds, does not endorse any third-party project launched on the protocol, and makes no guarantees regarding token price, liquidity, or returns. All smart contract interactions are irreversible and executed at the user's own risk.
