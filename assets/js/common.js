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
 * - 共通ブランドアイコンの適用
 */

import { saveData, loadData } from "/hidacity-bousaiguide/assets/js/storage.js";
import { initSiteSearch } from "/hidacity-bousaiguide/assets/js/site-search.js";

const THEME_KEY = "theme";
const BRAND_ICON_URL = "/hidacity-bousaiguide/assets/icons/hidacity-bousaiguideaicons.png?v=2026-08-20-icon-upload";
const FALLBACK_ICON_URL = "/hidacity-bousaiguide/assets/icons/hida-bousai-icon.svg?v=2026-08-20-icon2";
const FAVICON_URL = BRAND_ICON_URL;

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

function ensureBrandIcon() {
  document.querySelectorAll(".logo .logo-badge").forEach((badge) => {
    if (badge.querySelector('img[data-brand-icon="true"]')) return;
    badge.replaceChildren();
    const img = document.createElement("img");
    img.src = BRAND_ICON_URL;
    img.alt = "";
    img.width = 40;
    img.height = 40;
    img.decoding = "async";
    img.loading = "eager";
    img.setAttribute("data-brand-icon", "true");
    img.style.display = "block";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.borderRadius = "inherit";
    img.onerror = () => {
      if (img.src.endsWith(FALLBACK_ICON_URL)) return;
      img.src = FALLBACK_ICON_URL;
    };
    badge.appendChild(img);
  });
}

function ensureFavicon() {
  let icon = document.querySelector('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }
  icon.type = "image/png";
  icon.href = FAVICON_URL;
  icon.onerror = () => {
    icon.type = "image/svg+xml";
    icon.href = FALLBACK_ICON_URL;
  };
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
  ensureBrandIcon();
  ensureFavicon();
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
