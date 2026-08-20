/**
 * pwa.js
 * Service Worker登録 + 全ページ共通UIスタイルのロード。
 */

const SW_VERSION = "2026-08-20-4";
const UI_VERSION = "2026-08-20-ui2";
const BASE = "/hidacity-bousaiguide";
const UI_CSS = `${BASE}/assets/css/ui-refresh.css?v=${UI_VERSION}`;

function ensureUiStyles() {
  if (document.querySelector('link[data-ui-refresh="true"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = UI_CSS;
  link.dataset.uiRefresh = "true";
  document.head.appendChild(link);
}

ensureUiStyles();

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
