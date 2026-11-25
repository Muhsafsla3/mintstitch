/**
 * MintStitch — Free Mint Radar (server.js)
 * Express + frontend statis. Tanpa database berbayar: state di data/state.json.
 * Env (lihat .env.example): PORT, POLL_INTERVAL_MS, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
 */
'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { readMintStatus, checkEligibility, normalizeAddress } = require('./src/bsc');
const { answer } = require('./src/qa');
const { pollOnce, loadState } = require('./src/watcher');
const telegram = require('./src/telegram');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 60_000);

const WATCHLIST = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'watchlist.json'), 'utf8'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let cache = { statuses: [], updatedAt: null, polling: false };

async function refreshCache() {
  if (cache.polling) {
    // Poll sedang jalan (mis. refresh awal saat cold start): tunggu sampai
    // selesai (maks ~30 dtk) daripada pulang dengan cache kosong.
    for (let i = 0; i < 60 && cache.polling; i++) {
      await new Promise((r) => setTimeout(r, 500));
    }
    return cache;
  }
  cache.polling = true;
  try {
    const { statuses } = await pollOnce(WATCHLIST);
    cache = { statuses, updatedAt: new Date().toISOString(), polling: false };
  } catch (err) {
    cache.polling = false;
    console.error('[mintstitch] refresh gagal:', err.message);
  }
  return cache;
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    app: 'mintstitch',
    version: '0.1.0',
    watchlist: WATCHLIST.length,
    telegramConfigured: telegram.isConfigured(),
    pollIntervalMs: POLL_INTERVAL_MS,
    cacheUpdatedAt: cache.updatedAt,
    time: new Date().toISOString(),
  });
});

app.get('/api/mints', async (req, res) => {
  if (!cache.statuses.length) await refreshCache();
  res.json({ updatedAt: cache.updatedAt, mints: cache.statuses });
});

app.get('/api/mints/:id', async (req, res) => {
  const mint = WATCHLIST.find((m) => m.id === req.params.id);
  if (!mint) return res.status(404).json({ error: `mint tidak dikenal: ${req.params.id}` });
  const cached = cache.statuses.find((s) => s.id === mint.id);
  if (cached && Date.now() - new Date(cached.checkedAt).getTime() < 30_000) {
    return res.json(cached);
  }
  try {
    const status = await readMintStatus(mint);
    cache.statuses = cache.statuses.map((s) => (s.id === mint.id ? status : s));
    if (!cache.statuses.find((s) => s.id === mint.id)) cache.statuses.push(status);
    cache.updatedAt = new Date().toISOString();
    res.json(status);
  } catch (err) {
    res.status(502).json({ error: `gagal baca BSC: ${err.message}` });
  }
});

app.get('/api/check', async (req, res) => {
  const { address, mint: mintId } = req.query;
  if (!address) return res.status(400).json({ error: 'parameter address wajib (contoh: ?address=0x...&mint=agent-badge)' });
  let wallet;
  try {
    wallet = normalizeAddress(address);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  const targets = mintId ? WATCHLIST.filter((m) => m.id === mintId) : WATCHLIST;
  if (mintId && targets.length === 0) return res.status(404).json({ error: `mint tidak dikenal: ${mintId}` });
  const results = [];
  for (const mint of targets) {
    try {
      results.push(await checkEligibility(mint, wallet));
    } catch (err) {
      results.push({ id: mint.id, wallet, balance: null, hasMinted: null, error: err.message });
    }
  }
  res.json({ wallet, results });
});

app.post('/api/ask', async (req, res) => {
  const question = (req.body && req.body.question) || '';
  if (!question.trim()) return res.status(400).json({ error: 'question wajib diisi' });
  // Jawab dari cache bila ada; JANGAN blokir pada poll live penuh.
  // Di serverless (Vercel) cold start, poll 6 mint berurutan bisa
  // melampaui batas durasi fungsi — request menggantung dan frontend
  // stuck di "Mencari jawaban…" (kejadian live 25 Nov 2026).
  // Bila cache kosong, beri poll maksimal 20 dtk; bila tetap kosong,
  // kembalikan 503 yang jujur supaya frontend bisa menampilkan pesan.
  if (!cache.statuses.length) {
    try {
      await Promise.race([
        refreshCache(),
        new Promise((r) => setTimeout(r, 20000)),
      ]);
    } catch { /* abaikan — jawab dari data yang ada */ }
  }
  if (!cache.statuses.length) {
    return res.status(503).json({ error: 'Data live sedang dimuat (cold start), coba lagi sebentar.' });
  }
  const result = answer(question, cache.statuses, WATCHLIST);
  res.json({ question, ...result, answeredAt: new Date().toISOString() });
});

app.get('/api/alerts', (req, res) => {
  const state = loadState();
  res.json({ lastPollAt: state.lastPollAt || null, alerts: (state.alerts || []).slice(-20).reverse() });
});

app.post('/api/refresh', async (req, res) => {
  await refreshCache();
  res.json({ updatedAt: cache.updatedAt, mints: cache.statuses });
});

app.get('/api/watchlist', (req, res) => {
  res.json(WATCHLIST.map(({ contract, id, name, notes, supplyCap }) => ({ id, name, contract, supplyCap, notes })));
});

// Refresh awal + poller berkala (kirim alert Telegram bila window terbuka).
refreshCache().then(() => {
  console.log(`[mintstitch] cache awal terisi: ${cache.statuses.length} mint @ ${cache.updatedAt}`);
});
setInterval(() => {
  refreshCache().catch((err) => console.error('[mintstitch] poll berkala gagal:', err.message));
}, POLL_INTERVAL_MS);

// Listener hanya jalan saat `node server.js` langsung (require.main === module).
// Saat di-require dari api/index.js (Vercel serverless), app di-export tanpa listen.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[mintstitch] jalan di http://localhost:${PORT}`);
    console.log(`[mintstitch] watchlist: ${WATCHLIST.length} mint | poll tiap ${POLL_INTERVAL_MS / 1000} dtk | telegram: ${telegram.isConfigured() ? 'terkonfigurasi' : 'tidak dikonfigurasi (opsional)'}`);
  });
}

// Export untuk serverless (Vercel): api/index.js me-require file ini tanpa
// menjalankan listener.
module.exports = app;
