# MintStitch — Spec (Kiro spec-driven development)

## Ringkasan
MintStitch adalah Free Mint Radar untuk BSC: satu dashboard yang menjahit
empat teknologi yang jarang digabung — pembaca on-chain via public RPC,
bot Telegram, dashboard web statis, dan Q&A berbasis aturan. Target pengguna:
kolektor free mint (seperti Tabibqiu / tabibqiu9.ai) yang selama ini harus
mengecek X, Discord, dan contract read satu per satu sementara mint ludes
dalam hitungan menit.

## Requirements (EARS)

### R1 — Pembaca on-chain BSC
- R1.1 WHEN server membaca status mint THEN sistem WAJIB memanggil
  `eth_call` ke public RPC BSC dengan rotasi endpoint bila satu gagal.
- R1.2 WHEN membaca AgentBadge THEN sistem WAJIB memakai
  `totalMinted()` (selector `0xa2309ff8`), karena `totalSupply()`
  (`0x18160ddd`) REVERT di kontrak itu.
- R1.3 WHEN membaca Foundry Faces THEN sistem WAJIB membaca
  `mintOpen()` (`0x24bbd049`); WHEN membaca SnakeAgentNFT THEN
  `mintActive()` (`0x25fd90f3`).
- R1.4 WHEN sebuah `eth_call` revert THEN sistem WAJIB mencatat error
  dan melanjutkan ke mint berikutnya, bukan crash.
- R1.5 WHEN memanggil RPC THEN sistem WAJIB mengirim browser User-Agent
  (UA default Node/Python diblokir 403 / rate-limit).

### R2 — Cek eligibility wallet
- R2.1 WHEN pengguna menempel alamat BSC THEN sistem WAJIB membaca
  `balanceOf(address)` di tiap kontrak watchlist.
- R2.2 WHEN alamat tidak valid THEN sistem WAJIB menolak dengan pesan
  yang jelas, tanpa memanggil RPC.
- R2.3 Alamat WAJIB dinormalisasi ke lowercase secara programatik dan
  argumen alamat di-pad ke 64 hex oleh kode (jangan hitung tangan).

### R3 — Alert Telegram
- R3.1 WHEN status mint berubah dari closed/unknown menjadi open THEN
  sistem WAJIB mengirim satu pesan "WINDOW OPEN" ke chat Telegram yang
  dikonfigurasi.
- R3.2 WHEN token/chat id tidak dikonfigurasi THEN sistem WAJIB tetap
  jalan normal dan mencatat "tidak dikonfigurasi".
- R3.3 Token bot WAJIB hanya dari environment — TIDAK PERNAH di repo.

### R4 — Dashboard web
- R4.1 Dashboard WAJIB menampilkan kartu per mint: nama, badge status
  (BUKA/TUTUP/TIDAK DIKETAHUI), jumlah minted/supply, sisa, kontrak,
  waktu cek terakhir.
- R4.2 Dashboard WAJIB punya tombol refresh manual dan auto-refresh
  tiap 60 detik.
- R4.3 Frontend WAJIB statis tanpa build step (HTML/CSS/JS murni).

### R5 — Tanya Mint
- R5.1 WHEN pengguna bertanya soal mint di watchlist THEN sistem WAJIB
  menjawab dari status live + metadata, tanpa API berbayar.
- R5.2 WHEN mint tidak ditemukan THEN sistem WAJIB membalas daftar mint
  yang tersedia dan contoh pertanyaan.
- R5.3 Jawaban WAJIB dalam Bahasa Indonesia.

### R6 — Kiro & repo (hackathon)
- R6.1 Repo GitHub WAJIB publik, berisi semua source + folder `.kiro`
  di root, dan `.kiro` TIDAK BOLEH masuk `.gitignore`.
- R6.2 Repo WAJIB berisi spec ini, steering docs, hooks, dan MCP server
  lokal `bsc-read`.
- R6.3 App WAJIB jalan tanpa layanan berbayar apa pun (file JSON saja,
  tanpa database berbayar).

## Kriteria penerimaan
- `npm start` jalan, `GET /api/health` mengembalikan `ok: true`.
- `GET /api/mints` mengembalikan status live 6 mint (minted terbaca
  untuk mayoritas; error per-mint tercatat, bukan crash).
- `GET /api/check?address=<wallet BSC>` mengembalikan balance per mint.
- `POST /api/ask` menjawab pertanyaan soal Agent Badge dengan angka live.
- MCP server merespons `tools/list` dan `tools/call bsc_mint_status`.
- Tidak ada secret/token di repo (`git grep` bersih dari pola token).
