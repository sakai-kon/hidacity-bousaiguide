/**
 * sw.js
 * 飛騨防災ガイド Service Worker
 * オフラインでも主要ページを表示できるように、事前キャッシュ（プレキャッシュ）を行う。
 * GitHub Pages のベースパス "/hidacity-bousaiguide/" を前提にパスを列挙する。
 */

const CACHE_NAME = "hida-bousai-v1";
const BASE = "/hidacity-bousaiguide";

const PRECACHE_URLS = [
  `${BASE}/`,
  `${BASE}/hazard/`,
  `${BASE}/bag/`,
  `${BASE}/knowledge/`,
  `${BASE}/quiz/`,
  `${BASE}/contact/`,
  `${BASE}/privacy/`,
  `${BASE}/terms/`,
  `${BASE}/manifest.webmanifest`,
  `${BASE}/favicon.svg`,
  `${BASE}/assets/css/global.css`,
  `${BASE}/assets/js/common.js`,
  `${BASE}/assets/js/storage.js`,
  `${BASE}/assets/js/checklist.js`,
  `${BASE}/assets/js/quiz.js`,
  `${BASE}/assets/js/pwa.js`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-512.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // GET以外（POSTなど）はそのままネットワークへ
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // キャッシュを返しつつ、裏側で更新（stale-while-revalidate）
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

function fetchAndUpdate(request) {
  fetch(request)
    .then((response) => {
      if (response && response.ok) {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
      }
    })
    .catch(() => {
      /* オフライン時は無視 */
    });
}
