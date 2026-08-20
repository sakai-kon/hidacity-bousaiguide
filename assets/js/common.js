/**
 * common.js
 * 全ページ共通の挙動をまとめたスクリプト。
 * - ヘッダーのスクロール影
 * - スマホ用メニューの開閉
 * - ダークモードの切替・保存
 * - スクロールフェードイン([data-fade])
 * - FAQアコーディオンの開閉
 * - 防災記事リンクの共通ナビ追加・順序統一
 * - 全ページ共通サイト内検索
 */

import { saveData, loadData } from "/hidacity-bousaiguide/assets/js/storage.js";
import { initSiteSearch } from "/hidacity-bousaiguide/assets/js/site-search.js";

const THEME_KEY = "theme";

function applyTheme(theme) {
  if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
}

function initTheme() {
  const saved = loadData(THEME_KEY, null);
  if (saved === "dark" || saved === "light") applyTheme(saved);
  else {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      saveData(THEME_KEY, next);
    });
  });
}

function initHeaderShadow() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const update = () => header.classList.toggle("is-scrolled", window.scrollY > 4);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

function ensureArticleLink(container) {
  if (!container) return;

  let link = container.querySelector('a[href="/hidacity-bousaiguide/articles/"]');
  if (!link) {
    link = document.createElement("a");
    link.href = "/hidacity-bousaiguide/articles/";
    link.className = "nav-link";
    link.textContent = "防災記事";
    container.appendChild(link);
  }

  link.classList.toggle("is-active", location.pathname.startsWith("/hidacity-bousaiguide/articles/"));

  // すべてのページで「防災記事」をハザードマップの直後に統一。
  // これにより記事ページだけナビ項目の並びが変わって、右側のボタン位置がずれる問題を防ぐ。
  const hazard = container.querySelector('a[href="/hidacity-bousaiguide/hazard/"]');
  if (hazard && hazard.nextElementSibling !== link) {
    container.insertBefore(link, hazard.nextElementSibling);
  }
}

function initArticleNav() {
  ensureArticleLink(document.querySelector(".pc-nav"));
  ensureArticleLink(document.querySelector(".mobile-menu"));
}

function initMobileMenu() {
  const toggleBtn = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  if (!toggleBtn || !menu) return;
  toggleBtn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
    });
  });
}

function initScrollFade() {
  const targets = document.querySelectorAll("[data-fade]");
  if (!targets.length) return;
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  targets.forEach((el) => observer.observe(el));
}

function initAccordion() {
  const items = document.querySelectorAll(".accordion-item");
  if (!items.length) return;
  items.forEach((item) => {
    const trigger = item.querySelector(".accordion-trigger");
    const panel = item.querySelector(".accordion-panel");
    if (!trigger || !panel) return;
    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      item.classList.toggle("is-open", !isOpen);
      panel.style.maxHeight = isOpen ? "0px" : panel.scrollHeight + "px";
      trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });
  });
  window.addEventListener("resize", () => {
    document.querySelectorAll(".accordion-item.is-open .accordion-panel").forEach((panel) => {
      panel.style.maxHeight = panel.scrollHeight + "px";
    });
  });
}

function init() {
  initTheme();
  initHeaderShadow();
  initArticleNav();
  initMobileMenu();
  initScrollFade();
  initAccordion();
  initSiteSearch();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
