# Steering — Struktur

```
mintstitch/
├── server.js                  Entry: Express + poller
├── package.json
├── .env.example               Placeholder env (tanpa nilai asli)
├── .gitignore                 .env + node_modules + data/state.json
├── LICENSE                    MIT
├── README.md
├── public/                    Frontend statis (tanpa build)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── src/
│   ├── bsc.js                 eth_call BSC (satu-satunya tempat logika chain)
│   ├── telegram.js            Kirim alert (env-only)
│   ├── qa.js                  Tanya Mint (aturan, tanpa LLM)
│   └── watcher.js             Poll + deteksi transisi open + alert
├── data/
│   ├── watchlist.json         Seed kontrak (boleh di-commit)
│   └── state.json             Runtime state (JANGAN di-commit)
├── test/
│   └── smoke.test.js          Smoke test endpoint + QA + MCP
├── mcp-server/bsc-read/
│   └── server.js              MCP server lokal (stdio)
└── .kiro/
    ├── specs/mintstitch/      requirements.md, design.md, tasks.md
    ├── steering/              product.md, tech.md, structure.md
    ├── hooks/                 format-on-save.json, smoke-check.json
    └── settings/mcp.json      Registrasi MCP server bsc-read
```

## Konvensi
- Bahasa kode: komentar + pesan error dalam Bahasa Indonesia bila
  menyentuh pengguna; komentar teknis boleh Inggris singkat.
- Satu tanggung jawab per file di `src/`; `server.js` hanya wiring.
- Selector eth_call didefinisikan sekali di `src/bsc.js` (`SELECTORS`).
- Watchlist baru ditambah lewat `data/watchlist.json` saja — tanpa
  ubah kode — dengan field: id, name, contract, mintedSelector,
  openSelector (opsional), supplyCap (opsional), totalSupplyReverts.
