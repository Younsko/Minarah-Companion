const VERSION = 'minarah-v1';
const CORE = ['/', '/manifest.webmanifest'];
const QURAN = Array.from({ length: 114 }, (_, index) => `/data/quran/surah-${index + 1}.json`);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(async cache => {
    await cache.addAll(CORE);
    const documentResponse = await cache.match('/');
    const html = await documentResponse.text();
    const assets = [...html.matchAll(/(?:src|href)="([^\"]*\/_next\/static\/[^\"]+)"/g)]
      .map(match => new URL(match[1], self.location.origin).toString());
    await Promise.allSettled([...new Set(assets)].map(url => cache.add(url)));
    await Promise.allSettled(QURAN.map(url => cache.add(url)));
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/data/quran/')) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(VERSION).then(cache => cache.put(request, response.clone()));
      return response;
    })));
    return;
  }
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(VERSION).then(cache => cache.put(request, response.clone()));
      return response;
    })));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(VERSION).then(cache => cache.put('/', response.clone()));
      return response;
    }).catch(() => caches.match('/')));
  }
});
