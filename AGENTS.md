# AGENTS.md — Kradl Engineering & Agent Guide

Selamat datang di repositori **Kradl** — *Multi-Chain EVM App & Project Launchpad* (Robinhood Chain + Base).
File ini adalah panduan utama bagi seluruh AI coding agent dan developer yang berkontribusi di codebase ini.

---

## 1. Sumber Kebenaran (Source of Truth)

Sebelum merancang fitur baru atau mengubah kode besar, selalu rujuk dokumen resmi di `docs/`:
- **Produk & Ekonomi:** `docs/PRD.md` (visi, fitur, bonding curve, fee split 0.5% platform / 0.5% creator, graduation fee 2%).
- **Arsitektur & Skema:** `docs/ARCHITECTURE.md` (monorepo layout, smart contract math, Prisma schema, indexer, multi-chain config, Docker).
- **UI/UX & Styling:** `docs/UI_DESIGN.md` (color tokens, typography, signature Web3 components, wireframes).

---

## 2. Struktur Monorepo

```text
Launchpad/
├── contracts/          # Solidity smart contracts (Hardhat + TypeScript + OpenZeppelin v5)
├── packages/shared/    # Shared ABIs, chain configs (Robinhood Chain, Base, Local), BigInt curve math
├── apps/web/           # Next.js 15 App Router (Frontend Web3 + REST API + Prisma)
├── apps/indexer/       # Standalone multi-chain EVM event indexer (viem -> PostgreSQL)
├── docs/               # PRD, Architecture, UI Design System
├── .agents/rules/      # Workspace rules (auto-loaded by Antigravity)
└── docker-compose.yml  # Local PostgreSQL 16 + Production services
```

---

## 3. Tech Stack & Conventions

- **Package Manager:** `pnpm` (monorepo workspace). Jangan mencampur `npm` atau `yarn` lockfile.
- **Language:** TypeScript strict mode (`strict: true`) di seluruh `packages/` dan `apps/`. Solidity `^0.8.24` (fixed pragma `0.8.24`) di `contracts/`.
- **Database:** PostgreSQL 16 via Docker (`docker compose up -d postgres`), diakses melalui **Prisma ORM**.
- **Web3 Client:** `wagmi` v2 + `viem` v2 + `@rainbow-me/rainbowkit`.
- **Auth:** SIWE (Sign-In With Ethereum) untuk aksi off-chain (komentar, metadata proyek, changelog).
- **Styling:** Tailwind CSS + CSS Variables sesuai token di `docs/UI_DESIGN.md`.

---

## 4. Perintah Utama (Workflow Commands)

*(Akan aktif begitu scaffolding monorepo selesai di Milestone 1)*

```bash
# 1. Jalankan PostgreSQL lokal
docker compose up -d postgres

# 2. Install semua dependencies monorepo
pnpm install

# 3. Compile & test smart contracts
pnpm --filter contracts compile
pnpm --filter contracts test

# 4. Sinkronisasi database Prisma
pnpm --filter web db:push
pnpm --filter web db:generate

# 5. Jalankan local blockchain + deploy kontrak dev
pnpm --filter contracts node
pnpm --filter contracts deploy:local

# 6. Jalankan web app & indexer secara paralel
pnpm dev
```

---

## 5. Aturan Emas (Non-Negotiable Rules)

1. **Multi-Chain First:** Jangan pernah *hardcode* satu `chainId`, satu RPC URL, atau satu alamat kontrak di komponen UI maupun API. Selalu ambil dari `packages/shared/src/chains.ts` dan `contracts.ts`.
2. **Presisi Finansial (`BigInt`):** Semua nominal wei, token balance (18 desimal), reserve bonding curve, dan fee **WAJIB** menggunakan `bigint` (TypeScript) atau `Decimal`/`String` (PostgreSQL/Prisma). Dilarang keras memakai `Number` JavaScript untuk perhitungan wei/token.
3. **Non-Custodial & Anti-Rug:** Smart contract tidak boleh memiliki backdoor (`mint` tambahan setelah deploy, `blacklist`, atau penarikan paksa dana user). Semua fee menggunakan pola *pull-payment* (`claimCreatorFees`, `claimPlatformFees`).
4. **Sync Math Parity:** Rumus perhitungan quote Buy/Sell di `packages/shared/src/bondingCurve.ts` harus 100% identik (hingga pembulatan *floor division*) dengan `contracts/contracts/KradlLaunchpad.sol`.
5. **Security & Secrets:** Jangan pernah commit `.env`, private key mainnet, atau RPC API key. Selalu sediakan `.env.example`.
6. **Verify Before Done:** Setiap perubahan smart contract wajib lulus `pnpm --filter contracts test`; setiap perubahan web/indexer wajib lulus `typecheck` dan `build`.
