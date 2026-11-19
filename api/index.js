'use strict';

// Vercel serverless entrypoint: re-export aplikasi Express dari server.js
// tanpa menjalankan listener (server.js hanya listen saat require.main).
module.exports = require('../server');
