---
description: Security, gas efficiency, and testing rules for Solidity smart contracts in contracts/.
trigger: model_decision
---

# Kradl Solidity & Smart Contract Security Rules

Terapkan aturan ini setiap kali membuat, mengedit, atau mengaudit file `.sol` dan test kontrak di `contracts/`:

1. **Compiler & Standards:**
   - Gunakan fixed pragma `pragma solidity 0.8.24;` (hindari floating pragma `^`).
   - Gunakan library **OpenZeppelin Contracts v5** (`ERC20`, `ERC20Permit`, `ReentrancyGuard`, `Ownable2Step`, `SafeERC20`).

2. **Security Patterns (Mandatory):**
   - Terapkan `nonReentrant` pada semua fungsi eksternal yang mentransfer ETH atau token (`launchProject`, `buy`, `sell`, `claimCreatorFees`, `claimPlatformFees`).
   - Ikuti pola **Checks-Effects-Interactions (CEI)** secara ketat: update seluruh state (reserve, fee balance, status `graduated`) *sebelum* melakukan `call{value: ...}` atau `safeTransfer`.
   - Gunakan pola **Pull-over-Push** untuk seluruh distribusi fee (`creatorFeesAccrued`, `platformFeesAccrued`) agar kontrak yang menolak ETH tidak bisa memblokir (DoS) transaksi trading.
   - Gunakan custom errors (`error InsufficientOutput();`) bukan string `require` panjang untuk efisiensi gas & kejelasan debugging.

3. **Bonding Curve & Fee Invariants:**
   - Total fee trading per transaksi = `100 bps` (`1%`): `50 bps` Platform + `50 bps` Creator.
   - Graduation fee = `200 bps` (`2%`) dari `realEthReserve` saat migrasi.
   - Selalu sertakan parameter slippage protection (`minTokensOut` pada `buy`, `minEthOut` pada `sell`).
   - Jika `buy` melebihi `graduationThreshold`, hitung `ethIn` tepat sampai batas graduasi dan kembalikan kelebihan ETH (*refund*) ke `msg.sender` secara aman.
   - Pastikan tidak pernah terjadi pembagian dengan nol atau *dust draining* pada reserve.

4. **Anti-Rug Guarantees (`KradlToken.sol`):**
   - Suplai tetap `1_000_000_000 * 1e18` dicetak sekali di `constructor`.
   - Dilarang menambahkan fungsi `mint`, `burnFrom` sepihak, `pause`, `blacklist`, atau transfer tax di dalam `KradlToken`.

5. **Testing Requirements:**
   - Setiap perubahan kontrak wajib memiliki unit test lengkap mencakup: happy path (launch, buy, sell, graduate, claim fees), edge cases (slippage revert, over-threshold refund, zero-amount revert, unauthorized claim), dan *accounting invariant* (`address(launchpad).balance == sum(realEthReserves) + platformFeesAccrued + sum(creatorFeesAccrued)`).
