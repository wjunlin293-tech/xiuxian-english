/* ───────────────────────────────────────────────────────────────
 * yantian.js · 言田词书 + 神田成就（翻阅 / 标熟 / 成就陈列）
 * 标熟只用于跳过已会词；真实复习答对前不计入 vocabMastery 战力。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const PAGE_SIZE = 40;
  const view = { bookId: "", filter: "all", query: "", page: 0 };
  const gardenView = { query: "", filter: "all", page: 0 };
  const revealedMeanings = {};
  const pendingMark = {}; // P-31 标熟倒计时：{ "bookId::KEY": {secs,timer,interval,bid} } 3秒后入神田·期间可取消
  function pmToken(key) { return view.bookId + "::" + key; }

  function mountEl() { return document.getElementById("stage"); }
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function book() { return Game.wordBookById ? Game.wordBookById(view.bookId) : (Game.WORD_BOOKS && Game.WORD_BOOKS[view.bookId]); }
  function masteredKey(key) {
    const st = Game.peekWordStat ? Game.peekWordStat(view.bookId, key) : null;
    const rows = Game.favoriteRows ? Game.favoriteRows() : [];
    const row = view.bookId === (Game.FAVORITE_BOOK_ID || "favorites") ? rows.find((r) => r.wordKey === key) : null;
    return (row ? row.bookId : view.bookId) + "::" + key;
  }
  function statOf(key) { return Game.peekWordStat ? Game.peekWordStat(view.bookId, key) : null; }
  function wordIpa(w) {
    return w.ipa || (Game.IPA_MAP && (Game.IPA_MAP[String(w.word || "").toLowerCase()] || Game.IPA_MAP[w.word])) || "";
  }
  function meaning(w) { return w.mainMeaning || w.cn || ""; }
  function meaningToken(key) { return view.bookId + "::" + key; }
  function frequencyBadge(key) {
    const info = Game.wordFrequencyInfo && Game.wordFrequencyInfo(view.bookId, key);
    if (!info) return "";
    return '<span class="freq-badge yt-freq freq-' + info.tier + (info.estimated ? ' freq-est' : '') + '" title="' + esc(info.detail) + '">' + esc(info.badge) + '</span>';
  }
  function stageOf(key) {
    const st = statOf(key);
    if (st && st.markedKnown) return { id: "marked", name: "已标熟" };
    if ((Game.isMemorized && Game.isMemorized(key, view.bookId)) || Game.state.mastered[masteredKey(key)] || (st && st.mastery >= 5)) return { id: "mastered", name: "已掌握" };
    const stage = Game.deriveStage ? Game.deriveStage(st) : 0;
    if (stage === 2) return { id: "learning", name: "巩固" };
    if (stage === 1) return { id: "learning", name: "认识" };
    return { id: "unseen", name: "未学" };
  }
  function bookProgress(id) {
    const b = Game.wordBookById ? Game.wordBookById(id) : Game.WORD_BOOKS[id];
    if (!b) return { count: 0, total: 0 };
    const keys = Object.keys(b.words || {});
    // 与 state.isMemorized 统一口径（含 mem≥阈值的真正记忆词）。
    const count = keys.filter((key) => Game.isMemorized
      ? Game.isMemorized(key, id)
      : (!!Game.state.mastered[id + "::" + key] || (function () { const st = Game.peekWordStat ? Game.peekWordStat(id, key) : null; return !!(st && (st.markedKnown || st.mastery >= 5)); })())
    ).length;
    return { count: count, total: keys.length };
  }
  function filteredRows() {
    const b = book();
    if (!b) return [];
    const q = view.query.trim().toLowerCase();
    return Object.keys(b.words || {}).filter((key) => {
      const w = b.words[key];
      const stage = stageOf(key);
      if (view.filter === "unseen" && stage.id !== "unseen") return false;
      if (view.filter === "learning" && stage.id !== "learning") return false;
      if (view.filter === "mastered" && stage.id !== "mastered" && stage.id !== "marked") return false;
      if (!q) return true;
      return [w.word, w.pos, w.cn, w.mainMeaning].some((value) => String(value || "").toLowerCase().indexOf(q) >= 0);
    });
  }

  function bookEntries() {
    const entries = Object.keys(Game.WORD_BOOKS || {}).map((id) => ({ id: id, book: Game.WORD_BOOKS[id] }));
    if (Game.favoriteBook) entries.push({ id: Game.FAVORITE_BOOK_ID || "favorites", book: Game.favoriteBook() });
    return entries;
  }

  function allMasteredWords() {
    // P-AUTOMARK：按拼写(key)去重——同一个词跨多本书只显示一条，
    // 优先归到"真·修炼掌握"(非标熟)的那本书，避免自动标熟产生重复词条。
    const byKey = {};
    Object.keys(Game.WORD_BOOKS || {}).forEach((bookId) => {
      const b = Game.WORD_BOOKS[bookId];
      Object.keys(b.words || {}).forEach((key) => {
        const st = Game.peekWordStat ? Game.peekWordStat(bookId, key) : null;
        const memo = Game.isMemorized ? Game.isMemorized(key, bookId)
          : (!!Game.state.mastered[bookId + "::" + key] || !!(st && (st.markedKnown || st.mastery >= 5)));
        if (!memo) return;
        const row = {
          bookId: bookId,
          bookName: b.name,
          key: key,
          word: b.words[key],
          marked: !!(st && st.markedKnown),
          mastery: st ? (st.mastery || 0) : 5,
          seen: st ? (st.seen || 0) : 1,
          correct: st ? (st.correct || 0) : 0,
          wrong: st ? (st.wrong || 0) : 0,
        };
        const prev = byKey[key];
        // 优先保留"修炼掌握"(!marked)；若都标熟或都掌握，保留先出现的。
        if (!prev || (prev.marked && !row.marked)) byKey[key] = row;
      });
    });
    const rows = Object.keys(byKey).map((k) => byKey[k]);
    return rows.sort((a, b) => {
      if (a.bookName !== b.bookName) return String(a.bookName).localeCompare(String(b.bookName), "zh-Hans-CN");
      return String(a.word.word || "").localeCompare(String(b.word.word || ""));
    });
  }

  function ghostMemoryWords(masteredByKey) {
    const rows = [];
    const seen = {};
    (Game.state.ghostQueue || []).forEach((ghost) => {
      const bookId = ghost && ghost.bookId;
      const key = ghost && ghost.wordKey;
      const b = Game.WORD_BOOKS && Game.WORD_BOOKS[bookId];
      const w = b && b.words && b.words[key];
      if (!bookId || !key || !w || masteredByKey[key] || seen[key]) return;
      seen[key] = true;
      rows.push({
        bookId: bookId,
        bookName: b.name,
        key: key,
        word: w,
        marked: false,
        memory: true,
        mastery: 0,
        seen: 0,
        correct: 0,
        wrong: 0,
      });
    });
    return rows;
  }

  function gardenRows() {
    const mastered = allMasteredWords();
    const masteredByKey = {};
    mastered.forEach((row) => { masteredByKey[row.key] = true; });
    return mastered.concat(ghostMemoryWords(masteredByKey)).sort((a, b) => {
      if (!!a.memory !== !!b.memory) return a.memory ? 1 : -1;
      if (a.bookName !== b.bookName) return String(a.bookName).localeCompare(String(b.bookName), "zh-Hans-CN");
      return String(a.word.word || "").localeCompare(String(b.word.word || ""));
    });
  }

  function gardenStats() {
    const words = gardenRows();
    const marked = words.filter((row) => row.marked).length;
    const memory = words.filter((row) => row.memory).length;
    const reviewed = words.length - marked - memory;
    const bookMap = {};
    words.forEach((row) => {
      if (!bookMap[row.bookId]) bookMap[row.bookId] = { id: row.bookId, name: row.bookName, count: 0, marked: 0, reviewed: 0, memory: 0 };
      bookMap[row.bookId].count += 1;
      if (row.memory) bookMap[row.bookId].memory += 1;
      else if (row.marked) bookMap[row.bookId].marked += 1;
      else bookMap[row.bookId].reviewed += 1;
    });
    return { words: words, total: words.length, marked: marked, reviewed: reviewed, memory: memory, books: Object.keys(bookMap).map((id) => bookMap[id]) };
  }

  function gardenTitle(total) {
    const levels = [
      { n: 0, name: "空田未垦", desc: "第一粒言种还未落下。" },
      { n: 1, name: "一言入田", desc: "第一枚词种已在神田发芽。" },
      { n: 10, name: "十言成畦", desc: "言田初成畦垄，已有可观痕迹。" },
      { n: 50, name: "百露将凝", desc: "词露连成一片，神田开始有光。" },
      { n: 100, name: "百言成圃", desc: "百言入田，识海已成小圃。" },
      { n: 300, name: "三百言林", desc: "词木成林，翻阅时已有风声。" },
      { n: 650, name: "言田丰岁", desc: "一册重路已能撑起丰年。" },
      { n: 1000, name: "千言神田", desc: "千言归田，识海自有星河。" },
    ];
    let current = levels[0];
    let next = null;
    levels.forEach((lv) => {
      if (total >= lv.n) current = lv;
      else if (!next) next = lv;
    });
    const target = next ? next.n : current.n;
    const base = current.n;
    const pct = next ? Math.max(0, Math.min(100, Math.round((total - base) / Math.max(1, target - base) * 100))) : 100;
    return { current: current, next: next, pct: pct };
  }

  function achievementGroups(items) {
    return [
      { title: "修行", items: items.filter((item) => item.group === "修行") },
      { title: "世事", items: items.filter((item) => item.group === "世事") },
      { title: "收集", items: items.filter((item) => item.group === "收集") },
    ].filter((group) => group.items.length);
  }

  function gameAchievements() {
    const s = Game.state;
    const flags = s.flags || {};
    const storyDone = Object.keys((s.flags && s.flags.storyDone) || {}).length;
    const gathered = Object.keys(s.bag || {}).some((key) => Number(s.bag[key]) > 0);
    const clearDifficulty = flags.vowClearDifficulty || flags.startDifficulty || (s.settings && s.settings.difficulty) || "normal";
    const vowWon = !!flags.vowBossDone;
    return [
      { group: "修行", icon: "卷", name: "言典初鸣", desc: "收录第一个背过的单词", done: allMasteredWords().length >= 1 },
      { group: "修行", icon: "境", name: "启言破境", desc: "踏入启言境", done: s.realmIndex >= 1 },
      { group: "修行", icon: "凝", name: "凝言有成", desc: "踏入凝言境", done: s.realmIndex >= 2 },
      { group: "世事", icon: "章", name: "世事留痕", desc: "完成一个剧情节点", done: storyDone >= 1 },
      { group: "世事", icon: "誓", name: "三年之约", desc: "完成三年之约的最终挑战", done: !!(s.flags && s.flags.vowBossDone) },
      { group: "世事", icon: "易", name: "简单过关", desc: "在简单难度胜过三年之约", done: vowWon && clearDifficulty === "easy" },
      { group: "世事", icon: "正", name: "普通过关", desc: "在普通难度胜过三年之约", done: vowWon && clearDifficulty === "normal" },
      { group: "世事", icon: "难", name: "困难过关", desc: "在困难难度胜过三年之约", done: vowWon && clearDifficulty === "hard" },
      { group: "收集", icon: "野", name: "山野有获", desc: "探险并带回第一份材料", done: gathered },
      { group: "收集", icon: "器", name: "百炼成器", desc: "制成第一件装备", done: Object.keys(s.gear || {}).length >= 1 },
      { group: "收集", icon: "果", name: "异果有缘", desc: "收录第一枚言典异果", done: Object.keys(s.yiguo || {}).length >= 1 }
    ];
  }

  function renderGardenWords() {
    const list = mountEl().querySelector("#sg-word-list");
    if (!list) return;
    const q = gardenView.query.trim().toLowerCase();
    const rows = gardenRows().filter((row) => {
      if (gardenView.filter === "marked" && !row.marked) return false;
      if (gardenView.filter === "reviewed" && (row.marked || row.memory)) return false;
      if (gardenView.filter === "memory" && !row.memory) return false;
      if (gardenView.filter !== "memory" && gardenView.filter !== "all" && row.memory) return false;
      return !q || [row.word.word, meaning(row.word), row.bookName]
        .some((value) => String(value || "").toLowerCase().indexOf(q) >= 0);
    });
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    gardenView.page = Math.max(0, Math.min(gardenView.page, pages - 1));
    const pageRows = rows.slice(gardenView.page * PAGE_SIZE, (gardenView.page + 1) * PAGE_SIZE);
    list.innerHTML = '<div class="sg-word-head"><span>已收录 <b>' + rows.length + '</b> 词 · 第 ' + (gardenView.page + 1) + '/' + pages + ' 页</span></div>' +
      '<div class="sg-word-grid">' + pageRows.map((row) =>
        '<article class="sg-word' + (row.memory ? ' sg-word-memory' : '') + '"><div><b>' + esc(row.word.word) + '</b>' + (wordIpa(row.word) ? '<em>' + esc(wordIpa(row.word)) + '</em>' : '') + '</div>' +
        '<p>' + esc(meaning(row.word)) + '</p><footer><span>' + esc(row.bookName) + '</span><i>' + (row.memory ? '前世记忆' : (row.marked ? '已标熟' : '修炼掌握')) + '</i></footer></article>'
      ).join('') + (pageRows.length ? '' : '<div class="empty-line">还没有符合筛选的单词。去言田标熟、修炼掌握，或等待前世鬼魂显影。</div>') + '</div>' +
      '<div class="yt-pages"><button class="btn btn-mini" id="sg-prev"' + (gardenView.page ? '' : ' disabled') + '>上一页</button>' +
      '<button class="btn btn-mini" id="sg-next"' + (gardenView.page + 1 < pages ? '' : ' disabled') + '>下一页</button></div>';
    const prev = list.querySelector("#sg-prev");
    const next = list.querySelector("#sg-next");
    if (prev) prev.onclick = () => { gardenView.page -= 1; renderGardenWords(); };
    if (next) next.onclick = () => { gardenView.page += 1; renderGardenWords(); };
  }

  // P-INSIGHT：学习足迹（本机统计·可导出给开发者做产品改进）
  function insightSection() {
    if (!Game.insight) return "";
    const d = Game.insight.summary();
    const acc = d.accuracy === null ? "—" : d.accuracy + "%";
    return '<section class="sg-section"><div class="sg-title"><div><span>四</span><h3>学习足迹</h3></div>' +
      '<b>' + d.daysActive + ' 天在修行</b></div>' +
      '<div class="sg-field-stats">' +
      '  <b>' + d.newWords + '</b><span>初见真言</span>' +
      '  <b>' + d.reviews + '</b><span>到期温故</span>' +
      '  <b>' + acc + '</b><span>答对率</span>' +
      '  <b>' + d.studySessions + '</b><span>闭关次数</span>' +
      '</div>' +
      '<p class="dim small">这些数字只存在你自己的设备上，不会上传。若你愿意帮助改进这个应用，' +
      '可以导出一段匿名摘要发给作者——内容你点开就能看见，不含姓名、邮箱或任何可识别身份的信息。</p>' +
      '<div class="sg-tools"><button class="btn btn-mini" id="sg-insight-export">导出匿名摘要</button></div>' +
      '<textarea id="sg-insight-box" readonly style="display:none;width:100%;min-height:96px;margin-top:8px;' +
      'font-size:12px;line-height:1.5;padding:8px;border-radius:8px;"></textarea></section>';
  }

  function bindInsight() {
    const btn = mountEl().querySelector("#sg-insight-export");
    if (!btn || !Game.insight) return;
    btn.onclick = () => {
      const box = mountEl().querySelector("#sg-insight-box");
      box.value = Game.insight.exportText();
      box.style.display = "block";
      box.focus();
      box.select();
      try { document.execCommand("copy"); btn.textContent = "已复制到剪贴板"; }
      catch (e) { btn.textContent = "已展开，请手动复制"; }
    };
  }

  function showGarden() {
    Game.normalizeState && Game.normalizeState();
    Game.setZone && Game.setZone("shentian");
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "shentian" });
    const achievements = gameAchievements();
    const unlocked = achievements.filter((item) => item.done).length;
    const stats = gardenStats();
    const title = gardenTitle(stats.total);
    const groups = achievementGroups(achievements);
    mountEl().innerHTML = '<div class="cult-screen sg-screen">' +
      '<button class="btn btn-mini zone-back" id="sg-back">退出</button>' +
      '<div class="sg-hero"><div><div class="wc-tag">神田 · 成就</div><h2>修行留下的每一道光</h2>' +
      '<p class="dim small">神田只作成就陈列，不影响战力。标熟、真正掌握和前世未尽记忆都会分区收录于此。</p></div>' +
      '<button class="btn btn-mini" id="sg-books">前往言田词书</button></div>' +
      '<section class="sg-field">' +
      '  <div class="sg-field-main"><span>当前称号</span><h3>' + esc(title.current.name) + '</h3><p>' + esc(title.current.desc) + '</p></div>' +
      '  <div class="sg-field-stats">' +
      '    <b>' + stats.total + '</b><span>入田词</span>' +
      '    <b>' + stats.reviewed + '</b><span>修炼掌握</span>' +
      '    <b>' + stats.marked + '</b><span>标熟入田</span>' +
      '    <b>' + stats.memory + '</b><span>前世记忆</span>' +
      '  </div>' +
      '  <div class="sg-growth"><div><span>' + (title.next ? '距「' + esc(title.next.name) + '」还差 ' + Math.max(0, title.next.n - stats.total) + ' 词' : '神田已臻当前上限') + '</span><b>' + title.pct + '%</b></div><i style="width:' + title.pct + '%"></i></div>' +
      '</section>' +
      '<section class="sg-section"><div class="sg-title"><div><span>一</span><h3>游戏成就</h3></div><b>' + unlocked + ' / ' + achievements.length + ' 已点亮</b></div>' +
      '<div class="sg-achievement-groups">' + groups.map((group) => '<div class="sg-achievement-group"><h4>' + esc(group.title) + '</h4><div class="sg-achievements">' + group.items.map((item) => '<article class="sg-achievement' + (item.done ? ' done' : '') + '">' +
      '<i>' + item.icon + '</i><div><b>' + item.name + '</b><p>' + item.desc + '</p></div><span>' + (item.done ? '已点亮' : '未达成') + '</span></article>').join('') + '</div></div>').join('') + '</div></section>' +
      '<section class="sg-section sg-memory-panel"><div class="sg-title"><div><span>二</span><h3>前世记忆</h3></div><b>' + stats.memory + ' 缕未尽</b></div>' +
      '<p class="dim small">' + (stats.memory ? '前世尚未稳固的词会以鬼魂残响留在这里。重新复习答对后，它们会按本世当前境界结算言气，并从残响中散去。' : '暂无前世鬼魂残响；若转世时仍有未稳固词，它们会在这里显影。') + '</p></section>' +
      '<section class="sg-section"><div class="sg-title"><div><span>三</span><h3>背过的单词</h3></div><b>' + stats.total + ' 词已入田</b></div>' +
      '<div class="sg-book-stats">' + (stats.books.length ? stats.books.map((item) => '<span><b>' + esc(item.name) + '</b><i>' + item.count + ' 词</i></span>').join('') : '<span><b>暂无词书收录</b><i>去言田标熟或修炼掌握</i></span>') + '</div>' +
      '<div class="sg-tools"><input id="sg-search" type="search" placeholder="搜索单词、释义或词书" value="' + esc(gardenView.query) + '">' +
      '<div class="sg-filters">' + [["all","全部"],["reviewed","修炼掌握"],["marked","标熟入田"],["memory","前世记忆"]].map((f) =>
        '<button class="btn btn-mini sg-filter' + (gardenView.filter === f[0] ? " active" : "") + '" data-filter="' + f[0] + '">' + f[1] + '</button>').join("") + '</div></div>' +
      '<div id="sg-word-list"></div></section>' +
      insightSection() + '</div>';
    mountEl().querySelector("#sg-back").onclick = () => Game.cultivate.chooseSession();
    mountEl().querySelector("#sg-books").onclick = () => show(Game.state.vocabBookId);
    const search = mountEl().querySelector("#sg-search");
    search.oninput = () => { gardenView.query = search.value; gardenView.page = 0; renderGardenWords(); };
    mountEl().querySelectorAll(".sg-filter").forEach((btn) => {
      btn.onclick = () => { gardenView.filter = btn.dataset.filter; gardenView.page = 0; renderGardenWords(); };
    });
    renderGardenWords();
    bindInsight();
    if (Game.modal && Game.modal.firstTime) {
      Game.modal.firstTime("shentian_intro", {
        tag: "神田初开",
        title: "背过的词，会在这里长成光",
        body: "神田是成就栏，不直接增加战力。游戏成就和背过的单词会分区陈列；标熟词会入田，真正复习答对才计入掌握收益。"
      });
    }
  }

  function renderRows() {
    const list = mountEl().querySelector("#yt-list");
    if (!list) return;
    const progress = bookProgress(view.bookId);
    const progressEl = mountEl().querySelector('.yt-book[data-book="' + view.bookId + '"] span');
    if (progressEl) progressEl.textContent = progress.count + " / " + progress.total + " 已掌握";
    const rows = filteredRows();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    view.page = Math.max(0, Math.min(view.page, pages - 1));
    const pageRows = rows.slice(view.page * PAGE_SIZE, (view.page + 1) * PAGE_SIZE);
    const cards = pageRows.map((key) => {
      const w = book().words[key];
      const stage = stageOf(key);
      const favored = Game.isFavorite && Game.isFavorite(view.bookId, key);
      const revealed = !!revealedMeanings[meaningToken(key)];
      const canMark = stage.id !== "mastered";
      const pend = pendingMark[pmToken(key)];
      const button = pend
        ? '<button class="btn btn-mini yt-cancelmark" data-key="' + esc(key) + '">入神田 ' + pend.secs + 's · 点取消</button>'
        : (stage.id === "marked"
          ? '<button class="btn btn-mini yt-unmark" data-key="' + esc(key) + '">取消标熟</button>'
          : (canMark ? '<button class="btn btn-mini yt-mark" data-key="' + esc(key) + '">标熟</button>' : '<span class="yt-settled">修炼已掌握</span>'));
      return '<article class="yt-word">' +
        '<div class="yt-word-main"><b>' + esc(w.word) + '</b><span>' + esc(w.pos || "") + '</span>' +
        (wordIpa(w) ? '<em>' + esc(wordIpa(w)) + '</em>' : '') +
        frequencyBadge(key) +
        '<button class="btn btn-mini yt-say" data-word="' + esc(w.word) + '" aria-label="朗读 ' + esc(w.word) + '">🔊</button></div>' +
        '<div class="yt-meaning-box' + (revealed ? ' revealed' : '') + '">' +
        '<div class="yt-meaning">' + esc(meaning(w)) + '</div>' +
        '<button class="yt-meaning-toggle" data-key="' + esc(key) + '" aria-expanded="' + (revealed ? 'true' : 'false') +
        '" aria-label="' + (revealed ? '隐藏释义 ' : '查看释义 ') + esc(w.word) + '">' + (revealed ? '隐藏释义' : '查看释义') + '</button></div>' +
        '<div class="yt-word-foot"><span class="yt-stage ' + stage.id + '">' + stage.name + '</span><span class="yt-word-actions">' +
        '<button class="btn btn-mini yt-fav' + (favored ? ' active' : '') + '" data-key="' + esc(key) + '">' + (favored ? '★ 已收藏' : '☆ 收藏') + '</button>' +
        button + '</span></div>' +
        '</article>';
    }).join("");
    const markable = pageRows.filter((key) => stageOf(key).id === "unseen");
    list.innerHTML =
      '<div class="yt-list-head"><span>找到 <b>' + rows.length + '</b> 词 · 第 ' + (view.page + 1) + '/' + pages + ' 页</span>' +
      '<button class="btn btn-mini" id="yt-mark-page"' + (markable.length ? "" : " disabled") + '>本页未学词全部标熟</button></div>' +
      '<div class="yt-words">' + (cards || '<div class="empty-line">没有符合条件的词。</div>') + '</div>' +
      '<div class="yt-pages"><button class="btn btn-mini" id="yt-prev"' + (view.page ? "" : " disabled") + '>上一页</button>' +
      '<button class="btn btn-mini" id="yt-next"' + (view.page + 1 < pages ? "" : " disabled") + '>下一页</button></div>';

    list.querySelectorAll(".yt-say").forEach((btn) => { btn.onclick = () => Game.wordcard && Game.wordcard.speak(btn.dataset.word); });
    list.querySelectorAll(".yt-meaning-toggle").forEach((btn) => {
      btn.onclick = () => {
        const token = meaningToken(btn.dataset.key);
        const revealed = !revealedMeanings[token];
        if (revealed) revealedMeanings[token] = true;
        else delete revealedMeanings[token];
        const box = btn.closest(".yt-meaning-box");
        if (box) box.classList.toggle("revealed", revealed);
        btn.textContent = revealed ? "隐藏释义" : "查看释义";
        btn.setAttribute("aria-expanded", revealed ? "true" : "false");
        const w = book().words[btn.dataset.key];
        btn.setAttribute("aria-label", (revealed ? "隐藏释义 " : "查看释义 ") + (w ? w.word : btn.dataset.key));
      };
    });
    list.querySelectorAll(".yt-mark").forEach((btn) => { btn.onclick = () => startPendingMark(btn.dataset.key); });
    list.querySelectorAll(".yt-cancelmark").forEach((btn) => { btn.onclick = () => cancelPendingMark(btn.dataset.key); });
    list.querySelectorAll(".yt-unmark").forEach((btn) => { btn.onclick = () => changeKnown(btn.dataset.key, false); });
    list.querySelectorAll(".yt-fav").forEach((btn) => {
      btn.onclick = () => {
        if (!Game.toggleFavorite) return;
        const was = Game.isFavorite && Game.isFavorite(view.bookId, btn.dataset.key);
        const changed = Game.toggleFavorite(view.bookId, btn.dataset.key);
        if (changed) {
          Game.save && Game.save.write({ view: "yantian" });
          Game.visual && Game.visual.toast(was ? "已移出收藏簿。" : "已收入收藏簿。", was ? "rose" : "gold");
          renderRows();
        }
      };
    });
    const markPage = list.querySelector("#yt-mark-page");
    if (markPage) markPage.onclick = () => {
      if (!markable.length) return;
      const apply = () => {
        markable.forEach((key) => Game.markKnown(view.bookId, key));
        Game.save && Game.save.write({ view: "yantian" });
        renderRows();
      };
      if (Game.modal && Game.modal.confirm) {
        return Game.modal.confirm({
          title: "本页全部标熟？",
          body: "将本页 " + markable.length + " 个未掌握词标为已会。标熟会移出新词轮换，但不会直接增加战力；之后可逐词取消。",
          confirmText: "全部标熟",
          cancelText: "取消"
        }, apply);
      }
      if (!confirm("将本页 " + markable.length + " 个未掌握词标为已会？可逐词取消。")) return;
      apply();
    };
    const prev = list.querySelector("#yt-prev");
    const next = list.querySelector("#yt-next");
    if (prev) prev.onclick = () => { view.page -= 1; renderRows(); mountEl().scrollIntoView({ behavior: "smooth" }); };
    if (next) next.onclick = () => { view.page += 1; renderRows(); mountEl().scrollIntoView({ behavior: "smooth" }); };
  }

  function changeKnown(key, mark) {
    const changed = mark ? Game.markKnown(view.bookId, key) : Game.unmarkKnown(view.bookId, key);
    if (!changed) return;
    Game.save && Game.save.write({ view: "yantian" });
    Game.visual && Game.visual.toast(mark ? "已标熟：之后不再当作新词派出。" : "已取消标熟：恢复原学习进度。", "gold");
    renderRows();
  }

  // P-31 标熟改 3 秒倒计时：点标熟→倒数 3 秒后真正入神田；3 秒内再点「点取消」撤销。
  function startPendingMark(key) {
    const tok = pmToken(key);
    if (pendingMark[tok]) return;
    const bid = view.bookId; // 锁定当前词书，期间切书也对应正确的书
    const p = { secs: 3, bid: bid };
    pendingMark[tok] = p;
    p.interval = setInterval(function () {
      p.secs -= 1;
      if (p.secs > 0) {
        const b = mountEl().querySelector('.yt-cancelmark[data-key="' + key + '"]');
        if (b) b.textContent = "入神田 " + p.secs + "s · 点取消";
      }
    }, 1000);
    p.timer = setTimeout(function () {
      clearInterval(p.interval);
      delete pendingMark[tok];
      const changed = Game.markKnown(bid, key);
      if (changed) {
        Game.save && Game.save.write({ view: "yantian" });
        Game.visual && Game.visual.toast("已标熟 · 移入神田。", "gold");
      }
      renderRows();
    }, 3000);
    renderRows(); // 立刻切到倒计时按钮
  }
  function cancelPendingMark(key) {
    const p = pendingMark[pmToken(key)];
    if (!p) return;
    clearTimeout(p.timer);
    clearInterval(p.interval);
    delete pendingMark[pmToken(key)];
    Game.visual && Game.visual.toast("已取消标熟。", "rose");
    renderRows();
  }

  function show(bookId) {
    Game.normalizeState && Game.normalizeState();
    if (bookId && (Game.wordBookById ? Game.wordBookById(bookId) : (Game.WORD_BOOKS && Game.WORD_BOOKS[bookId]))) view.bookId = bookId;
    if (!view.bookId || !(Game.wordBookById ? Game.wordBookById(view.bookId) : (Game.WORD_BOOKS && Game.WORD_BOOKS[view.bookId]))) {
      view.bookId = Game.state.vocabBookId || Object.keys(Game.WORD_BOOKS)[0];
    }
    const auto = Game.setVocabBook ? Game.setVocabBook(view.bookId) : 0; // P-AUTOMARK：返回自动标熟数（同步幂等，仅新出现的重叠才>0）
    Game.setZone && Game.setZone(null);
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "yantian" });
    const books = bookEntries().map((entry) => {
      const id = entry.id;
      const b = entry.book;
      const p = bookProgress(id);
      return '<button class="yt-book' + (id === view.bookId ? " active" : "") + '" data-book="' + esc(id) + '">' +
        '<b>' + esc(b.name) + '</b><span>' + p.count + ' / ' + p.total + ' 已掌握</span></button>';
    }).join("");
    mountEl().innerHTML =
      '<div class="cult-screen yt-screen">' +
      '<button class="btn btn-mini zone-back" id="yt-back">退出</button>' +
      '<div class="yt-head"><div><div class="wc-tag">言田 · 词书</div><h2>翻阅与标熟</h2>' +
      '<p class="dim small">释义默认遮挡，可逐词自由查看；会的词可直接标熟并移出新词轮换。标熟本身不增加战力，真实复习答对后才计入掌握加成。</p></div></div>' +
      '<div class="yt-books">' + books + '</div>' +
      '<div class="yt-tools"><input id="yt-search" type="search" placeholder="搜索单词或释义" value="' + esc(view.query) + '">' +
      '<div class="yt-filters">' + [["all","全部"],["unseen","未学"],["learning","学习中"],["mastered","已掌握"]].map((f) =>
        '<button class="btn btn-mini yt-filter' + (view.filter === f[0] ? " active" : "") + '" data-filter="' + f[0] + '">' + f[1] + '</button>').join("") + '</div></div>' +
      '<div id="yt-list"></div></div>';
    mountEl().querySelector("#yt-back").onclick = () => Game.cultivate.chooseSession();
    mountEl().querySelectorAll(".yt-book").forEach((btn) => { btn.onclick = () => { view.bookId = btn.dataset.book; view.page = 0; view.query = ""; show(view.bookId); }; });
    const search = mountEl().querySelector("#yt-search");
    search.oninput = () => { view.query = search.value; view.page = 0; renderRows(); };
    mountEl().querySelectorAll(".yt-filter").forEach((btn) => { btn.onclick = () => { view.filter = btn.dataset.filter; view.page = 0; show(view.bookId); }; });
    renderRows();
    Game.notifyAutoMark && Game.notifyAutoMark(auto, view.bookId); // P-AUTOMARK：本书有新自动标熟词才弹窗（幂等，filter/重渲不会重复）
  }

  Game.yantian = { show, showGarden };
})(window.Game = window.Game || {});
