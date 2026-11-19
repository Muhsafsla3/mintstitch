/**
 * src/qa.js — "Tanya Mint": Q&A berbasis aturan atas data watchlist.
 * Tanpa API berbayar, tanpa model eksternal: jawaban dirangkai dari status
 * live yang sudah dibaca dari BSC + metadata watchlist.
 */
'use strict';

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findMint(question, statuses, watchlist) {
  const q = normalize(question);
  const scored = watchlist.map((m) => {
    const hay = normalize(`${m.id} ${m.name} ${m.contract} ${(m.aliases || []).join(' ')}`);
    let score = 0;
    for (const token of q.split(' ').filter((t) => t.length > 2)) {
      if (hay.includes(token)) score += token.length;
    }
    if (q.includes(normalize(m.name))) score += 50;
    if (q.includes(m.id)) score += 50;
    return { mint: m, score };
  });
  scored.sort((a, b) => b.score - a.score);
  if (scored.length === 0 || scored[0].score <= 0) return null;
  const mint = scored[0].mint;
  const status = statuses.find((s) => s.id === mint.id) || null;
  return { mint, status };
}

function describeStatus(status) {
  if (!status) return 'status live belum sempat dibaca — coba refresh dashboard dulu.';
  if (status.status === 'open') return '🟢 BUKA — mint masih bisa dicoba sekarang.';
  if (status.status === 'closed') return '🔴 TUTUP — flag mint di kontrak sedang nonaktif.';
  return '⚪ TIDAK DIKETAHUI — kontrak ini tidak punya flag buka/tutup yang bisa dibaca; yang bisa dicek hanya jumlah minted.';
}

function answer(question, statuses, watchlist) {
  const q = normalize(question);
  const found = findMint(question, statuses, watchlist);

  if (!found) {
    const names = watchlist.map((m) => m.name).join(', ');
    return {
      answer:
        `Gue belum nemu mint yang lu maksud di watchlist. Yang gue pantau saat ini: ${names}. ` +
        `Coba tanya misalnya "apakah Agent Badge masih bisa di-mint?" atau "berapa Foundry Faces yang sudah di-mint?"`,
      mintId: null,
    };
  }

  const { mint, status } = found;
  const mintedPart =
    status && status.minted !== null
      ? `Sudah di-mint ${status.minted}${status.supply ? ` dari supply ${status.supply}` : ''}` +
        (status.remaining !== null ? `, sisa ${status.remaining}.` : '.')
      : 'Jumlah minted tidak terbaca dari RPC saat ini.';
  const checkedPart = status ? ` (dicek ${status.checkedAt})` : '';

  if (/(masih bisa|bisa di.mint|buka|open|mint sekarang|available)/.test(q)) {
    return {
      mintId: mint.id,
      answer: `${mint.name}: ${describeStatus(status)} ${mintedPart}${checkedPart}`,
    };
  }
  if (/(berapa|jumlah|sudah.*mint|minted|supply|sisa|tersisa)/.test(q)) {
    return {
      mintId: mint.id,
      answer: `${mint.name} — ${mintedPart} Status: ${describeStatus(status)}${checkedPart}`,
    };
  }
  if (/(kontrak|contract|alamat|address)/.test(q)) {
    return {
      mintId: mint.id,
      answer: `${mint.name} — kontrak BSC: ${mint.contract}. ${mintedPart}`,
    };
  }
  if (/(gratis|free|bayar|biaya|harga)/.test(q)) {
    return {
      mintId: mint.id,
      answer:
        `${mint.name} tercatat sebagai free mint (value 0 + gas) di watchlist MintStitch. ` +
        `Status live: ${describeStatus(status)} ${mintedPart}`,
    };
  }
  return {
    mintId: mint.id,
    answer: `${mint.name} — ${describeStatus(status)} ${mintedPart}${checkedPart} Tanya juga bisa: "berapa yang sudah di-mint?", "apakah masih buka?", atau "berapa kontraknya?".`,
  };
}

module.exports = { answer, findMint, normalize };
