/* ───────────────────────────────────────────────────────────────
 * time.js · 时间(月)驱动
 * R1 最小骨架：1 行动 = 1 月；时间事件只预留钩子，R4 再接剧情 deadline。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const START_AGE = 16; // 沈砚开局十六岁；内部 time.year 仍作修行年，避免剧情门槛偏移。

  function ensureTime() {
    Game.normalizeState && Game.normalizeState();
    return Game.state.time;
  }

  function totalMonths() {
    const t = ensureTime();
    return (t.year - 1) * 12 + t.month;
  }

  function label() {
    const t = ensureTime();
    return ageLabel(t);
  }

  function cultivationLabel(time) {
    const t = time || ensureTime();
    return "修行第" + (t.year || 1) + "年" + (t.month || 1) + "月";
  }

  function ageLabel(time) {
    const t = time || ensureTime();
    const y = Math.max(1, Number(t.year) || 1);
    const m = Math.max(1, Number(t.month) || 1);
    return (START_AGE + y - 1) + "岁" + m + "月";
  }

  function advanceOneMonth() {
    const t = ensureTime();
    t.month += 1;
    if (t.month > 12) {
      t.year += 1;
      t.month = 1;
    }
    const events = [];
    // 多月推进不能跳过第36月钉子；到点或越过都触发。
    if (totalMonths() >= 36 && !Game.state.flags.vowBossDue) {
      Game.state.flags.vowBossDue = true;
      events.push({ type: "timeEvent", id: "vow_boss_due" });
    }
    const life = Game.spendLifespan ? Game.spendLifespan(1, "month") : null;
    if (life && life.dead) events.push({ type: "life_death", left: life.left });
    const monthEvent = Game.monthEvents && Game.monthEvents.rollAfterMonth && Game.monthEvents.rollAfterMonth();
    if (monthEvent) events.push(monthEvent);
    return events;
  }

  function advanceMonths(months) {
    const n = Math.max(0, Math.round(Number(months) || 0));
    const events = [];
    for (let i = 0; i < n; i += 1) {
      events.push.apply(events, advanceOneMonth());
    }
    return events;
  }

  function advanceMonth() {
    return advanceMonths(1);
  }

  Game.time = { ensureTime, totalMonths, label, ageLabel, cultivationLabel, advanceMonth, advanceMonths };
})(window.Game = window.Game || {});
