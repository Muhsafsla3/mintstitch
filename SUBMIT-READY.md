# MintStitch — SUBMIT READY (Kiroween 2026, Frankenstein)

Status: 24 Nov 2026 ~22:40 WITA. Deadline submit Devpost: **5 Des 2026 06:00 WITA**
(4 Des 2026 14:00 PT). Hackathon: https://kiroween.devpost.com/
Repo: https://github.com/Muhsafsla3/mintstitch (public, MIT, HEAD 32da323 = origin/master)
Devpost terdaftar atas nama: **M syafrul supardi**. Kategori: **Frankenstein**.

## 1. Checklist kesiapan

| Item | Status |
|---|---|
| Build + tests | ✅ DONE — `npm test` 6/6 lolos (24 Nov 2026, diulang) |
| App lokal jalan + data live | ✅ DONE — `node server.js` :3000, `/api/health` ok:true, `/api/mints` 6 mint live (Agent Badge **214/1000** per 24 Nov 14:40 UTC; Foundry Faces OPEN; SnakeAgentNFT OPEN) |
| Repo GitHub publik + LICENSE MIT terdeteksi | ✅ DONE — `private:false`, `license:MIT` (cek via `gh api`) |
| `/.kiro` di root repo (specs, steering, hooks, MCP settings) | ✅ DONE — 9 file ter-commit, TIDAK di `.gitignore` |
| Tanpa secret di repo | ✅ DONE — tidak ada `.env` (`.env` ada di `.gitignore`, 0 file `.env` ter-commit) |
| Vercel-ready (serverless adapter + `vercel.json`) | ✅ DONE — commit 32da323 |
| **URL demo publik** | ✅ DONE — https://mintstitch-gjlp8y7x4-muhsafsupardi-4561s-projects.vercel.app (Vercel, terverifikasi 25 Nov 2026: `/api/health` ok:true, `/api/mints` 6 mint live) |
| Video demo <3 menit (YouTube publik) | ⚠️ **FILE SIAP, BELUM UPLOAD** — `video/demo-video.mp4` (1:49, 1920×965, H.264, decode OK, direkam 25 Nov 2026 dari URL publik). Upload ke YouTube Public (channel tabibqiu9) via browser task, lalu masukkan link ke form. |
| Submit Devpost | ❌ BELUM — tunggu link video YouTube; JANGAN submit sebelumnya |

## 2. Deploy — SELESAI 24 Nov 2026 (dulu blokir OAuth, kini beres)

URL publik: **https://mintstitch-gjlp8y7x4-muhsafsupardi-4561s-projects.vercel.app**
(deploy via dashboard import repo Muhsafsla3/mintstitch, akun muhsafsupardi-4561;
Vercel auto-deploy tiap push ke master — terverifikasi 25 Nov 2026).

**Perbaikan 25 Nov 2026 (commit 84e316a):** `/api/ask` sempat menggantung di
cold start Vercel (poll 6 mint berurutan > batas durasi fungsi) — frontend
stuck di "Mencari jawaban…". Diperbaiki: ask jawab dari cache, poll dibatasi
race 20 dtk, 503 jujur bila cache kosong; frontend timeout 25 dtk + pesan
gagal. Terverifikasi live: 3/3 POST /api/ask HTTP 200 ~1 dtk. `npm test` 6/6.

Jalur lama (bila deploy putus — import ulang repo di dashboard Vercel;
env TIDAK ADA yang wajib, opsional TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID).
Verifikasi: `GET <url>/api/health` → `ok:true`; `GET <url>/api/mints` → 6 mint.

## 3. Deskripsi submission (Bahasa Inggris — siap tempel ke Devpost)

**Title:** MintStitch — Free Mint Radar for BSC

**About (text description):**
> Free NFT mints on BNB Smart Chain sell out in minutes, but the information
> is scattered across X, Discord, and raw contract reads. MintStitch stitches
> it together into one live dashboard: it watches six free-mint contracts
> on BSC through public RPCs (with automatic rotation across four endpoints),
> shows open/closed status and minted/supply live, sends a Telegram alert
> the moment a mint window opens, checks any wallet's eligibility with a
> read-only `balanceOf` call (no wallet connection, no signature), and
> answers questions about the mints ("Ask Mint") from live data — with zero
> paid services.
>
> MintStitch is a Frankenstein build: an on-chain BSC reader, a Telegram bot,
> a web dashboard, and a rule-based Q&A stitched into a single Node.js app,
> plus a local MCP server (`bsc-read`) so Kiro itself can query the same
> live mint data. It was built spec-driven with Kiro: requirements, design,
> and tasks in `.kiro/specs/mintstitch/`, steering docs for product/tech/
> structure, and agent hooks (format-on-save, smoke-check).
>
> Built for real use: the watchlist is seeded with verified free mints
> (Agent Badge, Foundry Faces, SnakeAgentNFT, Unsolvable, PXIO Miners,
> MECHA). No paid APIs, no API keys required to run — clone, `npm install`,
> `npm start`.

**Built with (tag):** Kiro, Node.js, Express, BNB Smart Chain, Telegram Bot API,
MCP, JavaScript, Vercel

## 4. How Kiro was used (write-up — siap tempel ke Devpost)

