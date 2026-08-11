/**
 * pwa.js
 * Service Worker(sw.js)の登録処理のみを行う。
 */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/hidacity-bousaiguide/sw.js", { scope: "/hidacity-bousaiguide/" })
      .then((reg) => {
        console.log("[pwa] Service Worker registered:", reg.scope);
      })
      .catch((err) => {
        console.warn("[pwa] Service Worker registration failed:", err);
      });
  });
}
