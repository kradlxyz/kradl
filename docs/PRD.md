# Kradl — Product Requirements Document (PRD)

> **Version:** 1.0  
> **Brand:** **Kradl** (*"Where Real Apps Launch On-Chain"*)  
> **Category:** Builder & App Token Launchpad (Internet Capital Markets)  
> **Target Networks:** Multi-Chain EVM — **Robinhood Chain** (Primary) & **Base** (Secondary), siap ekspansi ke chain EVM lain.  
> **Target Market:** Global (Builders, Indie Hackers, Creators, & On-Chain Supporters/Traders).

---

## 1. Executive Summary & Vision

**Kradl** adalah platform **App & Project Launchpad berbasis Web3** yang menggabungkan pengalaman kurasi produk seperti *Product Hunt* dengan mekanisme pendanaan *on-chain* instan berbasis **Bonding Curve**.

Berbeda dengan launchpad memecoin pada umumnya yang penuh token tanpa utilitas, Kradl dirancang khusus untuk **developer, indie hacker, dan kreator yang membangun produk nyata** (web app, AI tools, SaaS, indie game, open-source, atau komunitas digital).

### Nilai Inti (Value Proposition)
1. **Untuk Builder / Creator:**
   - Meluncurkan token proyek dalam 1 klik tanpa modal likuiditas awal (*fair launch*).
   - Mendapatkan **pendanaan berkelanjutan otomatis (0.5% dari setiap volume trading)** dalam ETH yang bisa diklaim kapan saja di *Creator Dashboard*.
   - Mendapatkan halaman **App Showcase** lengkap (Live URL, GitHub, X/Twitter, screenshot, *changelog/milestone*, dan ruang diskusi komunitas) untuk mendapatkan *early adopters*.
2. **Untuk Publik / Supporter / Trader:**
   - Menemukan proyek & aplikasi nyata yang terverifikasi sebelum besar.
   - Transaksi jual-beli instan sejak detik pertama lewat *Bonding Curve* yang transparan, *non-custodial*, dan *anti-rug by design*.
3. **Untuk Platform (Kradl Revenue Model):**
   - **Trading Fee:** **0.5%** dari setiap transaksi beli & jual di *Bonding Curve* masuk ke *Platform Treasury* (langsung dalam ETH).
   - **Graduation Fee:** **2%** dari total ETH terkumpul saat token lulus (*graduate*) dari *Bonding Curve* ke DEX.
   - **Opsional (Anti-Spam):** Biaya pembuatan token ringan (dapat dikonfigurasi oleh admin, default `0` atau nominal sangat kecil di testnet/mainnet).

---

## 2. Competitive Positioning

| Dimensi | Memecoin Launchpad (Pump.fun, Pons, StonkFun) | **Kradl** |
| :--- | :--- | :--- |
| **Fokus Utama** | Meme, spekulasi jangka pendek, *stock-meme* | **Aplikasi, software, & proyek nyata** |
| **Halaman Token** | Gambar meme + grafik + chat acak | **App Showcase** (Live demo, GitHub, media, *changelog*, diskusi, + live chart) |
| **Insentif Creator** | Seringkali nihil atau mendorong creator *dump* token | **0.5% Continuous Creator Fee** dalam ETH, langsung diklaim dari smart contract |
| **Kepercayaan Publik** | Risiko *rugpull* & *spam* sangat tinggi | **Verified Builder Badge** (GitHub/Domain/X), *fair launch*, standar kontrak anti-rug |
| **Fleksibilitas Chain** | Umumnya terkunci di 1 chain | **Multi-Chain EVM** (Robinhood Chain + Base + mudah tambah chain EVM lain) |

---

## 3. Target User Personas

1. **The Indie Builder ("Raka" / Global Indie Hacker):**
   - Membangun AI tool, SaaS, atau indie game sendiri/tim kecil.
   - Butuh dana operasional (server, GPU/API) dan 100 pengguna pertama tanpa melewati proses VC yang lambat.
2. **The On-Chain Early Adopter & Trader ("Alex"):**
   - Aktif di ekosistem Robinhood Chain & Base, mencari proyek berpotensi tinggi yang benar-benar punya produk hidup, bukan sekadar meme 5 menit.
   - Menghargai transparansi *bonding curve*, grafik *real-time*, dan verifikasi builder.
3. **The Community Supporter ("Maya"):**
   - Suka mendukung kreator/aplikasi favoritnya, mengikuti *update changelog*, dan berdiskusi di halaman proyek.

---

## 4. Tokenomics & Bonding Curve Mechanics

Setiap token yang diluncurkan di Kradl mengikuti standar **Fair Launch ERC-20** yang seragam dan transparan:

- **Total Supply Tetap:** `1,000,000,000` (1 Miliar token, 18 desimal).
  - **Alokasi Bonding Curve:** `800,000,000` token (80%) tersedia untuk dibeli/dijual di *Bonding Curve*.
  - **Alokasi DEX Liquidity:** `200,000,000` token (20%) dicadangkan untuk migrasi otomatis ke DEX saat graduasi.
