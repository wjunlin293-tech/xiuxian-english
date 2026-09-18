/* ───────────────────────────────────────────────────────────────
 * yiguo.js · 异果「言典十果」图鉴 + 剧情获得 + 纳入回响
 * 借旧版异火榜：rank 十果(10末位→1榜首)·古雅名·未解锁剪影·独立图鉴入口·PNG缺图回退emoji。
 * P-FRUIT：真异果不再由雾岭概率采集；只允许剧情节点调用 grantByStory() 授予。
 * demo 阶段以体内误食果、裴家果核做伏笔；图鉴先展示十果格局，不把异果做成可刷资源。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const FRUITS = [
    { id: "taichu_qingming", rank: 10, name: "太初青冥果", real: false },
    { id: "cang_lan_gui_xu", rank: 9, name: "沧澜归墟果", real: true,
      attr: "神识", rarity: "稀有", theme: "思辨 · 见微知著", emoji: "🫐",
      lore: "由尘埃与墨香孕育的淡蓝异果，传闻曾在雾岭深处显影；唯神识澄明者能窥见其形。",
      bonus: { sense: 18 }, weapon: "归墟 · 照渊" },
    { id: "bu_mie_fen_gao", rank: 8, name: "不灭焚膏果", real: true,
      attr: "法力", rarity: "史诗", theme: "鏖战 · 久持不灭", emoji: "🔥",
      lore: "午夜不熄、以执念为薪的赤金异果，越是苦战越烧得旺。",
      bonus: { mp: 16 }, weapon: "焚膏 · 沸澜" },
    { id: "chi_xiao_zui_sheng", rank: 7, name: "赤霄醉笙果", real: false },
    { id: "jiu_you_bai_gu", rank: 6, name: "九幽白骨果", real: false },
    { id: "liu_jin_fu_hua", rank: 5, name: "鎏金浮华果", real: false },
    { id: "qi_jie_xuan_yuan", rank: 4, name: "七劫玄渊果", real: false },
    { id: "xuan_tie_shi_hun", rank: 3, name: "玄铁噬魂果", real: true,
      attr: "防御 + 力量", rarity: "传说", theme: "周旋 · 沉缄如铁", emoji: "🪨",
      lore: "黑铁之色、长沉默食骄气的异果，唯忍得住锋芒、不轻易出手者方能驯服。",
      bonus: { def: 14, str: 12 }, weapon: "噬魂 · 玄铁" },
    { id: "zhu_chi_fen_gong", rank: 2, name: "朱赤焚宫果", real: false },
    { id: "fen_tian_shi_shi", rank: 1, name: "焚天噬世果", real: false },
  ];

  function mountEl() { return document.getElementById("stage"); }
  function byId(id) { return FRUITS.find((f) => f.id === id); }
  function nameOf(id) { const f = byId(id); return f ? f.name : id; }
  function bag() { Game.normalizeState && Game.normalizeState(); if (!Game.state.yiguo) Game.state.yiguo = {}; return Game.state.yiguo; }
  function obtained(id) { return !!bag()[id]; }
  function obtainedCount() { return FRUITS.filter((f) => obtained(f.id)).length; }
  function realTotal() { return FRUITS.length; }

  function bonusStr(bonus) {
    return Game.ATTRS.filter((a) => bonus && bonus[a.key]).map((a) => a.name + " +" + bonus[a.key]).join("、");
  }

  // 图标：../素材/异果/<id>.png 优先，缺图 onerror 回退 emoji（借旧版双层机制·无图也能跑）
  function iconHtml(f) {
    const fb = (f && f.emoji) || "🍈";
    return '<span class="yg-iconwrap">' +
      '<img class="yg-img" src="../素材/异果/' + f.id + '.png" alt="" ' +
      'onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'">' +
      '<span class="yg-emoji" style="display:none">' + fb + '</span>' +
      '</span>';
  }

  function cardHtml(f) {
    if (f.real && obtained(f.id)) {
      return '<div class="yg-card got">' +
        iconHtml(f) +
        '<div class="yg-info">' +
        '  <div class="yg-name">' + f.name + '<em class="yg-rarity">' + f.rarity + '</em></div>' +
        '  <div class="yg-attr">主属性 · ' + f.attr + '　<span class="dim">' + f.theme + '</span></div>' +
        '  <p class="yg-lore">' + f.lore + '</p>' +
        '  <div class="yg-line">纳入回响：' + bonusStr(f.bonus) + '</div>' +
        '  <div class="yg-line">可炼武器：' + f.weapon + '</div>' +
        '</div></div>';
    }
    return '<div class="yg-card locked">' +
      '<span class="yg-iconwrap locked">❔</span>' +
      '<div class="yg-info"><div class="yg-name">？？？</div>' +
      '<p class="yg-lore dim">异果未现 · 尚待机缘</p></div></div>';
  }

  function showCodex() {
    Game.normalizeState && Game.normalizeState();
    Game.setZone && Game.setZone(null);
    Game.renderHeader && Game.renderHeader();
    const cards = FRUITS.slice().sort((a, b) => b.rank - a.rank).map(cardHtml).join("");
    mountEl().innerHTML =
      '<div class="cult-screen yg-codex">' +
      '  <button class="btn btn-mini zone-back" id="yg-back">退出</button>' +
      '  <div class="cult-head">' +
      '    <div class="wc-tag">言典十果 · 图鉴</div>' +
      '    <h2>言典十果</h2>' +
      '    <p class="dim small">远古“言”破碎，力之残片凝成十果，散于天地。已现 <b>' + obtainedCount() + ' / ' + realTotal() + '</b>。真果只随剧情与因果现身，不可在野外反复采集。</p>' +
      '  </div>' +
      '  <div class="yg-grid">' + cards + '</div>' +
      '</div>';
    mountEl().querySelector("#yg-back").onclick = () => Game.hub.show();
  }

  // hub 小入口（果实图标）
  function entryHtml() {
    return '<button class="yg-entry" id="hub-yiguo" title="言典十果 · 图鉴">' +
      '<span class="yg-entry-ico">🍈</span>' +
      '<span class="yg-entry-txt">言典十果 ' + obtainedCount() + '/' + realTotal() + '</span></button>';
  }

  function grant(f) {
    bag()[f.id] = true;
    Game.applyAttrBonus && Game.applyAttrBonus(f.bonus); // 纳入回响：一次性属性变化（已入存档·不重复加）
  }

  // 仅供剧情节点调用：异果必须来自“杀夺/心甘奉上/天生命数”等剧情因果，不再来自探险概率采集。
  function grantByStory(id) {
    Game.normalizeState && Game.normalizeState();
    const f = byId(id);
    if (!f || obtained(id)) return null;
    grant(f);
    if (Game.modal && Game.modal.event) {
      Game.modal.event({
        tag: "真果入命",
        title: "得「" + f.name + "」",
        body: "这不是野外随手采来的灵材，而是一枚远古言力残片认下的因果。它的回响已纳入你的根基。",
        closeText: "纳入言典"
      });
    }
    return f;
  }

  Game.yiguo = { FRUITS, byId, nameOf, obtained, obtainedCount, grantByStory, showCodex, entryHtml };
})(window.Game = window.Game || {});
