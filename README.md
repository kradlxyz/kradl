# Kradl

**Multi-chain EVM App & Project Launchpad** (`https://kradl.xyz`) built for working software, indie developers, and creators on **Robinhood Chain** and **Base**.

## Key Mechanics
- **Fair-Launch ERC-20 (`KradlToken.sol`):** Fixed `1,000,000,000` supply, zero hidden mint, zero blacklist, zero transfer tax.
- **Constant-Product Bonding Curve (`KradlLaunchpad.sol`):** Instant trading from block one with `0.5%` Platform Fee + `0.5%` Continuous Builder Fee (claimable in ETH via pull-payment) and `2%` DEX Graduation Fee.
- **Multi-Chain Architecture:** Supports Robinhood Chain (`4663` / Testnet `46630`), Base (`8453` / Sepolia `84532`), and Hardhat Local (`31337`).
- **Self-Hosted Stack:** Next.js 15 + PostgreSQL 16 (Prisma) + standalone `viem` Event Indexer + Caddy HTTPS.

## Monorepo Structure
```text
├── contracts/        # Solidity 0.8.24 + Hardhat + OpenZeppelin v5
├── packages/shared/  # Multi-chain configs, ABIs, exact BigInt curve math
├── apps/web/         # Next.js 15 App Router UI + REST API + SIWE auth
├── apps/indexer/     # Multi-chain EVM event indexer & OHLCV candle builder
├── docs/             # PRD.md, ARCHITECTURE.md, UI_DESIGN.md
└── scripts/          # Automated VPS deployment (vps-deploy.sh)
```

## Local Development
```bash
cp .env.example .env
pnpm install
pnpm db:up && pnpm db:push
pnpm test:all
pnpm web:dev
```
