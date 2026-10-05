/* Service Worker — অ্যাপ ফাইল ফোনে রেখে দেয়, নেট ছাড়াই চালু হয় */
const CACHE = 'trawler-v3';
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

/* নেট থাকলে সবসময় নতুন কপি (আপডেট সাথে সাথে পৌঁছায়);
   নেট না থাকলে বা ৩ সেকেন্ডে সাড়া না পেলে ফোনের কপি */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(cache => new Promise(resolve => {
      let done = false;
      const fromCache = () => cache.match(e.request, { ignoreSearch: true })
        .then(h => h || cache.match('./index.html'));
      const timer = setTimeout(() => {
        fromCache().then(h => { if (h && !done) { done = true; resolve(h); } });
      }, 3000);
      fetch(e.request, { cache: 'no-cache' }).then(res => {
        clearTimeout(timer);
        if (res && res.ok) cache.put(e.request, res.clone());
        if (!done) { done = true; resolve(res); }
      }).catch(() => {
        clearTimeout(timer);
        fromCache().then(h => { if (!done) { done = true; resolve(h || Response.error()); } });
      });
    }))
  );
});
