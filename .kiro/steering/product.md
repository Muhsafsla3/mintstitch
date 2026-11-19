# Steering — Produk

MintStitch adalah Free Mint Radar untuk BSC, dibangun untuk Kiroween 2026
kategori Frankenstein: menjahit 4 teknologi yang tidak biasa digabung
(pembaca on-chain public RPC + bot Telegram + dashboard web + Q&A berbasis
aturan) jadi satu alat.

## Pengguna
Tabibqiu (tabibqiu9.ai), kolektor free mint BSC. Ia mengejar mint gratis
yang benar-benar bisa di-mint saat ini dan bisa dijual kemudian. Free mint
di BSC ludes dalam hitungan menit — kecepatan info adalah segalanya.

## Prinsip produk
1. **Live dulu, cantik kemudian.** Angka dari chain adalah kebenaran;
   bila RPC gagal, tampilkan error jujur, jangan angka karangan.
2. **Gratis total.** Tanpa API berbayar, tanpa database berbayar, tanpa
   layanan pihak ketiga berbayar. Bila sebuah fitur butuh bayar, fitur
   itu tidak jadi.
3. **Tanpa tx dari server.** Server hanya MEMBACA chain (eth_call).
   Mint dilakukan pengguna sendiri dari wallet-nya.
4. **Bahasa Indonesia.** Semua teks pengguna + jawaban Tanya Mint dalam
   Bahasa Indonesia. Sapaan: "lu" (pengguna), "gue" (asisten/app).
5. **Satu sumber kebenaran.** Logika baca BSC tinggal di `src/bsc.js`
   dan dipakai ulang oleh server API, watcher, dan MCP server.
