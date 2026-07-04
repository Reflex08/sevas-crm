// Offline cache — network-first so updates land, cache fallback when offline.
const C = "sevas-crm-v2";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(["./"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { // never cache an error page over a good copy
        const copy = r.clone();
        caches.open(C).then(c => c.put(e.request, copy));
      }
      return r.ok ? r : caches.match(e.request).then(hit => hit || r); // serve last good copy through outages
    }).catch(() => caches.match(e.request).then(r => r || caches.match("./")))
  );
});
