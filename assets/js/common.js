/**
 * common.js
 * 全ページ共通の挙動をまとめたスクリプト。
 * - ヘッダーのスクロール影
 * - スマホ用メニューの開閉
 * - ダークモードの切替・保存
 * - スクロールフェードイン([data-fade])
 * - FAQアコーディオンの開閉
 *
 * 各HTMLの末尾で `import "/assets/js/common.js"` として読み込む。
 */

import { saveData, loadData } from "/hidacity-bousaiguide/assets/js/storage.js";

const THEME_KEY = "theme";

/* ---------------------------------------------
   1. ダークモード
--------------------------------------------- */
function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function initTheme() {
  const saved = loadData(THEME_KEY, null);
  if (saved === "dark" || saved === "light") {
    applyTheme(saved);
  } else {
    // 保存がない場合はOS設定を尊重
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }

  const toggleButtons = document.querySelectorAll("[data-theme-toggle]");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const next = isDark ? "light" : "dark";
      applyTheme(next);
      saveData(THEME_KEY, next);
    });
  });
}

/* ---------------------------------------------
   2. ヘッダーのスクロール影
--------------------------------------------- */
function initHeaderShadow() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const update = () => {
    if (window.scrollY > 4) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
}

/* ---------------------------------------------
   3. スマホ用メニューの開閉
--------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  if (!toggleBtn || !menu) return;

  toggleBtn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // メニュー内のリンクをクリックしたら閉じる
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------------------------------------------
   4. スクロールフェードイン
--------------------------------------------- */
function initScrollFade() {
  const targets = document.querySelectorAll("[data-fade]");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ---------------------------------------------
   5. FAQアコーディオン
--------------------------------------------- */
function initAccordion() {
  const items = document.querySelectorAll(".accordion-item");
  if (!items.length) return;

  items.forEach((item) => {
    const trigger = item.querySelector(".accordion-trigger");
    const panel = item.querySelector(".accordion-panel");
    if (!trigger || !panel) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      if (isOpen) {
        item.classList.remove("is-open");
        panel.style.maxHeight = "0px";
        trigger.setAttribute("aria-expanded", "false");
      } else {
        item.classList.add("is-open");
        panel.style.maxHeight = panel.scrollHeight + "px";
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  // ウィンドウリサイズ時に開いているパネルの高さを再計算
  window.addEventListener("resize", () => {
    document.querySelectorAll(".accordion-item.is-open .accordion-panel").forEach((panel) => {
      panel.style.maxHeight = panel.scrollHeight + "px";
    });
  });
}

/* ---------------------------------------------
   初期化
--------------------------------------------- */
function init() {
  initTheme();
  initHeaderShadow();
  initMobileMenu();
  initScrollFade();
  initAccordion();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
