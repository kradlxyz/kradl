# Kradl — UI/UX Design System (Web3 Signature Edition)

> **Aesthetic Direction:** *"Obsidian Terminal meets Product Hunt"*  
> Menggabungkan presisi & nuansa futuristik terminal trading Web3 (*dark-first, crisp 1px borders, glowing status indicators, monospace tabular data*) dengan kehangatan & kejelasan katalog produk modern (*showcase kartu app yang bersih, screenshot produk, dan hierarki informasi yang mudah dibaca publik global*).

---

## 1. Visual Identity & Design Principles

1. **Dark-First Obsidian Canvas:** Pengguna Web3 dan developer menghabiskan waktu lama melihat grafik & data; latar gelap bernuansa *deep obsidian* (bukan hitam pekat `#000000`) mengurangi kelelahan mata sekaligus membuat aksen neon & grafik harga terlihat tajam.
2. **Data Clarity Over Clutter:** Setiap angka harga, market cap, persentase perubahan, dan alamat wallet harus langsung terbaca dalam 0.5 detik menggunakan *tabular monospace numbers*.
3. **Trust Signals Everywhere:** Karena ini launchpad untuk *proyek serius*, elemen kepercayaan (**Verified Builder Badge**, link GitHub/App, indikator Fair Launch, status Bonding Curve) harus menjadi bagian utama hierarki visual — bukan sekadar hiasan.
4. **Tactile Web3 Micro-Interactions:** Hover glow halus pada border kartu, animasi *pulse* pada live feed transaksi, transisi mulus pada bonding curve progress bar, dan feedback jelas di setiap siklus transaksi wallet (*Idle → Signing → Pending → Confirmed*).

---

## 2. Color System (Design Tokens)

Semua warna didefinisikan sebagai CSS Variables di `globals.css` dan dipetakan ke Tailwind CSS:

### Surfaces & Backgrounds
| Token | Hex | Kegunaan |
| :--- | :--- | :--- |
| `--bg-canvas` | `#07090E` | Latar belakang utama halaman (*Deep Obsidian*) |
| `--bg-surface` | `#0D1119` | Kartu proyek, panel trading, sidebar |
| `--bg-elevated` | `#141A26` | Input field, dropdown, modal, hover surface |
| `--bg-glass` | `rgba(13, 17, 25, 0.78)` | Navbar sticky & overlay (`backdrop-filter: blur(16px)`) |

### Borders & Dividers
| Token | Value | Kegunaan |
| :--- | :--- | :--- |
| `--border-subtle` | `rgba(255, 255, 255, 0.07)` | Garis pemisah default antar kartu & tabel |
| `--border-strong` | `rgba(255, 255, 255, 0.14)` | Input focus, tombol sekunder, kartu aktif |
| `--border-glow` | `rgba(0, 229, 160, 0.35)` | Hover border pada proyek Verified / Featured |

### Brand & Web3 Accents
| Token | Hex | Kegunaan |
| :--- | :--- | :--- |
| `--accent-primary` | `#00E5A0` | **Kradl Mint** — CTA utama, Buy action, Verified Glow, Bonding Curve fill |
| `--accent-secondary` | `#6366F1` | **Electric Indigo** — Gradient sekunder, badge Builder/Developer, highlight chain |
| `--accent-gradient` | `linear-gradient(135deg, #00E5A0 0%, #38BDF8 50%, #6366F1 100%)` | Highlight teks hero, progress bar mendekati graduasi (>80%) |

### Semantic Trading & Status Colors
| Token | Hex | Kegunaan |
| :--- | :--- | :--- |
| `--trade-buy` | `#00E5A0` | Harga naik, tombol Buy, candle hijau |
| `--trade-sell` | `#FF4D6D` | Harga turun, tombol Sell, candle merah, error |
| `--status-warning` | `#F59E0B` | Peringatan slippage tinggi, status transaksi pending |
| `--status-info` | `#38BDF8` | Badge chain, info protokol |

