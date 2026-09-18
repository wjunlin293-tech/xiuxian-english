/* ───────────────────────────────────────────────────────────────
 * explore.js · 探险打野
 * R29：3 个 demo 区域，建议境界、单场战斗、概率掉落、逃跑扣言气、失败软惩罚。
 * P-FRUIT：真异果不再由探险概率采集；雾岭只保留果香伏笔、精怪战与残髓材料。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const FLEE_EXP_COST = 8; // 待用户定：逃跑损耗言气数值
  // 探险战败＝软惩罚「重伤生还」（用户 2026-06-21 拍板·非硬重开）。损耗言气按当前境界阈值缩放。
  // 约束：重于退避 FLEE_EXP_COST、显著小于一月修炼产出、不扣永久属性/材料。数值占位待 C-05。
  const DEFEAT_EXP_COST_MIN = 20;
  const DEFEAT_EXP_COST_RATE = 0.06;
  const GROUP_CHANCES = [
    { n: 1, chance: 0.86, label: "独行" },
    { n: 2, chance: 0.12, label: "双影夹击" },
    { n: 3, chance: 0.02, label: "三面围杀" },
  ];
  const ENEMY_VARIANCE_MIN = 0.9;
  const ENEMY_VARIANCE_MAX = 1.15;

  const ZONES = [
    {
      id: "bamboo_path",
      name: "后山竹径",
      desc: "书院后山的碎石小径，夜里常有残影徘徊。凡身也可试炼。",
      realmReq: 0,
      difficulty: "低",
      visualZone: "wild-bamboo",
      enemies: [
        { name: "竹径残影", hp: 36, str: 12, def: 0, sense: 8, realm: "凡身", art: "../素材/敌人/bamboo-remnant.png" },
        { name: "裂竹小妖", hp: 31, str: 15, def: 0, sense: 6, realm: "凡身", art: "../素材/敌人/bamboo-remnant.png" },
        { name: "夜露藤魅", hp: 44, str: 10, def: 2, sense: 10, realm: "凡身", art: "../素材/敌人/bamboo-remnant.png" },
      ],
      flavors: [
        "夜露压弯了竹梢，碎石小径上浮着一层薄白的月光。",
        "风穿竹林，沙沙如有人低语。沈砚握紧了袖中那点言气。",
        "一道残影在竹影间一闪，旧伤似的隐痛又爬上识海。",
      ],
      drops: [
        { key: "碎灵木", min: 1, max: 2, chance: 1 },
        { key: "低阶兽骨", min: 1, max: 1, chance: 0.7 },
        { key: "玄铁砂", min: 1, max: 1, chance: 0.15 },
        { key: "兽魂晶", min: 1, max: 1, chance: 0.1 },
      ],
    },
    {
      id: "mist_cave",
      name: "雾锁石窟",
      desc: "石窟中寒雾不散，凝言之前踏入极易迷失。启言境较稳，低境也可冒险。",
      realmReq: 1,
      difficulty: "中",
      visualZone: "wild-cave",
      enemies: [
        { name: "石窟妖影", hp: 63, str: 21, def: 3, sense: 18, realm: "启言境", art: "../素材/敌人/mist-cave-shadow.png" },
        { name: "寒雾石灵", hp: 78, str: 18, def: 6, sense: 16, realm: "启言境", art: "../素材/敌人/mist-cave-shadow.png" },
        { name: "刻痕怨魂", hp: 55, str: 25, def: 2, sense: 23, realm: "启言境", art: "../素材/敌人/mist-cave-shadow.png" },
      ],
      flavors: [
        "寒雾贴着石壁游走，火折子的光只照得出三步远。",
        "洞顶滴水成韵，每一声都像敲在识海上。",
        "石窟更深处传来一声闷响，像是有什么在雾里翻了个身。",
      ],
      drops: [
        { key: "寒铁屑", min: 1, max: 2, chance: 1 },
        { key: "凝露草", min: 1, max: 1, chance: 0.7 },
        { key: "玄铁砂", min: 1, max: 1, chance: 0.25 },
        { key: "凝言髓", min: 1, max: 1, chance: 0.12 },
        { key: "古篆残片", min: 1, max: 1, chance: 0.12 },
      ],
    },
    {
      id: "mist_ridge",
      name: "雾岭 · 果香外谷",
      desc: "北境雾岭外谷，一缕果香终年不散。凝言境较稳，低境强闯多半凶险。",
      realmReq: 2,
      difficulty: "高",
      visualZone: "wild-ridge",
      enemies: [
        { name: "异果精怪", hp: 105, str: 33, def: 9, sense: 45, realm: "凝言境", art: "../素材/敌人/fruit-spirit.png" },
        { name: "雾岭藤魇", hp: 122, str: 29, def: 12, sense: 42, realm: "凝言境", art: "../素材/敌人/fruit-spirit.png" },
        { name: "果香魇影", hp: 92, str: 39, def: 7, sense: 52, realm: "凝言境", art: "../素材/敌人/fruit-spirit.png" },
      ],
      flavors: [
        "果香一阵浓过一阵，甜得发腻，像在引人往更深处走。",
        "雾岭深处草木无声，连风都被那股香气压住了。",
        "你眼前忽然亮起几点幽光——是异果的精怪，正盯着闯入者。",
      ],
      drops: [
        { key: "凝言髓", min: 1, max: 2, chance: 1 },
        { key: "玄铁砂", min: 1, max: 1, chance: 0.6 },
        { key: "古篆残片", min: 1, max: 1, chance: 0.2 },
        { key: "异果果髓", min: 1, max: 1, chance: 0.15 },
      ],
    },
  ];

  // 随机奇遇（P-33）：探险时约 35% 触发，无战斗、给材料/言气或小损耗，增加变化。
  // kind 仅作注释；minRealm/zone 控制出现条件。
  const ENCOUNTERS = [
    { id: "relic", text: "断壁下半埋着一只旧木匣，锈锁一碰即碎——里头是前人遗落的炼器残料。",
      drops: [{ key: "玄铁砂", min: 1, max: 2, chance: 1 }, { key: "古篆残片", min: 1, max: 1, chance: 0.5 }] },
    { id: "insight", text: "一株无名草在雾里微微发亮。你盯着它看了很久，识海忽然通透了一瞬。", exp: 18 },
    { id: "spring", text: "一汪月华映泉藏在石隙间，你掬水而饮，神识为之一清。",
      drops: [{ key: "月华露", min: 1, max: 1, chance: 1 }], exp: 8 },
    { id: "herb", text: "崖壁上垂着几茎凝露草，沾着隔夜的灵气，伸手即可采下。",
      drops: [{ key: "凝露草", min: 1, max: 2, chance: 1 }] },
    { id: "beast", text: "你撞见一头濒死的灵兽，它望了你一眼，化作点点流光——留下一枚温热的兽魂晶。",
      drops: [{ key: "兽魂晶", min: 1, max: 1, chance: 1 }] },
    { id: "merchant", text: "雾中走来一个挑担的游方修士，用几句闲话换走你一缕言气，留下些草药。",
      drops: [{ key: "凝露草", min: 1, max: 1, chance: 1 }, { key: "月华露", min: 1, max: 1, chance: 0.5 }], cost: 6 },
    { id: "trap", text: "脚下苔石松动，你险些跌进暗沟，护身真气散了一线。", cost: 10 },
    { id: "ambush", text: "暗处射来一道冷光，你堪堪侧身避开，衣袂却被划破，惊出一身冷汗。", cost: 12 },
    { id: "empty", text: "这一程风平浪静，除了满身雾水，什么也没遇上。" },
    { id: "carving", text: "石窟深处一面残碑，刻满你读不全的古篆。你借着微光，拓下其中几片。",
      minRealm: 1, drops: [{ key: "古篆残片", min: 1, max: 2, chance: 1 }, { key: "凝言髓", min: 1, max: 1, chance: 0.4 }] },
    { id: "fruit_trace", text: "果香比往常更浓，林间却空无一物——像是有什么刚被惊走，只留下一缕残髓。",
      zone: "mist_ridge", drops: [{ key: "异果果髓", min: 1, max: 1, chance: 0.5 }, { key: "凝言髓", min: 1, max: 1, chance: 1 }] },
    { id: "old_blade", text: "一柄断刃斜插在乱石间，刃身古拙、寒气未散，似有来历。你拔了出来。",
      minRealm: 1, drops: [{ key: "寒铁屑", min: 2, max: 3, chance: 1 }, { key: "古篆残片", min: 1, max: 1, chance: 0.3 }] },
  ];
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function wonText(won) { return won.map((d) => d.key + " ×" + d.amount).join("、"); }

  function mountEl() { return document.getElementById("stage"); }

  function realmReqLabel(i) {
    return Game.REALMS[i] || Game.REALMS[Game.REALMS.length - 1];
  }

  function canEnter(zone) {
    return true;
  }

  function canSee(zone) {
    return true;
  }

  function battleScore(attrs) {
    attrs = attrs || {};
    return Math.round(
      (attrs.hp || 0) * 0.35 +
      (attrs.str || 0) * 2.2 +
      (attrs.def || 0) * 1.8 +
      (attrs.sense || 0) * 1.25 +
      (attrs.mp || 0) * 0.8
    );
  }

  function enemyScore(enemy) {
    enemy = enemy || {};
    if (Array.isArray(enemy.enemies)) return enemy.enemies.reduce((sum, e) => sum + enemyScore(e), 0);
    return Math.round(
      (enemy.hp || 0) * 0.42 +
      (enemy.str || 0) * 2.8 +
      (enemy.def || 0) * 2 +
      (enemy.sense || 0) * 1.15
    );
  }

  function strongestEnemy(zone) {
    const pool = (zone && zone.enemies) || (zone && zone.enemy ? [zone.enemy] : []);
    return pool.reduce((best, e) => enemyScore(e) > enemyScore(best) ? e : best, pool[0] || {});
  }

  function rollGroupSize(random) {
    const rand = random || Math.random;
    const r = rand();
    let acc = 0;
    for (let i = 0; i < GROUP_CHANCES.length; i++) {
      acc += GROUP_CHANCES[i].chance;
      if (r < acc) return GROUP_CHANCES[i];
    }
    return GROUP_CHANCES[0];
  }

  function varianceLabel(mult) {
    if (mult >= 1.09) return "气息凶戾";
    if (mult <= 0.96) return "气息偏弱";
    return "气息寻常";
  }

  function scaleEnemy(e, mult, index) {
    const suffix = index > 0 ? "·" + (index + 1) : "";
    return {
      name: e.name + suffix,
      hp: Math.max(1, Math.round(e.hp * mult)),
      str: Math.max(1, Math.round(e.str * mult)),
      def: Math.max(0, Math.round(e.def * mult)),
      sense: Math.max(0, Math.round((e.sense || 0) * mult)),
      realm: e.realm,
      art: e.art,
      variance: mult,
      aura: varianceLabel(mult),
    };
  }

  function rollEnemyPack(zone, random) {
    const rand = random || Math.random;
    const pool = (zone.enemies && zone.enemies.length ? zone.enemies : [zone.enemy]).filter(Boolean);
    const group = rollGroupSize(rand);
    const enemies = [];
    for (let i = 0; i < group.n; i++) {
      const base = pool[Math.floor(rand() * pool.length)];
      const mult = ENEMY_VARIANCE_MIN + rand() * (ENEMY_VARIANCE_MAX - ENEMY_VARIANCE_MIN);
      enemies.push(scaleEnemy(base, mult, i));
    }
    const name = enemies.length > 1 ? group.label + " · " + enemies.map((e) => e.name).join("、") : enemies[0].name;
    const maxSense = Math.max.apply(null, enemies.map((e) => e.sense || 0));
    return { name, enemies, groupLabel: group.label, realm: enemies[0].realm, sense: maxSense, art: enemies[0].art };
  }

  function dangerRatingFor(zone, refEnemy) {
    Game.normalizeState && Game.normalizeState();
    const attrs = Game.totalAttrs ? Game.totalAttrs() : Game.state.attrs;
    const player = battleScore(attrs);
    const enemy = enemyScore(refEnemy);
    const ratio = enemy ? player / enemy : 1;
    const realmGap = (Game.state.realmIndex || 0) - (zone.realmReq || 0);
    let label = "稳妥";
    let cls = "safe";
    let note = "战力与神识都足以应付。";
    if (ratio < 0.55 || realmGap <= -2) {
      label = "九死一生";
      cls = "fatal";
      note = "敌强我弱，能进，但大概率只能重伤生还。";
    } else if (ratio < 0.8 || realmGap < 0) {
      label = "凶险";
      cls = "danger";
      note = "境界或战力偏低，可以试探，别恋战。";
    } else if (ratio < 1.15) {
      label = "可试";
      cls = "try";
      note = "胜负看展露功力、术式爆发与退避时机。";
    }
    const refSense = Array.isArray(refEnemy && refEnemy.enemies)
      ? Math.max.apply(null, refEnemy.enemies.map((e) => e.sense || 0))
      : (refEnemy && refEnemy.sense ? refEnemy.sense : 0);
    return {
      label,
      cls,
      note,
      player,
      enemy,
      ratio,
      suggestedRealm: realmReqLabel(zone.realmReq),
      suggestedSense: refSense,
    };
  }

  function dangerRating(zone) {
    return dangerRatingFor(zone, strongestEnemy(zone));
  }

  function dropsText(drops) {
    return drops.map((d) => {
      const min = d.min == null ? (d.amount || 1) : d.min;
      const max = d.max == null ? min : d.max;
      const amount = min === max ? "×" + min : "×" + min + "–" + max;
      const chance = d.chance == null ? 1 : d.chance;
      return d.key + " " + amount + (chance < 1 ? "（" + Math.round(chance * 100) + "%）" : "");
    }).join("、");
  }

  function rollDrops(drops, random) {
    const rand = random || Math.random;
    return drops.reduce((won, d) => {
      const chance = d.chance == null ? 1 : d.chance;
      if (rand() >= chance) return won;
      const min = d.min == null ? (d.amount || 1) : d.min;
      const max = d.max == null ? min : d.max;
      const amount = min + Math.floor(rand() * (max - min + 1));
      won.push({ key: d.key, amount });
      return won;
    }, []);
  }

  // 击破多敌：每只独立掉一份，奖励随敌数成倍（合并同种材料）。
  function rollDropsTimes(drops, times, random) {
    const n = Math.max(1, times || 1);
    const acc = {};
    for (let i = 0; i < n; i += 1) {
      rollDrops(drops, random).forEach((d) => { acc[d.key] = (acc[d.key] || 0) + d.amount; });
    }
    return Object.keys(acc).map((k) => ({ key: k, amount: acc[k] }));
  }

  function bagSummary() {
    Game.normalizeState && Game.normalizeState();
    const entries = Object.keys(Game.state.bag).filter((k) => Game.state.bag[k] > 0);
    if (!entries.length) return '<span class="dim">暂无材料</span>';
    return entries.map((k) => {
      const icon = Game.itemIconHtml
        ? Game.itemIconHtml(k, k, { className: "bag-pill-icon", type: "material", fallback: "材", decorative: true })
        : "";
      return '<span class="bag-pill">' + icon + (Game.qName ? Game.qName(k, k) : k) + ' ×' + Game.state.bag[k] + '</span>';
    }).join("");
  }

  function showZones(message) {
    Game.normalizeState && Game.normalizeState();
    Game.setZone && Game.setZone("wild");
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "explore" });
    const cards = ZONES.filter(canSee).map((zone) => {
      const risk = dangerRating(zone);
      return '<button class="zone-card" data-zone="' + zone.id + '">' +
        '  <span class="zone-top"><b>' + zone.name + '</b><em>' + zone.difficulty + '</em></span>' +
        '  <span class="zone-desc">' + zone.desc + '</span>' +
        '  <span class="zone-meta">建议：' + risk.suggestedRealm + '　神识参考：' + risk.suggestedSense + '　掉落：' + dropsText(zone.drops) + '</span>' +
        '  <span class="zone-risk ' + risk.cls + '">当前评估：' + risk.label + ' · 战力 ' + risk.player + ' / 参考 ' + risk.enemy + '</span>' +
        '  <span class="zone-risk-note">' + risk.note + '</span>' +
        '</button>';
    }).join("");
    mountEl().innerHTML =
      '<div class="explore-screen">' +
      '  <button class="btn btn-mini zone-back" id="explore-back">退出</button>' +
      '  <div class="explore-head">' +
      '    <div class="wc-tag">探险 · 打野</div>' +
      '    <h2>选择本月去处</h2>' +
      '    <p class="dim small">这里只给建议境界与战力参考，不作硬拦；遇到打不过的怪，可以回合间退避。</p>' +
      (message ? '    <div class="hub-note">' + message + '</div>' : '') +
      '  </div>' +
      '  <div class="zone-list">' + cards + '</div>' +
      '  <div class="bag-box"><div class="panel-title">背包材料</div><div class="bag-list">' + bagSummary() + '</div></div>' +
      '</div>';
    mountEl().querySelectorAll(".zone-card").forEach((b) => {
      b.onclick = () => startZone(b.dataset.zone);
    });
    mountEl().querySelector("#explore-back").onclick = () => Game.hub.show();
  }

  function zoneById(id) {
    return ZONES.find((z) => z.id === id);
  }

  function startZone(id) {
    const zone = zoneById(id);
    if (!zone) return;
    // 约 35% 触发随机奇遇（无战斗·增加变化），否则常规战斗
    if (Math.random() < 0.35) return showEncounter(zone);
    Game.setZone && Game.setZone(zone.visualZone || "combat");
    Game.renderHeader && Game.renderHeader();
    const flavor = pick(zone.flavors || [zone.desc]);
    const fleeLife = Game.life && Game.life.costLine ? Game.life.costLine("explore_flee") : "耗时 1 月";
    const enemyPack = rollEnemyPack(zone);
    const risk = dangerRatingFor(zone, enemyPack);
    const enemyLine = enemyPack.enemies.map((e) => e.name + "（" + e.aura + "）").join("、");
    mountEl().innerHTML =
      '<div class="story-page">' +
      '  <div class="story-body">' +
      '    <h2>' + zone.name + '</h2>' +
      '    <p>' + flavor + '</p>' +
      '    <p class="dim small">遭遇：' + enemyLine + '。</p>' +
      '    <p class="dim small">建议进入境界：' + risk.suggestedRealm + '；神识参考：' + risk.suggestedSense + '；当前评估：' + risk.label + '（战力 ' + risk.player + ' / 参考 ' + risk.enemy + '）。</p>' +
      '    <p class="dim small">战斗按回合出手；可手动攻击，也可改为自动攻击。回合间退避会损耗言气 ' + FLEE_EXP_COST + '，' + fleeLife + '。</p>' +
      '  </div>' +
      '  <div id="explore-battle"></div>' +
      '</div>';
    Game.battle.start(
      mountEl().querySelector("#explore-battle"),
      enemyPack,
      { canFlee: true, fleeLabel: "退 避（言气 -" + FLEE_EXP_COST + " · " + fleeLife + "）" },
      (res) => finishZone(zone, res, enemyPack)
    );
  }

  // 随机奇遇：抽一条符合条件的事件，结算材料/言气，消耗 1 月后回月课。
  function showEncounter(zone) {
    Game.normalizeState && Game.normalizeState();
    Game.setZone && Game.setZone("wild");
    const realm = Game.state.realmIndex || 0;
    const pool = ENCOUNTERS.filter((e) => (!e.zone || e.zone === zone.id) && realm >= (e.minRealm || 0));
    const e = pick(pool.length ? pool : ENCOUNTERS);
    const parts = [];
    if (e.drops) {
      const won = rollDrops(e.drops);
      won.forEach((d) => Game.addItem(d.key, d.amount));
      parts.push(won.length ? "所获：" + wonText(won) : "可惜空手而归");
    }
    if (e.exp) {
      const gain = Game.applyQiGainRate ? Game.applyQiGainRate(e.exp) : e.exp;
      Game.gainExp && Game.gainExp(gain, { scaled: true });
      parts.push("参悟言气 +" + gain);
    }
    if (e.cost) { const p = Game.spendExp(e.cost); parts.push("言气损耗 " + p); }
    const resultLine = parts.length ? parts.join("，") + "。" : "无所得，也无所失。";
    Game.time.advanceMonth();
    Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("explore", "奇遇");
    Game.save && Game.save.write({ view: "hub" });
    Game.renderHeader && Game.renderHeader();
    if (Game.life && Game.life.guard && Game.life.guard("奇遇耗去一月，寿元已尽。")) return;
    mountEl().innerHTML =
      '<div class="story-page">' +
      '  <div class="story-body">' +
      '    <div class="wc-tag">探险 · 奇遇</div>' +
      '    <h2>' + zone.name + ' · 奇遇</h2>' +
      '    <p>' + e.text + '</p>' +
      '    <p class="dim small">' + resultLine + '</p>' +
      '  </div>' +
      '  <button class="btn btn-gold continue" id="enc-back">回到月课</button>' +
      '</div>';
    mountEl().querySelector("#enc-back").onclick = () => Game.hub.show("奇遇：" + e.text.slice(0, 18) + "…（" + resultLine + "）");
  }

  function finishZone(zone, res, enemyPack) {
    if (res.fled) {
      const paid = Game.spendExp(FLEE_EXP_COST);
      Game.time.advanceMonth();
      Game.life && Game.life.spendActionExtra && Game.life.spendActionExtra("explore_flee");
      Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("explore_flee", zone.name);
      Game.save && Game.save.write({ view: "hub" });
      if (Game.life && Game.life.guard && Game.life.guard("你退回书院时，寿元已尽。")) return;
      Game.hub.show("你从" + zone.name + "退回书院，损耗言气 " + paid + "。");
      return;
    }
    if (!res.win) return showDefeat(zone);

    // 击破的敌数：多敌遭遇时奖励成倍（每只独立掉一份）。
    const count = (enemyPack && Array.isArray(enemyPack.enemies) && enemyPack.enemies.length) || 1;
    const won = rollDropsTimes(zone.drops, count);
    won.forEach((d) => Game.addItem(d.key, d.amount));
    Game.time.advanceMonth();
    Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("explore", zone.name);
    Game.save && Game.save.write({ view: "hub" });
    if (Game.life && Game.life.guard && Game.life.guard("探险归来时，寿元已尽。")) return;
    let msg = "探险归来" + (count > 1 ? "（击破 " + count + " 敌）" : "") + "，获得：" + (won.length ? wonText(won) : "未有材料落袋") + "。";
    if (zone.id === "mist_ridge") {
      msg += "　雾岭深处的真果仍隔着一层瘴雾；此行只带回残髓与方位，未能夺果。";
    }
    Game.hub.show(msg);
  }

  function defeatExpCost() {
    Game.normalizeState && Game.normalizeState();
    return Math.max(DEFEAT_EXP_COST_MIN, Math.ceil((Game.state.expToBreak || 0) * DEFEAT_EXP_COST_RATE));
  }

  // 探险战败＝重伤生还（软惩罚·不真死）：损耗言气、推进 1 月、不掉永久属性/材料。
  function showDefeat(zone) {
    const paid = Game.spendExp(defeatExpCost());
    delete Game.state.flags.dead; // 清掉旧逻辑可能遗留的死亡 flag（软惩罚下不锁档）
    Game.time.advanceMonth();
    Game.life && Game.life.spendActionExtra && Game.life.spendActionExtra("explore_defeat");
    Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("explore_defeat", zone.name);
    // 先 advance 后 save：刷新落到「受罚后存档」，无法靠刷新绕过战败（H2）。
    Game.save && Game.save.write({ view: "hub" });
    Game.renderHeader && Game.renderHeader();
    if (Game.life && Game.life.guard && Game.life.guard("重伤将养一月，寿元已尽。")) return;
    mountEl().innerHTML =
      '<div class="death-screen">' +
      '  <div class="wc-tag">重伤 · 生还</div>' +
      '  <h2>沈砚险些没能从' + zone.name + '走出来</h2>' +
      '  <p>暗处的杀机比他料想的更狠。识海几乎被搅成一团乱麻，他咬着牙退出险地，一路跌撞回了书院。命保住了，那一身言气却散了大半。</p>' +
      '  <p class="penalty-line">重伤生还：言气损耗 ' + paid + '；将养一月，未有所获。</p>' +
      '  <button class="btn btn-gold" id="defeat-back">将养伤势，回到月课</button>' +
      '</div>';
    mountEl().querySelector("#defeat-back").onclick = () => Game.hub.show("你重伤生还，将养一月。");
  }

  Game.explore = { ZONES, showZones, bagSummary, rollDrops, dangerRating, battleScore, enemyScore, rollEnemyPack };
})(window.Game = window.Game || {});
