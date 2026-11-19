'use strict';

const cardsEl = document.getElementById('cards');
const updatedEl = document.getElementById('updated');
const tgStateEl = document.getElementById('tgState');

function badgeFor(status) {
  if (status === 'open') return '<span class="badge open">● BUKA</span>';
  if (status === 'closed') return '<span class="badge closed">● TUTUP</span>';
  if (status === 'error') return '<span class="badge error">● ERROR</span>';
  return '<span class="badge unknown">○ TIDAK DIKETAHUI</span>';
}

function renderCards(mints) {
  cardsEl.innerHTML = mints.map((m) => {
    const nums =
      m.minted !== null
        ? `<div class="nums">${m.minted}${m.supply ? ` <small>/ ${m.supply} supply</small>` : ''}${m.remaining !== null ? ` <small>· sisa ${m.remaining}</small>` : ''}</div>`
        : '<div class="nums">— <small>jumlah minted tidak terbaca</small></div>';
    const errs = (m.errors || []).length
      ? `<p class="err">${m.errors.map((e) => escapeHtml(e)).join('<br>')}</p>`
      : '';
    return `<article class="card">
      <h3>${escapeHtml(m.name)}</h3>
      ${badgeFor(m.status)}
      ${nums}
      <p><code>${escapeHtml(m.contract)}</code></p>
      <p class="note">Dicek ${escapeHtml(m.checkedAt || '')}${m.endpoint ? ` via ${escapeHtml(shortHost(m.endpoint))}` : ''}</p>
      ${errs}
    </article>`;
  }).join('');
}

function shortHost(url) {
  try { return new URL(url).host; } catch { return url; }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function loadMints() {
  const res = await fetch('/api/mints');
  const data = await res.json();
  renderCards(data.mints || []);
  updatedEl.textContent = data.updatedAt ? `Terakhir dicek ${new Date(data.updatedAt).toLocaleString('id-ID')}` : '';
}

async function loadHealth() {
  const res = await fetch('/api/health');
  const data = await res.json();
  tgStateEl.textContent = data.telegramConfigured ? 'Telegram: aktif' : 'Telegram: belum dikonfigurasi (opsional)';
}

async function loadAlerts() {
  const res = await fetch('/api/alerts');
  const data = await res.json();
  const el = document.getElementById('alerts');
  if (!data.alerts || !data.alerts.length) {
    el.innerHTML = '<p class="muted">Belum ada alert window-open. Alert muncul otomatis saat poller mendeteksi mint berubah jadi BUKA.</p>';
    return;
  }
  el.innerHTML = '<ul>' + data.alerts.map((a) =>
    `<li>${escapeHtml(a.at || '')} — <b>${escapeHtml(a.name || a.id)}</b>: ${a.sent ? 'terkirim ke Telegram' : 'gagal: ' + escapeHtml(a.reason || '')}</li>`
  ).join('') + '</ul>';
}

document.getElementById('refreshBtn').addEventListener('click', async () => {
  const res = await fetch('/api/refresh', { method: 'POST' });
  const data = await res.json();
  renderCards(data.mints || []);
  updatedEl.textContent = data.updatedAt ? `Terakhir dicek ${new Date(data.updatedAt).toLocaleString('id-ID')}` : '';
  loadAlerts();
});

document.getElementById('checkForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const addr = document.getElementById('walletInput').value.trim();
  const out = document.getElementById('checkResult');
  if (!addr) return;
  out.innerHTML = '<p class="muted">Mengecek balanceOf di BSC…</p>';
  const res = await fetch('/api/check?address=' + encodeURIComponent(addr));
  const data = await res.json();
  if (data.error) { out.innerHTML = `<p class="err">${escapeHtml(data.error)}</p>`; return; }
  out.innerHTML = '<table><tr><th>Mint</th><th>Balance</th><th>Sudah mint?</th></tr>' +
    data.results.map((r) =>
      `<tr><td>${escapeHtml(r.id)}</td><td>${r.balance === null ? '—' : escapeHtml(r.balance)}</td><td>${r.hasMinted === null ? (escapeHtml(r.error || '—')) : (r.hasMinted ? '✅ Ya' : 'Belum')}</td></tr>`
    ).join('') + '</table>';
});

document.getElementById('askForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = document.getElementById('askInput').value.trim();
  const out = document.getElementById('askResult');
  if (!q) return;
  out.innerHTML = '<p class="muted">Mencari jawaban dari data live…</p>';
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: q }),
  });
  const data = await res.json();
  out.innerHTML = `<div class="answer">${escapeHtml(data.answer || data.error || 'Tidak ada jawaban.')}</div>`;
});

loadHealth();
loadMints();
loadAlerts();
setInterval(loadMints, 60000);
setInterval(loadAlerts, 60000);