### Typography Colors
| Token | Hex | Kegunaan |
| :--- | :--- | :--- |
| `--text-primary` | `#F1F5F9` | Judul, harga utama, nama proyek |
| `--text-secondary` | `#94A3B8` | Tagline, label, deskripsi |
| `--text-muted` | `#64748B` | Timestamp, alamat pendek, placeholder |

---

## 3. Typography

- **Display / Headings:** `Space Grotesk` (atau `Syne` / `Plus Jakarta Sans` Bold) — geometris, tajam, terasa *tech-native* dan modern.
- **Body / UI:** `Inter` — keterbacaan maksimal di ukuran kecil untuk deskripsi proyek, komentar, dan form.
- **Numbers / Addresses / Hashes:** `JetBrains Mono` dengan `font-variant-numeric: tabular-nums` — **wajib** untuk semua harga ETH, Market Cap, persentase perubahan (`+14.2%`), alamat wallet (`0x71C...9A2`), dan countdown.

### Type Scale
- **Hero Title:** `40px–56px`, `font-weight: 700`, `letter-spacing: -0.03em`, `line-height: 1.08`
- **Page Title:** `28px–32px`, `font-weight: 700`, `letter-spacing: -0.02em`
- **Card Title:** `16px–18px`, `font-weight: 600`
- **Body:** `14px–15px`, `line-height: 1.6`
- **Mono Data / Pill:** `12px–13px`, `font-family: var(--font-mono)`

---

## 4. Signature Web3 Components

### 4.1 Live Activity Ticker (Top Bar)
- Pita tipis (`36px`) di paling atas halaman dengan animasi *subtle slide/pulse*.
- Menampilkan transaksi terbaru secara *real-time*:
  - `[● LIVE]` • `0x8a..3f` **BOUGHT** `0.15 ETH` of `$KCODE` *(+2.4%)* • `0x4c..91` **LAUNCHED** `NovaAI ($NVAI)` on **Robinhood Chain**.

### 4.2 Sticky Glass Navbar
- Kiri: Logo **Kradl** (ikon geometris *cradle/orbit* dengan glow mint) + navigasi (`Explore`, `Leaderboard`, `Dashboard`).
- Tengah: Search Bar global dengan shortcut keyboard `⌘K`.
- Kanan:
  - Tombol CTA mencolok **`+ Launch App`** (solid `--accent-primary`, teks gelap `#07090E`, *font-semibold*).
  - **Chain Switcher Pill** (menampilkan ikon & nama chain aktif: Robinhood Chain / Base).
  - **Wallet Button** (avatar *jazzicon/blockie* + saldo ETH + alamat pendek).

### 4.3 Project Showcase Card (Ciri Khas Kradl)
Berbeda dari kartu memecoin biasa, setiap kartu proyek di grid Explore menampilkan:
1. **Top Row:** Logo App (`48x48`, rounded-xl) + Nama App & `$TICKER` + **Verified Builder Badge** (centang mint/biru) + **Chain Micro-Badge** di kanan atas.
2. **Pitch:** 1–2 baris tagline jelas (*"Open-source AI SQL copilot for Postgres teams"*) + Category Pill (`AI & Agents`).
3. **Builder Proof Icons:** Ikon kecil interaktif untuk Live App, GitHub, dan X (menandakan proyek punya produk nyata).
4. **Metrics Strip (Mono):** `MCap $24.5k` • `24h +18.4%` • `Vol 3.2 ETH`.
5. **Bonding Curve Progress Bar:** Bar tipis (`6px`) dengan gradien *mint → cyan → indigo* + teks persentase (`64% to DEX`).
6. **Hover Effect:** Kartu naik `-2px` dengan border glow halus `--border-glow`.

