/**
 * sw.js
 * 飛騨防災ガイド Service Worker
 *
 * HTMLはネットワーク優先にして、サイト更新時に古いページが
 * 最初に表示される問題を防ぐ。
 * ハザードマップのGeoJSONはキャッシュせず、常に最新の公開データを取得する。
 * その他のGETリソースは従来どおりキャッシュを優先し、裏で更新する。
 */

const CACHE_NAME = "hida-bousai-v5";
const BASE = "/hidacity-bousaiguide";
const HAZARD_DATA_PREFIX = `${BASE}/hazard/data/`;
const HERO_IMAGE = `${BASE}/images/hero/castle-photo.svg`;

const PRECACHE_URLS = [
  `${BASE}/`, `${BASE}/hazard/`, `${BASE}/bag/`, `${BASE}/knowledge/`, `${BASE}/quiz/`, `${BASE}/contact/`,
  `${BASE}/privacy/`, `${BASE}/terms/`, `${BASE}/manifest.webmanifest`, `${BASE}/favicon.svg`,
  `${BASE}/assets/css/global.css`, `${BASE}/assets/js/common.js`, `${BASE}/assets/js/storage.js`,
  `${BASE}/assets/js/checklist.js`, `${BASE}/assets/js/quiz.js`, `${BASE}/assets/js/pwa.js`,
  HERO_IMAGE, `${BASE}/icons/icon-192.png`, `${BASE}/icons/icon-512.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const requestUrl = new URL(request.url);

  if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith(HAZARD_DATA_PREFIX)) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (!response || !response.ok) return response;
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("text/html")) {
            const html = await response.text();
            const modifiedResponse = new Response(injectHeroPhoto(html, request.url), {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
            const clone = modifiedResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return modifiedResponse;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(`${BASE}/`)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        fetchAndUpdate(request);
        return cached;
      }
      return fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(`${BASE}/`));
    })
  );
});

function injectHeroPhoto(html, requestUrl) {
  const url = new URL(requestUrl);
  const isTopPage = url.pathname === `${BASE}/` || url.pathname === `${BASE}/index.html`;
  if (!isTopPage || html.includes('data-hero-photo="true"')) return html;
  const heroVisualPattern = /<div class="hero-visual">[\s\S]*?<\/div>/;
  const heroPhoto = `<div class="hero-visual" data-hero-photo="true"><img src="${HERO_IMAGE}" alt="飛騨防災ガイドのヒーロー写真" loading="eager" decoding="async"></div>`;
  return html.replace(heroVisualPattern, heroPhoto);
}

function fetchAndUpdate(request) {
  fetch(request).then((response) => {
    if (response && response.ok) {
      caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
    }
  }).catch(() => {});
}
