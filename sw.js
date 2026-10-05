/* Service Worker — অ্যাপ ফাইল ফোনে রেখে দেয়, নেট ছাড়াই চালু হয় */
const CACHE = 'trawler-v1';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* আগে ফোনের কপি দেখায় (দ্রুত/অফলাইন), পেছনে নেট থাকলে নতুন কপি এনে রাখে */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request, { ignoreSearch: true }).then(hit => {
        const fresh = fetch(e.request).then(res => {
          if (res && res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(() => hit || cache.match('./index.html'));
        return hit || fresh;
      })
    )
  );
});