### 4.4 Trade Terminal Widget (Halaman Detail)
- Panel sticky di kolom kanan (`360px–400px`) dengan background `--bg-surface` dan border `--border-strong`.
- **Buy / Sell Segmented Toggle:** Buy menyala hijau mint (`#00E5A0`), Sell menyala merah koral (`#FF4D6D`).
- **Amount Input Besar (Mono):** Menampilkan saldo wallet user + tombol preset cepat (`0.01`, `0.05`, `0.1`, `0.5 ETH` atau `25%`, `50%`, `75%`, `MAX`).
- **Transparent Fee Breakdown Box:**
  - `You receive: ~1,245,000 $SYM`
  - `Builder Funding (0.5%): 0.0005 ETH` *(disorot positif — user tahu uangnya mendanai developer!)*
  - `Platform Fee (0.5%): 0.0005 ETH`
  - `Slippage: 1.0%` *(ikon gear untuk edit)*.
- **Transaction Lifecycle Button:**
  - `Connect Wallet` → `Switch to Robinhood Chain` → `Buy $SYM` → `Confirm in Wallet...` → `Confirming on-chain...` → Toast sukses dengan link Block Explorer.

### 4.5 Bonding Curve & Graduation Card
- Visualisasi progres yang jelas:
  - Bar progres bercahaya + penanda milestone (`0%` → `50%` → `100% DEX Graduation`).
  - Penjelasan singkat yang menenangkan user awam: *"When 5.0 ETH is reached, 98% of liquidity automatically migrates to DEX & locks forever."*

### 4.6 Builder Revenue Card (Creator Dashboard)
- Kartu hero khusus untuk developer dengan aksen gradien halus (`mint` + `indigo`):
  - Menampilkan **Unclaimed Builder Fees** dalam angka besar mono (`0.4820 ETH` ≈ `\$1,420`).
  - Tombol besar **`Claim Fees Now`** yang langsung memanggil `claimCreatorFees()` di smart contract.

---

## 5. Layout & Page Wireframes

### Explore Page (`/`)
- **Max-width container:** `1360px`, padding horizontal `24px` (desktop) / `16px` (mobile).
- **Grid Kartu Proyek:**
  - Desktop (`≥1280px`): 3 kolom (`gap-5`).
  - Tablet (`768px–1279px`): 2 kolom.
  - Mobile (`<768px`): 1 kolom.
- **Filter Bar:** Sticky di bawah navbar dengan horizontal scroll pill di mobile.

### Project Detail Page (`/project/[chainId]/[address]`)
- **Desktop Layout (2 Kolom Asimetris — 68% / 32%):**
  - **Kolom Kiri (68%):**
    1. Project Header (Logo, Title, Verified Badge, Live App CTA, Share/Copy CA).
    2. Interactive Live Candlestick Chart (tinggi `400px`).
    3. Tabs: `Overview & Demo` | `Updates (Changelog)` | `Discussion` | `Trades` | `Holders`.
  - **Kolom Kanan (32%, Sticky):**
    1. Trade Terminal Widget (Buy/Sell).
    2. Bonding Curve Progress Card.
    3. Builder Info Card (Creator address, GitHub/X links, total fee earned, Fair Launch checklist).
- **Mobile Layout:** Header → Chart → Sticky Bottom Bar ("Buy / Sell" membuka bottom sheet drawer) → Tabs.

---

## 6. Accessibility & Motion Guidelines

- **Kontras:** Minimal rasio kontras `4.5:1` untuk teks utama di atas `--bg-surface`.
- **Skeleton Loaders:** Gunakan *shimmer dark skeleton* (bukan spinner kosong) saat memuat daftar proyek, chart, atau saldo wallet.
- **Empty States:** Setiap tab kosong (misal belum ada komentar atau belum ada proyek yang dibuat) wajib punya ilustrasi/ikon minimal dan tombol CTA yang jelas.
- **Reduced Motion:** Hormati `@media (prefers-reduced-motion: reduce)` untuk ticker animasi dan efek glow.
