# MintStitch — Design

## Arsitektur
```
public/                 Frontend statis (index.html, styles.css, app.js)
server.js               Express: API + static + poller berkala
src/bsc.js              eth_call ke public RPC BSC (rotasi 4 endpoint)
src/telegram.js         Kirim alert via Bot API (env-only)
src/qa.js               "Tanya Mint": pencocokan aturan atas data live
src/watcher.js          Poll tiap 60 dtk, deteksi transisi -> open, alert
data/watchlist.json     Seed 6 kontrak BSC nyata (terverifikasi)
data/state.json         Runtime state (status terakhir + riwayat alert)
mcp-server/bsc-read/    MCP server lokal (stdio JSON-RPC) untuk Kiro
.kiro/                  Spec, steering, hooks, konfigurasi MCP
```

## Keputusan desain
1. **Tanpa database.** State cukup di file JSON (`data/state.json`).
   Alasan: gratis, cukup untuk 6 mint, dan sesuai aturan hackathon
   (tanpa layanan berbayar).
2. **eth_call mentah, tanpa ethers/web3.** Hanya butuh 5 selector
   (`balanceOf`, `totalSupply`, `totalMinted`, `mintOpen`,
   `mintActive`). Menghindari dependensi berat; `fetch` bawaan Node 20
   sudah cukup. Kelemahan yang diterima: tidak ada retry backoff
   eksponensial — rotasi endpoint sudah memadai untuk radar.
3. **Poller server-side, bukan client-side.** Transisi open harus
   terdeteksi walau dashboard tidak dibuka, supaya alert Telegram jalan.
4. **Q&A berbasis aturan, bukan LLM.** Deterministik, gratis, dan
   jawabannya selalu berakar pada angka live. Intent yang dikenali:
   status/buka, jumlah/supply, alamat kontrak, gratis/biaya.
5. **MCP server terpisah (stdio).** Kiro (IDE/CLI) memanggil
   `bsc_mint_status` / `bsc_check_eligibility` langsung dari editor,
   memakai ulang `src/bsc.js` yang sama dengan server — satu sumber
   kebenaran untuk logika baca BSC.

## Kontrak & selector (seed terverifikasi)
| Mint | Kontrak | Minted | Open flag |
|---|---|---|---|
| Agent Badge | `0xB617Aa35249E2e5CF64412a02Fe95d6570c171f6` | `totalMinted()` `0xa2309ff8` | — (totalSupply REVERT) |
| Foundry Faces | `0x8653B09bDaD22c99915910962167F132E514331F` | `totalSupply()` | `mintOpen()` `0x24bbd049` |
| SnakeAgentNFT | `0xf7C1Ba2286Cee6eef10cC264664168fD015127b1` | `totalSupply()` | `mintActive()` `0x25fd90f3` |
| Unsolvable | `0x9e95Da84f1bcc8E5570DAAc99A37EB3f95270904` | `totalSupply()` | — |
| PXIO Miners | `0x58e8f1b34B60687B36BCdc78e02a2fd443De71Ab` | `totalSupply()` | — |
| MECHA | `0xEEe31D337866a57cD59fdECc8B6e6548e182Ea78` | `totalSupply()` | — |

## API
- `GET /api/health` — status app, konfigurasi Telegram, waktu cache.
- `GET /api/mints` — status semua mint (dari cache poller).
- `GET /api/mints/:id` — status satu mint (refresh bila cache >30 dtk).
- `GET /api/check?address=0x…&mint=<id?>` — balanceOf per mint.
- `POST /api/ask {question}` — jawaban Tanya Mint.
- `GET /api/alerts` — 20 alert terakhir.
- `POST /api/refresh` — paksa refresh cache.
- `GET /api/watchlist` — metadata watchlist (tanpa selector internal).

## Keamanan
- Tidak ada secret di repo: Telegram token + chat id hanya dari env.
- `.env` masuk `.gitignore`; `.env.example` berisi placeholder saja.
- Tidak ada private key, seed phrase, atau kredensial GitHub di repo.
- Endpoint hanya membaca chain (eth_call) — tidak pernah mengirim tx.