- **Model Harga:** **Constant Product Virtual AMM** ($x \cdot y = k$ dengan *virtual ETH reserve* dan *virtual token reserve*):
  - Menghasilkan kurva harga yang mulus, deterministik, bebas *rounding exploit*, dan selaras dengan harga awal saat migrasi ke DEX.
  - Parameter default (dapat dikonfigurasi per chain di smart contract):
    - `virtualEthReserve`: e.g. `1.5 ETH` (disesuaikan dengan harga ETH & target market cap).
    - `graduationThreshold`: e.g. `5 ETH` real ETH terkumpul (di testnet bisa diset kecil seperti `0.05 ETH` agar mudah diuji sampai graduasi!).
- **Struktur Fee (Total 1% per trade di Bonding Curve):**
  - `0.5%` (50 bps) → **Platform Treasury** (`platformFeeBalance`).
  - `0.5%` (50 bps) → **Project Creator** (`creatorFeeBalance[creator]`, dapat diklaim kapan saja via *pull-payment*).
- **Graduation (Migrasi Otomatis ke DEX):**
  - Saat `realEthReserve >= graduationThreshold` (atau seluruh `800M` token terjual):
    - Trading di *Bonding Curve* berhenti (`graduated = true`).
    - `2%` (200 bps) dari `realEthReserve` masuk ke **Platform Treasury** sebagai *Graduation Fee*.
    - Sisa `98%` ETH + `200M` token cadangan dipindahkan ke DEX Router yang dikonfigurasi (misal Uniswap V2/V3/V4 adapter per chain) dan LP token dikirim ke *burn address* (`0x...dEaD`) agar likuiditas terkunci permanen.
    - *Fallback Aman:* Jika di chain baru (seperti awal testnet/mainnet baru) alamat DEX Router belum diset, kontrak menyediakan mode *Migration Vault* yang transparan sampai router resmi aktif, sehingga dana tidak pernah nyangkut.
- **Anti-Rug Guarantees:**
  - Tidak ada fungsi `mint()` tambahan setelah deploy.
  - Tidak ada `pause()`, `blacklist()`, atau pajak transfer tersembunyi di kontrak token ERC-20.
  - Opsi *Initial Creator Buy* di transaksi peluncuran yang transparan dan tercatat jelas di UI (*"Creator holds X%"*).

---

## 5. Functional Requirements (Fitur Lengkap Production)

### 5.1 Explore & Discovery (`/`)
- **Hero / Featured Spotlight:** Menampilkan proyek *Verified Builder* pilihan & metrik real-time platform (Total Projects Launched, Total Volume, Total Creator Fees Paid).
- **Live Activity Ticker:** Pita transaksi *real-time* di bagian atas (*"0x9a..f2 bought 0.25 ETH of $NEXA • 4s ago"*).
- **Filter & Sorting:**
  - Filter berdasarkan **Chain** (All / Robinhood Chain / Base).
  - Filter berdasarkan **Kategori App** (`All`, `AI & Agents`, `SaaS & Tools`, `Games`, `DeFi`, `Social`, `Open Source`).
  - Filter **Status** (`Live Curve`, `Graduating Soon >80%`, `Graduated`, `Verified Only`).
  - Sortir: `Trending`, `Newest`, `Market Cap`, `Volume 24h`, `Progress`.
- **Search Bar:** Pencarian cepat berdasarkan nama app, ticker (`$SYMBOL`), atau alamat kontrak.

### 5.2 Launch Project & Token (`/launch`)
- **Form Peluncuran 2-Langkah (Bersih & Terpandu):**
  1. **Identitas App & Token:** Nama Proyek, Ticker (`$SYM`), Deskripsi Singkat (*tagline*), Deskripsi Lengkap (Markdown), Kategori, Logo & Banner/Screenshots.
  2. **Bukti & Tautan Builder:** Live App URL, GitHub Repo URL, X/Twitter, Discord/Telegram, plus opsi **Initial Buy** (opsional: jumlah ETH yang ingin dibeli creator pada blok pertama).
- **Preview Kartu Live:** Creator melihat pratinjau kartu proyek & estimasi suplai/harga awal secara langsung sebelum klik **Deploy on-chain**.
- **Alur Transaksi Jelas:** Menangani *switch network*, *upload metadata*, *signature transaksi*, hingga redirect otomatis ke halaman proyek begitu *confirmed*.

