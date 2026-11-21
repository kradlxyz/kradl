---
description: Frontend Web3 UX, wagmi/viem integration, and Kradl UI Design System rules for apps/web/.
trigger: model_decision
---

# Kradl Web3 Frontend & UI Design Rules

Terapkan aturan ini setiap kali mengerjakan halaman, komponen UI, atau integrasi wallet di `apps/web/`:

1. **Design System Compliance (`docs/UI_DESIGN.md`):**
   - Gunakan tema **Dark-First Obsidian** (`#07090E` canvas, `#0D1119` surface, `#141A26` elevated) dengan aksen **Kradl Mint** (`#00E5A0`) dan **Electric Indigo** (`#6366F1`).
   - Semua angka finansial (harga ETH, Market Cap, persentase 24h, saldo, progress curve) dan alamat wallet/hash **wajib** memakai font monospace (`font-mono tabular-nums`).
   - Pertahankan identitas **App/Project Launchpad**: selalu tampilkan sinyal kepercayaan produk (*Verified Builder Badge*, link Live App, GitHub, kategori app) secara menonjol pada kartu & halaman detail.

2. **Web3 Transaction UX Lifecycle:**
   - Setiap tombol aksi *on-chain* (`Launch`, `Buy`, `Sell`, `Claim Fees`) wajib menangani seluruh state dengan jelas:
     1. Wallet belum terhubung → tampilkan tombol `Connect Wallet`.
     2. Chain tidak sesuai dengan proyek → tampilkan tombol `Switch to <ChainName>`.
     3. Input tidak valid / saldo kurang → disable tombol dengan label informatif.
     4. Menunggu tanda tangan → `Confirm in Wallet...`.
     5. Transaksi terkirim → `Confirming on-chain...` + link ke Block Explorer.
     6. Sukses / Gagal → Toast notifikasi bersih dengan pesan error yang ramah manusia (parsing revert reason, jangan tampilkan raw JSON-RPC stack trace).

3. **Performance & Real-Time Feedback:**
   - Gunakan *skeleton loaders* bernuansa gelap, hindari layout shift (CLS).
   - Hitung estimasi quote Buy/Sell secara instan di sisi klien menggunakan `packages/shared/src/bondingCurve.ts` (`BigInt`), tanpa menunggu RPC call setiap user mengetik 1 karakter.
   - Setelah transaksi sukses, segera invalidate cache query (TanStack Query) agar chart, saldo, dan riwayat trade langsung terbarui.

4. **Responsive Design:**
   - Halaman detail proyek menggunakan layout 2 kolom asimetris (68% / 32% sticky sidebar) di desktop, dan *sticky bottom trade bar + drawer* di mobile.
