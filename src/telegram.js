/**
 * src/telegram.js — Alert Telegram (opsional, env-only).
 *
 * Token bot & chat id HANYA dari environment:
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * Jangan pernah taruh token asli di repo, di file, atau di log.
 */
'use strict';

function isConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

async function sendMessage(text) {
  if (!isConfigured()) {
    return { sent: false, reason: 'telegram tidak dikonfigurasi (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID kosong)' };
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    return { sent: false, reason: `Telegram API: ${json.description || `HTTP ${res.status}`}` };
  }
  return { sent: true, messageId: json.result && json.result.message_id };
}

function windowOpenMessage(status) {
  const lines = [
    '🟢 <b>WINDOW OPEN — MintStitch</b>',
    '',
    `<b>${escapeHtml(status.name)}</b>`,
    `Kontrak: <code>${status.contract}</code>`,
    status.minted !== null ? `Sudah di-mint: ${status.minted}${status.supply ? ` / ${status.supply}` : ''}` : 'Jumlah minted: tidak terbaca',
    status.remaining !== null ? `Sisa: ${status.remaining}` : '',
    '',
    'Cek di dashboard MintStitch sebelum ludes.',
  ];
  return lines.filter(Boolean).join('\n');
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = { isConfigured, sendMessage, windowOpenMessage };
