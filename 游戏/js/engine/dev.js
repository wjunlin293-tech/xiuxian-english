/* ───────────────────────────────────────────────────────────────
 * dev.js · 本地验收调试入口
 * 仅 URL 带 ?dev=1 时启用；正式游玩不可见。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  function enabled() {
    try { return new URLSearchParams(location.search).get("dev") === "1"; }
    catch (e) { return false; }
  }

  function learnedWordSeed(n) {
    const book = Game.currentWordBook && Game.currentWordBook();
    const bookId = book && book.id ? book.id : (Game.state && Game.state.vocabBookId) || "gaokao";
    const words = book && book.words ? Object.keys(book.words) : Object.keys(Game.currentWords ? Game.currentWords() : {});
    const chosen = words.slice(0, Math.max(1, n || 60));
    Game.state.wordStats[bookId] = Game.state.wordStats[bookId] || {};
    chosen.forEach((key, i) => {
      Game.state.wordStats[bookId][key] = Object.assign({}, Game.state.wordStats[bookId][key] || {}, {
        seen: 3 + (i % 3),
        correct: 2 + (i % 4),
        wrong: i % 5 === 0 ? 2 : (i % 3 === 0 ? 1 : 0),
        mastery: Math.max(1, Math.min(5, 1 + (i % 5))),
        dueMonth: Game.currentMonthNumber ? Game.currentMonthNumber() : 1,
        dueAt: Date.now() - 1000,
        lastMode: "dev_seed",
      });
    });
    return chosen.length;
  }

  function seedBreakthrough() {
    if (!enabled()) return false;
    Game.normalizeState && Game.normalizeState();
    const s = Game.state;
    s.lifeDead = false;
    s.activeBreak = null;
    s.activeCultivation = null;
    if (s.realmIndex >= (Game.REALMS || []).length - 1) {
      s.realmIndex = Math.max(0, (Game.REALMS || []).length - 2);
      s.expToBreak = Math.max(900, Math.round(900 * Math.pow(3.9, s.realmIndex)));
      Game.applyLifespanForRealm && Game.applyLifespanForRealm();
    }
    const count = learnedWordSeed(70);
    s.exp = s.expToBreak;
    s.yanqi = s.exp;
    s.yanqiToLevel = s.expToBreak;
    Game.save && Game.save.write({ view: "hub" });
    Game.hub && Game.hub.show("DEV：已填满言气，并准备 " + count + " 个天劫测试词。");
    return true;
  }

  function sanitizeLoadedState() {
    if (!enabled() || !Game.state) return false;
    let changed = false;
    if (Game.state.activeBreak) {
      Game.state.activeBreak = null;
      changed = true;
    }
    if (Game.state.activeCultivation) {
      Game.state.activeCultivation = null;
      changed = true;
    }
    return changed;
  }

  function clearBreakToHub() {
    if (!enabled() || !Game.state) return false;
    Game.state.activeBreak = null;
    Game.state.activeCultivation = null;
    Game.save && Game.save.write({ view: "hub" });
    Game.hub && Game.hub.show("DEV：已清除天劫测试态，回到月课。");
    return true;
  }

  function hubHtml() {
    if (!enabled()) return "";
    return '<div class="deadline-box dev-box">' +
      '<b>DEV · 本地验收</b>' +
      '<span>仅 ?dev=1 显示。用于快速测试 P-BREAK 天劫突破链路。</span>' +
      '<button class="btn btn-gold" id="dev-seed-break">填满言气并准备天劫</button>' +
      '</div>';
  }

  function bindHub(root) {
    if (!enabled() || !root) return;
    const btn = root.querySelector("#dev-seed-break");
    if (btn) btn.onclick = seedBreakthrough;
  }

  function tribHtml() {
    if (!enabled()) return "";
    return '<div class="dev-box dev-inline">' +
      '<b>DEV · 天劫验收</b>' +
      '<button class="btn btn-mini" id="dev-clear-break">清除天劫测试态，回月课</button>' +
      '</div>';
  }

  function bindTrib(root) {
    if (!enabled() || !root) return;
    const btn = root.querySelector("#dev-clear-break");
    if (btn) btn.onclick = clearBreakToHub;
  }

  Game.dev = {
    enabled,
    hubHtml,
    bindHub,
    tribHtml,
    bindTrib,
    seedBreakthrough,
    sanitizeLoadedState,
    clearBreakToHub,
  };
})(window.Game = window.Game || {});
