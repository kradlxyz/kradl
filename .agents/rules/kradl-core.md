---
description: Core architecture, multi-chain, financial precision, and quality rules for the Kradl monorepo.
trigger: always_on
---

# Kradl Core Workspace Rules

1. **Monorepo & Package Manager:**
   - Gunakan `pnpm` untuk semua instalasi dan script workspace.
   - Letakkan kode bersama (ABI, alamat kontrak per `chainId`, definisi chain, tipe TypeScript, dan rumus bonding curve) di `packages/shared`, bukan diduplikasi antara `apps/web` dan `apps/indexer`.

2. **Multi-Chain Architecture:**
   - Semua data on-chain, tabel DB, dan endpoint API wajib terikat pada `chainId` (`4663` Robinhood Mainnet, `46630` Robinhood Testnet, `8453` Base Mainnet, `84532` Base Sepolia, `31337` Hardhat Local).
   - Alamat wallet dan alamat token yang disimpan di PostgreSQL harus selalu dinormalisasi ke **lowercase** (atau checksummed secara konsisten saat tampil di UI).

3. **Financial & Numeric Safety:**
   - Dilarang menggunakan JavaScript `number` / `parseFloat` untuk perhitungan wei, saldo token (18 desimal), atau perhitungan bonding curve. Selalu gunakan `bigint` dan utilitas `viem` (`parseEther`, `formatEther`, `formatUnits`).
   - Di Prisma/PostgreSQL, simpan nominal raw wei sebagai `String` atau `Decimal(78, 0)` agar tidak terjadi *overflow*.

4. **Security & Privacy:**
   - Jangan pernah menulis private key atau secret asli ke dalam kode atau git.
   - Semua mutasi off-chain (`POST/PATCH/DELETE` metadata proyek, changelog, komentar) wajib memverifikasi sesi **SIWE (Sign-In With Ethereum)** dan kepemilikan alamat wallet (`creatorAddress` untuk update/metadata proyek).
   - Validasi seluruh input API menggunakan `zod`.

5. **Documentation Alignment:**
   - Setiap perubahan pada parameter ekonomi (fee split, graduation threshold), skema database, atau design token wajib tetap selaras dengan `docs/PRD.md`, `docs/ARCHITECTURE.md`, dan `docs/UI_DESIGN.md`.
