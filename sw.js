/**
 * sw.js
 * 飛騨防災ガイド Service Worker
 * オンライン時は常にネットワークを優先し、更新直後の旧サイト表示を防ぐ。
 * オフライン時のみ、最後に取得できたキャッシュへフォールバックする。
 */

const CACHE_NAME = "hida-bousai-v15";
const CACHE_PREFIX = "hida-bousai-";
const BASE = "/hidacity-bousaiguide";
const ARTICLE_JSON = `${BASE}/articles/articles.json`;
const SEARCH_JSON = `${BASE}/search/site-search.json`;
const HERO_IMAGE = `${BASE}/images/hero/castle-photo.svg`;
const BRAND_ICON = `${BASE}/assets/icons/hida-bousai-icon.png`;
const UI_REFRESH_CSS = `${BASE}/assets/css/ui-refresh.css`;
const SITE_SEARCH_CSS = `${BASE}/assets/css/site-search.css`;

const PRECACHE_URLS = [
  `${BASE}/`, `${BASE}/hazard/`, `${BASE}/bag/`, `${BASE}/knowledge/`, `${BASE}/quiz/`, `${BASE}/contact/`,
  `${BASE}/privacy/`, `${BASE}/terms/`, `${BASE}/articles/`, `${BASE}/manifest.webmanifest`, BRAND_ICON,
  `${BASE}/assets/css/global.css`, UI_REFRESH_CSS, SITE_SEARCH_CSS,
  `${BASE}/assets/js/common.js`, `${BASE}/assets/js/site-search.js`, `${BASE}/assets/js/storage.js`,
  `${BASE}/assets/js/checklist.js`, `${BASE}/assets/js/quiz.js`, `${BASE}/assets/js/pwa.js`, HERO_IMAGE,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  const sameOrigin = requestUrl.origin === self.location.origin;

  // サイト内のすべてのGETはネットワーク優先。
  // ブラウザ/Pages/CDNから古いレスポンスしか返らない場合でも、
  // Service Worker側で過去のCache Firstを再利用しないようにする。
  if (sameOrigin && requestUrl.pathname.startsWith(BASE)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 外部リソースは既存キャッシュを利用し、なければネットワークへ。
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);

      if (request.mode === "navigate" && (response.headers.get("content-type") || "").includes("text/html")) {
        const html = await response.text();
        const modifiedHtml = injectHeroPhoto(html, request.url);
        const headers = new Headers(response.headers);
        // 本文を書き換えるので古い Content-Length を持ち越さない。
        headers.delete("content-length");
        const modifiedResponse = new Response(modifiedHtml, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
        await cache.put(request, modifiedResponse.clone());
        return modifiedResponse;
      }

      await cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      return (await caches.match(`${BASE}/`)) || Response.error();
    }

    return Response.error();
  }
}

function injectHeroPhoto(html, requestUrl) {
  const url = new URL(requestUrl);
  const isTopPage = url.pathname === `${BASE}/` || url.pathname === `${BASE}/index.html`;
  if (!isTopPage || html.includes('data-hero-photo="true"')) return html;

  const pattern = /<div class="hero-visual">[\s\S]*?<\/div>/;
  const replacement = `<div class="hero-visual" data-hero-photo="true"><img src="${HERO_IMAGE}" alt="飛騨防災ガイドのヒーロー写真" loading="eager" decoding="async"></div>`;
  return html.replace(pattern, replacement);
}
