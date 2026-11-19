/**
 * test/smoke.test.js — Smoke test MintStitch (tanpa framework, Node 20+).
 * Menguji: util alamat, QA berbasis aturan, MCP tools/list + tools/call,
 * dan endpoint HTTP server (dijalankan dengan server test di port acak).
 * RPC live dipakai apa adanya: bila RPC tidak terjangkau, test terkait
 * dilewati dengan pesan, bukan gagal — yang diuji di sini adalah wiring.
 */
'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const WATCHLIST = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'watchlist.json'), 'utf8'));
const { normalizeAddress, padAddressArg } = require('../src/bsc');
const { answer } = require('../src/qa');

let passed = 0;
let skipped = 0;

function ok(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  PASS ${name}`);
  } catch (err) {
    console.log(`  FAIL ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

async function okAsync(name, fn) {
  try {
    const r = await fn();
    if (r === 'skip') {
      skipped += 1;
      console.log(`  SKIP ${name}`);
      return;
    }
    passed += 1;
    console.log(`  PASS ${name}`);
  } catch (err) {
    console.log(`  FAIL ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

function mcpCall(proc, method, params, id) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout MCP')), 30000);
    const onData = (chunk) => {
      for (const line of String(chunk).split('\n')) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id === id) {
            clearTimeout(timer);
            proc.stdout.off('data', onData);
            resolve(msg);
          }
        } catch { /* abaikan baris non-JSON */ }
      }
    };
    proc.stdout.on('data', onData);
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

async function main() {
  console.log('== util alamat ==');
  ok('normalizeAddress lowercase programatik + assert 40 hex', () => {
    assert.equal(normalizeAddress('0xB617Aa35249E2e5CF64412a02Fe95d6570c171f6'), '0xb617aa35249e2e5cf64412a02fe95d6570c171f6');
    assert.throws(() => normalizeAddress('0x1234'), /tidak valid/);
    assert.throws(() => normalizeAddress('0xd523650eaa5beb675aaa0a33d0c0fff2fc818f'), /tidak valid/); // 38 hex — jebakan "c0" hilang
  });
  ok('padAddressArg pad ke 64 hex oleh kode', () => {
    const padded = padAddressArg('0xd523650eAA5bEb675AAaA0a33d0c0fFf2fC818f3');
    assert.equal(padded.length, 64);
    assert.equal(padded, '000000000000000000000000d523650eaa5beb675aaaa0a33d0c0fff2fc818f3');
  });

  console.log('== Tanya Mint (aturan) ==');
  ok('QA jawab status Agent Badge dari data live palsu', () => {
    const statuses = [{ id: 'agent-badge', name: 'Agent Badge', status: 'unknown', open: null, openKnown: false, minted: '133', supply: '1000', remaining: '867', checkedAt: new Date().toISOString(), errors: [] }];
    const r = answer('apakah Agent Badge masih bisa di-mint?', statuses, WATCHLIST);
    assert.equal(r.mintId, 'agent-badge');
    assert.match(r.answer, /133/);
  });
  ok('QA fallback bila mint tidak dikenal', () => {
    const r = answer('apakah Kucing Ajaib masih bisa di-mint?', [], WATCHLIST);
    assert.equal(r.mintId, null);
    assert.match(r.answer, /Agent Badge/);
  });

  console.log('== MCP server bsc-read ==');
  await okAsync('tools/list mengembalikan 3 tools', async () => {
    const proc = spawn('node', [path.join(ROOT, 'mcp-server', 'bsc-read', 'server.js')], { stdio: ['pipe', 'pipe', 'pipe'] });
    try {
      await mcpCall(proc, 'initialize', {}, 1);
      const list = await mcpCall(proc, 'tools/list', {}, 2);
      const names = (list.result.tools || []).map((t) => t.name);
      assert.ok(names.includes('bsc_mint_status'));
      assert.ok(names.includes('bsc_watchlist'));
      assert.ok(names.includes('bsc_check_eligibility'));
      const wl = await mcpCall(proc, 'tools/call', { name: 'bsc_watchlist', arguments: {} }, 3);
      const parsed = JSON.parse(wl.result.content[0].text);
      assert.equal(parsed.length, 6);
    } finally {
      proc.kill();
    }
  });

  console.log('== HTTP server (live BSC, boleh skip bila RPC mati) ==');
  await okAsync('GET /api/health + /api/mints', async () => {
    const port = 3456 + Math.floor(Math.random() * 1000);
    const proc = spawn('node', [path.join(ROOT, 'server.js')], {
      env: { ...process.env, PORT: String(port), POLL_INTERVAL_MS: '600000' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    try {
      // Tunggu server siap.
      let health = null;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const res = await fetch(`http://localhost:${port}/api/health`);
          if (res.ok) { health = await res.json(); break; }
        } catch { /* belum siap */ }
      }
      assert.ok(health && health.ok === true, 'server tidak siap / health gagal');
      // Poll /api/mints sampai cache awal terisi (poll pertama baca 6 kontrak live).
      let mints = null;
      for (let i = 0; i < 120; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const r = await fetch(`http://localhost:${port}/api/mints`);
        if (!r.ok) continue;
        const j = await r.json();
        if (Array.isArray(j.mints) && j.mints.length === 6) { mints = j; break; }
      }
      assert.ok(mints, 'GET /api/mints tidak mengembalikan 6 mint dalam 120 dtk');
      assert.ok(Array.isArray(mints.mints) && mints.mints.length === 6, 'harus 6 mint');
      const readable = mints.mints.filter((m) => m.minted !== null).length;
      if (readable === 0) return 'skip'; // RPC mati total — wiring OK, data live tidak terbaca
      console.log(`      (live: ${readable}/6 mint terbaca minted-nya)`);
      const askRes = await fetch(`http://localhost:${port}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'berapa Agent Badge yang sudah di-mint?' }),
      });
      const ask = await askRes.json();
      assert.equal(ask.mintId, 'agent-badge');
      const checkRes = await fetch(`http://localhost:${port}/api/check?address=0xd523650eAA5bEb675AAaA0a33d0c0fFf2fC818f3&mint=agent-badge`);
      assert.ok(checkRes.ok, 'GET /api/check gagal');
      const check = await checkRes.json();
      assert.equal(check.results[0].id, 'agent-badge');
    } finally {
      proc.kill();
    }
  });

  console.log(`\nSmoke test selesai: ${passed} lolos, ${skipped} dilewati, ${process.exitCode ? 'ADA YANG GAGAL' : 'semua OK'}.`);
}

main();
