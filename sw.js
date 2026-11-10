// 매물대장 오프라인 지원: 앱 화면은 인터넷이 끊겨도 열리고, 데이터는 기기에 보관됩니다.
const CACHE = "maemul-v32";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
const CDN = ["cdnjs.cloudflare.com", "cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // 앱 파일: 인터넷 우선, 끊기면 저장본
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
  } else if (CDN.includes(url.hostname)) {
    // 엑셀 모듈·아이콘·글꼴: 저장본 우선
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(n => { const c = n.clone(); caches.open(CACHE).then(x => x.put(req, c)); return n; })));
  }
  // 구글 로그인·드라이브·카카오 지도는 항상 인터넷으로 직접 연결
});
