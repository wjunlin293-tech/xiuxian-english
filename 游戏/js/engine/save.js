/* ───────────────────────────────────────────────────────────────
 * save.js · 轻量存档（localStorage）
 * P-37：三槽多存档 + 主菜单；首次自动迁移旧单档。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const OLD_KEY = "xiuxian_demo_save_v1";
  const SLOT_PREFIX = "xiuxian_save_slot";
  const LAST_KEY = "xiuxian_last_slot";
  const SLOTS = [1, 2, 3];
  let currentSlot = null;

  function slotKey(slot) { return SLOT_PREFIX + slot; }
  function validSlot(slot) { slot = Number(slot); return SLOTS.includes(slot) ? slot : null; }
  function rawRead(key) {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; }
    catch (e) { return null; }
  }
  function rawWrite(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch (e) { return false; }
  }
  function lastSlot() {
    try { return validSlot(localStorage.getItem(LAST_KEY)); }
    catch (e) { return null; }
  }
  function setCurrentSlot(slot) {
    slot = validSlot(slot);
    if (!slot) return false;
    currentSlot = slot;
    try { localStorage.setItem(LAST_KEY, String(slot)); } catch (e) {}
    return true;
  }
  function getCurrentSlot() { return currentSlot || lastSlot(); }

  function migrateLegacy() {
    try {
      const old = rawRead(OLD_KEY);
      if (!old) return;
      const anySlot = SLOTS.some((slot) => !!localStorage.getItem(slotKey(slot)));
      if (anySlot) return;
      if (rawWrite(slotKey(1), old)) {
        localStorage.setItem(LAST_KEY, "1");
        localStorage.removeItem(OLD_KEY);
      }
    } catch (e) {}
  }

  function write(pos) {
    try {
      migrateLegacy();
      if (!currentSlot) setCurrentSlot(lastSlot() || 1);
      pos = pos || {};
      Game.normalizeState && Game.normalizeState();
      localStorage.setItem(slotKey(currentSlot), JSON.stringify({
        v: 2,
        view: pos.view || (pos.chapterId ? "paged" : "hub"),
        chapterId: pos.chapterId,
        idx: pos.idx,
        sessionIndex: pos.sessionIndex,
        sessionTotal: pos.sessionTotal,
        state: Game.state,
        vow: Game.vow || null,
        savedAt: Date.now(),
      }));
    } catch (e) { /* 隐私模式/禁用 localStorage 时静默 */ }
  }

  function read(slot) {
    migrateLegacy();
    slot = validSlot(slot) || getCurrentSlot();
    if (!slot) return null;
    return rawRead(slotKey(slot));
  }

  function clear(slot) {
    try {
      migrateLegacy();
      slot = validSlot(slot) || getCurrentSlot();
      if (!slot) return;
      localStorage.removeItem(slotKey(slot));
      if (currentSlot === slot) currentSlot = null;
    } catch (e) {}
  }

  function countMastered(data) {
    const mastered = data && data.state && data.state.mastered;
    if (!mastered) return 0;
    return Object.keys(mastered).filter((k) => mastered[k]).length;
  }

  function summaryOf(slot) {
    const data = read(slot);
    if (!data || !data.state) return { slot, empty: true };
    const st = data.state;
    const time = st.time || { year: 1, month: 1 };
    const realms = Game.REALMS || ["凡身"];
    const gender = st.avatar && st.avatar.gender === "female" ? "female" : "male";
    return {
      slot,
      empty: false,
      name: st.name || "沈砚",
      gender,
      identityLabel: gender === "female" ? "女侠线" : "男侠线",
      realm: realms[st.realmIndex || 0] || realms[0],
      year: time.year || 1,
      month: time.month || 1,
      timeLabel: Game.time && Game.time.ageLabel ? Game.time.ageLabel(time) : "第" + (time.year || 1) + "年" + (time.month || 1) + "月",
      mastered: countMastered(data),
      savedAt: data.savedAt || 0,
      view: data.view || "hub",
    };
  }

  function list() {
    migrateLegacy();
    return SLOTS.map(summaryOf);
  }

  // 把存档写回 Game.state（就地覆盖字段，保留 name 等默认）
  function apply(data) {
    if (!data || !data.state) return;
    const s = Game.state, d = data.state;
    if (d.avatar) s.avatar = d.avatar;
    if (d.time) s.time = d.time;
    if (typeof d.realmIndex === "number") s.realmIndex = d.realmIndex;
    if (typeof d.exp === "number") s.exp = d.exp;
    else if (typeof d.yanqi === "number") s.exp = d.yanqi;
    if (typeof d.expToBreak === "number") s.expToBreak = d.expToBreak;
    else if (typeof d.yanqiToLevel === "number") s.expToBreak = d.yanqiToLevel;
    if (typeof d.lifespan === "number") s.lifespan = d.lifespan;
    if (typeof d.lifespanMax === "number") s.lifespanMax = d.lifespanMax;
    if (typeof d.lifeDead === "boolean") s.lifeDead = d.lifeDead;
    if (Object.prototype.hasOwnProperty.call(d, "lifeDeathInfo")) s.lifeDeathInfo = d.lifeDeathInfo || null;
    if (Object.prototype.hasOwnProperty.call(d, "rebirth")) s.rebirth = d.rebirth || null;
    if (Object.prototype.hasOwnProperty.call(d, "origin")) s.origin = d.origin || null;
    if (Array.isArray(d.ghostQueue)) s.ghostQueue = d.ghostQueue;
    if (typeof d.money === "number") s.money = d.money;
    if (typeof d.yanqi === "number") s.yanqi = d.yanqi;
    if (typeof d.yanqiToLevel === "number") s.yanqiToLevel = d.yanqiToLevel;
    if (typeof d.free === "number") s.free = d.free;
    if (d.mastered) s.mastered = d.mastered;
    if (d.vocabBookId) s.vocabBookId = d.vocabBookId;
    if (d.wordStats) s.wordStats = d.wordStats;
    if (d.attrs) s.attrs = d.attrs;
    if (d.bag) s.bag = d.bag;
    if (d.items) s.items = d.items;
    if (d.pillDoses) s.pillDoses = d.pillDoses;
    if (d.yiguo) s.yiguo = d.yiguo;
    if (d.relations) s.relations = d.relations;
    if (d.relationLog) s.relationLog = d.relationLog;
    if (Array.isArray(d.daolv)) s.daolv = d.daolv;
    if (Array.isArray(d.events)) s.events = d.events;
    if (typeof d.eventSeq === "number") s.eventSeq = d.eventSeq;
    if (Object.prototype.hasOwnProperty.call(d, "pinnedEventId")) s.pinnedEventId = d.pinnedEventId;
    if (Object.prototype.hasOwnProperty.call(d, "worldFeel")) s.worldFeel = d.worldFeel || null;
    if (d.gear) s.gear = d.gear;
    if (d.equip) s.equip = d.equip;
    if (d.zonesUnlocked) s.zonesUnlocked = d.zonesUnlocked;
    if (d.flags) s.flags = d.flags;
    if (d.settings) s.settings = d.settings;
    if (Object.prototype.hasOwnProperty.call(d, "activeCultivation")) {
      s.activeCultivation = d.activeCultivation || null;
    }
    if (Object.prototype.hasOwnProperty.call(d, "activeBreak")) {
      s.activeBreak = d.activeBreak || null; // P-BREAK：天劫雷劫中途态，刷新可续上
    }
    Game.normalizeState && Game.normalizeState();
    Game.vow = data.vow || undefined;
  }

  Game.save = { write, read, clear, apply, list, setCurrentSlot, getCurrentSlot, lastSlot, migrateLegacy };
})(window.Game = window.Game || {});
