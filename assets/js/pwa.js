/**
 * pwa.js
 * Service Worker登録 + 全ページ共通UIスタイルのロード。
 */

const SW_VERSION = "2026-08-30-02";
const UI_VERSION = "2026-08-20-ui2";
const SEARCH_STYLE_VERSION = "2026-08-20-search2";
const BASE = "/hidacity-bousaiguide";
const UI_CSS = `${BASE}/assets/css/ui-refresh.css?v=${UI_VERSION}`;
const SEARCH_CSS = `${BASE}/assets/css/site-search.css?v=${SEARCH_STYLE_VERSION}`;

function ensureStyles() {
  for (const [href, marker] of [[UI_CSS, "data-ui-refresh"], [SEARCH_CSS, "data-site-search-style"]]) {
    if (document.querySelector(`link[${marker}="true"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute(marker, "true");
    document.head.appendChild(link);
  }
}

ensureStyles();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${BASE}/sw.js?v=${SW_VERSION}`, {
        scope: `${BASE}/`,
        updateViaCache: "none",
      })
      .then((reg) => reg.update().catch(() => {}))
      .catch((err) => console.warn("[pwa] Service Worker registration failed:", err));
  });
}
