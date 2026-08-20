/**
 * sw.js
 * 飛騨防災ガイド Service Worker
 * HTMLはネットワーク優先。ハザード・記事・検索データは常に最新取得。
 */

const CACHE_NAME = "hida-bousai-v10";
const BASE = "/hidacity-bousaiguide";
const HAZARD_DATA_PREFIX = `${BASE}/hazard/data/`;
const ARTICLE_JSON = `${BASE}/articles/articles.json`;
const SEARCH_JSON = `${BASE}/search/site-search.json`;
const HERO_IMAGE = `${BASE}/images/hero/castle-photo.svg`;
const UI_REFRESH_CSS = `${BASE}/assets/css/ui-refresh.css`;
const SITE_SEARCH_CSS = `${BASE}/assets/css/site-search.css`;

const PRECACHE_URLS = [
  `${BASE}/`, `${BASE}/hazard/`, `${BASE}/bag/`, `${BASE}/knowledge/`, `${BASE}/quiz/`, `${BASE}/contact/`,
  `${BASE}/privacy/`, `${BASE}/terms/`, `${BASE}/articles/`, `${BASE}/manifest.webmanifest`, `${BASE}/favicon.svg`,
  `${BASE}/assets/css/global.css`, UI_REFRESH_CSS, SITE_SEARCH_CSS,
  `${BASE}/assets/js/common.js`, `${BASE}/assets/js/site-search.js`, `${BASE}/assets/js/storage.js`,
  `${BASE}/assets/js/checklist.js`, `${BASE}/assets/js/quiz.js`, `${BASE}/assets/js/pwa.js`, HERO_IMAGE,
  `${BASE}/icons/icon-192.png`, `${BASE}/icons/icon-512.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const requestUrl = new URL(request.url);

  if (requestUrl.origin === self.location.origin && (requestUrl.pathname.startsWith(HAZARD_DATA_PREFIX) || requestUrl.pathname === ARTICLE_JSON || requestUrl.pathname === SEARCH_JSON)) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  if (requestUrl.origin === self.location.origin && (requestUrl.pathname === UI_REFRESH_CSS || requestUrl.pathname === SITE_SEARCH_CSS || requestUrl.pathname === `${BASE}/favicon.svg`)) {
    event.respondWith(fetch(request, { cache: "no-store" }).then((response) => {
      if (response && response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request)));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(async (response) => {
      if (!response || !response.ok) return response;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        const html = await response.text();
        const modifiedResponse = new Response(injectHeroPhoto(html, request.url), { status: response.status, statusText: response.statusText, headers: response.headers });
        caches.open(CACHE_NAME).then((cache) => cache.put(request, modifiedResponse.clone()));
        return modifiedResponse;
      }
      caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || caches.match(`${BASE}/`))));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => {
    if (cached) { fetchAndUpdate(request); return cached; }
    return fetch(request).then((response) => {
      if (response && response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(`${BASE}/`));
  }));
});

function injectHeroPhoto(html, requestUrl) {
  const url = new URL(requestUrl);
  const isTopPage = url.pathname === `${BASE}/` || url.pathname === `${BASE}/index.html`;
  if (!isTopPage || html.includes('data-hero-photo="true"')) return html;
  const pattern = /<div class="hero-visual">[\s\S]*?<\/div>/;
  const replacement = `<div class="hero-visual" data-hero-photo="true"><img src="${HERO_IMAGE}" alt="飛騨防災ガイドのヒーロー写真" loading="eager" decoding="async"></div>`;
  return html.replace(pattern, replacement);
}

function fetchAndUpdate(request) {
  fetch(request).then((response) => {
    if (response && response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
  }).catch(() => {});
}
