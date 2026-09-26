/* ───────────────────────────────────────────────────────────────
 * state.js · 玩家状态（五维 + 言气 + 境界 + 时间养成状态）
 * 五维：血量 / 法力 / 力量 / 防御 / 神识。暴击已并入法力的术式爆发。
 * 时间驱动重构：背词得言气，言气满后渡雷劫升境。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  // 五维：血量 / 法力 / 力量 / 防御 / 神识
  // （2026-06-19 用户拍板：删除独立暴击；法力负责术式爆发率，溢流转额外伤害。）
  const ATTRS = [
    { key: "hp",    name: "血量", max: 300 },
    { key: "mp",    name: "法力", max: 120 },
    { key: "str",   name: "力量", max: 120 },
    { key: "def",   name: "防御", max: 120 },
    { key: "sense", name: "神识", max: 120 }, // 战前探知/秒杀（见 battle.js）
  ];

  // 各属性起始值（兼用于旧档缺维补默认）
  const ATTR_STARTS = { hp: 100, mp: 35, str: 15, def: 10, sense: 10 }; // mp 含旧暴击基准折算法力

  // 境界阶梯（demo 只用前两阶；通用概念可沿用，具体名走原创）
  const REALMS = ["凡身", "启言境", "凝言境"];

  // 突破曲线：2026-06-18 用户拍板·方案B（首破调高、二破明显更高），占位待 C-05 定稿。
  const CULTIVATION_EXP_PER_WORD = 12; // 待用户定：背词→言气换算公式
  const INITIAL_EXP_TO_BREAK = 900;    // 待用户定·方案B：首破目标约第3-5月（旧 300 偏低已调高）
  const BREAKTHROUGH_GROWTH = 3.9;     // 待用户定·方案B：二破目标约第16-24月
  // P-BREAK 突破失败惩罚（占位待 C-05）：扣阈值 15% 言气 + 轻微折寿 3 个月。
  const BREAK_FAIL_EXP_RATE = 0.15;
  const BREAK_FAIL_LIFE_MONTHS = 3;
  const SESSION_SIZES = [5, 10, 20, 50];
  const FAVORITE_BOOK_ID = "favorites";
  const REALM_GIFTS = [
    null,
    { hp: 18, mp: 14, str: 6, def: 6, sense: 6 },   // 待用户定：启言境礼包（旧暴击+2折入法力+6）
    { hp: 28, mp: 21, str: 10, def: 10, sense: 10 }, // 待用户定：凝言境礼包（旧暴击+3折入法力+9）
  ];

  // 境界标准值（五维参考线）——"境界标准对比"雷达用，玩家拿自身和它比。占位待 C-05。
  const REALM_STANDARDS = [
    { hp: 100, mp: 35, str: 15, def: 10, sense: 10 }, // 凡身
    { hp: 130, mp: 54, str: 25, def: 18, sense: 18 }, // 启言境
    { hp: 170, mp: 81, str: 40, def: 30, sense: 30 }, // 凝言境
  ];

  // P-LIFE：寿元单位为“月”。用户已定标准寿元：凡身50年，其后100/200/400/1000年。
  const LIFESPAN_BY_REALM = [600, 1200, 2400, 4800, 12000];
  const USER_SETTINGS_KEY = "xiuxian_user_settings_v1";
  const DIFFICULTIES = {
    easy: { key: "easy", name: "简单", qiRate: 1.2, desc: "言气获取 120%，适合偏剧情和轻压力游玩。" },
    normal: { key: "normal", name: "普通", qiRate: 1, desc: "言气获取 100%，默认节奏。" },
    hard: { key: "hard", name: "困难", qiRate: 0.8, desc: "言气获取 80%，寿元和突破压力更明显。" },
  };
  const DEFAULT_SETTINGS = {
    autoContinue: true,           // 2026-09-26 用户：默认开启（中速 1.1s），可在修炼页/游戏设置关闭
    autoContinueMode: "normal",
    cultivationMode: "mixed",
    difficulty: "normal",
    reducedMotion: false,
    fontSize: "normal",
    tts: true,
    accent: "us",
    sfx: true,
    bgmVolume: 0.21,   // 2026-09-26 用户：默认音量降到原来的 70%（原 0.3）
    sfxVolume: 0.112,  // 原 0.16 ×0.7
    combatReveal: 0.3, // 藏锋·展露功力滑杆上次的值（0.1~1.0），战斗默认沿用、可再调
    audio: { muted: false, vol: 0.21 },
  };

  const DEFAULT_STATE = {
    name: "沈砚",
    avatar: { gender: "male", body: "default", outfit: "academy_ragged", visualGear: {} },
    time: { year: 1, month: 1 }, // 内部修行月计数；界面按沈砚开局16岁显示
    realmIndex: 0,          // 0=凡身（觉醒前）
    exp: 0,                 // 言气（由背词修炼获得）
    expToBreak: INITIAL_EXP_TO_BREAK, // 雷劫突破所需言气；R15 起始约 300
    lifespan: LIFESPAN_BY_REALM[0], // 当前寿元（月）
    lifespanMax: LIFESPAN_BY_REALM[0], // 当前境界寿元上限（月）
    lifeDead: false,          // P-LIFE：寿元归零后的硬死亡态
    lifeDeathInfo: null,      // P-LIFE：死亡结算快照
    rebirth: null,            // P-REBIRTH：本世携带的转世记忆摘要
    origin: null,             // P-ORIGIN：本世入世构筑选择
    ghostQueue: [],           // P-GHOST：前世鬼魂复习队列 [{bookId, wordKey, ...}]
    activeBreak: null,        // P-BREAK：天劫雷劫中途态（题库/进度/丹药加成），刷新可续上
    money: 10,                // P-MONEY：灵石货币（开局10＝母亲遗留·剧情在「灶房的人」体现）
    yanqi: 0,               // 旧字段兼容：等同 exp，不再作为独立数值
    yanqiToLevel: INITIAL_EXP_TO_BREAK, // 旧字段兼容：等同 expToBreak
    free: 0,                // 可分配加点
    mastered: {},           // 已掌握词 { WORD: true }
    favoriteWords: {},      // 自主收藏词 { "bookId::WORD": true }，作为虚拟《收藏簿》动态汇总
    vocabBookId: "gaokao",  // 当前修炼词书
    wordStats: {},          // 背词熟练度 { bookId: { WORD: { seen, correct, wrong, mastery, dueMonth } } }
    attrs: { hp: 100, mp: 35, str: 15, def: 10, sense: 10 },
    bag: {},                // R2/R3 接入：材料背包
    items: {},              // R26 接入：可服用丹药背包 { itemId: count }
    pillDoses: {},          // P-27 借旧版：同种丹已服用次数 { pillId: n }，用于药效几何衰减(防刷)
    yiguo: {},              // 异果图鉴：已得异果 { fruitId: true }（仅剧情授予；属性已并入 attrs·不重复加）
    relations: {},          // P-CAST：相识人物情谊 { characterId: 0-100 }；存在 key 即已相逢
    relationLog: {},        // P-SHENTIAN-REL：人物谱因果记录 { characterId: [{ text, month, type }] }
    daolv: [],              // P-CAST：已缔结/义结人物 id
    events: [],             // P-28 事件栏：[{ id, text }]（最近在末尾·限长 60）
    eventSeq: 0,            // 事件自增 id
    pinnedEventId: null,    // 玩家标记的事件 id（折叠态优先显示它）
    worldFeel: null,         // P-FEEL：自由行动手感记录（近期行动/连续倾向/低频痕迹）
    gear: {},               // R3 接入：已制作装备库存 { itemId: item }
    equip: {},              // R3 接入：装备栏 { slot: itemId }
    zonesUnlocked: {},      // R2 接入：区域解锁
    flags: {},              // 时间事件/剧情节点 flag
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), // 全局/修炼设置；默认保留手动继续
    activeCultivation: null, // 修炼中断恢复草稿；正常结算/放弃后清空
  };
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));

  function resetState() {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_STATE));
    Object.keys(state).forEach((k) => { delete state[k]; });
    Object.assign(state, fresh);
    Game.vow = undefined;
    normalize();
  }

  function realmName() { return REALMS[state.realmIndex] || REALMS[REALMS.length - 1]; }

  // 当前（或指定）境界的五维标准值，用于雷达"境界标准对比"
  function realmStandard(idx) {
    if (typeof idx !== "number") idx = state.realmIndex;
    idx = Math.max(0, Math.min(REALM_STANDARDS.length - 1, idx));
    return REALM_STANDARDS[idx];
  }

  function syncLegacyProgress() {
    state.yanqi = state.exp;
    state.yanqiToLevel = state.expToBreak;
  }

  function canonicalGearSlot(slot) {
    if (slot === "talisman") return "artifact";
    return slot;
  }

  function gearSlotName(slot) {
    slot = canonicalGearSlot(slot);
    if (slot === "weapon") return "武器";
    if (slot === "artifact") return "法宝";
    if (slot === "outfit") return "衣服";
    return "装备";
  }

  function readUserSettings() {
    try {
      const raw = localStorage.getItem(USER_SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function mergeSettings(base, extra) {
    const out = Object.assign({}, base || {}, extra || {});
    out.audio = Object.assign({}, (base && base.audio) || {}, (extra && extra.audio) || {});
    return out;
  }

  function validDifficulty(key) {
    return DIFFICULTIES[key] ? key : "normal";
  }

  function coerceSettings(settings) {
    const out = mergeSettings(DEFAULT_SETTINGS, settings || {});
    out.autoContinue = !!out.autoContinue;
    out.autoContinueMode = ["off", "slow", "normal", "fast"].includes(out.autoContinueMode) ? out.autoContinueMode : (out.autoContinue ? "normal" : "off");
    out.autoContinue = out.autoContinueMode !== "off";
    out.cultivationMode = ["mixed", "skim", "spell", "meaning"].includes(out.cultivationMode) ? out.cultivationMode : "mixed";
    out.reducedMotion = !!out.reducedMotion;
    out.fontSize = ["small", "normal", "large"].includes(out.fontSize) ? out.fontSize : "normal";
    out.tts = out.tts !== false;
    out.accent = out.accent === "uk" ? "uk" : "us";
    out.difficulty = validDifficulty(out.difficulty);
    out.sfx = out.sfx !== false;
    const bgmVolume = Number(typeof out.bgmVolume !== "undefined" ? out.bgmVolume : (out.audio && out.audio.vol));
    const sfxVolume = Number(out.sfxVolume);
    out.bgmVolume = Number.isFinite(bgmVolume) ? Math.max(0, Math.min(1, bgmVolume)) : 0.21;
    out.sfxVolume = Number.isFinite(sfxVolume) ? Math.max(0, Math.min(1, sfxVolume)) : 0.112;
    const reveal = Number(out.combatReveal);
    out.combatReveal = Number.isFinite(reveal) ? Math.max(0.1, Math.min(1, Math.round(reveal * 10) / 10)) : 0.3;
    if (!out.audio) out.audio = { muted: false, vol: 0.21 };
    out.audio.muted = !!out.audio.muted;
    out.audio.vol = out.bgmVolume;
    return out;
  }

  function applySettingsEffects(settings) {
    if (typeof document !== "undefined" && document.body) {
      document.body.classList.toggle("reduced-motion", !!(settings && settings.reducedMotion));
      document.body.classList.toggle("font-small", !!(settings && settings.fontSize === "small"));
      document.body.classList.toggle("font-large", !!(settings && settings.fontSize === "large"));
    }
  }

  function normalizeSettings() {
    state.settings = coerceSettings(mergeSettings(state.settings || {}, readUserSettings()));
    if (state.flags && state.flags.startDifficulty) state.settings.difficulty = validDifficulty(state.flags.startDifficulty);
    applySettingsEffects(state.settings);
    return state.settings;
  }

  function saveUserSettings(partial) {
    state.settings = coerceSettings(mergeSettings(state.settings || DEFAULT_SETTINGS, partial || {}));
    applySettingsEffects(state.settings);
    try { localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(state.settings)); } catch (e) {}
    return state.settings;
  }

  function difficultyInfo(key) {
    return DIFFICULTIES[activeDifficultyKey(key)];
  }

  function activeDifficultyKey(key) {
    return validDifficulty(key || (state.flags && state.flags.startDifficulty) || (state.settings && state.settings.difficulty));
  }

  function difficultyLocked() {
    return !!(state.flags && state.flags.startDifficulty);
  }

  function setRunDifficulty(key, opts) {
    key = validDifficulty(key);
    state.settings = coerceSettings(mergeSettings(state.settings || DEFAULT_SETTINGS, { difficulty: key }));
    if (opts && opts.lock) {
      if (!state.flags) state.flags = {};
      state.flags.startDifficulty = key;
    }
    applySettingsEffects(state.settings);
    if (!opts || opts.persist !== false) {
      try { localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(state.settings)); } catch (e) {}
    }
    return difficultyInfo(key);
  }

  function difficultyQiRate() {
    return difficultyInfo().qiRate || 1;
  }

  function applyQiGainRate(amount) {
    const n = Math.max(0, Number(amount) || 0);
    return Math.max(0, Math.round(n * difficultyQiRate()));
  }

  function autoContinueDelay() {
    const mode = (state.settings && state.settings.autoContinueMode) || (state.settings && state.settings.autoContinue ? "normal" : "off");
    if (mode === "slow") return 1800;
    if (mode === "fast") return 650;
    if (mode === "normal") return 1100;
    return 0;
  }

  function normalize() {
    if (!state.avatar || typeof state.avatar !== "object" || Array.isArray(state.avatar)) state.avatar = {};
    state.avatar.gender = state.avatar.gender === "female" ? "female" : "male";
    state.avatar.body = typeof state.avatar.body === "string" && state.avatar.body ? state.avatar.body : "default";
    state.avatar.outfit = typeof state.avatar.outfit === "string" && state.avatar.outfit ? state.avatar.outfit : "academy_ragged";
    if (!state.avatar.visualGear || typeof state.avatar.visualGear !== "object" || Array.isArray(state.avatar.visualGear)) state.avatar.visualGear = {};
    if (!state.time) state.time = { year: 1, month: 1 };
    if (typeof state.exp !== "number") state.exp = typeof state.yanqi === "number" ? state.yanqi : 0;
    if (typeof state.expToBreak !== "number") {
      state.expToBreak = typeof state.yanqiToLevel === "number" ? state.yanqiToLevel : INITIAL_EXP_TO_BREAK;
    }
    if (!state.flags) state.flags = {};
    if (!state.flags.startDifficulty && state.origin && state.origin.confirmedAt) {
      state.flags.startDifficulty = validDifficulty(state.origin.difficulty || (state.settings && state.settings.difficulty));
    }
    if (state.flags.startDifficulty) state.flags.startDifficulty = validDifficulty(state.flags.startDifficulty);
    const originLifeDelta = typeof state.flags.originLifespanDelta === "number" ? state.flags.originLifespanDelta : 0;
    const lifeMax = Math.max(120, lifespanMaxForRealm(state.realmIndex) + originLifeDelta);
    if (typeof state.lifespanMax !== "number") state.lifespanMax = lifeMax;
    if (originLifeDelta) state.lifespanMax = lifeMax;
    if (state.lifespanMax < lifeMax) state.lifespanMax = lifeMax;
    if (typeof state.lifespan !== "number") state.lifespan = state.lifespanMax;
    state.lifespan = Math.max(0, Math.min(state.lifespan, state.lifespanMax));
    state.lifeDead = !!state.lifeDead || state.lifespan <= 0;
    if (state.lifeDead && !state.lifeDeathInfo) captureLifeDeathInfo("lifespan");
    if (!Array.isArray(state.ghostQueue)) state.ghostQueue = [];
    if (state.rebirth && typeof state.rebirth !== "object") state.rebirth = null;
    if (state.origin && typeof state.origin !== "object") state.origin = null;
    if (typeof state.money !== "number" || !Number.isFinite(state.money)) state.money = 0;
    state.money = Math.max(0, Math.floor(state.money));
    // 旧曲线存档迁移（30→300→900）：若存档阈值低于当前曲线对该境界应有的阈值，按进度比例迁移。
    // 等于当前曲线时不触发，故幂等、不会反复迁移。
    const expectedToBreak = Math.round(INITIAL_EXP_TO_BREAK * Math.pow(BREAKTHROUGH_GROWTH, Math.max(0, state.realmIndex)));
    if (state.expToBreak < expectedToBreak) {
      const oldToBreak = Math.max(1, state.expToBreak || INITIAL_EXP_TO_BREAK);
      const progressRatio = Math.max(0, state.exp || 0) / oldToBreak;
      state.expToBreak = expectedToBreak;
      state.exp = Math.min(Math.round(progressRatio * state.expToBreak), Math.max(0, state.expToBreak - 1));
    }
    if (!state.attrs || typeof state.attrs !== "object") state.attrs = {};
    migrateLegacyCrit();
    ATTRS.forEach((a) => { // 旧档缺维补默认
      if (typeof state.attrs[a.key] !== "number") state.attrs[a.key] = ATTR_STARTS[a.key] || 0;
    });
    if (!state.bag) state.bag = {};
    if (!state.items) state.items = {};
    if (!state.pillDoses) state.pillDoses = {};
    if (!Array.isArray(state.events)) state.events = [];
    if (typeof state.eventSeq !== "number") state.eventSeq = 0;
    if (typeof state.pinnedEventId === "undefined") state.pinnedEventId = null;
    if (!state.worldFeel || typeof state.worldFeel !== "object" || Array.isArray(state.worldFeel)) {
      state.worldFeel = { history: [], lastType: "", streak: 0, lastTraceMonth: 0 };
    }
    if (!Array.isArray(state.worldFeel.history)) state.worldFeel.history = [];
    state.worldFeel.history = state.worldFeel.history.filter((item) => item && item.type).slice(-10);
    if (typeof state.worldFeel.lastType !== "string") state.worldFeel.lastType = "";
    if (typeof state.worldFeel.streak !== "number") state.worldFeel.streak = 0;
    if (typeof state.worldFeel.lastTraceMonth !== "number") state.worldFeel.lastTraceMonth = 0;
    if (!state.yiguo) state.yiguo = {};
    if (!state.relations || typeof state.relations !== "object" || Array.isArray(state.relations)) state.relations = {};
    Object.keys(state.relations).forEach((id) => {
      const v = Number(state.relations[id]);
      state.relations[id] = Math.max(0, Math.min(100, Number.isFinite(v) ? Math.round(v) : 0));
    });
    if (!state.relationLog || typeof state.relationLog !== "object" || Array.isArray(state.relationLog)) state.relationLog = {};
    Object.keys(state.relationLog).forEach((id) => {
      if (!Array.isArray(state.relationLog[id])) {
        delete state.relationLog[id];
        return;
      }
      const currentMonth = state.time ? ((Math.max(1, Number(state.time.year) || 1) - 1) * 12 + Math.max(1, Number(state.time.month) || 1)) : 1;
      state.relationLog[id] = state.relationLog[id].filter((item) => item && typeof item.text === "string").slice(-12).map((item) => ({
        text: item.text,
        month: Number.isFinite(Number(item.month)) ? Number(item.month) : currentMonth,
        type: item.type || "note",
      }));
    });
    if (!Array.isArray(state.daolv)) state.daolv = [];
    state.daolv = Array.from(new Set(state.daolv.filter((id) => typeof id === "string" && id)));
    if (!state.gear) state.gear = {};
    if (!state.equip) state.equip = {};
    if (!state.wordStats) state.wordStats = {};
    if (!state.favoriteWords || typeof state.favoriteWords !== "object" || Array.isArray(state.favoriteWords)) state.favoriteWords = {};
    if (!state.vocabBookId) state.vocabBookId = "gaokao";
    if (Game.WORD_BOOKS && state.vocabBookId !== FAVORITE_BOOK_ID && !Game.WORD_BOOKS[state.vocabBookId]) {
      state.vocabBookId = Object.keys(Game.WORD_BOOKS)[0] || state.vocabBookId;
    }
    migrateLegacyWordStats();
    refreshWords();
    Object.keys(state.equip).forEach((slot) => {
      const item = state.equip[slot];
      if (item && typeof item === "object") {
        state.gear[item.id] = item;
        state.equip[slot] = item.id;
      }
    });
    Object.keys(state.gear || {}).forEach((id) => {
      const item = state.gear[id];
      if (!item || typeof item !== "object") return;
      item.slot = canonicalGearSlot(item.slot || "weapon");
      item.slotName = gearSlotName(item.slot);
    });
    Object.keys(state.equip || {}).forEach((slot) => {
      const canonical = canonicalGearSlot(slot);
      const itemId = state.equip[slot];
      if (!itemId) {
        delete state.equip[slot];
        return;
      }
      if (canonical !== slot) {
        if (!state.equip[canonical]) state.equip[canonical] = itemId;
        delete state.equip[slot];
      }
    });
    Object.keys(state.equip || {}).forEach((slot) => {
      const itemId = state.equip[slot];
      if (!state.gear || !state.gear[itemId]) delete state.equip[slot];
    });
    migrateLegacyGearCrit();
    if (!state.zonesUnlocked) state.zonesUnlocked = {};
    normalizeSettings();
    if (state.activeCultivation && typeof state.activeCultivation !== "object") state.activeCultivation = null;
    syncLegacyProgress();
  }

  // 旧档迁移：R17 的 crit(暴击%) 删除后，按 1 暴击 ≈ 3 法力折入 mp。
  function migrateLegacyCrit() {
    if (!state.attrs || typeof state.attrs.crit !== "number") return;
    if (!state.flags.critToMpMigrated) {
      state.attrs.mp = Math.min(ATTRS.find((a) => a.key === "mp").max,
        (typeof state.attrs.mp === "number" ? state.attrs.mp : ATTR_STARTS.mp) + Math.round(state.attrs.crit * 3));
      state.flags.critToMpMigrated = true;
    }
    delete state.attrs.crit;
  }

  function migrateLegacyGearCrit() {
    Object.keys(state.gear || {}).forEach((id) => {
      const item = state.gear[id];
      if (!item || !item.bonus || typeof item.bonus.crit !== "number") return;
      item.bonus.mp = (item.bonus.mp || 0) + Math.round(item.bonus.crit * 3);
      delete item.bonus.crit;
    });
  }

  function applyRealmGift(realmIndex) {
    const gift = REALM_GIFTS[realmIndex];
    if (gift) {
      ATTRS.forEach((a) => {
        const inc = gift[a.key] || 0;
        state.attrs[a.key] = Math.min(a.max, state.attrs[a.key] + inc);
      });
    }
    applyLifespanForRealm(realmIndex);
  }

  function lifespanMaxForRealm(realmIndex) {
    const idx = Math.max(0, Math.min(LIFESPAN_BY_REALM.length - 1, realmIndex || 0));
    return LIFESPAN_BY_REALM[idx];
  }

  function lifeLabel(months) {
    months = Math.max(0, Math.round(Number(months) || 0));
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y && m) return y + "年" + m + "月";
    if (y) return y + "年";
    return m + "月";
  }

  function applyLifespanForRealm(realmIndex) {
    const originLifeDelta = state.flags && typeof state.flags.originLifespanDelta === "number" ? state.flags.originLifespanDelta : 0;
    const nextMax = Math.max(120, lifespanMaxForRealm(realmIndex) + originLifeDelta);
    const oldMax = state.lifespanMax || nextMax;
    // 破境只"延寿"＝加上境界提升带来的额外寿元上限增量，不回满已消耗的寿元。
    // （旧逻辑 lifespan=lifespanMax 会让每次破境寿命满血重置，玩家觉得不合理。）
    const gain = Math.max(0, nextMax - oldMax);
    state.lifespanMax = Math.max(oldMax, nextMax);
    state.lifespan = Math.max(0, (state.lifespan || 0) + gain);
    if (state.lifespan > 0) state.lifeDead = false;
  }

  function captureLifeDeathInfo(reason) {
    const mastered = state.mastered || {};
    const prefix = (state.vocabBookId || "gaokao") + "::";
    const totalMastered = Object.keys(mastered).filter((k) => mastered[k]).length;
    state.lifeDeathInfo = {
      reason: reason || "lifespan",
      time: { year: state.time && state.time.year || 1, month: state.time && state.time.month || 1 },
      realm: REALMS[state.realmIndex] || REALMS[0],
      realmIndex: state.realmIndex || 0,
      mastered: Object.keys(mastered).filter((k) => mastered[k] && k.indexOf(prefix) === 0).length,
      totalMastered,
      exp: state.exp || 0,
      expToBreak: state.expToBreak || INITIAL_EXP_TO_BREAK,
      events: (state.events || []).slice(-5),
    };
    return state.lifeDeathInfo;
  }

  function checkLifeDeath(reason) {
    normalize();
    if (state.lifeDead) return true;
    if (state.lifespan > 0) return false;
    state.lifespan = 0;
    state.lifeDead = true;
    captureLifeDeathInfo(reason);
    if (Game.logEvent) Game.logEvent("☠ 大限已至 · 寿元归零");
    return true;
  }

  function spendLifespan(months, reason) {
    normalize();
    if (state.lifeDead) return { dead: true, spent: 0, left: 0 };
    const cost = Math.max(0, Math.round(Number(months) || 0));
    if (cost > 0) state.lifespan = Math.max(0, state.lifespan - cost);
    const dead = checkLifeDeath(reason || "spend");
    return { dead, spent: cost, left: state.lifespan };
  }

  function isLifeDead() {
    normalize();
    return !!state.lifeDead;
  }

  function isRealmCapped() {
    return state.realmIndex >= REALMS.length - 1;
  }

  function isRealmWallReady() {
    normalize();
    return isRealmCapped() && state.exp >= state.expToBreak;
  }

  // 背词得言气；满阈值则触发雷劫升境并给加点。demo 封顶后只触发境界墙提示，不升第4境界。
  function gainExp(amount, opts) {
    normalize();
    const wasBelow = state.exp < state.expToBreak;
    const gained = opts && opts.scaled ? Math.max(0, Math.round(Number(amount) || 0)) : applyQiGainRate(amount);
    state.exp += gained;
    const events = [];
    // P-BREAK：言气满不再自动突破。需玩家主动点「突破」走天劫雷劫（概率突破）。
    // 此处只在"刚好攒满"时发提示事件；封顶境界发境界墙提示。
    if (!isRealmCapped() && wasBelow && state.exp >= state.expToBreak) {
      events.push({ type: "ready_to_break", realm: REALMS[state.realmIndex] });
    }
    if (isRealmCapped() && state.exp >= state.expToBreak && (wasBelow || !state.flags.realmWallSeen)) {
      state.flags.realmWallSeen = true;
      events.push({ type: "realm_wall", realm: REALMS[state.realmIndex], need: state.expToBreak });
    }
    syncLegacyProgress();
    events.gained = gained;
    events.raw = Number(amount) || 0;
    return events;
  }

  // P-BREAK：是否可以发起突破（言气满 且 未封顶）。封顶境界走境界墙，不开雷劫。
  function readyToBreak() {
    normalize();
    return !isRealmCapped() && state.exp >= state.expToBreak;
  }

  // P-BREAK：突破成功——真正升境界（沿用旧自动突破的全部结算：礼包/+3根基点/阈值×3.9）。
  function doBreakthrough() {
    normalize();
    if (!readyToBreak()) return null;
    state.exp -= state.expToBreak;
    state.realmIndex += 1;
    applyRealmGift(state.realmIndex);
    state.free += 3;
    state.expToBreak = Math.round(state.expToBreak * BREAKTHROUGH_GROWTH);
    syncLegacyProgress();
    return { type: "breakthrough", from: REALMS[state.realmIndex - 1], to: REALMS[state.realmIndex] };
  }

  // P-BREAK：突破失败——扣部分言气 + 轻微扣寿元（占位待 C-05）。不掉属性，可再攒再来。
  function breakthroughFail() {
    normalize();
    const expLoss = Math.min(state.exp, Math.round(state.expToBreak * BREAK_FAIL_EXP_RATE));
    state.exp = Math.max(0, state.exp - expLoss);
    const lifeLoss = Math.min(state.lifespan, BREAK_FAIL_LIFE_MONTHS);
    state.lifespan = Math.max(0, state.lifespan - lifeLoss);
    state.lifeDead = !!state.lifeDead || state.lifespan <= 0;
    syncLegacyProgress();
    return { expLoss: expLoss, lifeLoss: lifeLoss, dead: state.lifespan <= 0 };
  }

  // 旧剧情引擎兼容：内部改走言气。
  function gainYanqi(amount, opts) { return gainExp(amount, opts); }

  function activeVocabBookId() {
    return state.vocabBookId || "gaokao";
  }
  function favoriteToken(bookId, wordKey) {
    return (bookId || activeVocabBookId()) + "::" + wordKey;
  }
  function parseFavoriteToken(token) {
    const idx = String(token || "").indexOf("::");
    if (idx < 0) return null;
    return { bookId: token.slice(0, idx), wordKey: token.slice(idx + 2) };
  }
  function favoriteRows() {
    if (!state.favoriteWords || typeof state.favoriteWords !== "object" || Array.isArray(state.favoriteWords)) state.favoriteWords = {};
    const rows = [];
    const seen = {};
    Object.keys(state.favoriteWords || {}).forEach((token) => {
      if (!state.favoriteWords[token]) return;
      const parsed = parseFavoriteToken(token);
      if (!parsed || seen[parsed.wordKey]) return;
      const b = Game.WORD_BOOKS && Game.WORD_BOOKS[parsed.bookId];
      const w = b && b.words && b.words[parsed.wordKey];
      if (!w) return;
      seen[parsed.wordKey] = true;
      rows.push({ bookId: parsed.bookId, wordKey: parsed.wordKey, word: w, bookName: b.name });
    });
    return rows;
  }
  function favoriteWordsMap() {
    const out = {};
    favoriteRows().forEach((row) => {
      out[row.wordKey] = Object.assign({}, row.word, { favoriteSourceBookId: row.bookId, favoriteSourceBookName: row.bookName });
    });
    return out;
  }
  function favoriteBook() {
    return { id: FAVORITE_BOOK_ID, name: "收藏簿", desc: "你手动标星、想反复记忆的词。", words: favoriteWordsMap(), virtual: true };
  }
  function wordBookById(bookId) {
    if (bookId === FAVORITE_BOOK_ID) return favoriteBook();
    return Game.WORD_BOOKS && Game.WORD_BOOKS[bookId];
  }
  function wordStatBookId(bookId, wordKey) {
    if (bookId !== FAVORITE_BOOK_ID) return bookId || activeVocabBookId();
    const rows = favoriteRows();
    const row = rows.find((r) => r.wordKey === wordKey);
    return row ? row.bookId : activeVocabBookId();
  }
  function isFavorite(bookId, wordKey) {
    if (!wordKey) return false;
    if (bookId === FAVORITE_BOOK_ID) {
      return favoriteRows().some((row) => row.wordKey === wordKey);
    }
    return !!(state.favoriteWords && state.favoriteWords[favoriteToken(bookId, wordKey)]);
  }
  function setFavorite(bookId, wordKey, value) {
    normalize();
    if (bookId === FAVORITE_BOOK_ID) bookId = wordStatBookId(bookId, wordKey);
    const b = Game.WORD_BOOKS && Game.WORD_BOOKS[bookId];
    if (!b || !b.words || !b.words[wordKey]) return false;
    const token = favoriteToken(bookId, wordKey);
    const had = !!state.favoriteWords[token];
    if (value === false) delete state.favoriteWords[token];
    else state.favoriteWords[token] = true;
    return had !== !!state.favoriteWords[token];
  }
  function toggleFavorite(bookId, wordKey) {
    return setFavorite(bookId, wordKey, !isFavorite(bookId, wordKey));
  }

  function refreshWords() {
    if (!Game.WORD_BOOKS) return Game.WORDS || {};
    const book = wordBookById(activeVocabBookId()) || Game.WORD_BOOKS[Object.keys(Game.WORD_BOOKS)[0]];
    Game.WORDS = book ? book.words : {};
    return Game.WORDS;
  }

  function currentWordBook() {
    normalize();
    return wordBookById(activeVocabBookId());
  }

  function currentWords() {
    normalize();
    return refreshWords();
  }

  function setVocabBook(bookId) {
    if (bookId === FAVORITE_BOOK_ID) {
      state.vocabBookId = FAVORITE_BOOK_ID;
      refreshWords();
      return 0;
    }
    if (!Game.WORD_BOOKS || !Game.WORD_BOOKS[bookId]) return false;
    state.vocabBookId = bookId;
    refreshWords();
    return syncCrossBookKnown(bookId); // 返回本次自动标熟的词数（供 UI 弹窗提示）
  }

  // P-AUTOMARK：某拼写在任一本词书已掌握/已标熟 → 视为"已在神田记录"。
  // 所有词书同拼写共用同一 key（pack() 统一大写），跨书匹配只看 key。
  function isKnownAnywhere(key) {
    if (!Game.WORD_BOOKS) return false;
    return Object.keys(Game.WORD_BOOKS).some((bid) => {
      if (!Game.WORD_BOOKS[bid].words[key]) return false;
      const st = peekWordStat(bid, key);
      if (st && st.markedKnown) return true;
      if (state.mastered[bid + "::" + key]) return true;
      return !!(st && st.mastery >= 5);
    });
  }

  // P-AUTOMARK：把"本书还没碰过、但别处已会"的词自动标熟，免得重背。
  // 铁律：只对本书 seen=0 且未标熟的词下手，绝不覆盖正在本书背的进度。返回标熟词数。
  function syncCrossBookKnown(bookId) {
    normalize();
    bookId = bookId || activeVocabBookId();
    const book = Game.WORD_BOOKS && Game.WORD_BOOKS[bookId];
    if (!book) return 0;
    let n = 0;
    Object.keys(book.words).forEach((key) => {
      const st = peekWordStat(bookId, key);
      if (st && (st.seen > 0 || st.markedKnown)) return; // 本书已学/已标熟 → 跳过
      if (!isKnownAnywhere(key)) return;                 // 别处也没会 → 跳过
      if (markKnown(bookId, key)) n += 1;
    });
    return n;
  }

  function masteredKey(word, bookId) {
    return wordStatBookId(bookId || activeVocabBookId(), word) + "::" + word;
  }

  function masterWord(word) {
    const key = masteredKey(word);
    if (state.mastered[key]) return false;
    state.mastered[key] = true;
    return true;
  }
  function masteredCount() {
    if (activeVocabBookId() === FAVORITE_BOOK_ID) {
      return favoriteRows().filter((row) => !!state.mastered[row.bookId + "::" + row.wordKey]).length;
    }
    const prefix = wordStatBookId(activeVocabBookId()) + "::";
    return Object.keys(state.mastered).filter((k) => k.indexOf(prefix) === 0).length;
  }

  // P-MEMORY 统一口径：词是否"真正记忆/已入神田"。单一真相源，供新学池/书卡/学完判定/神田复用。
  function isMemorized(key, bookId) {
    bookId = wordStatBookId(bookId || activeVocabBookId(), key);
    if (state.mastered[bookId + "::" + key]) return true;
    const st = peekWordStat(bookId, key);
    if (!st) return false;
    return !!st.markedKnown || (st.mem || 0) >= MEM_THRESHOLD || (st.mastery || 0) >= 5;
  }
  // 本书三态统计：total 总词 / memorized 已记忆 / learning 学习中 / newLeft 还可学的新词。
  function bookProgress(bookId) {
    normalize();
    bookId = bookId || activeVocabBookId();
    const book = wordBookById(bookId);
    if (!book) return { total: 0, memorized: 0, learning: 0, newLeft: 0 };
    let memorized = 0, learning = 0, newLeft = 0;
    Object.keys(book.words).forEach((key) => {
      if (isMemorized(key, bookId)) { memorized += 1; return; }
      const st = peekWordStat(bookId, key);
      if (st && st.seen > 0) learning += 1;
      else newLeft += 1;
    });
    return { total: Object.keys(book.words).length, memorized: memorized, learning: learning, newLeft: newLeft };
  }
  function memorizedCount(bookId) { return bookProgress(bookId).memorized; }
  function learnableNewCount(bookId) { return bookProgress(bookId).newLeft; }

  function frequencyBookId(bookId, wordKey) {
    bookId = bookId || activeVocabBookId();
    if (bookId !== FAVORITE_BOOK_ID) return bookId;
    const row = favoriteRows().find((r) => r.wordKey === wordKey);
    return row ? row.bookId : activeVocabBookId();
  }

  function frequencySourceLabel(sourceList) {
    const s = String(sourceList || "");
    if (/NAWL/i.test(s)) return "NAWL 学术词表频序";
    if (/ECDICT|COCA|gk|cet|toefl|ielts|gre|abroad/i.test(s)) return "词库真实频序参考";
    return s || "按当前词书顺序估算";
  }

  // 2026-09-26 性能：原来每个词都 Object.keys()+indexOf 整本书（3000 词书≈900 万次比较），
  // 修炼菜单每次渲染 9 本书的考频统计要卡 ~2.4s。词书是静态数据 → 每本书只建一次序号表。
  const _freqIndex = new WeakMap();
  const _freqSummary = new WeakMap();
  function frequencyIndex(book) {
    let x = _freqIndex.get(book);
    if (!x) {
      const keys = Object.keys(book.words);
      const idx = new Map();
      keys.forEach((k, i) => idx.set(k, i));
      x = { total: Math.max(1, keys.length), idx: idx };
      _freqIndex.set(book, x);
    }
    return x;
  }

  function wordFrequencyInfo(bookId, wordKey) {
    const sourceBookId = frequencyBookId(bookId, wordKey);
    const book = wordBookById(sourceBookId);
    if (!book || !book.words || !book.words[wordKey]) return null;
    const fi = frequencyIndex(book);
    const total = fi.total;
    const w = book.words[wordKey];
    let rank = Number(w.sourceRank || 0);
    let estimated = false;
    if (!(rank > 0)) {
      const idx = fi.idx.has(wordKey) ? fi.idx.get(wordKey) : -1;
      rank = idx >= 0 ? idx + 1 : total;
      estimated = true;
    }
    const pct = rank / total;
    const tier = pct <= 0.15 ? "high" : (pct <= 0.55 ? "mid" : "low");
    const tierName = tier === "high" ? "高频" : (tier === "mid" ? "中频" : "低频");
    const source = frequencySourceLabel(w.sourceList);
    return {
      bookId: sourceBookId,
      bookName: book.name || "",
      wordKey: wordKey,
      rank: rank,
      total: total,
      pct: pct,
      tier: tier,
      tierName: tierName,
      estimated: estimated,
      badge: "考频·" + (estimated ? "估" : "") + tierName.charAt(0),
      detail: source + " #" + rank + "/" + total + (estimated ? "（估算）" : ""),
      source: source,
    };
  }

  function bookFrequencySummary(bookId) {
    bookId = bookId || activeVocabBookId();
    const book = wordBookById(bookId);
    if (!book || !book.words) return { total: 0, high: 0, mid: 0, low: 0, estimated: 0, source: "" };
    const cached = _freqSummary.get(book);
    if (cached) return Object.assign({}, cached);
    const out = { total: 0, high: 0, mid: 0, low: 0, estimated: 0, source: "" };
    Object.keys(book.words).forEach((key) => {
      const info = wordFrequencyInfo(bookId, key);
      if (!info) return;
      out.total += 1;
      out[info.tier] += 1;
      if (info.estimated) out.estimated += 1;
      if (!out.source && info.source) out.source = info.source;
    });
    _freqSummary.set(book, Object.assign({}, out));
    return out;
  }

  function reviewCurveInfo() {
    return {
      title: "温故曲线",
      short: "参考艾宾浩斯遗忘曲线与 SM-2 间隔复习思路安排到期词。",
      detail: "答错会更快回炉；答对会拉长复习间隔。它只决定复习顺序，不强迫新学，也不直接发放属性。",
      days: DUE_DAYS.slice(),
    };
  }

  function peekWordStat(bookId, wordKey) {
    bookId = wordStatBookId(bookId, wordKey);
    const ws = state.wordStats && state.wordStats[bookId];
    return ws && ws[wordKey] ? ws[wordKey] : null;
  }

  function currentMonthNumber() {
    normalize();
    return ((state.time.year - 1) * 12) + state.time.month;
  }

  function wordStatFor(bookId, wordKey) {
    normalize();
    bookId = wordStatBookId(bookId || activeVocabBookId(), wordKey);
    if (!state.wordStats[bookId]) state.wordStats[bookId] = {};
    if (!state.wordStats[bookId][wordKey]) {
      state.wordStats[bookId][wordKey] = {
        seen: 0,
        correct: 0,
        wrong: 0,
        mastery: 0,
        mem: 0, // 记忆得分（P-MEMORY 公式·达 MEM_THRESHOLD 即"真正记忆/入神田"）
        dueMonth: currentMonthNumber(),
        dueAt: Date.now(), // 真实日历到期时间戳（跨场次复习用·C-09 双货币层）
        lastMode: "",
      };
    }
    const st = state.wordStats[bookId][wordKey];
    // 旧档条目缺 dueAt：按掌握度散到未来（Codex P-08 catch）——避免旧词全判成立即到期洪泛，
    // 越熟的词推得越远，符合 SRS（mastery0→今天起，mastery5→约15天后）。
    if (typeof st.dueAt !== "number") {
      st.dueAt = Date.now() + DUE_DAYS[Math.max(0, Math.min(DUE_DAYS.length - 1, st.mastery || 0))] * DAY_MS;
    }
    return st;
  }

  function wordStat(wordKey) {
    return wordStatFor(activeVocabBookId(), wordKey);
  }

  function markKnown(bookId, wordKey) {
    bookId = wordStatBookId(bookId, wordKey);
    if (!Game.WORD_BOOKS || !Game.WORD_BOOKS[bookId] || !Game.WORD_BOOKS[bookId].words[wordKey]) return false;
    const existing = peekWordStat(bookId, wordKey);
    if (existing && existing.markedKnown) return false;
    const key = masteredKey(wordKey, bookId);
    const backup = existing ? {
      existed: true,
      seen: existing.seen || 0,
      correct: existing.correct || 0,
      wrong: existing.wrong || 0,
      mastery: existing.mastery || 0,
      dueMonth: existing.dueMonth,
      dueAt: existing.dueAt,
      lastMode: existing.lastMode || "",
      lastMonth: existing.lastMonth,
      wasMastered: !!state.mastered[key],
    } : { existed: false, wasMastered: !!state.mastered[key] };
    const st = wordStatFor(bookId, wordKey);
    st.markKnownBackup = backup;
    st.markedKnown = true;
    st.markedKnownAt = Date.now();
    st.seen = st.seen || 0;
    st.mastery = st.mastery || 0;
    st.lastMode = "mark-known";
    return true;
  }

  function unmarkKnown(bookId, wordKey) {
    bookId = wordStatBookId(bookId, wordKey);
    const st = peekWordStat(bookId, wordKey);
    if (!st || !st.markedKnown) return false;
    const backup = st.markKnownBackup || { existed: false, wasMastered: false };
    const key = masteredKey(wordKey, bookId);
    if (!backup.existed) {
      delete state.wordStats[bookId][wordKey];
    } else {
      state.wordStats[bookId][wordKey] = {
        seen: backup.seen || 0,
        correct: backup.correct || 0,
        wrong: backup.wrong || 0,
        mastery: backup.mastery || 0,
        dueMonth: backup.dueMonth,
        dueAt: backup.dueAt,
        lastMode: backup.lastMode || "",
        lastMonth: backup.lastMonth,
      };
    }
    if (backup.wasMastered) state.mastered[key] = true;
    else delete state.mastered[key];
    return true;
  }

  function migrateLegacyWordStats() {
    if (!state.wordStats || !Object.keys(state.wordStats).length) return;
    const hasLegacy = Object.keys(state.wordStats).some((k) => state.wordStats[k] && typeof state.wordStats[k].seen === "number");
    if (!hasLegacy) return;
    const old = state.wordStats;
    state.wordStats = {};
    state.wordStats[activeVocabBookId()] = old;
  }

  function scoreFromResult(result) {
    if (!result) return 0;
    if (typeof result.score === "number") return result.score;
    if (result.rating === "easy") return 3;
    if (result.rating === "known") return 2;
    if (result.rating === "hazy") return 1;
    return result.correct ? 2 : 0;
  }

  function nextDueMonth(now, mastery, score) {
    if (score <= 0) return now;
    if (score === 1) return now + 1;
    if (score === 2) return now + Math.max(1, mastery);
    return now + Math.max(2, mastery + 1);
  }

  // C-09：学习阶段（复用 mastery 推断，不新增存档字段）。0初见/1认识/2巩固/3掌握
  function deriveStage(stat) {
    if (!stat || !stat.seen) return 0;
    if (stat.mastery <= 2) return 1;
    if (stat.mastery <= 4) return 2;
    return 3;
  }

  // ── P-MEMORY 记忆得分（设计见 40_背词记忆与复习体系）──
  // 思路：拉开间隔的不同场次里、用越难的题型把词从长期记忆反复捞出答对，才算真记住。
  const MEM_GAIN = { learn: 0.3, recognize: 1.0, listen: 1.2, context: 1.5, spell: 2.0 };
  const MEM_SPACED_MULT = 1.6; // 跨场次到期再答对的间隔加成
  const MEM_THRESHOLD = 6;     // 达此分＝真正记忆/入神田（易调）
  function applyMemScore(st, score, mode, wasDue) {
    if (typeof st.mem !== "number") st.mem = 0;
    if (score >= 2) {
      const gain = MEM_GAIN[mode] != null ? MEM_GAIN[mode] : 1.0;
      st.mem += gain * (wasDue ? MEM_SPACED_MULT : 1.0);
    } else {
      st.mem = Math.max(0, st.mem * 0.5 - 1); // 答错腰斩−1，不归零
    }
  }

  // C-09 双货币层：复习按真实日历到期（艾宾浩斯档位·SM-2 式按 mastery 拉长）。返回真实时间戳(ms)
  const DAY_MS = 86400000;
  const DUE_DAYS = [1, 1, 2, 4, 7, 15]; // 按 mastery 取间隔天数
  function nextDueAt(score, mastery) {
    const now = Date.now();
    if (score <= 0) return now;            // 答错：下次一上来就到期复习
    let d = DUE_DAYS[Math.max(0, Math.min(DUE_DAYS.length - 1, mastery))];
    if (score === 1) d = 1;                // 模糊：拉回 1 天
    else if (score === 3) d = Math.min(15, d * 2); // 秒懂：翻倍·封顶 15 天
    return now + d * DAY_MS;
  }

  function recordWordResult(wordKey, mode, result) {
    const st = wordStat(wordKey);
    const now = currentMonthNumber();
    const score = scoreFromResult(result);
    // 间隔检索判定：已学过(seen>0)且 dueAt 已到期＝跨场次从长期记忆里捞出来（mem 间隔加成）。
    const wasDue = st.seen > 0 && (st.dueAt || 0) <= Date.now();
    applyMemScore(st, score, mode, wasDue);
    st.seen += 1;
    st.lastMode = mode || "";
    st.lastMonth = now;
    if (score >= 2) {
      st.correct += 1;
      st.mastery = Math.min(5, st.mastery + (score === 3 ? 2 : 1));
      masterWord(wordKey);
      if (st.markedKnown) {
        delete st.markedKnown;
        delete st.markedKnownAt;
        delete st.markKnownBackup;
      }
    } else {
      st.wrong += 1;
      st.mastery = Math.max(0, st.mastery - 1);
    }
    st.dueMonth = nextDueMonth(now, st.mastery, score);
    st.dueAt = nextDueAt(score, st.mastery); // 真实日历到期（跨场次复习）
    // P-INSIGHT：匿名学习计数（只落本机·不外发）
    if (Game.insight) {
      Game.insight.bump(wasDue ? "reviews" : "newWords");
      Game.insight.bump(score >= 2 ? "correct" : "wrong");
    }
    return st;
  }

  function dueWords(count) {
    normalize();
    const keys = Object.keys(currentWords() || {});
    const realNow = Date.now();
    const sorted = keys.slice().sort((a, b) => {
      const sa = wordStat(a);
      const sb = wordStat(b);
      const da = (sa.dueAt || 0) <= realNow ? 0 : 1; // 真实时间到期优先
      const db = (sb.dueAt || 0) <= realNow ? 0 : 1;
      if (da !== db) return da - db;
      if (sa.mastery !== sb.mastery) return sa.mastery - sb.mastery;
      return sa.seen - sb.seen;
    });
    const out = [];
    if (!sorted.length) return out;
    for (let i = 0; i < count; i++) out.push(sorted[i % sorted.length]);
    return out;
  }

  function learningBuckets() {
    normalize();
    const realNow = Date.now();
    const rows = Object.keys(currentWords() || {}).map((key) => {
      const st = wordStat(key);
      return { key, st };
    });
    const byWeakness = (a, b) => {
      if (a.st.mastery !== b.st.mastery) return a.st.mastery - b.st.mastery;
      if (a.st.wrong !== b.st.wrong) return b.st.wrong - a.st.wrong;
      return (a.st.lastMonth || 0) - (b.st.lastMonth || 0);
    };
    const byRecent = (a, b) => (b.st.lastMonth || 0) - (a.st.lastMonth || 0);
    const byDue = (a, b) => {
      const dueDiff = (a.st.dueAt || 0) - (b.st.dueAt || 0);
      return dueDiff || byWeakness(a, b);
    };
    return {
      // M2：新学池排除已记忆词（含跨书已标熟的 seen=0 词），背完不再当新词派。
      unseen: rows.filter((r) => !r.st.seen && !isMemorized(r.key)).map((r) => r.key),
      // due = 真实日历到期（跨场次复习的真 SRS）；同场次内基本为空，靠 weak/recent 做即时穿插
      due: rows.filter((r) => r.st.seen > 0 && (r.st.dueAt || 0) <= realNow).sort(byDue).map((r) => r.key),
      // 手动标熟词在 dueAt 到期前不参加弱词/最近词穿插；到期后仍会从 due 自然返青。
      weak: rows.filter((r) => r.st.seen > 0 && !r.st.markedKnown).sort(byWeakness).map((r) => r.key),
      recent: rows.filter((r) => r.st.seen > 0 && !r.st.markedKnown).sort(byRecent).map((r) => r.key),
      all: rows.map((r) => r.key),
    };
  }

  // C-09 掌握度（喂战力·P-06）：当前词书里 mastery≥3 且未"生疏"(真实时间未过久)的牢固词数
  function vocabMastery() {
    normalize();
    const realNow = Date.now();
    const ws = state.wordStats[activeVocabBookId()] || {};
    let n = 0;
    Object.keys(ws).forEach((k) => {
      const s = ws[k];
      // 牢固 = 掌握度够 + 没有逾期太久(逾期 >7 天算生疏，不计入)
      if (s && !s.markedKnown && s.mastery >= 3 && (s.dueAt == null || s.dueAt >= realNow - 7 * DAY_MS)) n += 1;
    });
    return n;
  }

  function dueReviewCount() {
    return learningBuckets().due.length;
  }

  // P-DAOXIN（`48`）：道心＝复习保持度。当前书里 seen>0 的词中，dueAt 已过期未复习的比例决定档位。
  // 坚固×1.00 / 微澜(≤30%逾期)−8% / 心性不稳(>30%)−18%。只影响日常战斗攻势；生死战由 battle 豁免。
  // 永不永久掉属性（实时算·不存负 buff）；不逼背新词（没词可复习＝ratio 0＝坚固）。数值待 C-05。
  const DAOXIN_RIPPLE_MAX = 0.30, DAOXIN_RIPPLE = 0.92, DAOXIN_UNSTABLE = 0.82;
  function daoxinTier() {
    normalize();
    const realNow = Date.now();
    const ws = state.wordStats[activeVocabBookId()] || {};
    let active = 0, overdue = 0;
    Object.keys(ws).forEach((k) => {
      const s = ws[k];
      if (!s || !(s.seen > 0)) return;      // 只算真正学过/复习过的词
      active += 1;
      if (typeof s.dueAt === "number" && s.dueAt <= realNow) overdue += 1; // 到期未复习
    });
    const ratio = active > 0 ? overdue / active : 0;
    let tier = "solid", factor = 1, label = "道心坚固";
    if (overdue > 0 && ratio <= DAOXIN_RIPPLE_MAX) { tier = "ripple"; factor = DAOXIN_RIPPLE; label = "道心微澜"; }
    else if (ratio > DAOXIN_RIPPLE_MAX) { tier = "unstable"; factor = DAOXIN_UNSTABLE; label = "心性不稳"; }
    return { tier, factor, label, overdue, active, ratio };
  }

  function addItem(key, amount) {
    normalize();
    if (!key) return 0;
    const n = amount == null ? 1 : amount;
    state.bag[key] = (state.bag[key] || 0) + n;
    return state.bag[key];
  }

  function bagCount(key) {
    normalize();
    return state.bag[key] || 0;
  }

  function canAfford(cost) {
    normalize();
    cost = cost || {};
    return Object.keys(cost).every((k) => bagCount(k) >= cost[k]);
  }

  function spendItems(cost) {
    normalize();
    if (!canAfford(cost)) return false;
    Object.keys(cost || {}).forEach((k) => {
      state.bag[k] -= cost[k];
      if (state.bag[k] <= 0) delete state.bag[k];
    });
    return true;
  }

  function addInventoryItem(id, amount) {
    normalize();
    if (!id) return 0;
    const n = amount == null ? 1 : amount;
    state.items[id] = (state.items[id] || 0) + n;
    return state.items[id];
  }

  function inventoryCount(id) {
    normalize();
    return state.items[id] || 0;
  }

  function spendInventoryItem(id, amount) {
    normalize();
    const n = amount == null ? 1 : amount;
    if (!id || inventoryCount(id) < n) return false;
    state.items[id] -= n;
    if (state.items[id] <= 0) delete state.items[id];
    return true;
  }

  function moneyLabel(amount) {
    const n = Math.max(0, Math.floor(amount || 0));
    return n + " 灵石";
  }

  function gainMoney(amount, reason) {
    normalize();
    const n = Math.max(0, Math.floor(amount || 0));
    if (!n) return state.money;
    state.money += n;
    if (reason && Game.logEvent) Game.logEvent("💰 得灵石 · +" + n + "（" + reason + "）");
    return state.money;
  }

  function spendMoney(amount, reason) {
    normalize();
    const n = Math.max(0, Math.floor(amount || 0));
    if (!n) return true;
    if (state.money < n) return false;
    state.money -= n;
    if (reason && Game.logEvent) Game.logEvent("💰 花灵石 · -" + n + "（" + reason + "）");
    return true;
  }

  function spendExp(amount) {
    normalize();
    const n = Math.max(0, amount || 0);
    const paid = Math.min(state.exp, n);
    state.exp -= paid;
    syncLegacyProgress();
    return paid;
  }

  function applyAttrBonus(bonus) {
    normalize();
    bonus = bonus || {};
    ATTRS.forEach((a) => {
      const inc = bonus[a.key] || 0;
      if (!inc) return;
      state.attrs[a.key] = Math.min(a.max, state.attrs[a.key] + inc);
    });
  }

  function equipBonus() {
    normalize();
    const out = {};
    ATTRS.forEach((a) => { out[a.key] = 0; });
    Object.keys(state.equip).forEach((slot) => {
      const item = state.gear[state.equip[slot]];
      if (!item || !item.bonus) return;
      ATTRS.forEach((a) => { out[a.key] += item.bonus[a.key] || 0; });
    });
    return out;
  }

  function totalAttrs() {
    normalize();
    const bonus = equipBonus();
    const out = {};
    ATTRS.forEach((a) => {
      out[a.key] = Math.min(a.max, (state.attrs[a.key] || 0) + (bonus[a.key] || 0));
    });
    return out;
  }

  function avatarInfo() {
    normalize();
    const female = state.avatar.gender === "female";
    const gender = female ? "female" : "male";
    const outfitId = state.equip && state.equip.outfit;
    const outfit = outfitId && state.gear ? state.gear[outfitId] : null;
    const paperdollBase = female ? "../素材/主角/player-female-paperdoll-base.png" : "../素材/主角/player-male-paperdoll-base.png";
    const outfitImage = (outfit && outfit.paperdollImages && outfit.paperdollImages[gender]) ||
      (outfit && outfit.images && outfit.images[gender]);
    return {
      gender,
      label: female ? "女侠" : "男侠",
      title: female ? "问言女侠" : "问言少侠",
      image: outfitImage || paperdollBase,
      outfitId: outfit ? outfit.id : "",
      outfitName: outfit ? outfit.name : "",
    };
  }

  function setAvatarGender(gender) {
    normalize();
    state.avatar.gender = gender === "female" ? "female" : "male";
    return avatarInfo();
  }

  function addGear(item) {
    normalize();
    if (!item || !item.id) return false;
    const next = Object.assign({}, item);
    next.slot = canonicalGearSlot(next.slot || "weapon");
    next.slotName = gearSlotName(next.slot);
    state.gear[next.id] = next;
    return true;
  }

  function equipItem(slot, itemId) {
    normalize();
    if (!slot || !itemId || !state.gear[itemId]) return false;
    slot = canonicalGearSlot(slot);
    const item = state.gear[itemId];
    item.slot = canonicalGearSlot(item.slot || slot);
    item.slotName = gearSlotName(item.slot);
    state.equip[item.slot || slot] = itemId;
    return true;
  }

  function unequipItem(slot) {
    normalize();
    slot = canonicalGearSlot(slot);
    if (!slot || !state.equip[slot]) return false;
    delete state.equip[slot];
    return true;
  }

  // 加点：给某属性 +step
  function allocate(key, step) {
    if (state.free <= 0) return false;
    const a = ATTRS.find((x) => x.key === key);
    if (!a) return false;
    const inc = step != null ? step : 8;
    state.attrs[key] = Math.min(a.max, state.attrs[key] + inc);
    state.free -= 1;
    return true;
  }

  // 撤回一点（allocate 的逆操作）：退还属性 + 返还可分配。
  // 仅用于「纳入识海」确认前的重分配；撤回上限由加点卡按本轮加点数把关。
  function deallocate(key, step) {
    const a = ATTRS.find((x) => x.key === key);
    if (!a) return false;
    const inc = step != null ? step : 8;
    if (state.attrs[key] - inc < 0) return false;
    state.attrs[key] = state.attrs[key] - inc;
    state.free += 1;
    return true;
  }

  // ── 事件栏（P-28）──
  function logEvent(text) {
    normalize();
    text = String(text == null ? "" : text).trim();
    if (!text) return;
    const last = state.events[state.events.length - 1];
    if (last && last.text === text) return; // 去重：连续相同不重复记
    state.eventSeq = (state.eventSeq || 0) + 1;
    state.events.push({ id: state.eventSeq, text: text });
    if (state.events.length > 60) state.events = state.events.slice(-60);
  }
  function pinEvent(id) { normalize(); state.pinnedEventId = (state.pinnedEventId === id) ? null : id; } // toggle
  function pinnedEvent() { normalize(); return state.events.find((e) => e.id === state.pinnedEventId) || null; }
  function latestEvent() { normalize(); return state.events[state.events.length - 1] || null; }
  function barEvent() { return pinnedEvent() || latestEvent(); } // 折叠态显示：优先标记·否则最近

  Game.ATTRS = ATTRS;
  Game.REALMS = REALMS;
  Game.REALM_STANDARDS = REALM_STANDARDS;
  Game.LIFESPAN_BY_REALM = LIFESPAN_BY_REALM;
  Game.realmStandard = realmStandard;
  Game.CULTIVATION_EXP_PER_WORD = CULTIVATION_EXP_PER_WORD;
  Game.SESSION_SIZES = SESSION_SIZES;
  Game.FAVORITE_BOOK_ID = FAVORITE_BOOK_ID;
  Game.DIFFICULTIES = DIFFICULTIES;
  Game.state = state;
  Game.resetState = resetState;
  Game.realmName = realmName;
  Game.isRealmCapped = isRealmCapped;
  Game.isRealmWallReady = isRealmWallReady;
  Game.readyToBreak = readyToBreak;
  Game.doBreakthrough = doBreakthrough;
  Game.breakthroughFail = breakthroughFail;
  Game.lifespanMaxForRealm = lifespanMaxForRealm;
  Game.lifeLabel = lifeLabel;
  Game.applyLifespanForRealm = applyLifespanForRealm;
  Game.captureLifeDeathInfo = captureLifeDeathInfo;
  Game.checkLifeDeath = checkLifeDeath;
  Game.spendLifespan = spendLifespan;
  Game.isLifeDead = isLifeDead;
  Game.normalizeState = normalize;
  Game.saveUserSettings = saveUserSettings;
  Game.setRunDifficulty = setRunDifficulty;
  Game.activeDifficultyKey = activeDifficultyKey;
  Game.difficultyLocked = difficultyLocked;
  Game.difficultyInfo = difficultyInfo;
  Game.difficultyQiRate = difficultyQiRate;
  Game.applyQiGainRate = applyQiGainRate;
  Game.autoContinueDelay = autoContinueDelay;
  Game.gainExp = gainExp;
  Game.gainYanqi = gainYanqi;
  Game.masterWord = masterWord;
  Game.masteredCount = masteredCount;
  Game.isMemorized = isMemorized;
  Game.bookProgress = bookProgress;
  Game.wordFrequencyInfo = wordFrequencyInfo;
  Game.bookFrequencySummary = bookFrequencySummary;
  Game.reviewCurveInfo = reviewCurveInfo;
  Game.memorizedCount = memorizedCount;
  Game.learnableNewCount = learnableNewCount;
  Game.currentWordBook = currentWordBook;
  Game.currentWords = currentWords;
  Game.favoriteBook = favoriteBook;
  Game.favoriteRows = favoriteRows;
  Game.wordBookById = wordBookById;
  Game.isFavorite = isFavorite;
  Game.setFavorite = setFavorite;
  Game.toggleFavorite = toggleFavorite;
  Game.setVocabBook = setVocabBook;
  Game.refreshWords = refreshWords;
  Game.currentMonthNumber = currentMonthNumber;
  Game.wordStat = wordStat;
  Game.wordStatFor = wordStatFor;
  Game.peekWordStat = peekWordStat;
  Game.markKnown = markKnown;
  Game.isKnownAnywhere = isKnownAnywhere;
  Game.syncCrossBookKnown = syncCrossBookKnown;
  Game.unmarkKnown = unmarkKnown;
  Game.recordWordResult = recordWordResult;
  Game.deriveStage = deriveStage;
  Game.vocabMastery = vocabMastery;
  Game.daoxinTier = daoxinTier;
  Game.dueWords = dueWords;
  Game.learningBuckets = learningBuckets;
  Game.dueReviewCount = dueReviewCount;
  Game.addItem = addItem;
  Game.bagCount = bagCount;
  Game.canAfford = canAfford;
  Game.spendItems = spendItems;
  Game.addInventoryItem = addInventoryItem;
  Game.inventoryCount = inventoryCount;
  Game.spendInventoryItem = spendInventoryItem;
  Game.moneyLabel = moneyLabel;
  Game.gainMoney = gainMoney;
  Game.spendMoney = spendMoney;
  Game.spendExp = spendExp;
  Game.applyAttrBonus = applyAttrBonus;
  Game.avatarInfo = avatarInfo;
  Game.setAvatarGender = setAvatarGender;
  Game.canonicalGearSlot = canonicalGearSlot;
  Game.gearSlotName = gearSlotName;
  Game.equipBonus = equipBonus;
  Game.totalAttrs = totalAttrs;
  Game.addGear = addGear;
  Game.equipItem = equipItem;
  Game.unequipItem = unequipItem;
  Game.allocate = allocate;
  Game.deallocate = deallocate;
  Game.logEvent = logEvent;
  Game.pinEvent = pinEvent;
  Game.pinnedEvent = pinnedEvent;
  Game.latestEvent = latestEvent;
  Game.barEvent = barEvent;
})(window.Game = window.Game || {});
