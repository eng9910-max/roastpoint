/* 로스트포인트 — 서비스워커 v5
   1) 공유 시트로 들어온 파일을 가로채 캐시에 넣고 앱으로 넘김
   2) 오프라인에서도 앱이 열리도록 최소 캐싱                     */

const APP_CACHE   = "roast-app-v25";
const SHARE_CACHE = "roast-shared";
const SCOPE       = self.registration.scope;
const SHARE_KEY   = new URL("__shared__", SCOPE).href;

const SHELL = ["./", "./index.html", "./studio.html", "./manifest.webmanifest",
               "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(APP_CACHE)
    .then(c => c.addAll(SHELL).catch(() => {}))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== APP_CACHE && k !== SHARE_CACHE)
      .map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  /* ── 공유 수신 ── */
  if (e.request.method === "POST" && url.pathname.endsWith("/share")) {
    e.respondWith((async () => {
      const files = [];
      const images = [];
      let   shared_text = "";
      const diag  = { at: new Date().toISOString(), entries: [], error: null };
      try {
        const fd = await e.request.formData();
        for (const [key, val] of fd.entries()) {
          if (val && typeof val === "object" && typeof val.arrayBuffer === "function") {
            const type = val.type || "";
            diag.entries.push({ field: key, kind: "file", name: val.name || "",
                                type, size: val.size || 0 });
            if (/^image\//.test(type) || /\.(jpe?g|png|webp|heic)$/i.test(val.name || "")) {
              const buf = new Uint8Array(await val.arrayBuffer());
              let bin = "";
              for (let i = 0; i < buf.length; i += 0x8000)
                bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
              images.push({ name: val.name || "shared.jpg",
                            dataUrl: "data:" + (type || "image/jpeg") + ";base64," + btoa(bin) });
            } else {
              const text = await val.text();
              if (text && text.length) files.push({ name: val.name || (key + ".csv"), text });
            }
          } else {
            const s = String(val ?? "");
            diag.entries.push({ field: key, kind: "text", size: s.length,
                                head: s.slice(0, 120) });
            if (s.trim()) shared_text += (shared_text ? "\n" : "") + s;
          }
        }
      } catch (err) {
        diag.error = String(err && err.message || err);
      }
      const cache = await caches.open(SHARE_CACHE);
      await cache.put(SHARE_KEY, new Response(JSON.stringify({ files, images, shared_text, diag }), {
        headers: { "Content-Type": "application/json" }
      }));
      return Response.redirect(new URL("./?shared=1", SCOPE).href, 303);
    })());
    return;
  }

  /* ── 앱 껍데기 ── */
  if (e.request.method === "GET" && url.origin === self.location.origin) {
    e.respondWith(caches.match(e.request).then(hit => hit ||
      fetch(e.request).then(res => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(APP_CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match("./index.html"))));
  }
});