### 5.3 Project & Token Detail Page (`/project/[chainId]/[address]`)
Halaman utama yang memadukan **App Showcase** + **Trading Terminal**:
- **Header Proyek:** Logo, Nama, `$TICKER`, Chain Badge, **Verified Builder Badge**, Contract Address (dengan tombol copy + link Block Explorer), dan tombol *Visit Live App*.
- **Interactive Live Chart:** Grafik *Candlestick / Area* (TradingView Lightweight Charts) dengan pilihan timeframe (`1m`, `5m`, `15m`, `1h`, `1d`).
- **Trade Terminal (Sticky Sidebar):**
  - Tab **Buy / Sell** dengan preset cepat (`0.01`, `0.05`, `0.1`, `0.5 ETH` untuk Buy; `25%`, `50%`, `75%`, `MAX` untuk Sell).
  - *Real-time quote calculation* (estimasi token diterima, *price impact*, rincian fee 0.5% platform + 0.5% creator).
  - Pengaturan **Slippage Tolerance** (`0.5%`, `1%`, `3%`, custom).
- **Bonding Curve Progress Widget:** Progress bar neon menuju target graduasi DEX + sisa ETH yang dibutuhkan.
- **Tab Konten Proyek (Di bawah Chart):**
  - **Overview & Showcase:** Deskripsi produk, galeri screenshot, tautan GitHub/App/Sosial.
  - **Updates (Changelog):** Feed *build-in-public* resmi yang hanya bisa diposting oleh *creator wallet* (terverifikasi lewat *Sign-In With Ethereum / SIWE*).
  - **Discussion (Komentar):** Kolom komentar komunitas berbasis wallet (dengan badge `Creator` & `Holder` otomatis).
  - **Trades & Holders:** Tabel riwayat transaksi *real-time* & daftar Top Holders (menandai alamat Bonding Curve & Creator).

### 5.4 Leaderboard (`/leaderboard`)
- **Top Projects:** Peringkat berdasarkan Market Cap, Volume 24h, dan Jumlah Holder.
- **Top Builders:** Peringkat creator berdasarkan total *Builder Fee* yang dihasilkan & jumlah proyek sukses.

### 5.5 Creator & User Dashboard (`/dashboard`)
- **Builder Revenue Panel:** Menampilkan total fee ETH yang sudah terkumpul dari semua proyek yang dibuat user, beserta tombol **Claim Fees** langsung ke smart contract.
- **My Launched Projects:** Daftar proyek milik creator dengan tombol cepat *Edit Metadata / Post Update / Verify Links*.
- **My Portfolio:** Daftar token proyek yang sedang dipegang user beserta nilai estimasi & *PnL*.

### 5.6 Multi-Chain & Wallet Management
- Dukungan native untuk **Robinhood Chain (Testnet `46630` & Mainnet `4663`)** dan **Base (Sepolia `84532` & Mainnet `8453`)**, plus **Hardhat Local (`31337`)** untuk pengembangan.
- Koneksi wallet modern (MetaMask, Rabby, Coinbase Wallet, WalletConnect) melalui **RainbowKit + wagmi + viem**.
- Autentikasi off-chain (komentar, edit metadata, posting changelog) menggunakan **SIWE (Sign-In With Ethereum)** — tanpa perlu password.

---

## 6. Non-Functional Requirements

- **Security:** Smart contract menggunakan OpenZeppelin v5, `ReentrancyGuard`, pola *Checks-Effects-Interactions (CEI)*, *pull-over-push* untuk klaim fee, dan cakupan *unit test* ≥ 95%.
- **Performance:** Waktu muat halaman awal (LCP) < 2 detik; update data trade & chart melalui *polling/SSE* cepat dari indexer PostgreSQL lokal.
- **Self-Hosted Readiness:** Seluruh backend, database PostgreSQL, dan indexer berjalan bersih melalui `docker compose up -d` untuk deployment mudah ke VPS mana pun.
- **Observability:** Structured logging pada indexer & API, health-check endpoint (`/api/health`), dan penanganan *reorg* dasar pada blockchain indexer.

---

## 7. Delivery Milestones (Production Build Plan)

- **Milestone 1 — Foundation & Smart Contracts:** Setup monorepo (`pnpm` workspace), Docker PostgreSQL, kontrak `KradlToken` + `KradlFactory` + `KradlBondingCurve` (Hardhat + Solidity + OpenZeppelin) lengkap dengan test suite & script deploy multi-chain.
- **Milestone 2 — Database, Indexer & Backend API:** Skema PostgreSQL (Prisma), event indexer real-time (sync Launch, Buy, Sell, Graduate, FeeClaimed), agregator OHLCV candle, autentikasi SIWE, serta REST API lengkap.
- **Milestone 3 — Production Frontend (Web3 UI):** Implementasi seluruh halaman sesuai `docs/UI_DESIGN.md`, integrasi wagmi/viem/RainbowKit, TradingView Lightweight Charts, dan alur end-to-end.
- **Milestone 4 — Testing, Testnet Deployment & Hardening:** Uji end-to-end di local node & Robinhood Chain Testnet / Base Sepolia, verifikasi kontrak di Blockscout/Basescan, dan Dockerfile production untuk VPS.
