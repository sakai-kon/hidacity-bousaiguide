/**
 * checklist.js
 * bag/index.html 専用スクリプト。
 * data-check-id を持つチェックボックスを自動検出し、
 * チェック状態を localStorage に保存する。
 * 進捗バー（n/合計）を自動計算して表示する。
 * 項目を増減しても、このJS側の変更は不要。
 */

import { saveData, loadData } from "/hidacity-bousaiguide/assets/js/storage.js";

const STORAGE_KEY = "bag-checklist";

function initChecklist() {
  const checkboxes = Array.from(document.querySelectorAll("[data-check-id]"));
  if (!checkboxes.length) return;

  const progressCountEl = document.querySelector("[data-progress-count]");
  const progressTotalEl = document.querySelector("[data-progress-total]");
  const progressFillEl = document.querySelector("[data-progress-fill]");
  const progressPercentEl = document.querySelector("[data-progress-percent]");
  const resetBtn = document.querySelector("[data-checklist-reset]");

  const total = checkboxes.length;
  const savedState = loadData(STORAGE_KEY, {});

  // 保存されている状態を反映
  checkboxes.forEach((checkbox) => {
    const id = checkbox.getAttribute("data-check-id");
    const row = checkbox.closest(".check-row");
    if (savedState[id]) {
      checkbox.checked = true;
      if (row) row.classList.add("is-checked");
    }
  });

  function updateProgress() {
    const checkedCount = checkboxes.filter((cb) => cb.checked).length;
    const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

    if (progressCountEl) progressCountEl.textContent = String(checkedCount);
    if (progressTotalEl) progressTotalEl.textContent = String(total);
    if (progressFillEl) progressFillEl.style.width = percent + "%";
    if (progressPercentEl) progressPercentEl.textContent = percent + "%";
  }

  function persistState() {
    const state = {};
    checkboxes.forEach((cb) => {
      state[cb.getAttribute("data-check-id")] = cb.checked;
    });
    saveData(STORAGE_KEY, state);
  }

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const row = checkbox.closest(".check-row");
      if (row) row.classList.toggle("is-checked", checkbox.checked);
      persistState();
      updateProgress();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (!window.confirm("チェックをすべてリセットしますか？")) return;
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
        const row = checkbox.closest(".check-row");
        if (row) row.classList.remove("is-checked");
      });
      persistState();
      updateProgress();
    });
  }

  updateProgress();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChecklist);
} else {
  initChecklist();
}
