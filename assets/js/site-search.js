const BASE = "/hidacity-bousaiguide";
const SEARCH_URL = `${BASE}/search/site-search.json`;
const STYLE_URL = `${BASE}/assets/css/site-search.css?v=2026-08-20-search2`;
let indexPromise = null;

function ensureSearchStyles() {
  if (document.querySelector('link[data-site-search-style="true"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = STYLE_URL;
  link.dataset.siteSearchStyle = "true";
  document.head.appendChild(link);
}

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("ja-JP")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadSearchIndex() {
  if (!indexPromise) {
    indexPromise = fetch(`${SEARCH_URL}?v=${Date.now()}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .catch((error) => {
        indexPromise = null;
        throw error;
      });
  }
  return indexPromise;
}

function makeResult(item) {
  const card = document.createElement("a");
  card.className = "site-search-result";
  card.href = item.url;
  const type = document.createElement("span");
  type.className = "tag tag-blue site-search-result-type";
  type.textContent = item.typeLabel || item.type || "ページ";
  const title = document.createElement("h3");
  title.textContent = item.title;
  const desc = document.createElement("p");
  desc.textContent = item.description || item.excerpt || "";
  const meta = document.createElement("div");
  meta.className = "site-search-result-meta";
  if (item.category) meta.append(document.createTextNode(`🏷 ${item.category}`));
  if (item.date) meta.append(document.createTextNode(`${item.category ? "  ·  " : ""}📅 ${item.date}`));
  card.append(type, title, desc);
  if (meta.childNodes.length) card.append(meta);
  return card;
}

function score(item, query) {
  const q = normalize(query);
  const title = normalize(item.title);
  const description = normalize(item.description || item.excerpt);
  const keywords = normalize((item.keywords || []).join(" "));
  const content = normalize(item.searchText || "");
  let value = 0;
  if (title === q) value += 100;
  if (title.includes(q)) value += 60;
  if (keywords.includes(q)) value += 35;
  if (description.includes(q)) value += 20;
  if (content.includes(q)) value += 8;
  return value;
}

function createOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "site-search-overlay";
  overlay.setAttribute("hidden", "");
  overlay.innerHTML = `
    <div class="site-search-backdrop" data-search-close></div>
    <section class="site-search-dialog" role="dialog" aria-modal="true" aria-label="サイト内検索">
      <div class="site-search-head">
        <div>
          <span class="eyebrow">🔎 SEARCH</span>
          <h2>サイト内を検索</h2>
        </div>
        <button type="button" class="icon-btn site-search-close" data-search-close aria-label="検索を閉じる">×</button>
      </div>
      <label class="site-search-input-wrap">
        <span aria-hidden="true">⌕</span>
        <input type="search" autocomplete="off" placeholder="土砂災害、避難、持ち物…" aria-label="検索キーワード">
        <kbd>Esc</kbd>
      </label>
      <div class="site-search-status" aria-live="polite">キーワードを入力してください。</div>
      <div class="site-search-results" role="list"></div>
    </section>`;
  document.body.appendChild(overlay);
  return overlay;
}

function openSearch(overlay) {
  overlay.hidden = false;
  document.body.classList.add("search-open");
  const input = overlay.querySelector("input");
  setTimeout(() => input?.focus(), 0);
}

function closeSearch(overlay) {
  overlay.hidden = true;
  document.body.classList.remove("search-open");
}

export function initSiteSearch() {
  ensureSearchStyles();
  const actions = document.querySelector(".header-actions");
  if (!actions || document.querySelector("[data-site-search-trigger]")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-btn site-search-trigger";
  button.setAttribute("data-site-search-trigger", "true");
  button.setAttribute("aria-label", "サイト内検索を開く");
  button.innerHTML = "<span aria-hidden=\"true\">⌕</span>";
  actions.insertBefore(button, actions.firstElementChild);

  const overlay = createOverlay();
  const input = overlay.querySelector("input");
  const status = overlay.querySelector(".site-search-status");
  const results = overlay.querySelector(".site-search-results");

  const render = async () => {
    const query = input.value.trim();
    results.replaceChildren();
    if (!query) {
      status.textContent = "キーワードを入力してください。";
      return;
    }
    status.textContent = "検索しています…";
    try {
      const index = await loadSearchIndex();
      const terms = normalize(query).split(" ").filter(Boolean);
      const matched = index
        .map((item) => ({ item, score: terms.reduce((sum, term) => sum + score(item, term), 0) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || String(a.item.title).localeCompare(String(b.item.title), "ja"));
      status.textContent = matched.length ? `${matched.length}件の検索結果` : "該当するページが見つかりませんでした。";
      matched.slice(0, 30).forEach(({ item }) => results.appendChild(makeResult(item)));
    } catch (error) {
      status.textContent = `検索データを読み込めませんでした：${error.message}`;
    }
  };

  let timer = null;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(render, 120);
  });
  button.addEventListener("click", () => openSearch(overlay));
  overlay.addEventListener("click", (event) => {
    if (event.target.closest("[data-search-close]")) closeSearch(overlay);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeSearch(overlay);
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (overlay.hidden) openSearch(overlay); else closeSearch(overlay);
    }
  });
}
