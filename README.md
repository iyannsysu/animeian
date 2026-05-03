# Anime Ian

Website streaming anime sub Indo yang ringan dan lancar di HP. Dibangun dengan
Next.js 14 (App Router) + Tailwind CSS, menggunakan data dari
[Sonzai X API](https://api.sonzaix.indevs.in/) (provider `/anime/*`).

## Fitur

- **Home** — hero anime terbaru + grid update terbaru + daftar ongoing.
- **Cari** — pencarian anime berdasarkan judul.
- **Daftar A-Z** — telusuri semua anime per huruf.
- **Jadwal Rilis** — jadwal per hari dalam seminggu.
- **Detail** — sinopsis, genre, rating, dan daftar episode.
- **Watch** — pemutar video MP4 native dengan pemilihan kualitas (360p / 480p /
  720p / 1080p), tombol episode sebelumnya/berikutnya, dan auto-resume saat
  berpindah kualitas. Mendukung range request HTTP sehingga scrubbing cepat dan
  streaming tidak patah di jaringan mobile.

## Optimasi mobile

- Default kualitas `480p` di HP, `720p` di desktop, dan tersimpan di
  `localStorage`.
- `preload="metadata"` agar tidak menghabiskan kuota sebelum ditonton.
- `playsInline` supaya fullscreen inline di iOS.
- Gambar cover di-lazy load, bottom navigation untuk navigasi cepat.
- `next.config.mjs` mengizinkan semua hostname gambar dengan mode `unoptimized`
  untuk menghindari roundtrip optimizer.
- Semua data di-fetch di server dengan ISR 1-60 menit, jadi kunjungan berulang
  hampir instan.

## Development

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Build & Deploy

```bash
npm run build
npm start
```

Proyek ini siap di-deploy ke Vercel tanpa konfigurasi tambahan.

## Struktur

- `app/` — route (home, search, anime-list, jadwal, anime/[series],
  watch/[series]/[slug]).
- `components/` — `Header`, `BottomNav`, `AnimeCard`, `AnimeGrid`,
  `VideoPlayer`, `EpisodeList`, dsb.
- `lib/api.ts` — wrapper untuk endpoint Sonzai X API.
- `lib/types.ts` — TypeScript types untuk respons API.

## Catatan

Situs ini hanya berfungsi sebagai indeks. Semua video di-stream langsung dari
sumber pihak ketiga (`storage.animekita.org`, `pixeldrain.com`, dst.) yang
disediakan oleh API.
