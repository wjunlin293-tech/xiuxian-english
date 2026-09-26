/* ───────────────────────────────────────────────────────────────
 * cultivate.js · 修炼背词 session
 * 五法合参：按词阶段混合派题。三种专修：从源头锁定单一题型。
 * 混合出题顺序：先复习到期 → 小批新词(先学→即时再认) → 错词回炉。
 * 双货币：背新词→言气(养成)；复习到期(真实时间)→掌握度。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  // 练习类型（拼装一轮闭关的题序用）。五法合参按阶段临场定题型；专修模式只出固定题型。
  const PRACTICE_META = {
    new:    { name: "初见", expRate: 1 },
    review: { name: "复习", expRate: 0.85 },
    recall: { name: "复现", expRate: 0.7 },
    retry:  { name: "回炉", expRate: 0.45 },
    legacy: { name: "修炼", expRate: 1 },
  };
  const BATCH_SIZE = 3;
  const MAX_REVIEW_COUNT = 40;
  // P-BREAK/C-05：基础20% + 每答对1%(满50题=+50%) + 突破丹15% + 心境最高5%。
  const BREAK_BASE = 20;        // 基础突破概率 %
  const BREAK_QUIZ_N = 50;      // 天劫题数上限；已学词不足时不重复凑题
  const BREAK_PER_CORRECT = 1;  // 每答对 +1%
  const MINDSET_MAX = 5;        // 心境最高加成 %
  const MINDSET_DUE_BASE = 30;  // 待复习到期词≥此数则心境=0（越少越满）
  const NEW_WORD_EXP = 12;     // 待用户定：新学一词的养成言气（双货币·背新词→言气）
  const TYPE_BASE = { recognize: 10, listen: 12, context: 14, spell: 16 }; // 待用户定：各题型满额基础言气
  const LEARN_MODES = {
    mixed: { name: "五法合参", desc: "混合修炼：先学、再认、拼写、语境与听音都会出现。", fit: "混合题型" },
    skim: { name: "掠影识言", desc: "单题型：只快速看词、音标、核心义与例句，不追加选择题。", fit: "只过词" },
    spell: { name: "凝字成诀", desc: "单题型：只做英文默写，偏重拼写与主动回忆。", fit: "只默写" },
    meaning: { name: "辨义问心", desc: "单题型：只做看词选义，快速校准中文义。", fit: "只选择" },
  };
  const STREAK_LINES = [
    "连参不滞，言气渐顺。",
    "一气贯通，势起了。",
    "识海澄明，正盛。",
  ];
  const MISS_LINES = [
    "心浮则字乱，定一定神。",
    "急不得，慢慢来。",
    "停一口气，再观。",
  ];

  let session = null;

  function mountEl() { return document.getElementById("stage"); }
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  // P-AUTOMARK：切书后若有词在别的典籍已学过、被自动标熟，弹一窗告知（不打断操作）。
  function notifyAutoMark(n, bookId) {
    if (!n || n <= 0 || !Game.modal) return;
    const book = Game.wordBookById ? Game.wordBookById(bookId) : (Game.WORD_BOOKS && Game.WORD_BOOKS[bookId]);
    const name = book ? book.name : "这本词书";
    Game.modal.event({
      tag: "故识重逢",
      title: "识海自行标熟",
      body: "翻开《" + name + "》，其中 " + n + " 个真言你早已在别的典籍中烂熟于心。识海自动将它们标熟，无需重背——余下的才是这本书的新词。",
      closeText: "了然",
    });
  }
  function sourceNote(id) {
    if (id === (Game.FAVORITE_BOOK_ID || "favorites")) return '<small>双击进入收藏簿</small>';
    const src = Game.VOCAB_SOURCES && Game.VOCAB_SOURCES[id];
    return src && src.short ? '<small>' + src.short + '</small>' : "";
  }
  function frequencySummary(id) {
    if (!Game.bookFrequencySummary) return "";
    const s = Game.bookFrequencySummary(id);
    if (!s || !s.total) return "";
    const est = s.estimated ? " · 含估算" : "";
    return '<small class="book-frequency" title="' + esc((s.source || "词书频序") + est) + '">考频：高 ' + s.high + ' / 中 ' + s.mid + ' / 低 ' + s.low + est + '</small>';
  }
  function reviewCurveNote() {
    const info = Game.reviewCurveInfo ? Game.reviewCurveInfo() : null;
    if (!info) return "";
    return '<div class="review-curve-note"><b>' + esc(info.title) + '</b><span>' + esc(info.short) + esc(info.detail) + '</span></div>';
  }
  function vocabBookEntries() {
    const entries = Object.keys(Game.WORD_BOOKS || {}).map((id) => ({ id: id, book: Game.WORD_BOOKS[id] }));
    if (Game.favoriteBook) entries.push({ id: Game.FAVORITE_BOOK_ID || "favorites", book: Game.favoriteBook() });
    return entries;
  }
  function autoContinueOn() {
    const s = Game.state.settings || {};
    return !!(s.autoContinueMode ? s.autoContinueMode !== "off" : s.autoContinue);
  }
  function ttsOnSetting() {
    return !(Game.state.settings && Game.state.settings.tts === false);
  }
  function accentSetting() {
    return (Game.state.settings && Game.state.settings.accent === "uk") ? "uk" : "us";
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function reviewLimit(newCount) {
    return Math.min(MAX_REVIEW_COUNT, Math.ceil(Math.max(0, newCount) * 1.2));
  }
  function currentLearnMode() {
    const id = Game.state.settings && Game.state.settings.cultivationMode;
    return LEARN_MODES[id] ? id : "mixed";
  }
  function setLearnMode(id) {
    id = LEARN_MODES[id] ? id : "mixed";
    if (Game.saveUserSettings) Game.saveUserSettings({ cultivationMode: id });
    else {
      Game.state.settings = Game.state.settings || {};
      Game.state.settings.cultivationMode = id;
    }
    Game.save && Game.save.write({ view: "cultivate_menu" });
    return id;
  }
  function modeCards() {
    const active = currentLearnMode();
    return Object.keys(LEARN_MODES).map((id) => {
      const m = LEARN_MODES[id];
      return '<button class="cult-mode' + (id === active ? ' active' : '') + '" data-mode="' + id + '">' +
        '<span>' + m.name + '</span><b>' + m.fit + '</b><em>' + m.desc + '</em>' +
        '</button>';
    }).join("");
  }
  function modeName(id) {
    return (LEARN_MODES[id] || LEARN_MODES.mixed).name;
  }

  // ── 修炼入口：选词书 + 听力/自动继续开关 + 选本月新学量（UI 克制·不暴露算法） ──
  function chooseSession() {
    if (Game.state.activeCultivation && Game.state.activeCultivation.words) {
      return showResumePrompt();
    }
    Game.setZone && Game.setZone("practice");
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "cultivate_menu" });
    const book = Game.currentWordBook && Game.currentWordBook();
    const dueCount = Game.dueReviewCount ? Game.dueReviewCount() : 0;
    const bookCards = vocabBookEntries().map((entry) => {
      const id = entry.id;
      const b = entry.book;
      const active = book && book.id === id ? " active" : "";
      const count = Object.keys(b.words || {}).length;
      const prog = Game.bookProgress ? Game.bookProgress(id) : null;
      const done = prog && prog.total > 0 && prog.memorized >= prog.total;
      return '<button class="cult-book' + active + (done ? ' book-done' : '') + '" data-book="' + id + '">' +
        '  <span>' + b.name + (done ? ' <em class="book-done-tag">已通</em>' : '') + '</span>' +
        '  <b>' + count + ' 词' + (prog ? ' · 已记忆 ' + prog.memorized : '') + '</b>' +
        '  <em>' + b.desc + '</em>' +
        sourceNote(id) +
        frequencySummary(id) +
        '  <small class="cult-book-fast">双击速览 / 标熟</small>' +
        '</button>';
    }).join("");
    // M4/M5：本书进度 → 新学量（不足不灌水）与主动复习档位。
    const prog = Game.bookProgress ? Game.bookProgress(Game.state.vocabBookId) : { total: 0, memorized: 0, learning: 0, newLeft: 0 };
    const baseSizes = Game.SESSION_SIZES || [5, 10, 20, 50];
    const newSizes = [];
    baseSizes.forEach((n) => {
      const eff = Math.min(n, prog.newLeft);
      if (eff > 0 && newSizes.indexOf(eff) < 0) newSizes.push(eff);
    });
    const reviewSizes = [];
    baseSizes.forEach((n) => {
      const eff = Math.min(n, dueCount);
      if (eff > 0 && reviewSizes.indexOf(eff) < 0) reviewSizes.push(eff);
    });
    const sizes = newSizes.length ? newSizes.map((n) => {
      const plannedDue = Math.min(dueCount, reviewLimit(n));
      const deferredDue = Math.max(0, dueCount - plannedDue);
      const lifeCost = Game.life && Game.life.costLine ? Game.life.costLine("cultivate", { targetNew: n }) : "耗时 1 月";
      return (
      '<button class="cult-size" data-n="' + n + '">' +
      '  <span>新学 ' + n + ' 词</span>' +
      '  <b>本轮复习 ' + plannedDue + ' 个到期词' + (deferredDue ? '，其余 ' + deferredDue + ' 个顺延' : '') + '</b>' +
      '  <em>' + lifeCost + '</em>' +
      '</button>'
      );
    }).join("") : ('<div class="cult-allmemo">' + (prog.total > 0 && prog.memorized >= prog.total
      ? '📗 本词书已全部记忆，无需再学。可换一本词书，或在下方复习巩固。'
      : '本词书的新词已学完，只剩复习巩固；换一本词书可继续学新词。') + '</div>');
    const customSize = prog.newLeft > 0 ? (
      '<div class="cult-custom">' +
      '  <label><span>自定新学</span><input id="cult-custom-n" type="number" min="1" max="' + prog.newLeft + '" step="1" value="' + Math.min(10, prog.newLeft) + '"><em>剩余新词 ' + prog.newLeft + '，超出会自动截断。</em></label>' +
      '  <button class="btn btn-gold" id="cult-custom-go">按此数量闭关</button>' +
      '</div>'
    ) : "";
    // M5 主动复习档位（同 5/10/20/50，按到期数截断）
    const reviews = reviewSizes.length ? reviewSizes.map((n) => {
      const lifeCost = Game.life && Game.life.costLine ? Game.life.costLine("cultivate", { targetNew: n }) : "耗时 1 月";
      return (
      '<button class="cult-size cult-review" data-rev="' + n + '">' +
      '  <span>复习 ' + n + ' 词</span>' +
      '  <b>巩固到期真言</b>' +
      '  <em>' + lifeCost + '</em>' +
      '</button>'
      );
    }).join("") : '<div class="cult-allmemo dim">暂无到期真言，记忆已稳固。</div>';
    mountEl().innerHTML =
      '<div class="cult-screen">' +
      '  <button class="btn btn-mini zone-back" id="cult-back">退出</button>' +
      '  <div class="cult-head">' +
      '    <div class="wc-tag">闭关 · 参悟天外言典</div>' +
      '    <h2>本月修炼</h2>' +
      '    <p class="dim small">当前词书：<b>' + (book ? book.name : "未选择") + '</b>。今日有 <b>' + dueCount + '</b> 个到期真言；五法合参会混合先学、再认、拼写、语境与听力；三种专修只出对应单题型。</p>' +
      '  </div>' +
      '  <div class="panel-title">选择词书</div>' +
      '  <div class="cult-side-links"><button class="btn btn-mini cult-yantian" id="cult-yantian">翻阅词书 · 言田</button>' +
      '  <button class="btn btn-mini cult-shentian" id="cult-shentian">神田 · 成就</button></div>' +
      '  <div class="cult-books">' + bookCards + '</div>' +
      '  <div class="panel-title">选择修炼法</div>' +
      '  <div class="cult-guide" id="cult-guide">' +
      '    <b>新手指引</b><span>先选词书，再选修炼法和本月新学数量。五法合参是混合题型；掠影、凝字、辨义都是单题型专修。所有选择都只是学习方式，不会强迫你背满固定数量。</span>' +
      '    <button class="btn btn-mini" id="cult-guide-close">知道了</button>' +
      '  </div>' +
      '  <div class="cult-modes">' + modeCards() + '</div>' +
      '  <label class="cult-toggle">' +
      '    <input type="checkbox" id="cult-tts"' + (ttsOnSetting() ? " checked" : "") + '>' +
      '    <span>听力朗读</span>' +
      '    <em>开启后自动朗读单词与例句；静音环境可关。</em>' +
      '  </label>' +
      '  <div class="cult-accent"><span>发音口音：</span>' +
      '    <button class="btn btn-mini accent-opt' + (accentSetting() === "us" ? " active" : "") + '" data-acc="us">美音</button>' +
      '    <button class="btn btn-mini accent-opt' + (accentSetting() === "uk" ? " active" : "") + '" data-acc="uk">英音</button>' +
      '  </div>' +
      '  <label class="cult-toggle">' +
      '    <input type="checkbox" id="cult-auto"' + (autoContinueOn() ? " checked" : "") + '>' +
      '    <span>答题后自动继续</span>' +
      '    <em>开启后反馈停留约 1 秒，仍可手动提前继续。</em>' +
      '  </label>' +
      '  <div class="panel-title">本月新学多少</div>' +
      '  <div class="cult-sizes">' + sizes + '</div>' +
      customSize +
      '  <div class="panel-title">复习巩固<span class="dim small">（到期 ' + dueCount + ' 词 · 只复习不学新）</span></div>' +
      reviewCurveNote() +
      '  <div class="cult-sizes">' + reviews + '</div>' +
      '</div>';
    const guide = mountEl().querySelector("#cult-guide");
    if (guide && Game.state.flags && Game.state.flags.cultivateGuideSeen) guide.style.display = "none";
    const guideClose = mountEl().querySelector("#cult-guide-close");
    if (guideClose) guideClose.onclick = () => {
      Game.state.flags = Game.state.flags || {};
      Game.state.flags.cultivateGuideSeen = true;
      if (guide) guide.style.display = "none";
      Game.save && Game.save.write({ view: "cultivate_menu" });
    };
    mountEl().querySelectorAll(".cult-mode").forEach((b) => {
      b.onclick = () => {
        setLearnMode(b.dataset.mode);
        chooseSession();
      };
    });
    mountEl().querySelectorAll(".cult-book").forEach((b) => {
      b.onclick = () => {
        const auto = Game.setVocabBook ? Game.setVocabBook(b.dataset.book) : 0;
        Game.save && Game.save.write({ view: "cultivate_menu" });
        chooseSession();
        notifyAutoMark(auto, b.dataset.book);
      };
      b.ondblclick = () => {
        if (Game.setVocabBook) Game.setVocabBook(b.dataset.book);
        Game.save && Game.save.write({ view: "cultivate_menu" });
        if (Game.yantian) Game.yantian.show(b.dataset.book);
      };
    });
    mountEl().querySelector("#cult-yantian").onclick = () => Game.yantian && Game.yantian.show(Game.state.vocabBookId);
    mountEl().querySelector("#cult-shentian").onclick = () => Game.yantian && Game.yantian.showGarden();
    mountEl().querySelector("#cult-tts").onchange = (e) => {
      if (Game.saveUserSettings) Game.saveUserSettings({ tts: !!e.target.checked });
      else {
        Game.state.settings = Game.state.settings || {};
        Game.state.settings.tts = !!e.target.checked;
      }
      Game.save && Game.save.write({ view: "cultivate_menu" });
    };
    mountEl().querySelectorAll(".accent-opt").forEach((b) => {
      b.onclick = () => {
        if (Game.saveUserSettings) Game.saveUserSettings({ accent: b.dataset.acc });
        else {
          Game.state.settings = Game.state.settings || {};
          Game.state.settings.accent = b.dataset.acc;
        }
        Game.save && Game.save.write({ view: "cultivate_menu" });
        if (Game.wordcard && Game.wordcard.speak) Game.wordcard.speak(b.dataset.acc === "uk" ? "colour" : "color"); // 切换即试听
        chooseSession();
      };
    });
    mountEl().querySelector("#cult-auto").onchange = (e) => {
      if (Game.saveUserSettings) Game.saveUserSettings({ autoContinue: !!e.target.checked, autoContinueMode: e.target.checked ? "normal" : "off" });
      else {
        Game.state.settings = Game.state.settings || {};
        Game.state.settings.autoContinue = !!e.target.checked;
        Game.state.settings.autoContinueMode = e.target.checked ? "normal" : "off";
      }
      Game.save && Game.save.write({ view: "cultivate_menu" });
    };
    mountEl().querySelectorAll(".cult-size").forEach((b) => {
      b.onclick = () => {
        if (b.dataset.rev != null) startReview(Number(b.dataset.rev), currentLearnMode()); // M5 主动复习
        else start(Number(b.dataset.n), currentLearnMode());
      };
    });
    const customBtn = mountEl().querySelector("#cult-custom-go");
    if (customBtn) customBtn.onclick = () => {
      const input = mountEl().querySelector("#cult-custom-n");
      const raw = input ? Number(input.value) : 0;
      const n = Math.max(1, Math.min(prog.newLeft, Math.floor(Number.isFinite(raw) ? raw : 1)));
      start(n, currentLearnMode());
    };
    mountEl().querySelector("#cult-back").onclick = () => Game.hub.show();
  }

  // ── 题序拼装：混合模式保留交织骨架；专修模式不插“先学→再认”二段式，避免单题型被掺杂。
  function wordKeysFor(count) {
    if (Game.dueWords) return Game.dueWords(count);
    const keys = Object.keys(Game.WORDS || {});
    const out = [];
    if (!keys.length) return out;
    for (let i = 0; i < count; i++) out.push(keys[i % keys.length]);
    return out;
  }
  function practiceMeta(kind) { return PRACTICE_META[kind] || PRACTICE_META.legacy; }
  function uniqueList(list) {
    const seen = {}, out = [];
    (list || []).forEach((key) => { if (key && !seen[key]) { seen[key] = true; out.push(key); } });
    return out;
  }
  function takeUnique(list, count, used) {
    used = used || {};
    const out = [];
    uniqueList(list).forEach((key) => {
      if (out.length >= count || used[key]) return;
      used[key] = true;
      out.push(key);
    });
    return out;
  }
  function takeCycle(list, count, used) {
    const pool = uniqueList(list).filter((key) => !(used && used[key]));
    const out = [];
    if (!pool.length || count <= 0) return out;
    for (let i = 0; i < count; i++) out.push(pool[i % pool.length]);
    return out;
  }
  function addItems(items, keys, kind) {
    keys.forEach((key) => items.push({ wordKey: key, kind: kind }));
  }

  function isFocusedMode(modeId) {
    return modeId === "skim" || modeId === "spell" || modeId === "meaning";
  }
  function fixedTypeForMode(modeId) {
    if (modeId === "skim") return "learn";
    if (modeId === "spell") return "spell";
    if (modeId === "meaning") return "recognize";
    return "";
  }
  function buildPracticeItems(newCount, modeId) {
    const buckets = Game.learningBuckets ? Game.learningBuckets() : null;
    if (!buckets) return wordKeysFor(newCount).map((wordKey) => ({ wordKey, kind: "legacy" }));

    const usedNew = {};
    const newTargets = takeUnique(buckets.unseen, newCount, usedNew);
    const newSet = {};
    newTargets.forEach((key) => { newSet[key] = true; });

    const reviewPool = uniqueList([]
      .concat(buckets.due || [])
      .concat(buckets.weak || [])
      .concat(buckets.recent || []))
      .filter((key) => !newSet[key]);
    const reviewTarget = Math.max(0, Math.min(reviewLimit(newCount), reviewPool.length));
    let reviewCursor = 0;
    function nextReviews(n) {
      const keys = [];
      if (!reviewPool.length || n <= 0) return keys;
      for (let i = 0; i < n; i++) {
        keys.push(reviewPool[reviewCursor % reviewPool.length]);
        reviewCursor += 1;
      }
      return keys;
    }

    const items = [];
    // 热身：先清今日到期复习（真实日历到期·跨场次才有；同场次基本为空）
    const warmup = Math.min(reviewTarget, Math.max(0, Math.min(5, Math.ceil(newCount / 3))));
    addItems(items, nextReviews(warmup), "review");

    if (!newTargets.length) {
      const pureReviews = nextReviews(Math.max(newCount * 2, 5));
      addItems(items, pureReviews.length ? pureReviews : takeCycle(buckets.all, newCount, null), "review");
      return items;
    }

    if (isFocusedMode(modeId)) {
      addItems(items, newTargets, "new");
      const remainingReviews = Math.max(0, reviewTarget - items.filter((item) => item.kind === "review").length);
      addItems(items, nextReviews(remainingReviews), "review");
      return items;
    }

    // 小批新词：先学 → 即时再认 → 穿插旧词复习
    for (let i = 0; i < newTargets.length; i += BATCH_SIZE) {
      const batch = newTargets.slice(i, i + BATCH_SIZE);
      addItems(items, batch, "new");
      addItems(items, nextReviews(1), "review");
      addItems(items, batch, "recall");
      addItems(items, nextReviews(1), "review");
    }
    const remainingReviews = Math.max(0, reviewTarget - items.filter((item) => item.kind === "review").length);
    addItems(items, nextReviews(remainingReviews), "review");
    return items;
  }

  // ── 草稿存档（R14 中断恢复·去掉 modeId·加 newSet） ──
  function sessionDraft() {
    if (!session) return null;
    return {
      v: 3,
      targetNew: session.targetNew || 0,
      modeId: session.modeId || "mixed",
      total: session.items.length,
      index: session.index,
      gained: session.gained,
      items: session.items.slice(),
      words: session.items.map((item) => item.wordKey),
      results: session.results.slice(),
      newSet: session.newSet,
      streak: session.streak || 0,
      miss: session.miss || 0,
      bestStreak: session.bestStreak || 0,
      vocabBookId: Game.state.vocabBookId,
      savedAt: Date.now(),
    };
  }
  function saveSessionDraft(view) {
    if (!session) return;
    Game.state.activeCultivation = sessionDraft();
    Game.save && Game.save.write({ view: view || "cultivate", sessionIndex: session.index, sessionTotal: session.total });
  }
  function clearSessionDraft() { if (Game.state) Game.state.activeCultivation = null; }

  // M2：草稿词书是否仍有效（词书被删/改名时草稿不可用，避免恢复后题目找不到词被静默判错）。
  function draftBookOk(draft) {
    if (!draft) return false;
    const id = draft.vocabBookId;
    if (id === (Game.FAVORITE_BOOK_ID || "favorites")) return true;
    if (id && Game.WORD_BOOKS && !Game.WORD_BOOKS[id]) return false;
    return true;
  }

  function restoreDraft() {
    const draft = Game.state && Game.state.activeCultivation;
    if (!draft || !draft.words || !draft.words.length) return null;
    if (!draftBookOk(draft)) { clearSessionDraft(); return null; } // 词书失效→弃草稿(防自动判错)
    if (draft.vocabBookId && Game.setVocabBook) Game.setVocabBook(draft.vocabBookId);
    const items = Array.isArray(draft.items) && draft.items.length
      ? draft.items.slice()
      : draft.words.map((wordKey) => ({ wordKey, kind: "legacy" }));
    const results = Array.isArray(draft.results) ? draft.results.slice() : [];
    const gained = typeof draft.gained === "number" ? draft.gained : results.reduce((s, r) => s + (r.exp || 0), 0);
    const newSet = draft.newSet || {};
    if (!draft.newSet) items.forEach((it) => { if (it.kind === "new") newSet[it.wordKey] = true; });
    session = {
      targetNew: draft.targetNew || 0,
      modeId: LEARN_MODES[draft.modeId] ? draft.modeId : "mixed",
      total: draft.total || items.length,
      index: Math.max(0, Math.min(draft.index || 0, items.length)),
      gained: gained,
      items: items,
      results: results,
      newSet: newSet,
      streak: draft.streak || 0,
      miss: draft.miss || 0,
      bestStreak: draft.bestStreak || 0,
      events: [],
    };
    return session;
  }

  function start(count, modeId) {
    modeId = LEARN_MODES[modeId] ? modeId : currentLearnMode();
    const items = buildPracticeItems(count, modeId);
    const newSet = {};
    items.forEach((it) => { if (it.kind === "new") newSet[it.wordKey] = true; });
    session = {
      targetNew: count,
      modeId: modeId,
      total: items.length,
      index: 0,
      gained: 0,
      items: items,
      results: [],
      newSet: newSet,
      streak: 0,
      miss: 0,
      bestStreak: 0,
      events: [],
    };
    saveSessionDraft("cultivate");
    renderNext();
  }

  // M5 主动复习：只复习到期词（不足补学习中的弱词），不学新词。走同一套答题机制，
  // 每题经 recordWordResult 更新 mem + 推后 dueAt → 答对的词自动离开被动复习队列（M6）。
  function buildReviewItems(count) {
    const buckets = Game.learningBuckets ? Game.learningBuckets() : null;
    if (!buckets) return [];
    const pool = uniqueList([].concat(buckets.due || []).concat(buckets.weak || []));
    const items = [];
    for (let i = 0; i < count && i < pool.length; i += 1) {
      items.push({ wordKey: pool[i], kind: "review" });
    }
    return items;
  }
  function startReview(count, modeId) {
    modeId = LEARN_MODES[modeId] ? modeId : currentLearnMode();
    const items = buildReviewItems(count);
    if (!items.length) return chooseSession();
    session = {
      targetNew: count, // 仅用于"耗时/燃寿与新学同档"（用户：复习和学新词一样）；实际新词数由 kinds 统计=0
      modeId: modeId,
      total: items.length,
      index: 0,
      gained: 0,
      items: items,
      results: [],
      newSet: {},
      streak: 0,
      miss: 0,
      bestStreak: 0,
      events: [],
      reviewOnly: true,
    };
    saveSessionDraft("cultivate");
    renderNext();
  }

  // ── 题型：三种专修先锁定单题型；只有五法合参按词阶段混合派题。 ──
  function typeForItem(item) {
    const modeId = session && session.modeId || "mixed";
    const fixed = fixedTypeForMode(modeId);
    if (fixed) return fixed;
    if (item.kind === "new") return "learn";        // 五法合参：新词先学卡·不计分
    if (item.kind === "retry") return "recognize";  // 回炉降到最易
    if (item.kind === "recall") return "recognize"; // 刚学完即认
    // review：按词阶段；同轮新学的词收尾别拷打→封顶再认
    if (session.newSet[item.wordKey]) return "recognize";
    const stage = Game.deriveStage ? Game.deriveStage(Game.wordStat(item.wordKey)) : 0;
    if (stage <= 0) return "recognize";
    if (stage === 1) return (session.index % 2) ? "spell" : "recognize";
    if (stage === 2) return (session.index % 2) ? "context" : "spell";
    return (session.index % 2) ? "listen" : "context"; // 掌握
  }

  // P-26：背词言气随境界提升(×2.7^境界)。涨幅 2.7 < 阈值涨幅 3.9，故每境界所需词数温和递增
  // (×1.44/境界·累计封顶~2000 命中稳记词锚点)，既消除高境界暴肝又不雪球。占位待 C-05 终校。
  // 注意副作用：封顶境界(demo 凝言)经验也被放大→经验炼丹堆属性会加速，C-05 可给炼丹成本加境界缩放中和。
  function realmExpScale() { return Math.pow(2.7, Game.state.realmIndex || 0); }
  function expForResult(result, item) {
    const scale = realmExpScale();
    if (result.type === "learn") return Game.applyQiGainRate ? Game.applyQiGainRate(NEW_WORD_EXP * scale) : Math.round(NEW_WORD_EXP * scale); // 新学→养成言气
    const base = Math.max(1, Math.round((TYPE_BASE[result.type] || 10) * practiceMeta(item.kind).expRate));
    let raw;
    if (result.rating === "easy") raw = base + 1;
    else if (result.rating === "hazy") raw = Math.max(1, Math.ceil(base * 0.55));
    else if (!result.correct) raw = Math.max(1, Math.ceil(base * 0.35));
    else raw = base;
    if (Game.state.flags && Game.state.flags.originReviewBoost) raw = Math.max(1, Math.round(raw * 1.1));
    const gained = raw * scale;
    return Game.applyQiGainRate ? Game.applyQiGainRate(gained) : Math.round(gained);
  }

  function resultScore(result) {
    if (!result) return 0;
    if (typeof result.score === "number") return result.score;
    if (result.rating === "easy") return 3;
    if (result.rating === "known") return 2;
    if (result.rating === "hazy") return 1;
    return result.correct ? 2 : 0;
  }
  function hasPendingRetry(wordKey) {
    return session.items.slice(session.index).some((item) => item.wordKey === wordKey && item.kind === "retry");
  }
  function insertRetry(wordKey) {
    if (!wordKey || hasPendingRetry(wordKey)) return;
    const pos = Math.min(session.index + 2, session.items.length);
    session.items.splice(pos, 0, { wordKey: wordKey, kind: "retry" });
    session.total = session.items.length;
  }
  function updateStreak(result) {
    if (!session || !result || result.type === "learn") return "";
    if (result.correct) {
      session.streak = (session.streak || 0) + 1;
      session.miss = 0;
      session.bestStreak = Math.max(session.bestStreak || 0, session.streak);
      if (session.streak >= 3 && session.streak % 3 === 0) {
        return "连对 " + session.streak + "：" + pick(STREAK_LINES);
      }
      return "";
    }
    session.miss = (session.miss || 0) + 1;
    session.streak = 0;
    if (session.miss >= 2 && session.miss % 2 === 0) {
      return "连错 " + session.miss + "：" + pick(MISS_LINES);
    }
    return "";
  }

  function renderNext() {
    if (!session || session.index >= session.items.length) return finishSession();
    Game.renderHeader && Game.renderHeader();
    saveSessionDraft("cultivate");
    const item = session.items[session.index];
    const wordKey = item.wordKey;
    const upcoming = session.items[session.index + 1];
    if (upcoming && Game.wordcard.preload) Game.wordcard.preload(upcoming.wordKey); // 预载下一题发音
    const type = typeForItem(item);
    const meta = practiceMeta(item.kind);
    mountEl().innerHTML =
      '<div class="cult-screen">' +
      '  <div class="cult-progress">' +
      '    <span>' + modeName(session.modeId) + ' · ' + meta.name + ' ' + (session.index + 1) + ' / ' + session.items.length + '</span>' +
      '    <span>待结算言气 +' + session.gained + '</span>' +
      '    <button class="btn btn-mini" id="cult-exit">暂退闭关</button>' +
      '  </div>' +
      '  <div id="cult-word"></div>' +
      '</div>';
    mountEl().querySelector("#cult-exit").onclick = showExitConfirm;
    Game.wordcard.render(mountEl().querySelector("#cult-word"), wordKey, {
      type: type,
      studyMode: session.modeId || "mixed",
      autoContinue: autoContinueOn(),
    }, function (result) {
      const gain = expForResult(result, item);
      const streakLine = updateStreak(result);
      result.exp = gain;
      result.practiceKind = item.kind;
      result.streakLine = streakLine;
      session.gained += gain;
      session.results.push(result);
      if (result.type === "learn") {
        session.newSet[wordKey] = true; // 标记本轮新学·收尾不拷打
      } else {
        Game.recordWordResult && Game.recordWordResult(wordKey, result.type, result);
        if (item.kind !== "retry" && resultScore(result) <= 1) insertRetry(wordKey);
      }
      Game.visual.toast(
        meta.name + '「' + wordKey + '」　待结算言气 +' + gain + (streakLine ? '　' + streakLine : ''),
        result.correct ? 'gold' : 'rose'
      );
      if (streakLine && Game.visual.comboPop) Game.visual.comboPop(streakLine);           // 连击弹出(P-29)
      if (result.type !== "learn" && !result.correct && Game.visual.redFlash) Game.visual.redFlash(); // 答错红闪(P-29)
      session.index += 1;
      saveSessionDraft("cultivate");
      setTimeout(renderNext, 120); // 原 450ms：旧题停在屏上像卡顿，缩短；提示 toast 独立浮层不受影响
    });
  }

  function showExitConfirm() {
    if (!session) return chooseSession();
    mountEl().innerHTML =
      '<div class="cult-screen">' +
      '  <div class="wordcard">' +
      '    <div class="wc-tag">暂退闭关</div>' +
      '    <h2>要如何离开？</h2>' +
      '    <p class="dim small">已完成 ' + session.results.length + ' / ' + session.items.length + ' 题，待结算言气 +' + session.gained + '。</p>' +
      '    <div class="cult-exit-actions">' +
      '      <button class="btn btn-gold" id="cult-settle">结算离关</button>' +
      '      <button class="btn" id="cult-keep">保留进度，回主页</button>' +
      '      <button class="btn" id="cult-abandon">放弃本次</button>' +
      '      <button class="btn btn-mini" id="cult-continue">继续修炼</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    mountEl().querySelector("#cult-settle").onclick = () => settleSession("提前离关");
    mountEl().querySelector("#cult-keep").onclick = keepAndExit;
    mountEl().querySelector("#cult-abandon").onclick = abandonSession;
    mountEl().querySelector("#cult-continue").onclick = renderNext;
  }

  function applySessionResults() {
    const events = Game.gainExp(session.gained, { scaled: true });
    session.events = events;
    clearSessionDraft();
    Game.save && Game.save.write({ view: "hub" });
    return events;
  }

  function summarizeSession(prefix) {
    const stats = {
      prefix: prefix,
      total: session.results.length,
      gained: session.gained,
      easy: 0, known: 0, hazy: 0, wrong: 0,
      kinds: { new: 0, review: 0, recall: 0, retry: 0, legacy: 0 },
      expByKind: { new: 0, review: 0, recall: 0, retry: 0, legacy: 0 },
      bestStreak: session.bestStreak || 0,
      streakNotes: [],
      mastered: [],
    };
    const seen = {};
    session.results.forEach((r) => {
      const kind = r.practiceKind || "legacy";
      if (typeof stats.kinds[kind] !== "number") stats.kinds[kind] = 0;
      if (typeof stats.expByKind[kind] !== "number") stats.expByKind[kind] = 0;
      stats.kinds[kind] += 1;
      stats.expByKind[kind] += r.exp || 0;
      if (r.type === "learn") return; // 先学不计入对错
      if (r.streakLine && stats.streakNotes.indexOf(r.streakLine) < 0) stats.streakNotes.push(r.streakLine);
      if (r.rating === "easy") stats.easy += 1;
      else if (r.rating === "known" || r.correct) stats.known += 1;
      else if (r.rating === "hazy") stats.hazy += 1;
      else stats.wrong += 1;
      if (r.correct && !seen[r.wordKey]) { seen[r.wordKey] = true; stats.mastered.push(r.wordKey); }
    });
    return stats;
  }
  function wordName(wordKey) {
    const w = Game.WORDS && Game.WORDS[wordKey];
    return w ? w.word : wordKey;
  }

  function finishSession() { settleSession("本月闭关结束"); }

  function settleSession(prefix) {
    if (!session) return Game.hub.show();
    const summary = summarizeSession(prefix);
    const message = prefix + "，完成 " + session.results.length + " 题，言气 +" + session.gained + "。";
    Game.insight && Game.insight.bump("studySessions"); // P-INSIGHT
    Game.insight && Game.insight.mark("study_done");
    const events = applySessionResults();
    events.forEach((ev) => {
      if (!Game.logEvent) return;
      if (ev.type === "breakthrough") Game.logEvent("⚡ 突破 · " + ev.from + " → " + ev.to); // 里程碑入事件栏(P-28)
      if (ev.type === "ready_to_break") Game.logEvent("✦ 言气已满 · 可引天劫突破 " + (Game.REALMS[Game.state.realmIndex + 1] || ""));
      if (ev.type === "realm_wall") Game.logEvent("⛰ 境界墙 · 凝言圆满，尚缺外界灵脉与突破丹");
    });
    Game.time.advanceMonth();
    Game.life && Game.life.spendActionExtra && Game.life.spendActionExtra("cultivate", { targetNew: summary.kinds.new || (session && session.targetNew) || 0 });
    Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("cultivate", "言气+" + session.gained);
    // 月份推进后必须再落盘一次：否则在小结/雷劫/加点页刷新会丢这次 advanceMonth（H1）。
    Game.save && Game.save.write({ view: "hub" });
    Game.renderHeader && Game.renderHeader();
    session = null;
    if (Game.life && Game.life.guard && Game.life.guard(message)) return;
    showSessionSummary(summary, events, message);
  }

  function abandonSession() {
    session = null;
    clearSessionDraft();
    Game.save && Game.save.write({ view: "hub" });
    Game.hub.show("已暂退闭关，本次修炼未结算，月份未推进。");
  }

  // M1：保留进度退出——草稿存好、回 hub，下次「修炼背词」可继续这一轮（不结算、不推进月份）。
  function keepAndExit() {
    if (!session) return Game.hub.show("");
    saveSessionDraft("cultivate");
    session = null;
    Game.save && Game.save.write({ view: "hub" });
    Game.hub.show("闭关已暂存，下次「修炼背词」可继续这一轮。");
  }

  // ───────────────── P-BREAK 主动突破 + 天劫雷劫 ─────────────────
  // 言气满后玩家主动点「突破」→ 提示窗 → 最多 50 题突击检查 → 概率结算（成功升境/失败扣言气+轻微折寿）。

  // 抽"记得最不熟"的词作题库（mastery 低 / 错得多优先）。不足 50 个就有多少考多少，不重复灌水。
  function leastFamiliarQueue() {
    const words = Game.WORDS || {};
    const rows = Object.keys(words).map((k) => ({ k: k, st: Game.wordStat(k) }))
      .filter((r) => r.st && (r.st.seen > 0 || r.st.markedKnown));
    rows.sort((a, b) => (a.st.mastery - b.st.mastery) || ((b.st.wrong || 0) - (a.st.wrong || 0)));
    const pool = rows.map((r) => r.k);
    if (!pool.length) return [];
    return pool.slice(0, BREAK_QUIZ_N);
  }

  function breakQuestionCount() {
    return leastFamiliarQueue().length;
  }

  // 心境：与待复习到期词剩余量挂钩——背得勤、复习清空，则临劫心定，加成最高 +5%。
  function mindsetBonus() {
    const buckets = Game.learningBuckets ? Game.learningBuckets() : null;
    const due = buckets && buckets.due ? buckets.due.length : 0;
    const ratio = Math.min(1, due / MINDSET_DUE_BASE);
    return Math.round(MINDSET_MAX * (1 - ratio));
  }

  function ownedBreakPill() {
    if (!Game.craft || !Game.craft.breakPillRecipe) return null;
    const r = Game.craft.breakPillRecipe(Game.state.realmIndex);
    if (!r || !Game.inventoryCount || Game.inventoryCount(r.id) <= 0) return null;
    return r;
  }

  // B3 入口：hub「突破」按钮调用。
  function startBreakthrough() {
    Game.normalizeState && Game.normalizeState();
    if (!Game.readyToBreak || !Game.readyToBreak()) {
      if (Game.isRealmWallReady && Game.isRealmWallReady()) return showRealmWall("凝言圆满：第 4 境界尚缺外界灵脉与突破丹。");
      return Game.hub.show("言气未满，尚不能引动天劫。");
    }
    showBreakPrompt();
  }

  // B4 提示窗（模板·后期境界可换困难/玩法）：列所需物品 + 要经历的困难 + 当前概率构成。
  function showBreakPrompt() {
    const idx = Game.state.realmIndex;
    const from = Game.REALMS[idx], to = Game.REALMS[idx + 1];
    const pill = ownedBreakPill();
    const recipe = Game.craft && Game.craft.breakPillRecipe && Game.craft.breakPillRecipe(idx);
    const mind = mindsetBonus();
    const qCount = breakQuestionCount();
    const pillLine = recipe
      ? (pill ? '已备《' + pill.name + '》——可直接服丹迎劫，当次 +' + (pill.breakBonus || 0) + '% 突破概率。'
              : '需《' + recipe.name + '》（' + (Game.REALMS[recipe.breakRealm] || "本境") + '突破丹，可在丹房炼制）——未持有，可点下方去丹房，也可徒手迎劫。')
      : '本境无对应突破丹。';
    const body =
      '言气已满，天劫将至。' + from + '欲破' + to + '，须受天劫雷劫——\n' +
      '【所需物品】' + pillLine + '\n' +
      '【要经历的困难】天劫将进行临劫真言检查 ' + qCount + ' 道（最多 ' + BREAK_QUIZ_N + ' 道，不足不重复；若当前为 0 道，则答题加成为 0%）；每答对一题，破境胜算 +' + BREAK_PER_CORRECT + '%。\n' +
      '【当前胜算】基础 ' + BREAK_BASE + '%' + (pill ? ' + 丹药 ' + (pill.breakBonus || 0) + '%' : '') + ' + 心境 ' + mind + '%，再加临劫答题。\n' +
      '【失败】雷劫反噬：折损部分言气、轻微折寿，但不掉属性、可再攒再来。';
    const actions = [];
    if (pill) actions.push({ label: "服《" + pill.name + "》迎劫", value: "pill", gold: true });
    else if (recipe && Game.craft && Game.craft.show) actions.push({ label: "去丹房炼制《" + recipe.name + "》", value: "craft", gold: true });
    actions.push({ label: pill ? "徒手迎劫" : "迎天劫", value: "bare", gold: !pill });
    actions.push({ label: "再等等", value: "cancel" });
    Game.modal.open({
      kind: "event", tag: "天劫将至", title: from + " → " + to, body: body, actions: actions,
      onClose: function (v) {
        if (v === "craft" && Game.craft && Game.craft.show) return Game.craft.show("先炼制突破丹；炼成后回月课点「突破」即可服丹迎劫。");
        if (!v || v === "cancel" || v.replaced) return Game.hub.show("你压下破境的念头，先稳住根基。");
        beginTribulation(v === "pill" ? pill : null);
      },
    });
  }

  // B5 起势：消耗突破丹（若服用）、建题库、入存档态，渲染第一题。
  function beginTribulation(pill) {
    const queue = leastFamiliarQueue();
    let pillBonus = 0, pillName = "";
    if (pill && Game.spendInventoryItem && Game.spendInventoryItem(pill.id, 1)) {
      pillBonus = pill.breakBonus || 0; pillName = pill.name;
    }
    Game.state.activeBreak = {
      realmIndex: Game.state.realmIndex,
      queue: queue, pos: 0, correct: 0,
      pillBonus: pillBonus, pillName: pillName,
      mindset: mindsetBonus(),
    };
    Game.save && Game.save.write({ view: "breakthrough" });
    renderTribQuestion();
  }

  // 渲染天劫一题（用现有再认题型·突击检查）。
  function renderTribQuestion() {
    const bs = Game.state.activeBreak;
    if (!bs) return Game.hub.show("");
    if (bs.pos >= bs.queue.length) return settleTribulation();
    Game.setZone && Game.setZone("practice");
    const tally = BREAK_BASE + bs.correct * BREAK_PER_CORRECT + (bs.pillBonus || 0) + (bs.mindset || 0);
    mountEl().innerHTML =
      '<div class="cult-screen trib-screen">' +
      '  <div class="trib-head"><div class="wc-tag">天劫雷劫 · 突击检查</div>' +
      '    <div class="trib-meta"><span>第 ' + (bs.pos + 1) + ' / ' + bs.queue.length + ' 道</span>' +
      '    <span>已答对 ' + bs.correct + '</span><span>当前胜算 ' + Math.min(100, tally) + '%</span></div>' +
      (Game.dev && Game.dev.tribHtml ? Game.dev.tribHtml() : '') +
      '  </div>' +
      '  <div id="trib-card"></div>' +
      '</div>';
    Game.dev && Game.dev.bindTrib && Game.dev.bindTrib(mountEl());
    Game.wordcard.render(mountEl().querySelector("#trib-card"), bs.queue[bs.pos], { type: "recognize", autoContinue: true }, function (res) {
      if (res && res.correct) bs.correct += 1;
      bs.pos += 1;
      Game.save && Game.save.write({ view: "breakthrough" });
      setTimeout(renderTribQuestion, 420);
    });
  }

  // B6 结算：总胜算 roll → 成功升境 / 失败惩罚。
  function settleTribulation() {
    const bs = Game.state.activeBreak;
    if (!bs) return Game.hub.show("");
    const prob = Math.max(0, Math.min(100, BREAK_BASE + bs.correct * BREAK_PER_CORRECT + (bs.pillBonus || 0) + (bs.mindset || 0)));
    const win = (Math.random() * 100) < prob;
    Game.state.activeBreak = null;
    if (win) {
      const ev = Game.doBreakthrough && Game.doBreakthrough();
      Game.save && Game.save.write({ view: "hub" });
      Game.renderHeader && Game.renderHeader();
      if (Game.logEvent && ev) Game.logEvent("⚡ 突破 · " + ev.from + " → " + ev.to);
      if (ev) return showBreakthroughs([ev], 0, "天劫已渡，" + ev.to + "已成。", Game.isRealmWallReady && Game.isRealmWallReady());
      return Game.hub.show("天劫已渡，境界已稳。");
    }
    const fail = Game.breakthroughFail && Game.breakthroughFail();
    Game.save && Game.save.write({ view: "hub" });
    Game.renderHeader && Game.renderHeader();
    if (Game.logEvent) Game.logEvent("☍ 破境失败 · 雷劫反噬，折言气" + (fail ? " " + fail.expLoss : "") + (fail && fail.lifeLoss ? "、折寿 " + fail.lifeLoss + " 月" : ""));
    showBreakFail(prob, fail);
  }

  function showBreakFail(prob, fail) {
    if (fail && fail.dead && Game.life && Game.life.showDeath) return Game.life.showDeath();
    Game.setZone && Game.setZone("practice");
    mountEl().innerHTML =
      '<div class="cult-screen">' +
      '  <div class="realm-wall-card">' +
      '    <div class="wc-tag">天劫 · 反噬</div>' +
      '    <h2>这一劫，没能渡过</h2>' +
      '    <p>雷光自识海炸开，未稳的根基被生生震退。沈砚跪伏在地，咳出一口浊气——破境之机，终究差了那一线。</p>' +
      '    <div class="wall-locks">' +
      '      <div><b>折损言气</b><span>本次胜算 ' + Math.round(prob) + '%，雷劫反噬耗去言气' + (fail ? ' ' + fail.expLoss : '') + '。</span></div>' +
      '      <div><b>轻微折寿</b><span>强渡天劫伤及本源，折寿' + (fail && fail.lifeLoss ? ' ' + fail.lifeLoss + ' 个月' : '若干') + '；但未掉属性，可再攒言气重来。</span></div>' +
      '    </div>' +
      '    <p class="dim small">多背熟些真言、备好突破丹再来——临劫答得越多、心境越定，胜算越高。</p>' +
      '    <button class="btn btn-gold" id="break-fail-back">回主页，再图破境</button>' +
      '  </div>' +
      '</div>';
    mountEl().querySelector("#break-fail-back").onclick = () => Game.hub.show("破境未成，且先稳住根基。");
  }

  // B8 刷新恢复：从存档态续上天劫。
  function restoreBreakthrough() {
    if (!Game.state.activeBreak || !Game.state.activeBreak.queue) return Game.hub.show("");
    renderTribQuestion();
  }

  function hasRealmWall(events) { return events.some((ev) => ev.type === "realm_wall"); }
  function breakthroughEvents(events) { return events.filter((ev) => ev.type === "breakthrough"); }
  function hasReadyToBreak(events) { return events.some((ev) => ev.type === "ready_to_break"); }

  function showBreakthroughs(events, idx, message, wallAfter) {
    if (idx >= events.length) return showAllocateAfterBreak(message, wallAfter);
    const ev = events[idx];
    mountEl().innerHTML = '<div class="story-page"><div id="trib-mount"></div></div>';
    Game.visual.thunderTribulation(mountEl().querySelector("#trib-mount"), ev.from, ev.to, function () {
      // 破境回声庆祝(P-29)，点掉或自散后继续下一次突破
      const next = function () {
        if (Game.modal && Game.modal.event) {
          return Game.modal.event({
            tag: "破境",
            title: ev.to + "已成",
            body: "雷劫散去，识海中新开的经脉仍有余光。你可以分配新的根基点，把这一境界稳住。",
            closeText: "稳住根基"
          }, function () { showBreakthroughs(events, idx + 1, message, wallAfter); });
        }
        showBreakthroughs(events, idx + 1, message, wallAfter);
      };
      if (Game.visual.breakEcho) Game.visual.breakEcho("破 境 · " + ev.to, next);
      else next();
    });
  }

  function showSessionSummary(summary, events, message) {
    const mastered = summary.mastered.length ? summary.mastered.map(wordName).join(" / ") : "暂无";
    const streakNotes = summary.streakNotes.length ? summary.streakNotes.join(" / ") : "暂无";
    mountEl().innerHTML =
      '<div class="cult-screen">' +
      '  <div class="cult-summary">' +
      '    <div class="wc-tag">' + summary.prefix + '</div>' +
      '    <h2>本轮小结</h2>' +
      '    <div class="summary-grid">' +
      '      <div><b>' + summary.total + '</b><span>完成题数</span></div>' +
      '      <div><b>+' + summary.gained + '</b><span>获得言气</span></div>' +
      '      <div><b>' + (summary.easy + summary.known) + '</b><span>稳住</span></div>' +
      '      <div><b>' + (summary.hazy + summary.wrong) + '</b><span>需复习</span></div>' +
      '    </div>' +
      '    <div class="summary-grid">' +
      '      <div><b>' + (summary.kinds.new || 0) + '</b><span>新学</span></div>' +
      '      <div><b>' + (summary.kinds.review || 0) + '</b><span>旧词复习</span></div>' +
      '      <div><b>' + (summary.kinds.recall || 0) + '</b><span>即时复现</span></div>' +
      '      <div><b>' + (summary.kinds.retry || 0) + '</b><span>回炉</span></div>' +
      '    </div>' +
      '    <div class="summary-line"><span>秒懂</span><b>' + summary.easy + '</b><span>记得</span><b>' + summary.known + '</b><span>模糊</span><b>' + summary.hazy + '</b><span>错误</span><b>' + summary.wrong + '</b></div>' +
      '    <div class="summary-line"><span>最高连对</span><b>' + summary.bestStreak + '</b><span>连击提示</span><em>' + streakNotes + '</em></div>' +
      '    <div class="summary-line"><span>言气拆分</span><b>新学 +' + (summary.expByKind.new || 0) + '</b><span>复习 +' + (summary.expByKind.review || 0) + '</span><span>复现 +' + (summary.expByKind.recall || 0) + '</span><span>回炉 +' + (summary.expByKind.retry || 0) + '</span></div>' +
      '    <p class="dim small">本轮掌握：' + mastered + '</p>' +
      (hasRealmWall(events) ? '    <div class="realm-wall-note"><b>凝言圆满</b><span>言气已满，但第 4 境界需要外界灵脉与突破丹。</span></div>' : '') +
      (hasReadyToBreak(events) ? '    <div class="realm-wall-note"><b>言气已满</b><span>可引动天劫雷劫，主动突破到下一境界。</span></div>' : '') +
      '    <button class="btn btn-gold" id="summary-done">' + (hasReadyToBreak(events) ? "引天劫突破" : (hasRealmWall(events) ? "查看破境所缺" : "纳入月课")) + '</button>' +
      '  </div>' +
      '</div>';
    mountEl().querySelector("#summary-done").onclick = () => {
      if (hasReadyToBreak(events)) return startBreakthrough();
      if (hasRealmWall(events)) return showRealmWall(message);
      Game.hub.show(message);
    };
  }

  function showAllocateAfterBreak(message, wallAfter) {
    mountEl().innerHTML =
      '<div class="story-page">' +
      '  <div class="story-body"><p><b>雷劫已过。</b>天外真言沉入骨血，新的根基正在识海中凝形。</p></div>' +
      '  <div id="cult-alloc"></div>' +
      '</div>';
    Game.radar.allocateCard(mountEl().querySelector("#cult-alloc"), function () {
      if (wallAfter) return showRealmWall(message + " 雷劫已渡，境界已稳。");
      Game.hub.show(message + " 雷劫已渡，境界已稳。");
    });
  }

  function showRealmWall(message) {
    Game.normalizeState && Game.normalizeState();
    Game.setZone && Game.setZone("practice");
    Game.renderHeader && Game.renderHeader();
    mountEl().innerHTML =
      '<div class="cult-screen">' +
      '  <div class="realm-wall-card">' +
      '    <div class="wc-tag">境界墙 · 凝言圆满</div>' +
      '    <h2>门外有风，门内无路</h2>' +
      '    <p>沈砚的识海已经蓄满，天外言典的字影一枚枚沉进骨血。可当他再试着往前推一步，四周灵气却像一口干井，怎么也汲不出下一境所需的潮声。</p>' +
      '    <p>残魂低声道：“问言书院这点灵气，养到凝言，已是极限。再往上，要借真正的灵脉，或洞天福地。”</p>' +
      '    <div class="wall-locks">' +
      '      <div><b>缺外界灵脉</b><span>第 4 境界需要书院外的大灵脉承托。</span></div>' +
      '      <div><b>缺突破丹</b><span>丹方只在外面大城流传，书院坊市求不到。</span></div>' +
      '    </div>' +
      '    <p class="dim small">demo 封顶：凡身 → 启言境 → 凝言境。你仍可继续背词、探险、炼丹与积累材料；真正出世破境，将接后续完整内容。</p>' +
      '    <button class="btn btn-gold" id="wall-back">继续在书院积累</button>' +
      '  </div>' +
      '</div>';
    mountEl().querySelector("#wall-back").onclick = () => Game.hub.show(message || "凝言圆满：第 4 境界尚缺外界灵脉与突破丹。");
  }

  function showResumePrompt() {
    const draft = Game.state && Game.state.activeCultivation;
    if (!draft) return chooseSession();
    if (!draft.words || !draft.words.length) { clearSessionDraft(); return chooseSession(); }
    if (!draftBookOk(draft)) { // M2：词书失效→只允许放弃，避免「继续」后静默判错或死循环
      Game.setZone && Game.setZone("practice");
      Game.renderHeader && Game.renderHeader();
      mountEl().innerHTML =
        '<div class="cult-screen"><div class="wordcard">' +
        '<div class="wc-tag">闭关未竟</div><h2>词书已变，无法接续</h2>' +
        '<p class="dim small">上次闭关用的词书已不在书架上，这一轮无法继续。</p>' +
        '<div class="cult-exit-actions"><button class="btn btn-gold" id="cult-drop">放弃本次，回主页</button></div>' +
        '</div></div>';
      mountEl().querySelector("#cult-drop").onclick = abandonSession;
      return;
    }
    const done = Array.isArray(draft.results) ? draft.results.length : 0;
    const total = draft.total || (draft.words ? draft.words.length : 0);
    const gained = typeof draft.gained === "number" ? draft.gained : 0;
    Game.setZone && Game.setZone("practice");
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "cultivate_resume" });
    mountEl().innerHTML =
      '<div class="cult-screen">' +
      '  <div class="wordcard">' +
      '    <div class="wc-tag">闭关未竟</div>' +
      '    <h2>上次修炼尚未收束</h2>' +
      '    <p class="dim small">已完成 ' + done + ' / ' + total + ' 题，待结算言气 +' + gained + '。</p>' +
      '    <div class="cult-exit-actions">' +
      '      <button class="btn btn-gold" id="cult-resume">继续闭关</button>' +
      '      <button class="btn" id="cult-settle-saved"' + (done ? "" : " disabled") + '>结算已完成</button>' +
      '      <button class="btn btn-mini" id="cult-abandon-saved">放弃本次</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    mountEl().querySelector("#cult-resume").onclick = () => {
      if (!restoreDraft()) return chooseSession();
      saveSessionDraft("cultivate");
      renderNext();
    };
    const settle = mountEl().querySelector("#cult-settle-saved");
    if (settle) settle.onclick = () => {
      if (!restoreDraft()) return chooseSession();
      settleSession("接续旧课结算");
    };
    mountEl().querySelector("#cult-abandon-saved").onclick = abandonSession;
  }

  function handleEscape() {
    const m = mountEl();
    if (!m) return false;
    if (Game.state && Game.state.activeBreak) {
      Game.visual && Game.visual.toast && Game.visual.toast("天劫雷劫中，不能直接退出。", "rose");
      return true;
    }
    if (m.querySelector("#cult-continue")) {
      renderNext();
      return true;
    }
    if (session) {
      showExitConfirm();
      return true;
    }
    if (m.querySelector(".cult-screen")) {
      Game.save && Game.save.write({ view: "hub" });
      Game.hub && Game.hub.show("");
      return true;
    }
    return false;
  }

  Game.cultivate = { chooseSession, showResumePrompt, reviewLimit, showRealmWall, startBreakthrough, restoreBreakthrough, handleEscape };
  Game.notifyAutoMark = notifyAutoMark; // P-AUTOMARK：供言田切书复用
})(window.Game = window.Game || {});
