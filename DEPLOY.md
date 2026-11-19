# MintStitch — Deploy

Status: 19 Nov 2026 ~23:41 WITA. Repo: https://github.com/Muhsafsla3/mintstitch
(HEAD setelah commit ini: deploy-ready Vercel + perbaikan cold-start.)

## Status deploy

- **Lokal: LIVE** — `node server.js` di `:3000` (proses detached, restart manual bila mati).
  Verifikasi 19 Nov 23:41: `/api/health` → `ok:true, watchlist:6`;
  `/api/mints` → 6 mint, Agent Badge **145/1000** (cocok on-chain).
- **URL publik durable: BELUM ADA.** Semua percobaan tunnel dari VM ini GAGAL
  (rincian di bawah). Yang selesai malam ini: repo dibuat **Vercel-ready** supaya
  parent bisa deploy dengan satu perintah begitu OAuth Vercel tersambung.
  **JANGAN submit Devpost sebelum URL publik + video demo selesai.**

## Yang diubah untuk deploy (commit ini)

- `api/index.js` (baru): entrypoint serverless Vercel — re-export app Express.
- `vercel.json` (baru): rewrite `/api/*` → `/api/index.js`. File `public/` disajikan
  statis oleh Vercel; Express juga bisa menyajikannya (tidak bentrok).
- `server.js`: `app.listen` hanya saat `node server.js` langsung
  (`require.main === module`); `module.exports = app` untuk serverless.
  `refreshCache()`: kalau poll sedang jalan (cold start), tunggu sampai selesai
  (maks ~30 dtk) daripada mengembalikan cache kosong.
- `src/watcher.js`: `saveState`/`loadState` fallback in-memory bila filesystem
  read-only (Vercel serverless) — perilaku lokal tidak berubah (file tetap ditulis).
- Tes: `npm test` 6/6 lolos; adapter diverifikasi di port 3101
  (`/api/health` 200 + `/api/mints` 6 mint, Agent Badge 145/1000).

## Deploy durable — jalur utama: Vercel (gratis, tanpa kartu)

Butuh: OAuth Vercel tersambung (parent, via browser — CLI di VM ini
`/opt/hatch/bin/vercel` hanya MCP OAuth helper, `vercel status` =
`not_connected` 19 Nov 23:35).

1. Parent: sambungkan Vercel (OAuth) → `vercel --prod` dari root repo,
   atau import repo `Muhsafsla3/mintstitch` di dashboard Vercel.
2. Env: tidak ada yang wajib. Opsional: `TELEGRAM_BOT_TOKEN` +
   `TELEGRAM_CHAT_ID` (alert window buka; app jalan tanpanya).
3. Verifikasi setelah deploy: `GET <url>/api/health` → `ok:true`;
   `GET <url>/api/mints` → 6 mint, Agent Badge 145/1000.
4. Catatan: cold start pertama `/api/mints` bisa ~7 dtk (poll BSC);
   request berikutnya pakai cache in-memory instance. Jangan set
   `maxDuration` di `vercel.json` tanpa cek limit plan (Hobby).

Jalur alternatif: **Render** (gratis, tanpa kartu untuk free tier) — New Web
Service dari repo GitHub, build `npm install`, start `npm start`, env `PORT`
otomatis. Kelemahan: free tier spin-down setelah idle (first load lambat).

## Percobaan tunnel dari VM (SEMUA GAGAL 19 Nov 23:35–23:38)

- **cloudflared quick tunnel** (biner 2025.10.0, diunduh OK dari GitHub):
  `failed to request quick Tunnel: tls: first record does not look like a TLS handshake`.
  Penyebab: panggilan control-plane `api.trycloudflare.com` tidak jalan lewat
  egress proxy VM (curl ke host yang sama dapat HTTP 403 = host terjangkau,
  tapi cloudflared tidak memakai proxy env). Biner TIDAK di-commit
  (tersimpan di `/tmp/cloudflared2`).
- **localtunnel** (`npx --yes localtunnel`): `localtunnel.me` tidak terjangkau
  sama sekali dari VM (curl HTTP 000); proses mati sendiri.
- **SSH reverse tunnel** (`localhost.run`, `serveo`): koneksi SSH di-reset
  proxy (`Connection reset by 198.19.0.1 port 3128`).
- Kesimpulan: VM ini tidak bisa membuka URL publik sendiri tanpa akun/host
  yang login via browser. Jangan ulangi percobaan tunnel yang sama.

## Jalankan lokal

```
cd ~/workspace/mintstitch
node server.js            # :3000 (detached: nohup node server.js > server.log 2>&1 &)
curl localhost:3000/api/health
curl localhost:3000/api/mints
```

Matikan: `kill <pid>` (cari via `ps aux | grep "node server.js"`).
JANGAN `pkill -f "node server.js"` dari perintah yang mengandung pola itu.

## Rencana video demo (<3 menit, direkam SETELAH deploy)

Bahasa: Inggris (Devpost). Rekam layar dashboard di URL publik.

| Waktu | Shot |
|---|---|
| 0:00–0:15 | Intro: dashboard terbuka, 6 kartu watchlist (Agent Badge 145/1000, Foundry Faces OPEN, SnakeAgentNFT OPEN, Unsolvable 401/3333, PXIO, MECHA) |
| 0:15–0:45 | Klik "Refresh sekarang" → timestamp update; tunjuk badge status open/closed |
| 0:45–1:15 | Cek eligibility: tempel wallet `0xd523650eAA5bEb675AAaA0a33d0c0fFf2fC818f3` → hasil (Agent Badge 1, hasMinted true) |
| 1:15–1:45 | Tanya Mint: tanya "mint gratis apa yang lagi buka?" → jawaban dari data watchlist |
| 1:45–2:15 | Buka `/api/mints` (JSON) + sebut alert Telegram + MCP `bsc-read` |
| 2:15–2:45 | Penutup: cara Kiro dipakai (specs, hooks, steering, MCP) + link repo + URL app |

Upload video ke YouTube oleh user → URL video masuk submit Devpost
(deadline 5 Des 2026 06:00 WITA). Jangan submit sebelum video + URL terverifikasi.
