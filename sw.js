/* رصيدو — عمل دون إنترنت.
   الصفحة نفسها: الشبكة أولًا ثم المخزّن (حتى يصل التحديث فورًا).
   الأصول الثابتة: المخزّن أولًا. */
const VERSION = 'c6f85c729e';
const CACHE = 'raseedo-' + VERSION;
const ASSETS = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
function isPage(req, u){
  return req.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html');
}
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.pathname.indexOf('/rest/v1/') >= 0 || u.pathname.indexOf('/auth/v1/') >= 0) return;
  if (u.origin === location.origin && isPage(e.request, u)){
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200){
          const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match('index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res && res.status === 200 && u.origin === location.origin){
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
