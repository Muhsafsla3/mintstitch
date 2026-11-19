/**
 * src/bsc.js — Pembaca on-chain BSC (public RPC, tanpa API key).
 *
 * Semua alamat diturunkan ke lowercase SECARA PROGRAMATIK dari alamat
 * checksummed (jangan pernah salin lowercase dari ingatan — pernah hilang
 * 1 byte "c0" dan semua eth_call revert). Argumen alamat di-pad ke 64
 * karakter hex oleh kode, bukan hitungan tangan.
 */
'use strict';

const RPC_ENDPOINTS = [
  'https://bsc-dataseed.binance.org',
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed2.binance.org',
  'https://bsc.publicnode.com',
];

// Browser User-Agent WAJIB — UA default Node/Python kena 403 / rate-limit.
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const SELECTORS = {
  balanceOf: '0x70a08231',
  totalSupply: '0x18160ddd',
  totalMinted: '0xa2309ff8', // AgentBadge: totalSupply() REVERT di kontrak ini, pakai ini
  mintOpen: '0x24bbd049', // Foundry Faces: mintOpen()
  mintActive: '0x25fd90f3', // SnakeAgentNFT: mintActive()
};

/** Normalisasi alamat: lowercase programatik + assert panjang 40 hex. */
function normalizeAddress(address) {
  if (typeof address !== 'string') throw new Error('address harus string');
  const lower = address.trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(lower)) {
    throw new Error(`alamat tidak valid: ${address}`);
  }
  return lower;
}

/** Pad argumen alamat (tanpa 0x) ke 64 karakter hex untuk calldata. */
function padAddressArg(address) {
  const lower = normalizeAddress(address);
  return lower.slice(2).padStart(64, '0');
}

/** Decode uint256 / bool dari return data eth_call. */
function decodeUint256(hex) {
  if (!hex || hex === '0x') return null;
  return BigInt(hex).toString();
}

function decodeBool(hex) {
  if (!hex || hex === '0x') return null;
  return BigInt(hex) !== 0n;
}

async function rpcCall(endpoint, method, params, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(`RPC error: ${json.error.message || JSON.stringify(json.error)}`);
    return json.result;
  } finally {
    clearTimeout(timer);
  }
}

/** eth_call dengan rotasi RPC: coba endpoint berikut bila satu gagal. */
async function ethCall(to, data) {
  const contract = normalizeAddress(to);
  const errors = [];
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const result = await rpcCall(endpoint, 'eth_call', [{ to: contract, data }, 'latest']);
      return { result, endpoint };
    } catch (err) {
      errors.push(`${endpoint}: ${err.message}`);
    }
  }
  throw new Error(`semua RPC gagal: ${errors.join(' | ')}`);
}

/** eth_call yang toleran terhadap revert: kembalikan null bila kontrak revert. */
async function ethCallSoft(to, data) {
  try {
    const { result, endpoint } = await ethCall(to, data);
    return { result, endpoint, reverted: false };
  } catch (err) {
    return { result: null, endpoint: null, reverted: true, error: err.message };
  }
}

/**
 * Baca status satu mint dari watchlist.
 * Mengembalikan: { minted, supply, open, openKnown, endpoint, checkedAt, errors[] }
 */
async function readMintStatus(mint) {
  const contract = normalizeAddress(mint.contract);
  const checkedAt = new Date().toISOString();
  const errors = [];
  let minted = null;
  let supply = null;
  let open = null;
  let openKnown = false;
  let endpoint = null;

  // 1) Jumlah yang sudah di-mint.
  if (mint.mintedSelector) {
    const r = await ethCallSoft(contract, mint.mintedSelector);
    if (!r.reverted && r.result) {
      minted = decodeUint256(r.result);
      endpoint = r.endpoint;
    } else {
      errors.push(`minted (${mint.mintedMethod || mint.mintedSelector}) revert/gagal`);
    }
  }
  // Fallback: totalSupply() — KECUALI kontrak yang diketahui revert (AgentBadge).
  if (minted === null && !mint.totalSupplyReverts) {
    const r = await ethCallSoft(contract, SELECTORS.totalSupply);
    if (!r.reverted && r.result) {
      supply = decodeUint256(r.result);
      minted = supply; // untuk koleksi free-mint, totalSupply == jumlah minted
      endpoint = r.endpoint;
    } else {
      errors.push('totalSupply() revert/gagal');
    }
  }
  if (mint.supplyCap) supply = String(mint.supplyCap);

  // 2) Status buka/tutup, bila kontrak punya selector-nya.
  if (mint.openSelector) {
    const r = await ethCallSoft(contract, mint.openSelector);
    if (!r.reverted && r.result) {
      open = decodeBool(r.result);
      openKnown = true;
      endpoint = r.endpoint;
    } else {
      errors.push(`open (${mint.openMethod || mint.openSelector}) revert/gagal`);
    }
  }

  const status = !openKnown ? 'unknown' : open ? 'open' : 'closed';
  return {
    id: mint.id,
    name: mint.name,
    contract,
    status,
    open,
    openKnown,
    minted,
    supply,
    remaining:
      minted !== null && supply !== null
        ? String(BigInt(supply) - BigInt(minted))
        : null,
    endpoint,
    checkedAt,
    errors,
  };
}

/** Cek eligibility: apakah alamat sudah punya / sudah mint di kontrak ini. */
async function checkEligibility(mint, walletAddress) {
  const wallet = normalizeAddress(walletAddress);
  const contract = normalizeAddress(mint.contract);
  const data = SELECTORS.balanceOf + padAddressArg(wallet);
  const r = await ethCallSoft(contract, data);
  if (r.reverted || !r.result) {
    return {
      id: mint.id,
      wallet,
      contract,
      balance: null,
      hasMinted: null,
      error: 'balanceOf() gagal — RPC/kontrak tidak merespons',
      checkedAt: new Date().toISOString(),
    };
  }
  const balance = decodeUint256(r.result);
  return {
    id: mint.id,
    wallet,
    contract,
    balance,
    hasMinted: BigInt(balance) > 0n,
    checkedAt: new Date().toISOString(),
    endpoint: r.endpoint,
  };
}

module.exports = {
  RPC_ENDPOINTS,
  SELECTORS,
  normalizeAddress,
  padAddressArg,
  decodeUint256,
  decodeBool,
  ethCall,
  ethCallSoft,
  readMintStatus,
  checkEligibility,
};
