/* ───────────────────────────────────────────────────────────────
 * month_events.js · P-MODAL-B 低频月度奇遇
 * 原则：只在行动结束回到 hub 后弹；低概率 + 冷却；普通月份不打扰。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const CHANCE = 0.14;
  const MIN_MONTH = 3;
  const COOLDOWN_MIN = 4;
  const COOLDOWN_SPREAD = 3;

  function flags() {
    Game.normalizeState && Game.normalizeState();
    Game.state.flags = Game.state.flags || {};
    return Game.state.flags;
  }
  function nowMonth() {
    return Game.time && Game.time.totalMonths ? Game.time.totalMonths() : (Game.currentMonthNumber ? Game.currentMonthNumber() : 1);
  }
  function realmScale() {
    return Math.max(1, (Game.state && Game.state.realmIndex || 0) + 1);
  }
  function safeGainExp(amount) {
    Game.normalizeState && Game.normalizeState();
    const s = Game.state;
    const room = Math.max(0, (s.expToBreak || 0) - (s.exp || 0) - 1);
    const scaled = Game.applyQiGainRate ? Game.applyQiGainRate(amount || 0) : Math.floor(amount || 0);
    const n = Math.max(0, Math.min(Math.floor(scaled || 0), room));
    if (n > 0) {
      s.exp += n;
      s.yanqi = s.exp;
      if (Game.logEvent) Game.logEvent("✨ 月度感悟 · 言气 +" + n);
    }
    return n;
  }
  function addMat(name, count) {
    Game.addItem && Game.addItem(name, count || 1);
    if (Game.logEvent) Game.logEvent("🌿 月度奇遇 · 得" + name + "×" + (count || 1));
  }
  function rewardLine(text) {
    if (Game.visual && Game.visual.toast) Game.visual.toast(text, "gold");
  }

  const EVENTS = [
    {
      id: "rain_copy",
      tag: "月度奇遇",
      title: "夜雨抄卷",
      body: "夜雨敲在藏言楼檐角。你借着一盏残灯，把半页旧卷抄到天明，字里有一缕迟来的清意。",
      label: "收下心得",
      apply: function () {
        const n = safeGainExp(8 + realmScale() * 4);
        rewardLine(n ? "夜雨抄卷 · 言气 +" + n : "夜雨抄卷 · 心神已满，待破境后再悟");
      },
    },
    {
      id: "tail_market",
      tag: "坊市尾市",
      title: "摊主收摊前叫住你",
      body: "坊市将散，一名老摊主把几枚碎灵石塞进你掌心：“小友常来，今日便当结个善缘。”",
      label: "谢过摊主",
      apply: function () {
        const n = 5 + realmScale() * 3;
        Game.gainMoney && Game.gainMoney(n, "坊市尾市");
        rewardLine("坊市尾市 · 灵石 +" + n);
      },
    },
    {
      id: "herb_dew",
      tag: "药圃微光",
      title: "露水没有落进泥里",
      body: "清晨药圃薄雾未散，一滴凝露悬在草叶尖，像被某个未说出口的字托住。",
      label: "小心收起",
      apply: function () {
        const mat = (Game.state.realmIndex || 0) >= 1 ? "月华露" : "凝露草";
        addMat(mat, 1);
        rewardLine("药圃微光 · " + mat + "×1");
      },
    },
    {
      id: "old_bell",
      tag: "书院暮钟",
      title: "暮钟慢了一拍",
      body: "书院暮钟今日慢了一拍。那一拍落进识海，竟让几日浮躁压下去一些。",
      label: "静听余音",
      apply: function () {
        const n = safeGainExp(5 + realmScale() * 3);
        rewardLine(n ? "暮钟余音 · 言气 +" + n : "暮钟余音 · 心神已满");
      },
    },
    {
      id: "loose_bone",
      tag: "后山遗落",
      title: "竹根旁埋着旧兽骨",
      body: "后山竹根被雨水冲开，露出一截低阶兽骨。看断口，像是很久以前某次巡山留下的残物。",
      label: "带回丹房",
      apply: function () {
        addMat("低阶兽骨", 1);
        rewardLine("后山遗落 · 低阶兽骨×1");
      },
    },
    // —— P-FEEL-C 低频奇遇扩展（`43`§1）·世界反馈驱动·可错过可不理·守铁律只给叙事/线索/材料/好感 ——
    {
      id: "night_knock",
      tag: "夜半叩窗",
      title: "有人在窗纸上敲了三下",
      body: "子夜，杂役房的窗纸被极轻地叩了三下。你披衣去看，窗外空无一人，只有廊下积水映着半枚缺月。回身时，你瞥见识海里那卷残页，无风自动了一瞬。",
      label: "记下这一夜",
      apply: function () {
        // 纯叙事·埋 F17（藏言楼半夜不止一人＝云栀）。不发奖励，可不理。
        rewardLine("夜半叩窗 · 你把这桩说不清的小事，压进了心底");
      },
    },
    {
      id: "corner_note",
      tag: "墙角字条",
      title: "青砖缝里夹着一张字条",
      body: "扫到弃字阶最里侧，你在一道砖缝里摸出一张折得极小的纸条。上面只有一行清瘦小楷：“少走藏言楼西侧，那处近来有人守着。”没有落款，墨痕却新。",
      label: "烧了纸条",
      apply: function () {
        // 埋 F17/裴昭式暗护·给一点点好感倾向（仅人物已相逢时加，避免凭空）。
        if (Game.affinityOf && Game.affinityOf("pei_zhao") > 0 && Game.addAffinity) {
          Game.addAffinity("pei_zhao", 1, "（有人在暗处替你避开了什么）");
        }
        rewardLine("墙角字条 · 你记住了那行没有落款的字");
      },
    },
    {
      id: "market_whisper",
      tag: "坊市低语",
      title: "两名散修压着嗓子说话",
      body: "坊市角落，两名散修压着嗓子：“……听说雾岭那缕果香断了，被人先一步摘了。”“十枚里又少一枚喽。”话到你近处，他们警觉地噤了声，斜你一眼便散开。",
      label: "不动声色走开",
      apply: function () {
        // 埋异果十果流言（F26/F28 世界观）。纯信息，不发奖励。
        rewardLine("坊市低语 · 天地间的果，原来一直有人在争");
      },
    },
    {
      id: "backhill_stir",
      tag: "后山异动",
      title: "竹林深处惊起一群夜鸟",
      body: "后山倒灰时，竹林深处毫无征兆地惊起一群夜鸟。那方向没有兽吼，只有一股极淡、极陌生的气息一掠而过——像什么东西路过，又像在避着什么。",
      label: "远远避开",
      apply: function () {
        // 给一点野物残料·守铁律非战力。给材料而非属性。
        var mat = (Game.state.realmIndex || 0) >= 1 ? "兽魂晶" : "低阶兽骨";
        addMat(mat, 1);
        rewardLine("后山异动 · 你在鸟惊处拾得 " + mat + "×1");
      },
    },
    {
      id: "rain_corridor",
      tag: "雨廊相遇",
      title: "檐雨把两个人困在同一段回廊",
      body: "骤雨把你和一个同样避雨的人困在回廊两端。对方没搭话，只在雨势稍歇时，把半块干粮搁在中间的栏上，起身走进雨里。你拿起时，还是温的。",
      label: "收下那半块干粮",
      apply: function () {
        // 随机小暖·若二两已相逢给他一点好感，否则纯叙事。
        if (Game.affinityOf && Game.affinityOf("er_liang") > 0 && Game.addAffinity) {
          Game.addAffinity("er_liang", 1, "（二两 嘴上不说，把你这顿记在了心里）");
        }
        var n = safeGainExp(4);
        rewardLine(n ? "雨廊相遇 · 一点暖意入心 · 言气 +" + n : "雨廊相遇 · 一点暖意，你记下了");
      },
    },
    {
      id: "ledger_glimpse",
      tag: "账本一角",
      title: "二两的账本翻开在最后一页",
      body: "二两睡熟了，那本油乎乎的账本歪在草席边，翻开在最后一页。你没细看，只瞥见那页记的不是欠账——是一行歪歪扭扭的字，被他用手肘半盖着。",
      label: "替他把账本合好",
      apply: function () {
        // 埋二两情感伏笔（账本最后一页写的是"沈砚会成大器"）。纯叙事。
        rewardLine("账本一角 · 你替他合上了那页，没有看完");
      },
    },
  ];

  function eligible() {
    const idx = Game.state && Game.state.realmIndex || 0;
    return EVENTS.filter((e) => e.minRealm == null || idx >= e.minRealm);
  }
  function byId(id) {
    return EVENTS.find((e) => e.id === id);
  }
  function rollAfterMonth() {
    const f = flags();
    if (Game.state.lifeDead) return null;
    if (f.monthEventPending) return null;
    const m = nowMonth();
    if (m < MIN_MONTH) return null;
    if (f.monthEventCooldownUntil && m < f.monthEventCooldownUntil) return null;
    if (Math.random() > CHANCE) return null;
    const list = eligible();
    if (!list.length) return null;
    const ev = list[Math.floor(Math.random() * list.length)];
    f.monthEventPending = { id: ev.id, month: m };
    f.monthEventCooldownUntil = m + COOLDOWN_MIN + Math.floor(Math.random() * COOLDOWN_SPREAD);
    return { type: "month_event", id: ev.id };
  }
  function showPending() {
    const f = flags();
    const pending = f.monthEventPending;
    if (!pending || !pending.id || !Game.modal) return false;
    const ev = byId(pending.id);
    if (!ev) {
      delete f.monthEventPending;
      Game.save && Game.save.write({ view: "hub" });
      return false;
    }
    Game.modal.open({
      kind: "event",
      tag: ev.tag,
      title: ev.title,
      body: ev.body,
      actions: [{
        label: ev.label || "收下",
        value: true,
        gold: true,
        onClick: function () {
          delete f.monthEventPending;
          ev.apply && ev.apply();
          Game.save && Game.save.write({ view: "hub" });
          Game.renderHeader && Game.renderHeader();
          Game.hub && Game.hub.show("月度奇遇：" + ev.title);
        },
      }],
    });
    return true;
  }
  function force(id) {
    const ev = byId(id) || EVENTS[0];
    flags().monthEventPending = { id: ev.id, month: nowMonth() };
    return ev.id;
  }

  Game.monthEvents = { EVENTS, rollAfterMonth, showPending, force };
})(window.Game = window.Game || {});
