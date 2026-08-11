/**
 * quiz.js
 * quiz/index.html 専用スクリプト。
 * #quiz-root の data-questions 属性に埋め込まれたJSONを読み取り、
 * 問題カードを動的に生成・採点・結果表示する。
 * localStorage にはベストスコアを保存する。
 */

import { saveData, loadData } from "/hidacity-bousaiguide/assets/js/storage.js";

const BEST_SCORE_KEY = "quiz-best-score";

function initQuiz() {
  const root = document.getElementById("quiz-root");
  if (!root) return;

  let questions = [];
  try {
    const raw = root.getAttribute("data-questions");
    questions = JSON.parse(raw);
  } catch (err) {
    console.error("[quiz] 問題データの読み込みに失敗しました:", err);
    root.innerHTML =
      '<p class="text-muted">問題データの読み込みに失敗しました。ページを再読み込みしてください。</p>';
    return;
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    root.innerHTML = '<p class="text-muted">現在、問題が登録されていません。</p>';
    return;
  }

  const total = questions.length;
  let currentIndex = 0;
  let score = 0;
  let answered = false;

  // ---- 要素をJSで生成 ----
  const wrap = document.createElement("div");

  const meta = document.createElement("div");
  meta.className = "quiz-meta";
  const metaLeft = document.createElement("span");
  metaLeft.setAttribute("data-quiz-meta-left", "");
  const metaRight = document.createElement("span");
  metaRight.setAttribute("data-quiz-meta-right", "");
  meta.appendChild(metaLeft);
  meta.appendChild(metaRight);

  const progressTrack = document.createElement("div");
  progressTrack.className = "quiz-progress-track";
  const progressFill = document.createElement("div");
  progressFill.className = "quiz-progress-fill";
  progressTrack.appendChild(progressFill);

  const card = document.createElement("div");
  card.className = "quiz-card";
  card.setAttribute("data-quiz-card", "");

  wrap.appendChild(meta);
  wrap.appendChild(progressTrack);
  wrap.appendChild(card);
  root.appendChild(wrap);

  function renderQuestion() {
    answered = false;
    const q = questions[currentIndex];

    metaLeft.textContent = `第${currentIndex + 1}問 / 全${total}問`;
    metaRight.textContent = `現在のスコア：${score}点`;
    progressFill.style.width = `${(currentIndex / total) * 100}%`;

    card.innerHTML = "";

    const questionEl = document.createElement("p");
    questionEl.className = "quiz-question";
    questionEl.textContent = q.question;
    card.appendChild(questionEl);

    const optionsWrap = document.createElement("div");
    optionsWrap.setAttribute("data-options", "");

    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option";
      btn.textContent = opt.text;
      btn.addEventListener("click", () => handleAnswer(i));
      optionsWrap.appendChild(btn);
    });
    card.appendChild(optionsWrap);

    const note = document.createElement("div");
    note.className = "quiz-note";
    note.setAttribute("data-note", "");
    card.appendChild(note);

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn btn-primary quiz-next-btn";
    nextBtn.setAttribute("data-next-btn", "");
    nextBtn.textContent = currentIndex === total - 1 ? "結果を見る" : "次の問題へ";
    nextBtn.addEventListener("click", goNext);
    card.appendChild(nextBtn);
  }

  function handleAnswer(selectedIndex) {
    if (answered) return;
    answered = true;

    const q = questions[currentIndex];
    const buttons = card.querySelectorAll(".quiz-option");
    const note = card.querySelector("[data-note]");
    const nextBtn = card.querySelector("[data-next-btn]");

    const selectedOpt = q.options[selectedIndex];
    if (selectedOpt.correct) score += 1;

    buttons.forEach((btn, i) => {
      btn.disabled = true;
      const opt = q.options[i];
      if (opt.correct) {
        btn.classList.add("is-correct");
      } else if (i === selectedIndex) {
        btn.classList.add("is-wrong");
      }
    });

    if (note) {
      const noteText = selectedOpt.note || q.options.find((o) => o.correct)?.note || "";
      note.textContent = (selectedOpt.correct ? "○ 正解です。" : "× 不正解です。") + (noteText ? " " + noteText : "");
      note.classList.add("is-visible");
    }
    if (nextBtn) nextBtn.classList.add("is-visible");

    metaRight.textContent = `現在のスコア：${score}点`;
  }

  function goNext() {
    if (currentIndex < total - 1) {
      currentIndex += 1;
      renderQuestion();
    } else {
      renderResult();
    }
  }

  function renderResult() {
    progressFill.style.width = "100%";
    metaLeft.textContent = `結果`;
    metaRight.textContent = "";

    const best = loadData(BEST_SCORE_KEY, 0);
    const newBest = Math.max(best, score);
    saveData(BEST_SCORE_KEY, newBest);

    const percent = Math.round((score / total) * 100);
    let message = "";
    if (percent === 100) {
      message = "満点です！飛騨の防災についてしっかり理解できています。";
    } else if (percent >= 70) {
      message = "よくできました。もう少し復習すればパーフェクトです。";
    } else if (percent >= 40) {
      message = "防災知識ページも見て、もう一度チャレンジしてみましょう。";
    } else {
      message = "まずは防災知識ページを読んで、基本を確認してみましょう。";
    }

    card.innerHTML = `
      <div class="quiz-result">
        <div class="quiz-result-score">${score}<small> / ${total}点</small></div>
        <p class="quiz-result-msg">${message}</p>
        <p class="text-sm text-faint mt-1">これまでのベストスコア：${newBest} / ${total}点</p>
        <div class="flex gap-2 justify-center mt-3" style="flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" data-retry-btn>もう一度チャレンジする</button>
          <a href="/hidacity-bousaiguide/knowledge/" class="btn btn-outline">防災知識を復習する</a>
        </div>
      </div>
    `;

    const retryBtn = card.querySelector("[data-retry-btn]");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        currentIndex = 0;
        score = 0;
        renderQuestion();
      });
    }
  }

  renderQuestion();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initQuiz);
} else {
  initQuiz();
}
