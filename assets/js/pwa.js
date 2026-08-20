/**
 * pwa.js
 * Service Worker(sw.js)の登録処理のみを行う。
 * サイト更新時に古いService Workerが残らないよう、明示的に更新を促す。
 */

const SW_VERSION = "2026-08-20-2";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`/hidacity-bousaiguide/sw.js?v=${SW_VERSION}`, {
        scope: "/hidacity-bousaiguide/",
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
