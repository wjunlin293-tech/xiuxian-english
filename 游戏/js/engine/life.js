/* ───────────────────────────────────────────────────────────────
 * life.js · P-LIFE 寿元硬死亡
 * 寿元归零即锁入死亡页；转世、鬼魂复习、开局构筑由 rebirth.js 接入。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  function mountEl() { return document.getElementById("stage"); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function deathInfo() {
    Game.normalizeState && Game.normalizeState();
    return Game.state.lifeDeathInfo || (Game.captureLifeDeathInfo && Game.captureLifeDeathInfo("lifespan")) || {};
  }
  function timeText(info) {
    const t = info.time || (Game.state && Game.state.time) || { year: 1, month: 1 };
    return Game.time && Game.time.ageLabel ? Game.time.ageLabel(t) : "第" + (t.year || 1) + "年" + (t.month || 1) + "月";
  }
  function lifeText() {
    return Game.lifeLabel ? Game.lifeLabel(Game.state.lifespan || 0) : String(Game.state.lifespan || 0) + "月";
  }
  function realmFactor() {
    Game.normalizeState && Game.normalizeState();
    return Math.max(1, (Game.state.realmIndex || 0) + 1);
  }
  function actionCost(type, opts) {
    opts = opts || {};
    const rf = realmFactor();
    if (type === "cultivate") {
      const n = Number(opts.targetNew || opts.size || 0);
      const base = n >= 50 ? 2 : (n >= 20 ? 1 : 0);
      return base * rf;
    }
    if (type === "contemplate") return Math.max(0, Math.round(Number(opts.months || opts.burnMonths || 6 * rf) || 0));
    if (type === "explore_flee") return Math.max(0, 1 * rf - (Game.state.flags && Game.state.flags.originMountainBody ? 1 : 0));
    if (type === "explore_defeat") return 6 * rf;
    if (type === "forbidden") return 12 * rf;
    return 0;
  }
  function labelMonths(months) {
    return Game.lifeLabel ? Game.lifeLabel(months) : String(months || 0) + "月";
  }
  function costLine(type, opts) {
    const extra = actionCost(type, opts);
    return extra > 0 ? "耗时 1 月 · 燃寿 " + labelMonths(extra) : "耗时 1 月";
  }
  function spendActionExtra(type, opts) {
    const extra = actionCost(type, opts);
    if (extra <= 0) return { dead: false, spent: 0, left: Game.state && Game.state.lifespan || 0 };
    const res = Game.spendLifespan ? Game.spendLifespan(extra, type) : { dead: false, spent: extra };
    if (Game.logEvent) Game.logEvent("⌛ 折寿 · " + labelMonths(extra));
    return res;
  }

  function settlementHtml(info) {
    const recent = (info.events || []).map((e) => '<li>' + esc(e.text || "") + '</li>').join("");
    return '<div class="life-settlement" id="life-settlement" hidden>' +
      '  <h3>本世结算</h3>' +
      '  <div class="life-stats">' +
      '    <div><b>' + esc(timeText(info)) + '</b><span>止步年月</span></div>' +
      '    <div><b>' + esc(info.realm || Game.realmName()) + '</b><span>最高境界</span></div>' +
      '    <div><b>' + (info.totalMastered || 0) + '</b><span>总掌握词</span></div>' +
      '    <div><b>' + (info.exp || 0) + '</b><span>剩余言气</span></div>' +
      '  </div>' +
      '  <p class="dim small">真实掌握过的词不会随角色死亡抹去；踏入轮回后，已学之词会随记忆留存，未稳固的词会化作前世鬼魂来寻你。</p>' +
      (recent ? '<ul class="life-events">' + recent + '</ul>' : '') +
      '</div>';
  }

  function showDeath(message) {
    Game.normalizeState && Game.normalizeState();
    if (!Game.state.lifeDead && Game.checkLifeDeath) Game.checkLifeDeath("lifespan");
    Game.setZone && Game.setZone("ending");
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "life_death" });
    const info = deathInfo();
    const el = mountEl();
    if (!el) return;
    el.innerHTML =
      '<div class="life-death-screen">' +
      '  <div class="wc-tag">大限已至 · Game Over</div>' +
      '  <h2>灯尽于 ' + esc(timeText(info)) + '</h2>' +
      '  <p>这一夜，沈砚合上《天外言典》，指尖却再也翻不动下一页。窗外的风吹过书院旧檐，像有人低声读完了他的名字。</p>' +
      '  <p>肉身会朽，识海会散，可那些真正刻进心里的字没有死。它们像灰烬里未灭的星火，等着下一世重新聚成火光。</p>' +
      '  <div class="life-meter dead"><span>剩余寿元</span><b>' + esc(lifeText()) + '</b></div>' +
      (message ? '  <p class="life-note">' + esc(message) + '</p>' : '') +
      settlementHtml(info) +
      '  <div class="life-actions">' +
      '    <button class="btn btn-gold" id="life-summary">查看本世结算</button>' +
      '    <button class="btn" id="life-rebirth">踏入轮回 ▸</button>' +
      '    <button class="btn btn-mini" id="life-menu">回主菜单</button>' +
      '  </div>' +
      '</div>';
    const settlement = el.querySelector("#life-settlement");
    const summary = el.querySelector("#life-summary");
    if (summary && settlement) summary.onclick = () => {
      settlement.hidden = !settlement.hidden;
      summary.textContent = settlement.hidden ? "查看本世结算" : "收起本世结算";
    };
    const rebirth = el.querySelector("#life-rebirth");
    if (rebirth) rebirth.onclick = () => Game.rebirth && Game.rebirth.showMemory ? Game.rebirth.showMemory() : showRebirthStub();
    const menu = el.querySelector("#life-menu");
    if (menu) menu.onclick = () => Game.menu && Game.menu.backToMenu ? Game.menu.backToMenu() : location.reload();
  }

  function showRebirthStub() {
    Game.renderHeader && Game.renderHeader();
    mountEl().innerHTML =
      '<div class="life-death-screen">' +
      '  <div class="wc-tag">转世记忆 · 模块未载入</div>' +
      '  <h2>灰烬里未散的音节</h2>' +
      '  <p>黑暗里，有些字没有沉下去。它们围着你，像前世残灯，也像下一世的路标。</p>' +
      '  <p class="dim">轮回模块未载入时显示此兜底页；正常版本会进入死亡结算、记忆点数、前世鬼魂复习和开局点数构筑。</p>' +
      '  <div class="life-actions">' +
      '    <button class="btn btn-gold" id="life-back-death">回到大限页</button>' +
      '    <button class="btn btn-mini" id="life-menu">回主菜单</button>' +
      '  </div>' +
      '</div>';
    mountEl().querySelector("#life-back-death").onclick = () => showDeath();
    mountEl().querySelector("#life-menu").onclick = () => Game.menu && Game.menu.backToMenu ? Game.menu.backToMenu() : location.reload();
  }

  function guard(message) {
    if (Game.isLifeDead && Game.isLifeDead()) {
      showDeath(message);
      return true;
    }
    return false;
  }

  function showContemplate() {
    Game.normalizeState && Game.normalizeState();
    Game.setZone && Game.setZone("practice");
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "hub" });
    const rf = realmFactor();
    const gainPerMonth = 5 + (Game.state.realmIndex || 0) * 3;
    const lifespan = Game.state.lifespan || 0;
    // 静参会先耗 1 月日历寿元（advanceMonth），再燃你选的寿元。
    // 安全上限＝lifespan-2（留 1 月日历 + 1 月保命底）→ 静参永远烧不死自己。
    // 寿元过低（≤2 月）时不提供燃寿，别把死亡触发点藏进一个"感悟"菜单里。
    const safeMax = lifespan - 2;
    if (safeMax < 1) {
      mountEl().innerHTML =
        '<div class="story-page life-contemplate">' +
        '  <div class="story-body">' +
        '    <div class="wc-tag">悟道 · 静参</div>' +
        '    <h2>以寿燃灯，照一字之深</h2>' +
        '    <p>沈砚闭目端坐，却觉识海里的火，已弱得再经不起一分燃烧。</p>' +
        '    <p class="dim small">寿元将尽（剩 ' + esc(labelMonths(lifespan)) + '），不宜再燃。先去背词修炼或突破以延寿，方能再谈静参。</p>' +
        '  </div>' +
        '  <div class="life-actions">' +
        '    <button class="btn" id="life-contemplate-back">暂不耗寿</button>' +
        '  </div>' +
        '</div>';
      mountEl().querySelector("#life-contemplate-back").onclick = () => Game.hub && Game.hub.show();
      return;
    }
    const defaultBurn = Math.min(Math.max(1, 6 * rf), safeMax);
    const burnOptions = [1, 3, 6, 12, 24, 60].filter((n, i, arr) => n <= safeMax && arr.indexOf(n) === i);
    if (!burnOptions.includes(defaultBurn)) burnOptions.push(defaultBurn);
    burnOptions.sort((a, b) => a - b);
    const optionHtml = burnOptions.map((n) =>
      '<button class="btn btn-mini life-burn-option' + (n === defaultBurn ? ' active' : '') + '" data-burn="' + n + '">' + labelMonths(n) + '</button>'
    ).join("");
    mountEl().innerHTML =
      '<div class="story-page life-contemplate">' +
      '  <div class="story-body">' +
      '    <div class="wc-tag">悟道 · 静参</div>' +
      '    <h2>以寿燃灯，照一字之深</h2>' +
      '    <p>沈砚闭目端坐，把寿元压成识海里的一缕火。此法不适合常用，却能在瓶颈前换来一线明悟。</p>' +
      '    <div class="life-burn-panel">' +
      '      <div class="life-burn-head"><span>选择燃寿</span><b id="life-burn-picked">' + esc(labelMonths(defaultBurn)) + '</b></div>' +
      '      <div class="life-burn-options">' + optionHtml + '</div>' +
      '      <label class="life-burn-custom">自定燃寿（月）<input id="life-burn-input" type="number" min="1" max="' + safeMax + '" step="1" value="' + defaultBurn + '"></label>' +
      '    </div>' +
      '    <div class="life-meter"><span id="life-burn-cost">' + esc(costLine("contemplate", { months: defaultBurn })) + '</span><b id="life-burn-gain">言气 +' + (Game.applyQiGainRate ? Game.applyQiGainRate(defaultBurn * gainPerMonth) : defaultBurn * gainPerMonth) + '</b></div>' +
      '    <p class="dim small">静参本身耗时 1 月；你额外选择燃掉多少寿元，就换取对应言气。境界越高，每月燃寿换来的明悟更多，但正常背词修炼仍是最稳的长生路。</p>' +
      '  </div>' +
      '  <div class="life-actions">' +
      '    <button class="btn btn-gold" id="life-contemplate-do">燃寿静参</button>' +
      '    <button class="btn" id="life-contemplate-back">暂不耗寿</button>' +
      '  </div>' +
      '</div>';
    let burnMonths = defaultBurn;
    const maxBurn = safeMax;
    const picked = mountEl().querySelector("#life-burn-picked");
    const costNode = mountEl().querySelector("#life-burn-cost");
    const gainNode = mountEl().querySelector("#life-burn-gain");
    const input = mountEl().querySelector("#life-burn-input");
    const doBtn = mountEl().querySelector("#life-contemplate-do");
    function clampBurn(v) {
      return Math.max(1, Math.min(maxBurn, Math.round(Number(v) || 1)));
    }
    function setBurn(v) {
      burnMonths = clampBurn(v);
      if (input) input.value = String(burnMonths);
      if (picked) picked.textContent = labelMonths(burnMonths);
      if (costNode) costNode.textContent = costLine("contemplate", { months: burnMonths });
      if (gainNode) gainNode.textContent = "言气 +" + (Game.applyQiGainRate ? Game.applyQiGainRate(burnMonths * gainPerMonth) : burnMonths * gainPerMonth);
      if (doBtn) doBtn.textContent = "燃寿 " + labelMonths(burnMonths) + " 静参";
      mountEl().querySelectorAll(".life-burn-option").forEach((b) => {
        b.classList.toggle("active", Number(b.dataset.burn) === burnMonths);
      });
    }
    mountEl().querySelectorAll(".life-burn-option").forEach((b) => {
      b.onclick = () => setBurn(Number(b.dataset.burn));
    });
    if (input) input.oninput = () => setBurn(input.value);
    setBurn(defaultBurn);
    mountEl().querySelector("#life-contemplate-back").onclick = () => Game.hub && Game.hub.show();
    mountEl().querySelector("#life-contemplate-do").onclick = () => {
      const cost = actionCost("contemplate", { months: burnMonths });
      const gain = Game.applyQiGainRate ? Game.applyQiGainRate(burnMonths * gainPerMonth) : burnMonths * gainPerMonth;
      const events = Game.gainExp ? Game.gainExp(gain, { scaled: true }) : [];
      (events || []).forEach((ev) => {
        if (!Game.logEvent) return;
        if (ev.type === "breakthrough") Game.logEvent("⚡ 突破 · " + ev.from + " → " + ev.to);
        if (ev.type === "realm_wall") Game.logEvent("⛰ 境界墙 · 凝言圆满，尚缺外界灵脉与突破丹");
      });
      Game.time && Game.time.advanceMonth && Game.time.advanceMonth();
      spendActionExtra("contemplate", { months: cost });
      Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("contemplate", "燃寿" + labelMonths(cost));
      Game.save && Game.save.write({ view: "hub" });
      Game.renderHeader && Game.renderHeader();
      if (guard("静参耗去寿元，灯火已尽。")) return;
      Game.hub && Game.hub.show("静参一月，燃寿 " + labelMonths(cost) + "，言气 +" + gain + "。");
    };
  }

  Game.life = { showDeath, guard, showRebirthStub, showContemplate, realmFactor, actionCost, costLine, spendActionExtra };
})(window.Game = window.Game || {});
