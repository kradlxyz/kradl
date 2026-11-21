---
name: deploy-kradl
description: Step-by-step runbook for deploying KradlLaunchpad smart contracts to Robinhood Chain / Base (testnet & mainnet) and deploying the full stack to a Linux VPS via Docker Compose.
---

# Kradl Deployment Runbook

## 1. Pre-Deployment Checklist
1. Pastikan seluruh unit test dan typecheck lulus:
   ```bash
   pnpm test:all
   pnpm typecheck
   ```
2. Siapkan wallet deployer terpisah (bukan wallet utama pribadi) dan isi saldo ETH:
   - **Robinhood Chain Testnet (`46630`):** Ambil ETH testnet gratis di `https://faucet.testnet.chain.robinhood.com`.
   - **Base Sepolia (`84532`):** Ambil ETH testnet gratis dari Base Sepolia Faucet.
3. Isi `DEPLOYER_PRIVATE_KEY` di file `.env` (jangan pernah commit `.env` ke Git!).

## 2. Deploy Smart Contract (`KradlLaunchpad`)
- **Robinhood Chain Testnet (`46630`):**
  ```bash
  pnpm --filter @kradl/contracts deploy:rh-testnet
  ```
- **Base Sepolia (`84532`):**
  ```bash
  pnpm --filter @kradl/contracts deploy:base-sepolia
  ```
- Catat alamat kontrak dari output terminal (juga tersimpan otomatis di `contracts/deployments/<chainId>.json`).

## 3. Hubungkan Alamat Kontrak ke Web & Indexer
Tambahkan ke `.env` (dan `apps/web/.env` saat dev lokal):
```env
NEXT_PUBLIC_LAUNCHPAD_ADDRESS_46630="0x..."
NEXT_PUBLIC_LAUNCHPAD_ADDRESS_84532="0x..."
```
*(Untuk mainnet gunakan `_4663` untuk Robinhood Mainnet dan `_8453` untuk Base Mainnet).*

## 4. Production Deployment di VPS Linux
1. Install Docker & Docker Compose di VPS (Ubuntu 24.04).
2. Clone repositori, salin `.env.example` ke `.env`, lalu isi `JWT_SECRET`, `POSTGRES_PASSWORD`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, dan alamat kontrak `NEXT_PUBLIC_LAUNCHPAD_ADDRESS_*`.
3. Jalankan seluruh stack production:
   ```bash
   docker compose --profile prod up -d --build
   ```
4. Push skema database pertama kali:
   ```bash
   docker compose exec web npx prisma db push --schema=apps/web/prisma/schema.prisma
   ```
5. Pasang reverse proxy **Caddy** di port `80/443` menuju `localhost:3000` untuk HTTPS otomatis (Let's Encrypt).
