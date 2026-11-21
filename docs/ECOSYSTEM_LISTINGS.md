# Kradl Ecosystem Listing Pack

Ready-to-submit listing metadata for DeFiLlama, Base Ecosystem Directory, and Robinhood Chain ecosystem directories.

## Official Metadata
- **Name:** Kradl
- **Tagline:** Fund real apps from block one
- **Category:** Launchpad / DeFi
- **Website:** https://kradl.xyz
- **Litepaper:** https://kradl.xyz/litepaper
- **GitHub:** https://github.com/kradlxyz/kradl
- **X / Twitter:** https://x.com/kradlxyz
- **Logo (800×800 PNG):** `assets/brand/kradl-avatar-800x800.png`
- **Banner (1500×500 PNG):** `assets/brand/kradl-x-banner-1500x500.png`

## Unified Verified Mainnet Contracts (Sourcify `exact_match` + Blockscout)
- **Chains:** Robinhood Chain Mainnet (`4663`), Base Mainnet (`8453`)
- **`KradlLaunchpad`:** `0x2FEE1b921F68A19bFdA0B587dff8bC245727D518`
- **`DEX Migrator` (Uniswap V3 on `4663` / Uniswap V2 on `8453`):** `0xD02a30af2430FD2CCE14987016819AeD4744d20f`
- **`KradlVestingVault`:** `0x94DD22D82Ae5f4370BCEBF97F94A505D413a70F5`
- **`KradlMerkleDistributor`:** `0xd352961fc0b140F73142FF8EB20B59c077d6e8bF`

## 1. DeFiLlama Listing (`DefiLlama/DefiLlama-Adapters`)
1. Fork https://github.com/DefiLlama/DefiLlama-Adapters using `@kradlxyz`.
2. Copy `docs/defillama-adapter.js` to `projects/kradl/index.js`.
3. Open a PR with title `Add Kradl Launchpad (Base)` and paste the Official Metadata above.

## 2. Base Ecosystem Directory (`base.org/ecosystem`)
1. Open https://www.base.org/ecosystem (or submit via the Base Ecosystem submission portal / `base/web`).
2. Use the Official Metadata and Base Mainnet verified contract `0x2FEE1b921F68A19bFdA0B587dff8bC245727D518` (`https://basescan.org/address/0x2FEE1b921F68A19bFdA0B587dff8bC245727D518`).