> MintStitch was built spec-driven with Kiro from the first commit.
> - **Specs** (`.kiro/specs/mintstitch/`): `requirements.md` (EARS-style
>   requirements), `design.md` (architecture and key decisions, e.g. RPC
>   rotation with browser User-Agent, `totalMinted()` for Agent Badge
>   because its `totalSupply()` reverts), `tasks.md` (checklist ticked off
>   as work landed).
> - **Steering** (`.kiro/steering/`): `product.md` (product principles),
>   `tech.md` (hard rules: derive lowercase addresses programmatically,
>   pad to 64 hex in code, never hand-copy), `structure.md` (repo map).
> - **Agent hooks** (`.kiro/hooks/`): format-on-save and smoke-check hooks
>   that run on every change.
> - **MCP**: a local `bsc-read` MCP server (`mcp-server/bsc-read/`,
>   registered in `.kiro/settings/mcp.json`) exposes the same live BSC
>   reads to Kiro, so the agent can answer mint questions from on-chain
>   data during development.
> - **Kiro CLI / agent work**: the Vercel serverless adapter, the
>   read-only filesystem fallback for serverless, and the cold-start cache
>   fix were all implemented through Kiro agent sessions driven by the spec.

## 5. Rencana video demo (≤3 menit, Bahasa Inggris, rekam layar URL PUBLIK)

Rekam SETELAH deploy (§2). Upload ke YouTube sebagai **Public** oleh user.
Catatan: UI dashboard berbahasa Indonesia — narasi Inggris menjelaskan tiap
langkah; itu tidak masalah, juri melihat app-nya benar-benar jalan.
Angka live per 24 Nov 2026 (cek ulang saat rekam, angka bisa berubah):
Agent Badge 214/1000, Foundry Faces OPEN, SnakeAgentNFT OPEN.

| Waktu | Shot (apa yang terlihat + narasi) |
|---|---|
| 0:00–0:15 | **Intro.** Dashboard terbuka di URL publik. "This is MintStitch — a free-mint radar for BSC. Six free mints, one live dashboard." Tunjuk 6 kartu watchlist. |
| 0:15–0:45 | **Status live.** Klik "↻ Refresh sekarang" → timestamp update. "Every card is read live from BSC public RPCs — open or closed, minted versus supply." Tunjuk badge status + angka Agent Badge. |
| 0:45–1:15 | **Cek eligibility.** Tempel wallet `0xd523650eAA5bEb675AAaA0a33d0c0fFf2fC818f3` → klik Cek wallet. "Read-only balanceOf — no wallet connection, no signature." Tunjuk hasil (Agent Badge: sudah mint). |
| 1:15–1:45 | **Tanya Mint.** Ketik "apakah Agent Badge masih bisa di-mint?" → jawaban dari data live. "Ask Mint answers from live data — no paid API." |
| 1:45–2:15 | **Di balik layar.** Buka `<url>/api/mints` (JSON mentah) + sebut alert Telegram "WINDOW OPEN" dan MCP server `bsc-read`. |
| 2:15–2:45 | **Penutup + Kiro.** Tunjuk repo GitHub (`.kiro/` specs, steering, hooks) + link repo + URL app di layar. "Built spec-driven with Kiro." |
| 2:45–3:00 | Buffer / outro. JANGAN lewat 3:00 — juri tidak wajib nonton lebih. |

Peralatan rekam: screen recording biasa (bukan AI video — video generation
di akun ini diblokir). Rekam 1080p, suara jelas, tanpa musik ber-copyright.

## 6. Langkah submit Devpost (setelah URL + video ada)

1. Login Devpost sebagai **M syafrul supardi** → buka https://kiroween.devpost.com/
   → "Join Hackathon" (kalau belum) → "Enter a submission" / "Submit".
2. Category: **Frankenstein**. Bonus prizes: centang yang relevan bila ada
   (cek halaman Rules saat submit; jangan klaim student/startup — user BUKAN
   mahasiswa dan BUKAN founder startup).
3. Isi form:
   - GitHub repo: `https://github.com/Muhsafsla3/mintstitch`
   - Working app URL: `<url Vercel dari §2>`
   - Demo video: link YouTube publik (§5)
   - Text description: §3 di atas
   - How Kiro was used: §4 di atas
   - Login credentials: TIDAK ADA (app publik, tanpa login).
4. Save draft dulu, periksa semua link bisa dibuka (repo publik, URL app
   200, video Public), baru **Submit** sebelum **5 Des 2026 06:00 WITA**.
   Tidak ada perpanjangan; submission tidak bisa diedit setelah deadline.

## 7. Catatan / bukan tugas agen

- **Verifikasi identitas Didit (KTP + selfie)** untuk kredit Kiro 4.000:
  itu urusan USER sendiri — jangan disentuh agen. Form kredit sudah
  terkirim; kode 4.000 keluar setelah verifikasi lolos; redeem sebelum
  4 Des 2026. (Kreditnya sendiri TIDAK wajib buat submit — app sudah jadi
  tanpa kredit Kiro.)
- Indonesia TIDAK ada di daftar negara yang dilarang Kiroween (yang dilarang
  antara lain Quebec, Argentina, Australia, Brazil, Italia, Filipina,
  Rusia, Kuba, Iran, Korut, Suriah, Belarus, Crimea, DNR/LNR, UAE).
- Telegram alert opsional — jangan isi token bot di repo; hanya via env
  Vercel bila mau.
- Jangan submit sebelum URL publik + video terverifikasi (aturan dari
  `DEPLOY.md`, tetap berlaku).
