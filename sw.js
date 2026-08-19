/**
 * sw.js
 * 飛騨防災ガイド Service Worker
 *
 * HTMLはネットワーク優先にして、サイト更新時に古いページが
 * 最初に表示される問題を防ぐ。
 * また、トップページのヒーロー画像は images/hero/ の写真を使用する。
 * ネットワークに接続できない場合のみキャッシュへフォールバックする。
 * その他のGETリソースは従来どおりキャッシュを優先し、裏で更新する。
 */

const CACHE_NAME = "hida-bousai-v3";
const BASE = "/hidacity-bousaiguide";
const HERO_IMAGE = `${BASE}/images/hero/castle-photo.svg`;

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
  HERO_IMAGE,
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

  // HTMLのページ遷移はネットワーク優先。
  // 最新版を取得したあと、トップページのヒーロー部分だけ写真表示に差し替える。
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (!response || !response.ok) return response;

          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("text/html")) {
            const html = await response.text();
            const modifiedHtml = injectHeroPhoto(html, request.url);
            const modifiedResponse = new Response(modifiedHtml, {
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
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(`${BASE}/`))
        )
    );
    return;
  }

  // CSS / JS / 画像などはキャッシュを返しつつ裏で更新。
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
  // トップページだけを対象にする。
  const url = new URL(requestUrl);
  const isTopPage =
    url.pathname === `${BASE}/` ||
    url.pathname === `${BASE}/index.html`;

  if (!isTopPage) return html;

  // 既に写真へ差し替え済みなら何もしない。
  if (html.includes('data-hero-photo="true"')) return html;

  const heroVisualPattern = /<div class="hero-visual">[\s\S]*?<\/div>/;
  const heroPhoto = `
          <div class="hero-visual" data-hero-photo="true">
            <img
              src="${HERO_IMAGE}"
              alt="飛騨防災ガイドのヒーロー写真"
              loading="eager"
              decoding="async"
            >
          </div>`;

  return html.replace(heroVisualPattern, heroPhoto);
}

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
