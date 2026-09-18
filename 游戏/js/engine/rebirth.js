/* ───────────────────────────────────────────────────────────────
 * rebirth.js · P-REBIRTH / P-GHOST / P-ORIGIN
 * 死的是角色，不是玩家真实学过的词。跨存档 meta 保存学习记忆、轮回摘要与入世构筑记录。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const META_KEY = "xiuxian_rebirth_meta_v1";
  const MAX_GHOSTS = 80;
  const BASE_ORIGIN_POINTS = 6; // 第一世也有的“先天气运”点；转世记忆点在此基础上额外叠加。
  const MAX_ORIGIN_DEFECTS = 2;
  const TYPE_BASE = { recognize: 10, listen: 12, context: 14, spell: 16 };
  // 每项都同时承载开局效果和隐藏身份。flag 不在构筑页解释，供后续剧情安全地作加性 if 分支。
  const ORIGIN_TRAITS = [
    { id: "long_life", group: "体质", name: "长寿骨", cost: 3, effect: "寿元上限 +10年", flag: "originLongLife", desc: "天生比旁人多熬几十年。与天争寿，你起步就多攥了几把沙。" },
    { id: "jade_bone", group: "体质", name: "玉骨初成", cost: 3, effect: "血量 +10 / 防御 +2", flag: "originJadeBone", desc: "骨如温玉，皮肉也比常人结实三分。挨得住打，才走得远。" },
    { id: "iron_fist", group: "体质", name: "铁掌筋", cost: 3, effect: "力量 +5", flag: "originIronFist", desc: "掌骨粗粝，握住的东西不容易松开。" },
    { id: "clear_mind", group: "资质", name: "识海清明", cost: 4, effect: "神识 +6", flag: "originClearMind", desc: "识海生来澄澈，旁人看不见的东西，你看得见一线。" },
    { id: "early_mana", group: "资质", name: "法脉早开", cost: 4, effect: "法力 +8", flag: "originEarlyMana", desc: "法脉早于常人开窍，言气在四肢里淌得格外顺。" },
    { id: "review_boost", group: "悟性", name: "温故知新", cost: 5, effect: "复习/鬼魂经验 +10%", flag: "originReviewBoost", desc: "旧字重温，每每能咂出新味。前世记下的，这一世拾起来更快。" },
    { id: "quiet_reader", group: "悟性", name: "静读之心", cost: 2, effect: "后续静读相关机缘更易显现", flag: "originQuietReader", desc: "人声越杂，你越能在纸页间听见真正的声音。" },
    { id: "dream_listener", group: "悟性", name: "梦听者", cost: 3, effect: "后续梦境相关机缘更易显现", flag: "originDreamListener", desc: "睡去以后，仍有一些声音愿意对你说话。" },
    { id: "herb_child", group: "出身", name: "药童旧缘", cost: 3, effect: "凝露草 +2 / 月华露 +1", flag: "originHerbChild", desc: "前世曾在丹房打过下手，一身药性的眉眼，转世也没全忘。" },
    { id: "mountain_body", group: "出身", name: "山民筋骨", cost: 2, effect: "探险退避额外燃寿 -1月", flag: "originMountainBody", desc: "生在山里，攀崖涉涧是从小的活计。命硬，脚也稳。" },
    { id: "trader_kin", group: "出身", name: "行商旧识", cost: 2, effect: "开局灵石 +35", flag: "originTraderKin", desc: "你记得秤杆压手的分量，也记得谁的笑里藏着价钱。" },
    { id: "woodland_child", group: "出身", name: "林下长大", cost: 2, effect: "碎灵木 +2 / 低阶兽骨 +1", flag: "originWoodlandChild", desc: "林子里的每一条小路，你都比旁人多认得几分。" },
    { id: "ghost_guide", group: "机缘", name: "鬼魂引路", cost: 4, effect: "前世鬼魂提示更明显", flag: "originGhostGuide", desc: "前世的残念格外执着，早早就循着你的气味找了来。" },
    { id: "old_seal", group: "机缘", name: "旧印在身", cost: 3, effect: "后续遗物相关机缘更易显现", flag: "originOldSeal", desc: "掌心一枚淡印，连你自己也说不清从何而来。" },
    { id: "tiger_talisman", group: "机缘", name: "虎符残角", cost: 3, effect: "后续书院外来人相关机缘更易显现", flag: "originTigerTalisman", desc: "一角旧符藏在衣内，偶尔会在夜里微微发烫。" },
    { id: "wind_walker", group: "体质", name: "轻身旧习", cost: 2, effect: "后续险路相关机缘更易显现", flag: "originWindWalker", desc: "走在窄处时，你总能比旁人早半步找到落脚点。" },
    { id: "forge_spark", group: "资质", name: "炉火余温", cost: 3, effect: "寒铁屑 +2", flag: "originForgeSpark", desc: "你闻得出炉火里哪一瞬最适合落锤。" },
    { id: "scripture_legacy", group: "悟性", name: "残卷家学", cost: 4, effect: "后续残卷相关机缘更易显现", flag: "originScriptureLegacy", desc: "有些断句，你从未学过，却总觉得似曾相识。" },
    { id: "rain_shelter", group: "出身", name: "雨巷旧居", cost: 2, effect: "后续坊市夜雨相关机缘更易显现", flag: "originRainShelter", desc: "檐下避雨的日子，教会你辨认许多人的脚步。" },
    { id: "beast_friend", group: "出身", name: "驯兽旧缘", cost: 3, effect: "后续灵兽相关机缘更易显现", flag: "originBeastFriend", desc: "你靠近兽类时，它们很少第一时间露出牙。" },
    { id: "court_sense", group: "机缘", name: "识人之眼", cost: 3, effect: "后续人物试探相关机缘更易显现", flag: "originCourtSense", desc: "一句话落下，你常能听出旁人没说的半句。" },
    { id: "lantern_oath", group: "机缘", name: "灯下旧约", cost: 3, effect: "后续故人相关机缘更易显现", flag: "originLanternOath", desc: "曾有人在灯下同你约过一件事，而你还没想起是谁。" },
    { id: "hidden_map", group: "机缘", name: "山河残图", cost: 4, effect: "后续秘径相关机缘更易显现", flag: "originHiddenMap", desc: "一角残图压在记忆最深处，指向无人问津的岔路。" },
    { id: "vow_keeper", group: "缺陷", name: "守诺成执", cost: -2, effect: "后续誓约相关机缘更易显现", flag: "originVowKeeper", desc: "你答应过的事，总比旁人更难放下。" },
    { id: "echo_blood", group: "缺陷", name: "旧血回响", cost: -2, effect: "后续血脉相关机缘更易显现", flag: "originEchoBlood", desc: "夜深时，血里偶有不属于你的回声。" },
    { id: "short_life", group: "缺陷", name: "短寿之身", cost: -3, effect: "寿元上限 -10年", flag: "originShortLife", desc: "生来寿薄，大限比旁人催得急。" },
    { id: "old_wound", group: "缺陷", name: "旧伤未愈", cost: -2, effect: "血量 -8", flag: "originOldWound", desc: "前世那一刀太重，连转世都没敷好。" },
    { id: "heart_demon", group: "缺陷", name: "心魔易扰", cost: -2, effect: "鬼魂压迫感更强", flag: "originHeartDemon", desc: "记得太多，未必是福。" },
    { id: "debt_mark", group: "缺陷", name: "旧债缠身", cost: -2, effect: "后续坊市旧债事件可能出现", flag: "originDebtMark", desc: "有些账没有名字，却仍在暗处等你偿还。" },
    { id: "solitary_fate", group: "缺陷", name: "孤星照命", cost: -2, effect: "后续结伴相关机缘更难显现", flag: "originSolitaryFate", desc: "你走到人群里，别人也总会下意识给你让开一点位置。" },
  ];
  let originSelected = [];

  function mountEl() { return document.getElementById("stage"); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function clone(x) { return JSON.parse(JSON.stringify(x || null)); }
  function emptyMeta() {
    return {
      v: 1,
      totalMemoryPoints: 0,
      runs: 0,
      lifetimeStats: { maxRealmIndex: 0, totalMastered: 0, totalGhosts: 0 },
      learned: { mastered: {}, wordStats: {} },
      ghosts: [],
      lastOrigin: null,
      lastRun: null,
      updatedAt: 0,
    };
  }
  function readMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      const meta = raw ? JSON.parse(raw) : emptyMeta();
      return normalizeMeta(meta);
    } catch (e) { return emptyMeta(); }
  }
  function writeMeta(meta) {
    meta = normalizeMeta(meta);
    meta.updatedAt = Date.now();
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
    return meta;
  }
  function normalizeMeta(meta) {
    meta = meta && typeof meta === "object" ? meta : emptyMeta();
    if (!meta.learned) meta.learned = { mastered: {}, wordStats: {} };
    if (!meta.learned.mastered) meta.learned.mastered = {};
    if (!meta.learned.wordStats) meta.learned.wordStats = {};
    if (!Array.isArray(meta.ghosts)) meta.ghosts = [];
    if (!meta.lifetimeStats) meta.lifetimeStats = { maxRealmIndex: 0, totalMastered: 0, totalGhosts: 0 };
    if (typeof meta.totalMemoryPoints !== "number") meta.totalMemoryPoints = 0;
    if (typeof meta.runs !== "number") meta.runs = 0;
    return meta;
  }
  function traitById(id) {
    return ORIGIN_TRAITS.find((t) => t.id === id);
  }
  function hasOriginTrait(id) {
    const t = traitById(id);
    const flags = Game.state && Game.state.flags;
    return !!(t && flags && t.flag && flags[t.flag]);
  }
  function hasOriginFlag(flag) {
    return !!(Game.state && Game.state.flags && Game.state.flags[flag]);
  }
  function originBudgetInfo() {
    const meta = readMeta();
    const memory = Math.max(0, Math.floor(meta.totalMemoryPoints || 0));
    const base = BASE_ORIGIN_POINTS;
    return {
      base,
      memory,
      total: base + memory,
      hasMemory: memory > 0,
      runs: meta.runs || 0,
    };
  }
  function originBudget() {
    return originBudgetInfo().total;
  }
  function originTotals(ids) {
    const list = (ids || []).map(traitById).filter(Boolean);
    const spent = list.filter((t) => t.cost > 0).reduce((s, t) => s + t.cost, 0);
    const refunded = list.filter((t) => t.cost < 0).reduce((s, t) => s + Math.abs(t.cost), 0);
    const defects = list.filter((t) => t.cost < 0).length;
    const net = spent - refunded;
    const budgetInfo = originBudgetInfo();
    const budget = budgetInfo.total;
    return { budget, base: budgetInfo.base, memory: budgetInfo.memory, hasMemory: budgetInfo.hasMemory, spent, refunded, defects, maxDefects: MAX_ORIGIN_DEFECTS, net, left: budget - net, list };
  }
  function wordExists(bookId, wordKey) {
    return !!(Game.WORD_BOOKS && Game.WORD_BOOKS[bookId] && Game.WORD_BOOKS[bookId].words && Game.WORD_BOOKS[bookId].words[wordKey]);
  }
  function wordLabel(bookId, wordKey) {
    const w = Game.WORD_BOOKS && Game.WORD_BOOKS[bookId] && Game.WORD_BOOKS[bookId].words && Game.WORD_BOOKS[bookId].words[wordKey];
    return w ? w.word : wordKey;
  }
  function totalMasteredInState(st) {
    return Object.keys(st.mastered || {}).filter((k) => st.mastered[k]).length;
  }
  function mergeLearnedIntoMeta(meta, st) {
    Object.keys(st.mastered || {}).forEach((k) => { if (st.mastered[k]) meta.learned.mastered[k] = true; });
    Object.keys(st.wordStats || {}).forEach((bookId) => {
      meta.learned.wordStats[bookId] = meta.learned.wordStats[bookId] || {};
      Object.keys(st.wordStats[bookId] || {}).forEach((wordKey) => {
        const src = st.wordStats[bookId][wordKey];
        const old = meta.learned.wordStats[bookId][wordKey] || {};
        meta.learned.wordStats[bookId][wordKey] = {
          seen: Math.max(old.seen || 0, src.seen || 0),
          correct: Math.max(old.correct || 0, src.correct || 0),
          wrong: Math.max(old.wrong || 0, src.wrong || 0),
          mastery: Math.max(old.mastery || 0, src.mastery || 0),
          dueMonth: src.dueMonth || old.dueMonth,
          dueAt: Math.min(src.dueAt || Infinity, old.dueAt || Infinity) === Infinity ? (src.dueAt || old.dueAt) : Math.min(src.dueAt || Infinity, old.dueAt || Infinity),
          lastMode: src.lastMode || old.lastMode || "",
          lastMonth: Math.max(old.lastMonth || 0, src.lastMonth || 0),
          markedKnown: !!(old.markedKnown || src.markedKnown),
        };
      });
    });
  }
  function collectGhosts(st) {
    const now = Date.now();
    const rows = [];
    Object.keys(st.wordStats || {}).forEach((bookId) => {
      Object.keys(st.wordStats[bookId] || {}).forEach((wordKey) => {
        const stat = st.wordStats[bookId][wordKey];
        if (!stat || !stat.seen || !wordExists(bookId, wordKey)) return;
        const mastery = stat.mastery || 0;
        const due = (stat.dueAt || 0) <= now;
        const shaky = mastery < 5 || due || (stat.wrong || 0) > 0;
        if (!shaky) return;
        rows.push({
          id: bookId + "::" + wordKey,
          bookId,
          wordKey,
          word: wordLabel(bookId, wordKey),
          mastery,
          wrong: stat.wrong || 0,
          dueAt: stat.dueAt || 0,
          sourceRealmIndex: st.realmIndex || 0,
        });
      });
    });
    rows.sort((a, b) => {
      if (a.mastery !== b.mastery) return a.mastery - b.mastery;
      if (a.wrong !== b.wrong) return b.wrong - a.wrong;
      return (a.dueAt || 0) - (b.dueAt || 0);
    });
    return rows.slice(0, MAX_GHOSTS);
  }
  function mergeGhosts(meta, ghosts) {
    const byId = {};
    (meta.ghosts || []).concat(ghosts || []).forEach((g) => {
      if (!g || !g.id || !wordExists(g.bookId, g.wordKey)) return;
      const old = byId[g.id];
      if (!old || (g.mastery || 0) < (old.mastery || 0) || (g.wrong || 0) > (old.wrong || 0)) byId[g.id] = g;
    });
    meta.ghosts = Object.keys(byId).map((k) => byId[k]).slice(0, MAX_GHOSTS);
    return meta.ghosts;
  }
  // 记忆点＝本世真实进度的结算，不是"死一次就白给"。
  // baseMastered＝入世时从前世继承来的已掌握词（meta.learned.mastered），
  // 只有"这一世新掌握"的词才计分，防止"学一次→反复投胎白刷点数"。
  function memoryPointsFor(st, ghosts, baseMastered) {
    const total = totalMasteredInState(st);
    const inherited = baseMastered && typeof baseMastered === "object"
      ? Object.keys(st.mastered || {}).filter((k) => st.mastered[k] && baseMastered[k]).length
      : 0;
    const freshMastered = Math.max(0, total - inherited); // 仅本世新掌握
    const realm = st.realmIndex || 0;                     // 境界每世归零，是本世真进度
    let points = Math.floor(freshMastered / 20) + realm * 5;
    if (st.flags && st.flags.vowBossDone) points += 5;
    if (st.flags && st.flags.endingSeen) points += 3;
    points += Math.min(6, Math.floor((ghosts || []).length / 12));
    return Math.max(0, points); // 白活一世＝0 点（原 Math.max(1,…) 会给保底 1 点＝可刷）
  }
  function prepareFromDeath() {
    Game.normalizeState && Game.normalizeState();
    const st = Game.state;
    let meta = readMeta();
    if (st.lifeDeathInfo && st.lifeDeathInfo.rebirthClaimed) return meta;
    const ghosts = collectGhosts(st);
    // meta 此刻尚未合并本世 → meta.learned.mastered＝入世时的继承基线，用于剔除继承词、只计本世新掌握。
    const earned = memoryPointsFor(st, ghosts, (meta.learned && meta.learned.mastered) || {});
    mergeLearnedIntoMeta(meta, st);
    mergeGhosts(meta, ghosts);
    meta.runs += 1;
    meta.totalMemoryPoints += earned;
    meta.lifetimeStats.maxRealmIndex = Math.max(meta.lifetimeStats.maxRealmIndex || 0, st.realmIndex || 0);
    meta.lifetimeStats.totalMastered = Math.max(meta.lifetimeStats.totalMastered || 0, totalMasteredInState(st));
    meta.lifetimeStats.totalGhosts = Math.max(meta.lifetimeStats.totalGhosts || 0, meta.ghosts.length);
    meta.lastRun = {
      earned,
      ghosts: ghosts.length,
      realmIndex: st.realmIndex || 0,
      realm: Game.realmName ? Game.realmName() : "",
      mastered: totalMasteredInState(st),
      diedAt: st.time ? clone(st.time) : { year: 1, month: 1 },
      createdAt: Date.now(),
    };
    if (st.lifeDeathInfo) st.lifeDeathInfo.rebirthClaimed = true;
    st.rebirth = { pending: true, memoryPoints: meta.totalMemoryPoints, lastEarned: earned, ghostCount: meta.ghosts.length };
    st.ghostQueue = clone(meta.ghosts) || [];
    writeMeta(meta);
    Game.save && Game.save.write({ view: "life_death" });
    return meta;
  }
  function applyGlobalMemoryToState() {
    const meta = readMeta();
    Game.normalizeState && Game.normalizeState();
    const st = Game.state;
    Object.keys(meta.learned.mastered || {}).forEach((k) => { if (meta.learned.mastered[k]) st.mastered[k] = true; });
    Object.keys(meta.learned.wordStats || {}).forEach((bookId) => {
      st.wordStats[bookId] = st.wordStats[bookId] || {};
      Object.keys(meta.learned.wordStats[bookId] || {}).forEach((wordKey) => {
        st.wordStats[bookId][wordKey] = clone(meta.learned.wordStats[bookId][wordKey]);
      });
    });
    st.ghostQueue = clone(meta.ghosts) || [];
    if (meta.totalMemoryPoints > 0) {
      st.rebirth = {
        memoryPoints: meta.totalMemoryPoints,
        runs: meta.runs || 0,
        ghostCount: st.ghostQueue.length,
        inheritedAt: Date.now(),
      };
      st.flags = st.flags || {};
      st.flags.rebirthMemoryInherited = true;
    }
    Game.normalizeState && Game.normalizeState();
    return meta;
  }
  function showMemory() {
    const meta = prepareFromDeath();
    const last = meta.lastRun || {};
    Game.setZone && Game.setZone("dream");
    Game.renderHeader && Game.renderHeader();
    const el = mountEl();
    el.innerHTML =
      '<div class="life-death-screen rebirth-screen">' +
      '  <div class="wc-tag">转世记忆 · 入世前</div>' +
      '  <h2>灰烬里未散的音节</h2>' +
      '  <p>黑暗里，有些字没有沉下去。它们围着你，像前世残灯，也像下一世的路标。</p>' +
      '  <div class="life-stats">' +
      '    <div><b>+' + (last.earned || 0) + '</b><span>本世记忆点</span></div>' +
      '    <div><b>' + (meta.totalMemoryPoints || 0) + '</b><span>总记忆点</span></div>' +
      '    <div><b>' + (last.mastered || 0) + '</b><span>本世掌握词</span></div>' +
      '    <div><b>' + (meta.ghosts || []).length + '</b><span>前世鬼魂</span></div>' +
      '  </div>' +
      '  <p class="dim small">已学/已掌握的词会随转世保留，不会重新变成新词；未稳固、到期或答错过的词会化成前世鬼魂，来世继续复习。</p>' +
      '  <div class="life-actions">' +
      '    <button class="btn btn-gold" id="rebirth-enter">带着记忆入世</button>' +
      '    <button class="btn" id="rebirth-back">回到大限页</button>' +
      '  </div>' +
      '</div>';
    el.querySelector("#rebirth-enter").onclick = () => rebornCurrentSlot(true);
    el.querySelector("#rebirth-back").onclick = () => Game.life && Game.life.showDeath && Game.life.showDeath();
  }
  function rebornCurrentSlot(openOrigin) {
    const meta = readMeta();
    Game.resetState && Game.resetState();
    applyGlobalMemoryToState();
    Game.state.lifeDead = false;
    Game.state.lifeDeathInfo = null;
    Game.state.flags = Game.state.flags || {};
    Game.state.flags.rebornFromDeath = true;
    Game.logEvent && Game.logEvent("☯ 转世 · 携 " + (meta.totalMemoryPoints || 0) + " 点记忆入世");
    Game.save && Game.save.write({ view: "hub" });
    Game.renderHeader && Game.renderHeader();
    if (openOrigin && shouldShowOrigin()) return showOriginBuilder("death");
    Game.hub && Game.hub.show("你带着前世记忆重新入世。已学之词未散，前世鬼魂会在月课中来寻你。");
  }
  function shouldShowOrigin() {
    Game.normalizeState && Game.normalizeState();
    return originBudget() > 0 && !(Game.state.origin && Game.state.origin.confirmedAt);
  }
  function originGroupLabel(group) {
    return group === "缺陷" ? "逆缘" : group;
  }
  function traitCardHtml(t) {
    const selected = originSelected.indexOf(t.id) >= 0;
    const totals = originTotals(originSelected);
    const defectLocked = t.cost < 0 && !selected && totals.defects >= MAX_ORIGIN_DEFECTS;
    return '<button class="origin-trait' + (selected ? " selected" : "") + (defectLocked ? " locked" : "") + '" data-id="' + t.id + '"' + (defectLocked ? " disabled" : "") + '>' +
      '  <span class="origin-trait-top"><b>' + t.name + '</b><em>' + originGroupLabel(t.group) + ' · ' + (t.cost >= 0 ? "消耗 " + t.cost : "返还 " + Math.abs(t.cost)) + ' 点</em></span>' +
      '  <span class="origin-effect">' + t.effect + '</span>' +
      '  <span class="origin-desc">' + t.desc + '</span>' +
      (defectLocked ? '  <span class="origin-desc">本世逆缘已达上限。</span>' : '') +
      '</button>';
  }
  function avatarChoiceHtml() {
    const info = Game.avatarInfo ? Game.avatarInfo() : { gender: "male" };
    const cards = [
      { gender: "male", name: "男侠", image: "../素材/主角/player-male-origin-broom.png", desc: "旧袍竹杖，藏锋入院。" },
      { gender: "female", name: "女侠", image: "../素材/主角/player-female-origin-broom.png", desc: "束发执杖，独自问道。" },
    ].map((item) => {
      const selected = info.gender === item.gender;
      return '<button class="origin-avatar-card' + (selected ? " selected" : "") + '" data-gender="' + item.gender + '">' +
        '  <span class="origin-avatar-art"><img src="' + item.image + '" alt="' + item.name + '"></span>' +
        '  <span class="origin-avatar-text"><b>' + item.name + '</b><em>' + item.desc + '</em></span>' +
        '</button>';
    }).join("");
    return '<section class="origin-avatar-choice">' +
      '  <div class="origin-avatar-head"><b>此身形貌</b><span>只影响立绘、称谓与少量细节反应，不影响战力。</span></div>' +
      '  <div class="origin-avatar-grid">' + cards + '</div>' +
      '</section>';
  }
  function difficultyChoiceHtml() {
    const current = Game.activeDifficultyKey ? Game.activeDifficultyKey() : ((Game.state.settings && Game.state.settings.difficulty) || "normal");
    const locked = Game.difficultyLocked && Game.difficultyLocked();
    const list = Game.DIFFICULTIES || {};
    const cards = Object.keys(list).map((key) => {
      const d = list[key];
      return '<button class="origin-difficulty-card' + (key === current ? " selected" : "") + (locked ? " locked" : "") + '" data-difficulty="' + key + '"' + (locked ? " disabled" : "") + '>' +
        '  <b>' + d.name + '</b>' +
        '  <span>言气获取 ' + Math.round((d.qiRate || 1) * 100) + '%</span>' +
        '  <em>' + d.desc + '</em>' +
        '</button>';
    }).join("");
    return '<section class="origin-difficulty-choice">' +
      '  <div class="origin-avatar-head"><b>本档难度</b><span>' + (locked ? '本世难度已定，后续不可反悔。' : '开档时定下；影响后续言气获取与难度通关成就。') + '</span></div>' +
      '  <div class="origin-difficulty-grid">' + cards + '</div>' +
      '</section>';
  }
  function showOriginBuilder(reason) {
    const meta = readMeta();
    if (!originSelected.length && Game.state.origin && Array.isArray(Game.state.origin.traits)) originSelected = Game.state.origin.traits.slice();
    Game.setZone && Game.setZone("dream");
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "origin_builder" });
    const totals = originTotals(originSelected);
    const tooManyDefects = totals.defects > MAX_ORIGIN_DEFECTS;
    const invalid = totals.left < 0 || tooManyDefects;
    const isFirstLife = !totals.hasMemory && reason !== "death";
    const tag = isFirstLife ? "先天气运 · 初入世" : "转世记忆 · 入世构筑";
    const title = isFirstLife ? "为此生，择一副根骨" : "为来世，选一副根骨";
    const lead = isFirstLife
      ? "此身尚未踏进问言书院，命数却已在暗处开枝。形貌、体质、资质、出身与逆缘，都会把这一世推向不同方向。"
      : "轮回是一条没有灯的长河。前世的脸、名字、爱恨都会被水冲淡——除了那些字。";
    const desc = isFirstLife
      ? "用「先天气运点」选择体质、资质、出身与逆缘。第一世也能构筑开局；不能购买凭空掌握新词。"
      : "每一世都有基础先天气运；转世记忆点会额外叠加。点数来自你真实掌握的词、走过的境界与际遇；不能购买凭空掌握新词。";
    const groups = ["体质", "资质", "悟性", "出身", "机缘", "缺陷"];
    const html = groups.map((g) => {
      const cards = ORIGIN_TRAITS.filter((t) => t.group === g).map(traitCardHtml).join("");
      return '<section class="origin-group"><h3>' + originGroupLabel(g) + '</h3><div class="origin-grid">' + cards + '</div></section>';
    }).join("");
    mountEl().innerHTML =
      '<div class="origin-screen">' +
      '  <div class="wc-tag">' + tag + '</div>' +
      '  <h2>' + title + '</h2>' +
      '  <p>' + lead + '</p>' +
      '  <p class="dim small">' + desc + '</p>' +
      avatarChoiceHtml() +
      difficultyChoiceHtml() +
      '  <div class="origin-budget">' +
      '    <div><b>' + totals.budget + '</b><span>总点</span></div>' +
      '    <div><b>' + totals.base + '</b><span>先天气运</span></div>' +
      '    <div><b>' + totals.memory + '</b><span>转世记忆</span></div>' +
      '    <div><b>' + totals.spent + '</b><span>已花</span></div>' +
      '    <div><b>' + totals.refunded + '</b><span>逆缘返还</span></div>' +
      '    <div class="' + (invalid ? "bad" : "") + '"><b>' + totals.left + '</b><span>剩余</span></div>' +
      '  </div>' +
      '<p class="dim small">逆缘最多选择 ' + MAX_ORIGIN_DEFECTS + ' 项；返还仍照常计算，但不能靠叠满逆缘冲掉开局取舍。</p>' +
      (meta.ghosts && meta.ghosts.length ? '<p class="dim small">前世鬼魂：' + meta.ghosts.length + ' 个。相关特质会影响它们的提示与压迫感。</p>' : '') +
      html +
      (invalid ? '<p class="origin-warning">记忆点不足，或逆缘选择超过上限。请调整所选命数。</p>' : '') +
      '  <div class="life-actions">' +
      '    <button class="btn btn-gold" id="origin-confirm"' + (invalid ? " disabled" : "") + '>点数已定，魂归新身</button>' +
      '    <button class="btn" id="origin-clear">清空选择</button>' +
      '  </div>' +
      '</div>';
    mountEl().querySelectorAll(".origin-trait").forEach((b) => {
	      b.onclick = () => {
	        const id = b.dataset.id;
	        const trait = traitById(id);
	        const selected = originSelected.indexOf(id) >= 0;
	        const totalsNow = originTotals(originSelected);
	        if (!selected && trait && trait.cost < 0 && totalsNow.defects >= MAX_ORIGIN_DEFECTS) return;
	        originSelected = selected ? originSelected.filter((x) => x !== id) : originSelected.concat(id);
	        showOriginBuilder(reason);
	      };
    });
    mountEl().querySelectorAll(".origin-avatar-card").forEach((b) => {
      b.onclick = () => {
        Game.setAvatarGender && Game.setAvatarGender(b.dataset.gender);
        Game.save && Game.save.write({ view: "origin_builder" });
        showOriginBuilder(reason);
      };
    });
    mountEl().querySelectorAll(".origin-difficulty-card").forEach((b) => {
      b.onclick = () => {
        if (b.disabled || (Game.difficultyLocked && Game.difficultyLocked())) return;
        Game.setRunDifficulty && Game.setRunDifficulty(b.dataset.difficulty);
        Game.save && Game.save.write({ view: "origin_builder" });
        showOriginBuilder(reason);
      };
    });
    const clear = mountEl().querySelector("#origin-clear");
    if (clear) clear.onclick = () => { originSelected = []; showOriginBuilder(reason); };
    const confirm = mountEl().querySelector("#origin-confirm");
    if (confirm) confirm.onclick = () => confirmOrigin();
  }
  function attrDelta(key, delta) {
    Game.state.attrs[key] = Math.max(1, Math.min(300, (Game.state.attrs[key] || 0) + delta));
  }
  function lifespanDelta(months) {
    const s = Game.state;
    s.flags = s.flags || {};
    s.flags.originLifespanDelta = (s.flags.originLifespanDelta || 0) + months;
    const base = Game.lifespanMaxForRealm ? Game.lifespanMaxForRealm(s.realmIndex || 0) : (s.lifespanMax || 600);
    const target = Math.max(120, base + s.flags.originLifespanDelta);
    const oldMax = s.lifespanMax || base;
    s.lifespanMax = target;
    if (months > 0) s.lifespan += target - oldMax;
    s.lifespan = Math.max(1, Math.min(s.lifespan, s.lifespanMax));
  }
  function applyTrait(t) {
    const s = Game.state;
    s.flags = s.flags || {};
    if (t.flag) s.flags[t.flag] = true;
    if (t.id === "long_life") lifespanDelta(120);
    if (t.id === "jade_bone") { attrDelta("hp", 10); attrDelta("def", 2); }
    if (t.id === "clear_mind") { attrDelta("sense", 6); s.flags.originGhostHint = true; }
    if (t.id === "early_mana") attrDelta("mp", 8);
    if (t.id === "iron_fist") attrDelta("str", 5);
    if (t.id === "review_boost") s.flags.originReviewBoost = true;
    if (t.id === "herb_child") { Game.addItem && Game.addItem("凝露草", 2); Game.addItem && Game.addItem("月华露", 1); s.flags.originHerbChild = true; }
    if (t.id === "mountain_body") s.flags.originMountainBody = true;
    if (t.id === "trader_kin") { s.money = Math.max(0, (s.money || 0) + 35); }
    if (t.id === "woodland_child") { Game.addItem && Game.addItem("碎灵木", 2); Game.addItem && Game.addItem("低阶兽骨", 1); }
    if (t.id === "forge_spark") Game.addItem && Game.addItem("寒铁屑", 2);
    if (t.id === "ghost_guide") s.flags.originGhostGuide = true;
    if (t.id === "short_life") lifespanDelta(-120);
    if (t.id === "old_wound") attrDelta("hp", -8);
    if (t.id === "heart_demon") s.flags.originHeartDemon = true;
  }
  function confirmOrigin() {
    const totals = originTotals(originSelected);
    if (totals.defects > MAX_ORIGIN_DEFECTS) return showOriginBuilder();
    if (totals.left < 0) return showOriginBuilder();
	    if (Game.modal && Game.modal.confirm) {
	      return Game.modal.confirm({
	        title: "定下这一世？",
	        body: "入世构筑确认后，本世根骨、逆缘与寿元修正会立即写入存档。本页所选点数不能在本世反悔。",
	        confirmText: "魂归新身",
        cancelText: "再想想"
      }, function () { commitOrigin(totals); });
    }
    commitOrigin(totals);
  }
  function commitOrigin(totals) {
    Game.normalizeState && Game.normalizeState();
    const difficulty = Game.activeDifficultyKey ? Game.activeDifficultyKey() : ((Game.state.settings && Game.state.settings.difficulty) || "normal");
    const diffInfo = Game.setRunDifficulty ? Game.setRunDifficulty(difficulty, { lock: true }) : null;
    totals.list.forEach(applyTrait);
    Game.state.origin = {
      memoryPoints: totals.budget,
      basePoints: totals.base,
      rebirthMemoryPoints: totals.memory,
      spent: totals.spent,
      refunded: totals.refunded,
      left: totals.left,
      traits: totals.list.map((t) => t.id),
      originFlags: totals.list.map((t) => t.flag).filter(Boolean),
      names: totals.list.map((t) => t.name),
      difficulty: difficulty,
      difficultyName: diffInfo ? diffInfo.name : difficulty,
      confirmedAt: Date.now(),
    };
    const meta = readMeta();
    meta.lastOrigin = clone(Game.state.origin);
    writeMeta(meta);
    originSelected = [];
    Game.logEvent && Game.logEvent((totals.memory > 0 ? "☯ 入世构筑 · " : "✦ 先天气运 · ") + (Game.state.origin.names.join(" / ") || "未选特质"));
    Game.save && Game.save.write({ view: "hub" });
    Game.renderHeader && Game.renderHeader();
    Game.hub && Game.hub.show(totals.memory > 0 ? "点数已定，魂归新身。睁眼，便是来世。" : "先天气运已定。此身入世，命数从此分岔。");
  }
  function ghostCount() {
    Game.normalizeState && Game.normalizeState();
    return (Game.state.ghostQueue || []).filter((g) => g && wordExists(g.bookId, g.wordKey)).length;
  }
  function nextGhost() {
    Game.normalizeState && Game.normalizeState();
    while ((Game.state.ghostQueue || []).length) {
      const g = Game.state.ghostQueue[0];
      if (g && wordExists(g.bookId, g.wordKey)) return g;
      Game.state.ghostQueue.shift();
    }
    return null;
  }
  function realmExpScale() { return Math.pow(2.7, Game.state.realmIndex || 0); }
  function ghostExp(result) {
    const base = Math.max(1, Math.round((TYPE_BASE[result.type] || 10) * 0.85)); // 与普通 review expRate 保持一致
    let raw;
    if (result.rating === "easy") raw = base + 1;
    else if (result.rating === "hazy") raw = Math.max(1, Math.ceil(base * 0.55));
    else if (!result.correct) raw = Math.max(1, Math.ceil(base * 0.35));
    else raw = base;
    if (Game.state.flags && Game.state.flags.originReviewBoost) raw = Math.max(1, Math.round(raw * 1.1));
    return Math.round(raw * realmExpScale());
  }
  function syncCurrentGhostsToMeta() {
    const meta = readMeta();
    mergeLearnedIntoMeta(meta, Game.state);
    meta.ghosts = clone(Game.state.ghostQueue || []).filter((g) => g && wordExists(g.bookId, g.wordKey)).slice(0, MAX_GHOSTS);
    meta.lifetimeStats.totalGhosts = Math.max(meta.lifetimeStats.totalGhosts || 0, meta.ghosts.length);
    writeMeta(meta);
    return meta;
  }
  function showGhosts(message) {
    const g = nextGhost();
    if (!g) return Game.hub && Game.hub.show("暂时没有前世鬼魂来寻你。");
    Game.setVocabBook && Game.setVocabBook(g.bookId);
    Game.setZone && Game.setZone("dream");
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "ghost_review" });
    const el = mountEl();
    el.innerHTML =
      '<div class="cult-screen ghost-screen">' +
      '  <button class="btn btn-mini zone-back" id="ghost-back">退出</button>' +
      '  <div class="wordcard ghost-intro">' +
      '    <div class="wc-tag">前世鬼魂 · 旧字来寻</div>' +
      '    <h2>有影伏在识海边缘</h2>' +
      '    <p class="dim small">它带着前世未稳的一个词来找你。答对后按当前境界获得言气；不会沿用上一世境界倍率。</p>' +
      (message ? '    <p class="life-note">' + esc(message) + '</p>' : '') +
      '  </div>' +
      '  <div id="ghost-card"></div>' +
      '</div>';
    el.querySelector("#ghost-back").onclick = () => Game.hub && Game.hub.show();
    if (Game.modal && Game.modal.firstTime) {
      Game.modal.firstTime("ghost_intro", {
        tag: "前世鬼魂",
        title: "旧世未稳之词，会追到今生",
        body: "你上一世没有复习完的词，会化作前世鬼魂来寻你。答对后获得的言气按今生当前境界计算，不继承上一世境界倍率。"
      });
    }
    Game.wordcard.render(el.querySelector("#ghost-card"), g.wordKey, { type: "recognize", autoContinue: false }, function (result) {
      Game.recordWordResult && Game.recordWordResult(g.wordKey, result.type || "recognize", result);
      const rawExp = ghostExp(result || {});
      const exp = Game.applyQiGainRate ? Game.applyQiGainRate(rawExp) : rawExp;
      const events = Game.gainExp ? Game.gainExp(exp, { scaled: true }) : [];
      if (result && result.correct) Game.state.ghostQueue.shift();
      else Game.state.ghostQueue.push(Game.state.ghostQueue.shift());
      syncCurrentGhostsToMeta();
      Game.time && Game.time.advanceMonth && Game.time.advanceMonth();
      Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("ghosts", result && result.correct ? "退散" : "未散");
      Game.save && Game.save.write({ view: "hub" });
      Game.renderHeader && Game.renderHeader();
      if (Game.life && Game.life.guard && Game.life.guard("前世鬼魂纠缠一月，寿元已尽。")) return;
      (events || []).forEach((ev) => {
        if (!Game.logEvent) return;
        if (ev.type === "breakthrough") Game.logEvent("⚡ 突破 · " + ev.from + " → " + ev.to);
        if (ev.type === "realm_wall") Game.logEvent("⛰ 境界墙 · 凝言圆满，尚缺外界灵脉与突破丹");
      });
      const msg = result && result.correct
        ? "前世鬼魂退散，言气 +" + exp + "。"
        : "鬼魂未散，言气 +" + exp + "；它会稍后再来。";
      Game.hub && Game.hub.show(msg);
    });
  }

  Game.rebirth = {
    readMeta,
    writeMeta,
    prepareFromDeath,
    showMemory,
    rebornCurrentSlot,
    applyGlobalMemoryToState,
    originBudgetInfo,
    hasOriginTrait,
    hasOriginFlag,
    ORIGIN_TRAITS,
    shouldShowOrigin,
    showOriginBuilder,
    confirmOrigin,
    ghostCount,
    showGhosts,
    ghostExp,
    syncCurrentGhostsToMeta,
    ORIGIN_TRAITS,
  };
})(window.Game = window.Game || {});
