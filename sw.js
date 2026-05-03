const CACHE = 'pokemon-v1';
const APP_SHELL = [
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://unpkg.com/vue@3/dist/vue.global.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache First（App Shell） + Network First（圖片）
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 寶可夢圖片：先嘗試網路，失敗則用快取
  if (url.hostname.includes('githubusercontent.com') || url.hostname.includes('pokeapi')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // App Shell：先用快取，快取沒有再去網路
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
