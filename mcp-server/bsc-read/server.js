/**
 * mcp-server/bsc-read/server.js — MCP server lokal "bsc-read".
 * Protokol MCP minimal via stdio (JSON-RPC 2.0): initialize, tools/list,
 * tools/call. Tools membaca status mint BSC langsung dari public RPC —
 * dipakai Kiro (IDE/CLI) supaya agent bisa tanya "apakah mint X buka?"
 * tanpa keluar dari editor.
 *
 * Jalankan: node mcp-server/bsc-read/server.js
 * Daftar di .kiro/settings/mcp.json.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { readMintStatus, checkEligibility, normalizeAddress } = require('../../src/bsc');

const WATCHLIST = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'watchlist.json'), 'utf8')
);

const TOOLS = [
  {
    name: 'bsc_mint_status',
    description: 'Baca status live satu free mint BSC dari watchlist MintStitch (buka/tutup, minted, supply).',
    inputSchema: {
      type: 'object',
      properties: {
        mintId: { type: 'string', description: 'ID mint di watchlist, mis. agent-badge, foundry-faces, snake-agent' },
      },
      required: ['mintId'],
    },
  },
  {
    name: 'bsc_watchlist',
    description: 'Daftar semua mint yang dipantau MintStitch beserta kontrak dan catatan.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'bsc_check_eligibility',
    description: 'Cek apakah sebuah wallet BSC sudah punya / sudah mint di kontrak tertentu (balanceOf).',
    inputSchema: {
      type: 'object',
      properties: {
        mintId: { type: 'string', description: 'ID mint di watchlist' },
        address: { type: 'string', description: 'Alamat wallet BSC (0x...)' },
      },
      required: ['mintId', 'address'],
    },
  },
];

function textResult(obj) {
  return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] };
}

async function callTool(name, args) {
  if (name === 'bsc_watchlist') {
    return textResult(WATCHLIST.map(({ id, name: n, contract, supplyCap, notes }) => ({ id, name: n, contract, supplyCap, notes })));
  }
  if (name === 'bsc_mint_status') {
    const mint = WATCHLIST.find((m) => m.id === args.mintId);
    if (!mint) return textResult({ error: `mint tidak dikenal: ${args.mintId}` });
    return textResult(await readMintStatus(mint));
  }
  if (name === 'bsc_check_eligibility') {
    const mint = WATCHLIST.find((m) => m.id === args.mintId);
    if (!mint) return textResult({ error: `mint tidak dikenal: ${args.mintId}` });
    const wallet = normalizeAddress(args.address);
    return textResult(await checkEligibility(mint, wallet));
  }
  throw new Error(`tool tidak dikenal: ${name}`);
}

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function respondError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    if (msg.method === 'notifications/initialized') continue;
    if (msg.method === 'initialize') {
      respond(msg.id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'bsc-read', version: '0.1.0' },
      });
      continue;
    }
    if (msg.method === 'tools/list') {
      respond(msg.id, { tools: TOOLS });
      continue;
    }
    if (msg.method === 'tools/call') {
      try {
        const result = await callTool(msg.params.name, msg.params.arguments || {});
        respond(msg.id, result);
      } catch (err) {
        respondError(msg.id, -32603, err.message);
      }
      continue;
    }
    respondError(msg.id, -32601, `method tidak dikenal: ${msg.method}`);
  }
});
