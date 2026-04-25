// Anime Ian service worker — minimalis.
// Tujuan: app shell offline + cache static asset; JANGAN cache API atau halaman dinamis.

const VERSION = "v3";
const STATIC_CACHE = `animeian-static-${VERSION}`;
const APP_SHELL = ["/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("animeian-") && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Jangan intercept origin lain (video, gambar CDN) atau API/auth — biar tidak ganggu streaming.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/data/")) return;
  if (url.pathname.includes("/auth/")) return;

  // Cache-first untuk static asset (Next build assets, ikon, manifest)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/apple-touch-icon.png" ||
    url.pathname === "/favicon.ico"
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, clone));
            }
            return res;
          })
          .catch(() => caches.match("/"));
      })
    );
    return;
  }

  // Halaman HTML: network-first, fallback ke cache (untuk offline shell)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // simpan halaman terakhir buat fallback offline
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put("/", clone));
          }
          return res;
        })
        .catch(() => caches.match("/").then((c) => c || Response.error()))
    );
  }
});
