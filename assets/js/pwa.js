/**
 * pwa.js
 * Service Workerの登録と、全ページ共通UIリフレッシュCSSの読み込みを行う。
 */

const SW_VERSION = "2026-08-20-3";
const UI_CSS_VERSION = "2026-08-20-ui-1";
const BASE = "/hidacity-bousaiguide";

function ensureUiRefreshStyles() {
  const href = `${BASE}/assets/css/ui-refresh.css?v=${UI_CSS_VERSION}`;
  if (document.querySelector(`link[data-ui-refresh][href^="${BASE}/assets/css/ui-refresh.css"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.uiRefresh = "true";
  document.head.appendChild(link);
}

ensureUiRefreshStyles();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${BASE}/sw.js?v=${SW_VERSION}`, {
        scope: `${BASE}/`,
        updateViaCache: "none",
      })
      .then((reg) => {
        reg.update().catch(() => {});
        console.log("[pwa] Service Worker registered:", reg.scope);
      })
      .catch((err) => {
        console.warn("[pwa] Service Worker registration failed:", err);
      });
  });
}
