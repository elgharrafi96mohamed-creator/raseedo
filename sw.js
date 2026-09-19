/* رصيدو — عمل دون إنترنت */
const CACHE = 'raseedo-v1';
const ASSETS = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.pathname.indexOf('/rest/v1/') >= 0 || u.pathname.indexOf('/auth/v1/') >= 0) return; // لا تخزّن نداءات الخادم
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res && res.status === 200 && u.origin === location.origin){
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
