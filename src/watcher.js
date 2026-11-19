/**
 * src/watcher.js — Poller berkala: baca ulang semua status watchlist,
 * deteksi transisi closed/unknown -> open, kirim alert Telegram sekali
 * per transisi. State terakhir disimpan di data/state.json (file lokal,
 * bukan database berbayar).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { readMintStatus } = require('./bsc');
const telegram = require('./telegram');

const STATE_PATH = path.join(__dirname, '..', 'data', 'state.json');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return { lastStatus: {}, alerts: [] };
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

/**
 * Satu putaran poll. Mengembalikan { statuses, transitions, alertsSent }.
 * `notify` = fungsi kirim pesan (default telegram.sendMessage) — bisa
 * di-override di test supaya tidak kirim pesan sungguhan.
 */
async function pollOnce(watchlist, { notify = telegram.sendMessage } = {}) {
  const state = loadState();
  const statuses = [];
  const transitions = [];
  const alertsSent = [];

  for (const mint of watchlist) {
    let status;
    try {
      status = await readMintStatus(mint);
    } catch (err) {
      status = {
        id: mint.id,
        name: mint.name,
        contract: mint.contract,
        status: 'error',
        open: null,
        openKnown: false,
        minted: null,
        supply: mint.supplyCap ? String(mint.supplyCap) : null,
        remaining: null,
        endpoint: null,
        checkedAt: new Date().toISOString(),
        errors: [String(err.message || err)],
      };
    }
    statuses.push(status);

    const prev = state.lastStatus[mint.id];
    const prevStatus = prev ? prev.status : 'unknown';
    if (status.status === 'open' && prevStatus !== 'open') {
      transitions.push({ id: mint.id, name: mint.name, from: prevStatus, to: 'open' });
      const text = telegram.windowOpenMessage(status);
      const result = await notify(text);
      alertsSent.push({ id: mint.id, ...result, at: new Date().toISOString() });
      state.alerts.push({ id: mint.id, name: mint.name, at: new Date().toISOString(), ...result });
      state.alerts = state.alerts.slice(-50);
    }
    state.lastStatus[mint.id] = { status: status.status, minted: status.minted, at: status.checkedAt };
  }

  state.lastPollAt = new Date().toISOString();
  saveState(state);
  return { statuses, transitions, alertsSent };
}

module.exports = { pollOnce, loadState, saveState, STATE_PATH };
