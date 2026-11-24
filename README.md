# 🧵 MintStitch — Free Mint Radar

> **Kiroween 2026 — kategori Frankenstein.** Satu dashboard yang menjahit
> 4 teknologi yang tidak biasa digabung: pembaca on-chain BSC (public RPC),
> bot Telegram, dashboard web, dan Q&A berbasis aturan — tanpa satu pun
> layanan berbayar.

**Masalah nyata:** free NFT mint di BSC ludes dalam hitungan menit, sementara
infonya tersebar di X, Discord, dan contract read. MintStitch menyatukan
semuanya: status mint live (buka/tutup, minted/supply) untuk watchlist
kontrak free-mint, alert Telegram saat window terbuka, cek eligibility
wallet, dan "Tanya Mint" — tanya soal mint, dijawab dari data live.

## Demo
- 🌐 App yang jalan: *(menunggu URL publik — deploy butuh OAuth Vercel, lihat `SUBMIT-READY.md` §2)*
- 🎥 Video demo: menyusul (<3 menit, shot list di `SUBMIT-READY.md` §5)
- 📝 Submission Devpost: menyusul (deadline 5 Des 2026 06:00 WITA; semua materi siap di `SUBMIT-READY.md`)

## Fitur
| Fitur | Status |
|---|---|
| Pembaca on-chain BSC (rotasi 4 RPC, browser UA) | ✅ |
| Status live 6 mint: Agent Badge, Foundry Faces, SnakeAgentNFT, Unsolvable, PXIO, MECHA | ✅ |
| Alert Telegram "WINDOW OPEN" saat mint berubah jadi BUKA | ✅ (opsional, env-only) |
| Dashboard web: kartu status, refresh manual + auto 60 dtk | ✅ |
| Cek eligibility wallet (`balanceOf`, tanpa connect wallet) | ✅ |
| "Tanya Mint" — Q&A berbasis aturan atas data live | ✅ |
| MCP server lokal `bsc-read` untuk Kiro | ✅ |
| Spec, steering, hooks Kiro (`.kiro/`) | ✅ |

## Cara jalanin
```bash
node --version   # butuh Node 20+
npm install
npm start        # http://localhost:3000
```

Cek cepat:
```bash
curl localhost:3000/api/health
curl localhost:3000/api/mints
curl "localhost:3000/api/check?address=0xd523650eAA5bEb675AAaA0a33d0c0fFf2fC818f3&mint=agent-badge"
curl -X POST localhost:3000/api/ask -H 'Content-Type: application/json' \
  -d '{"question":"apakah Agent Badge masih bisa di-mint?"}'
```

Test + lint:
```bash
npm test   # smoke test (util alamat, QA, MCP, endpoint HTTP)
npm run lint
```

## Setting environment
```bash
cp .env.example .env   # lalu isi — .env TIDAK BOLEH di-commit
```
| Variabel | Wajib | Keterangan |
|---|---|---|
| `PORT` | tidak (default 3000) | Port server |
| `POLL_INTERVAL_MS` | tidak (default 60000) | Interval poll status mint |
| `TELEGRAM_BOT_TOKEN` | tidak | Token bot dari @BotFather — app tetap jalan tanpanya |
| `TELEGRAM_CHAT_ID` | tidak | Chat id penerima alert |

**Tanpa secret di repo.** Token Telegram hanya dari environment. Jangan
pernah commit `.env`, private key, atau seed phrase.

## API
- `GET /api/health` — status app + konfigurasi Telegram + waktu cache
- `GET /api/mints` — status semua mint (cache poller)
- `GET /api/mints/:id` — status satu mint (refresh bila cache >30 dtk)
- `GET /api/check?address=0x…&mint=<id?>` — `balanceOf` per mint
- `POST /api/ask {"question": "..."}` — jawaban Tanya Mint
- `GET /api/alerts` — 20 alert terakhir
- `POST /api/refresh` — paksa refresh cache
- `GET /api/watchlist` — metadata watchlist

## Watchlist (seed terverifikasi)
| Mint | Kontrak BSC | Cara baca |
|---|---|---|
| Agent Badge | `0xB617Aa35249E2e5CF64412a02Fe95d6570c171f6` | `totalMinted()` — `totalSupply()` **REVERT** di kontrak ini |
| Foundry Faces | `0x8653B09bDaD22c99915910962167F132E514331F` | `totalSupply()` + `mintOpen()` |
| SnakeAgentNFT | `0xf7C1Ba2286Cee6eef10cC264664168fD015127b1` | `totalSupply()` + `mintActive()` |
| Unsolvable | `0x9e95Da84f1bcc8E5570DAAc99A37EB3f95270904` | `totalSupply()` |
| PXIO Miners | `0x58e8f1b34B60687B36BCdc78e02a2fd443De71Ab` | `totalSupply()` |
| MECHA | `0xEEe31D337866a57cD59fdECc8B6e6548e182Ea78` | `totalSupply()` |

RPC BSC (rotasi otomatis): `bsc-dataseed.binance.org`,
`bsc-dataseed1.binance.org`, `bsc-dataseed2.binance.org`,
`bsc.publicnode.com` — semua dengan browser User-Agent.

## Cara Kiro dipakai
Proyek ini dibangun **spec-driven** dengan Kiro:
- **Spec** — `.kiro/specs/mintstitch/`: `requirements.md` (EARS),
  `design.md` (arsitektur + keputusan), `tasks.md` (checklist, dicentang
  seiring selesai).
- **Steering** — `.kiro/steering/`: `product.md` (prinsip produk),
  `tech.md` (aturan keras: alamat lowercase programatik, pad 64 hex oleh
  kode, browser UA, `totalMinted()` untuk AgentBadge), `structure.md`
  (peta repo + konvensi).
- **Agent hooks** — `.kiro/hooks/`: `format-on-save.json` (Prettier
  otomatis tiap file JS disimpan), `smoke-check.json` (lint + smoke test
  tiap file `src/`/server berubah).
- **MCP server lokal** — `mcp-server/bsc-read/server.js`, terdaftar di
  `.kiro/settings/mcp.json`. Tools: `bsc_mint_status`,
  `bsc_watchlist`, `bsc_check_eligibility` — Kiro bisa membaca status
  mint BSC langsung dari editor/CLI tanpa keluar dari proyek.
- **Kiro CLI** — terpasang di mesin build (`kiro-cli 3.5.0`,
  `curl -fsSL https://cli.kiro.dev/install | bash`). Login Kiro
  (`kiro-cli login`) butuh sign-in browser (GitHub/Google/AWS Builder
  ID) dan dilakukan oleh pemilik akun — CLI terpasang, login belum.

## Struktur repo
```
server.js  public/  src/  data/  test/  mcp-server/bsc-read/  .kiro/
```
Detail: `.kiro/steering/structure.md`.

## Catatan
- Server hanya MEMBACA chain (`eth_call`) — tidak pernah mengirim
  transaksi. Mint dilakukan pengguna dari wallet-nya sendiri.
- Bukan saran finansial. Free mint tetap butuh gas; cek kontrak sebelum mint.
- Dibangun 19 Nov 2026 untuk Kiroween 2026 (30 Okt–4 Des 2026).

## Lisensi
MIT — lihat `LICENSE`.
