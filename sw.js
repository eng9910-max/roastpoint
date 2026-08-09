/* 로스팅 기록장 — 서비스워커
   하는 일 두 가지뿐입니다.
   1) 공유 시트로 들어온 파일을 가로채 캐시에 넣고 앱으로 넘김
   2) 오프라인에서도 앱이 열리도록 최소 캐싱                     */

const APP_CACHE = "roast-app-v1";
const SHARE_CACHE = "roast-shared";
const SHARE_KEY = new URL("__shared__", self.registration.scope).href;

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(APP_CACHE)
      .then(c => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== APP_CACHE && k !== SHARE_CACHE)
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  /* ── 1. 공유 시트로 들어온 파일 ── */
  if (e.request.method === "POST" && url.pathname.endsWith("/share")) {
    e.respondWith((async () => {
      const payload = [];
      try {
        const fd = await e.request.formData();
        for (const f of fd.getAll("logfile")) {
          if (f && typeof f.text === "function" && f.size) {
            payload.push({ name: f.name || "shared.csv", text: await f.text() });
          }
        }
        const txt = fd.get("text");
        if (!payload.length && typeof txt === "string" && txt.trim()) {
          payload.push({ name: "shared.txt", text: txt });
        }
      } catch (err) { /* 형식이 달라도 앱은 열어준다 */ }

      const cache = await caches.open(SHARE_CACHE);
      await cache.put(SHARE_KEY, new Response(JSON.stringify(payload), {
        headers: { "Content-Type": "application/json" }
      }));
      return Response.redirect("./?shared=1", 303);
    })());
    return;
  }

  /* ── 2. 앱 껍데기: 캐시 우선, 없으면 네트워크 ── */
  if (e.request.method === "GET" && url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(APP_CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match("./index.html")))
    );
  }
});
