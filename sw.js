/* 로스트포인트 — 서비스워커 v29
   1) 공유 시트로 들어온 파일·텍스트·이미지를 가로채 앱으로 넘김
   2) 오프라인에서도 앱이 열리도록 최소 캐싱
   페이지 이동은 네트워크를 먼저 본다. 그래야 새로 올린 파일이 바로 반영되고,
   캐시에 없는 페이지가 막히지 않는다. */

const APP_CACHE   = "roast-app-v63";
const SHARE_CACHE = "roast-shared";
const SCOPE       = self.registration.scope;
const SHARE_KEY   = new URL("__shared__", SCOPE).href;

const SHELL = ["./", "./index.html", "./studio.html", "./manifest.webmanifest",
               "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(APP_CACHE)
    .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
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
      const files = [], images = [];
      let shared_text = "";
      const diag = { at: new Date().toISOString(), entries: [], error: null };
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
            diag.entries.push({ field: key, kind: "text", size: s.length, head: s.slice(0, 120) });
            if (s.trim()) shared_text += (shared_text ? "\n" : "") + s;
          }
        }
      } catch (err) { diag.error = String(err && err.message || err); }

      const cache = await caches.open(SHARE_CACHE);
      await cache.put(SHARE_KEY, new Response(JSON.stringify({ files, images, shared_text, diag }), {
        headers: { "Content-Type": "application/json" }
      }));
      return Response.redirect(new URL("./?shared=1", SCOPE).href, 303);
    })());
    return;
  }

  if (e.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("/api/")) return;

  /* ── 페이지 이동: 네트워크 우선 ── */
  if (e.request.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const res = await fetch(e.request);
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(APP_CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;                                  // 404 도 그대로 보여준다
      } catch (err) {
        return (await caches.match(e.request))
            || (await caches.match("./index.html"))
            || new Response("오프라인입니다. 연결을 확인하세요.",
                 { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    })());
    return;
  }

  /* ── 그 밖의 자원: 캐시 우선 ── */
  e.respondWith((async () => {
    const hit = await caches.match(e.request);
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      if (res && res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(APP_CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      return new Response("", { status: 504 });
    }
  })());
});
