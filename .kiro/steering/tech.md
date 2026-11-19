# Steering — Teknologi

## Stack
- Node.js 20+ (fetch bawaan, tanpa ethers/web3 — eth_call mentah cukup).
- Express 4 untuk API + static file.
- Frontend statis: HTML/CSS/JS tanpa build step.
- Penyimpanan: file JSON (`data/watchlist.json`, `data/state.json`).
- MCP server lokal: stdio JSON-RPC, tanpa dependensi tambahan.

## Aturan keras
1. **Alamat BSC:** lowercase diturunkan SECARA PROGRAMATIK dari alamat
   checksummed (`address.toLowerCase()` + assert regex `^0x[0-9a-f]{40}$`).
   Jangan pernah salin versi lowercase dari ingatan — pernah hilang
   "c0" (38 karakter) dan semua eth_call revert.
2. **Pad calldata oleh kode:** argumen alamat di-pad ke 64 hex dengan
   `padStart(64, '0')`, jangan hitung tangan.
3. **User-Agent browser WAJIB** di semua request HTTP ke RPC BSC
   (UA default Node/Python kena 403 / rate-limit).
4. **AgentBadge:** `totalSupply()` REVERT — selalu pakai `totalMinted()`
   (selector `0xa2309ff8`).
5. **Secret hanya dari env.** Token Telegram (`TELEGRAM_BOT_TOKEN`,
   `TELEGRAM_CHAT_ID`) tidak pernah masuk repo, file, atau log.
6. **eth_call yang revert = data null + error tercatat**, bukan crash.
   Satu mint gagal tidak boleh mematikan mint lain.
7. **Kode entry ditulis sendiri** (oleh agen pembangun), bukan copy dari
   model lain dan bukan hasil minta model eksternal menulis kode.
