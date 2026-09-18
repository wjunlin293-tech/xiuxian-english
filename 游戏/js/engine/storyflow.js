/* ───────────────────────────────────────────────────────────────
 * storyflow.js · 剧情节点 + 三年之约 deadline
 * R4：推进纯叙事节点；第36月院试大比可应战/避战，失败或避战都有惩罚剧情。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const BOSS_PENALTY_EXP = 24; // C-05：失败/避战只损少量言气，不再永久掉属性
  const FORFEIT_PENALTY_EXP = 48; // 失约（拖过期限连面都不露）比主动避战更重；仍不掉永久属性
  // C-05 调难A：hp175/str35/def17/sense77。
  // 目标：凡身无望；刚启言低配仍有一线希望；启言常规真险胜；凝言稳赢。
  // 不再上调，避免轻度玩家接近 0% 胜率而变苛刻。
  const BOSS_ENEMY = { name: "裴照临", hp: 175, str: 35, def: 17, sense: 77, realm: "凝言境", art: "../素材/人物/pei-zhaolin.png" };

  function mountEl() { return document.getElementById("stage"); }
  function h(s) { return Game.heroText ? Game.heroText(s) : s; }

  function ensureStoryFlags() {
    Game.normalizeState && Game.normalizeState();
    if (typeof Game.state.flags.storyIndex !== "number") Game.state.flags.storyIndex = 0;
    if (!Game.state.flags.storyDone) Game.state.flags.storyDone = {};
    if (!Game.state.flags.storyDoneMigrated) {
      (Game.STORY_NODES || []).forEach((node, index) => {
        if (index < Game.state.flags.storyIndex) Game.state.flags.storyDone[node.id] = true;
      });
      if (Game.state.flags.storyDone.demo_pure) Game.state.flags.demoStoryDone = true;
      Game.state.flags.storyDoneMigrated = true;
    }
  }

  function storyDone(node) {
    ensureStoryFlags();
    return !!Game.state.flags.storyDone[node.id];
  }

  function canStart(node) {
    if (storyDone(node)) return false;
    return !node.canStart || node.canStart();
  }

  function firstPendingStory() {
    ensureStoryFlags();
    return (Game.STORY_NODES || []).find((node) => !storyDone(node)) || null;
  }

  function nextStory() {
    const node = firstPendingStory();
    return node && canStart(node) ? node : null;
  }

  function hasNextStory() {
    return !!nextStory();
  }

  function nextStoryTitle() {
    const node = nextStory();
    return node ? node.title : "";
  }

  function requirementText(node) {
    if (!node) return "暂无新的剧情节点";
    if (canStart(node)) return "已解锁";
    if (typeof node.requirementText === "function") return node.requirementText();
    return node.requirementText || "条件未满足";
  }

  function storyTimeCost(node) {
    if (!node) return 0;
    const raw = typeof node.timeCostMonths === "function" ? node.timeCostMonths() : node.timeCostMonths;
    const n = raw === undefined || raw === null ? 1 : raw;
    return Math.max(0, Math.round(Number(n) || 0));
  }

  function storyTimeText(node) {
    const n = storyTimeCost(node);
    if (typeof node.timeCostText === "function") return node.timeCostText(n);
    if (node.timeCostText) return node.timeCostText;
    if (n <= 0) return "不耗整月";
    return "耗时 " + n + " 月";
  }

  // 机缘期限机制：节点可声明 unlockMonth（解锁月，用于倒计时提示）
  // 与 deadline（赴约期限月）+ missedChapter（过期改演的"错过"正文）+ onMissed（过期惩罚）。
  function monthNow() {
    if (Game.time && Game.time.totalMonths) return Game.time.totalMonths();
    return Game.currentMonthNumber ? Game.currentMonthNumber() : 1;
  }

  // 过期：节点带 deadline 且已配 missedChapter，且当前月已越过期限。
  function isExpired(node) {
    return !!(node && node.deadline != null && node.missedChapter && monthNow() > node.deadline);
  }

  function nextStoryInfo() {
    const node = firstPendingStory();
    if (!node) return { title: "", canStart: false, requirement: "暂无新的剧情节点" };
    const now = monthNow();
    const started = canStart(node);
    const info = {
      title: node.title,
      canStart: started,
      requirement: requirementText(node),
      timeCostMonths: storyTimeCost(node),
      timeText: storyTimeText(node),
    };
    // 未解锁且只差时间：提示"还需 X 月解锁"。顺序门槛保证此时前置已完成，倒计时可信。
    if (typeof node.unlockMonth === "number" && !started && now < node.unlockMonth) {
      info.unlockMonth = node.unlockMonth;
      info.monthsToUnlock = node.unlockMonth - now;
    }
    // 已解锁且带期限：提示"机缘期限第 N 月前，还剩 X 月"，让玩家自主权衡是否赴约。
    if (typeof node.deadline === "number" && node.missedChapter) {
      info.deadline = node.deadline;
      info.expired = now > node.deadline;
      if (started && !info.expired) info.monthsToDeadline = node.deadline - now;
    }
    // 已解锁却搁置多久（供 hub 判断"剧情太久没推"强提醒）。
    if (started && typeof node.unlockMonth === "number") {
      info.monthsSinceUnlock = Math.max(0, now - node.unlockMonth);
    }
    return info;
  }

  function finishNode(node) {
    ensureStoryFlags();
    const index = (Game.STORY_NODES || []).indexOf(node);
    const nextIndex = index >= 0 ? Math.max(Game.state.flags.storyIndex, index + 1) : Game.state.flags.storyIndex;
    Game.state.flags.storyDone[node.id] = true;
    if (index >= 0) {
      Game.state.flags.storyIndex = nextIndex;
      (Game.STORY_NODES || []).forEach((n, i) => {
        if (i < nextIndex) Game.state.flags.storyDone[n.id] = true;
      });
    }
    if (node.id === "demo_pure") Game.state.flags.demoStoryDone = true;
    if (node.onComplete) node.onComplete();
  }

  function completeNode(node, message) {
    if (!node) return noStory();
    const cost = storyTimeCost(node);
    finishNode(node);
    if (Game.time && Game.time.advanceMonths) {
      Game.time.advanceMonths(cost);
    } else if (Game.time && Game.time.advanceMonth) {
      for (let i = 0; i < cost; i += 1) Game.time.advanceMonth();
    }
    Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("story", node.title || node.id);
    Game.save && Game.save.write({ view: "hub" });
    if (cost > 0 && Game.life && Game.life.guard && Game.life.guard("剧情推进耗时 " + cost + " 月，寿元已尽。")) return;
    if (node.id === "node_after_vow" && Game.ending && Game.ending.start && !Game.state.flags.endingSeen) {
      return Game.ending.start();
    }
    Game.hub.show(message || ("剧情节点「" + node.title + "」已推进（" + storyTimeText(node) + "）。"));
  }

  function startNext() {
    ensureStoryFlags();
    const node = nextStory();
    if (!node) return noStory();
    Game.setZone && Game.setZone("story");
    // 过期机缘：越过期限则改演"错过"正文，并在读完时结算过期惩罚（守铁律：不掉属性）。
    const expired = isExpired(node);
    const chapter = expired ? node.missedChapter : node.chapter;
    // 断点续上：若上次从本节点退出，则从记住的页继续；过期改演时丢弃旧断点从头读。
    const resume = Game.state.flags.storyResume;
    const startIdx = (!expired && resume && resume.id === node.id && typeof resume.idx === "number") ? resume.idx : 0;
    Game.paged.start(chapter, "stage", function () {
      Game.state.flags.storyResume = null; // 节点读完→清断点
      if (expired && node.onMissed) node.onMissed();
      completeNode(node);
    }, startIdx, function (curIdx) {
      // 退出剧情：记住断点，回 hub，不消耗月份
      Game.state.flags.storyResume = { id: node.id, idx: curIdx };
      Game.save && Game.save.write({ view: "hub" });
      Game.hub.show("已退出剧情，下次「推进剧情」从此处续上。");
    });
  }

  function noStory() {
    const node = firstPendingStory();
    if (node && !canStart(node)) {
      Game.hub.show("下一剧情「" + node.title + "」尚未解锁：" + requirementText(node));
      return;
    }
    Game.hub.show("暂无新的剧情节点。");
  }

  // 三年之约状态：vowBossDue＝时间到第36月；vowBuildupDone＝剧情铺垫(临战前夜)已走完。
  // 两者都满足才正式开战（A：校验剧情前置，杜绝"节奏跑偏→还没铺垫就放climax"）。
  function vowUnresolved() {
    Game.normalizeState && Game.normalizeState();
    const f = Game.state.flags;
    return !!(f.vowBossDue && !f.vowBossDone && !f.vowBossSkipped && !f.vowBossLost);
  }
  // 用"临战前夜节点是否完成"判铺垫，比 vowReady flag 可靠（vowReady 只在闭死关分支置）。
  function vowBuildupDone() {
    const sd = Game.state.flags && Game.state.flags.storyDone;
    return !!(sd && sd.node_eve_of_vow);
  }
  function bossDue() { return vowUnresolved() && vowBuildupDone(); }
  // 到点但剧情没跟上：催玩家去推进剧情/突破补前情；逾期仍补不上＝失约。
  function vowBehind() { return vowUnresolved() && !vowBuildupDone(); }

  function showBossPrompt() {
    Game.setZone && Game.setZone("combat");
    Game.save && Game.save.write({ view: "boss_prompt" });
    Game.renderHeader && Game.renderHeader();
    const avatar = Game.avatarInfo ? Game.avatarInfo() : { image: "../素材/主角/player-male-base.png", title: "沈砚" };
    const heroName = avatar.gender === "female" ? "问言女侠" : "沈砚";
    mountEl().innerHTML =
      '<div class="boss-screen">' +
      '  <div class="wc-tag">时间节点 · 三年之约</div>' +
      '  <h2>院试大比</h2>' +
      '  <div class="boss-duel-art">' +
      '    <figure><img src="' + avatar.image + '" alt="' + heroName + '"><figcaption>' + heroName + '</figcaption></figure>' +
      '    <div class="boss-duel-mark">三年之约</div>' +
      '    <figure><img src="../素材/人物/pei-zhaolin.png" alt="裴照临"><figcaption>裴照临</figcaption></figure>' +
      '  </div>' +
      '  <div class="story-body">' +
      '    <p>第三十六月到了。问言书院山门前，人潮如沸，裴氏的车驾停在高台之下。</p>' +
      '    <p>' + h("裴照临站在台上，仍是那身月白衣，只是眉眼比三年前更冷。他没有催促，只让人把沈砚的名字，念给满场听。") + '</p>' +
      '    <p>你可以赴约，也可以避开这一战。只是三年前当众立下的誓，不会因为沉默而消失。</p>' +
      '  </div>' +
      '  <div class="choice-list">' +
      '    <button class="btn choice-opt" id="boss-fight">赴约，上台一战</button>' +
      '    <button class="btn choice-opt" id="boss-skip">避战，暂忍此辱</button>' +
      '  </div>' +
      '</div>';
    mountEl().querySelector("#boss-fight").onclick = startBoss;
    mountEl().querySelector("#boss-skip").onclick = skipBoss;
    mountEl().querySelectorAll(".boss-duel-art img").forEach((img) => {
      img.onerror = () => { img.closest("figure").hidden = true; };
    });
  }

  function startBoss() {
    mountEl().innerHTML =
      '<div class="story-page">' +
      '  <div class="story-body">' +
      '    <h2>三年之约 · 裴照临</h2>' +
      '    <p>' + h("沈砚踏上高台。三年前碎玉落地，三年后满院屏息。裴照临袖中灵光翻涌，终于不再把他当作一粒尘。") + '</p>' +
      '  </div>' +
      '  <div id="boss-battle"></div>' +
      '</div>';
    Game.battle.start(mountEl().querySelector("#boss-battle"), bossEnemy(), { daoxinExempt: true }, function (res) {
      if (res.win) return bossWin();
      bossLose();
    });
  }

  function bossEnemy() {
    const e = Object.assign({}, BOSS_ENEMY);
    const f = Game.state.flags || {};
    if (f.bossUnderprepared) {
      e.hp = Math.max(120, e.hp - 12);
      e.def = Math.max(8, e.def - 2);
      e.sense = Math.max(60, e.sense - 5);
    } else if (f.bossWellPrepared) {
      // P3b：hp+3 会把轻度画像满展露胜率从约 11.9% 压到约 1.9%，prepared 只保留轻量防备。
      e.hp += 2;
      e.sense += 5;
    }
    return e;
  }

  function bossWin() {
    Game.state.flags.vowBossDone = true;
    Game.state.flags.vowClearDifficulty = Game.activeDifficultyKey ? Game.activeDifficultyKey() : ((Game.state.settings && Game.state.settings.difficulty) || "normal");
    Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("story", "三年之约胜");
    Game.save && Game.save.write({ view: "hub" });
    mountEl().innerHTML =
      '<div class="story-page">' +
      '  <h2>三年之约 · 兑现</h2>' +
      '  <div class="story-body">' +
      '    <p>裴照临的灵光在台上碎开，满院死寂。</p>' +
      '    <p>' + h("三年前被人踩在脚边的碎玉，三年后终于化作一记响亮的耳光。沈砚没有再多说什么，只看向裴氏席位，等他们亲眼把那份轻蔑咽回去。") + '</p>' +
      '    <p>' + h("这一战之后，问言书院再无人敢把他只当作扫言童子。") + '</p>' +
      '  </div>' +
      '  <button class="btn btn-gold continue" id="boss-back">回到月课</button>' +
      '</div>';
    mountEl().querySelector("#boss-back").onclick = () => Game.hub.show("三年之约已胜。");
  }

  function bossLose() {
    Game.state.flags.vowBossLost = true;
    applyPenalty("败约");
    Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("explore_defeat", "三年之约败");
    Game.save && Game.save.write({ view: "hub" });
    mountEl().innerHTML =
      '<div class="story-page">' +
      '  <h2>三年之约 · 败</h2>' +
      '  <div class="story-body">' +
      '    <p>沈砚最终还是退了半步。</p>' +
      '    <p>裴照临没有追击，只当众拂袖，淡淡说了一句：“三年前的誓，原来也不过如此。”</p>' +
      '    <p>' + h("那句话比伤势更重。识海里的《天外言典》没有沉寂，却像被一层冷灰盖住。沈砚知道，这一败不会让路断掉，但会让后面的每一步，都更难。") + '</p>' +
      penaltyText() +
      '  </div>' +
      '  <button class="btn btn-gold continue" id="boss-back">咽下此败，回到月课</button>' +
      '</div>';
    mountEl().querySelector("#boss-back").onclick = () => Game.hub.show("三年之约已败，主线继续。");
  }

  function skipBoss() {
    Game.state.flags.vowBossSkipped = true;
    applyPenalty("避战");
    Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("story", "三年之约避战");
    Game.save && Game.save.write({ view: "hub" });
    mountEl().innerHTML =
      '<div class="story-page">' +
      '  <h2>三年之约 · 避战</h2>' +
      '  <div class="story-body">' +
      '    <p>沈砚没有上台。</p>' +
      '    <p>人群的嘈杂从高台一路压到弃字阶，像三年前那场哄笑的回声。裴氏没有派人来催，只把“沈砚避战”四个字，留在了院试榜旁。</p>' +
      '    <p>' + h("他保住了性命，也保住了继续往前走的机会；可那道誓言，从此成了识海里一根没有拔出的刺。") + '</p>' +
      penaltyText() +
      '  </div>' +
      '  <button class="btn btn-gold continue" id="boss-back">收拾余心，回到月课</button>' +
      '</div>';
    mountEl().querySelector("#boss-back").onclick = () => Game.hub.show("你避开了三年之约，主线继续。");
  }

  function applyPenalty(reason, expAmount) {
    const paid = Game.spendExp(expAmount == null ? BOSS_PENALTY_EXP : expAmount);
    Game.state.flags.vowPenalty = { reason: reason, exp: paid, attrs: null, soft: true };
  }

  function penaltyText() {
    const paid = Game.state.flags.vowPenalty ? Game.state.flags.vowPenalty.exp : BOSS_PENALTY_EXP;
    return '<p class="penalty-line">软败约：言气损耗 ' + paid + '；不扣永久属性，主线继续。</p>';
  }

  // ── 三年之约赴约期限（用户 2026-06-27）──
  // 第36月起院试开锣，宽限到 VOW_DEADLINE 月（可见倒计时）；逾期未处理＝自动「失约」。
  // 失约比主动避战更重：扣更多言气 + 闭关机缘/声望受损 flag；仍守铁律不掉永久属性。
  function vowDeadline() { return 38; }
  function vowGraceLeft() {
    return Math.max(0, vowDeadline() - monthNow());
  }
  // 越过期限且仍未处理三年之约→该失约了。供 hub.show 在回到月课时拦截。
  function checkVowForfeit() {
    if (!vowUnresolved()) return false;       // 含"到点没铺垫"的落后玩家：逾期一样失约
    if (monthNow() <= vowDeadline()) return false;
    forfeitVow();
    return true;
  }
  function forfeitVow() {
    Game.state.flags.vowBossSkipped = true;
    Game.state.flags.vowForfeit = true;          // 区分「主动避战」与「拖到失约」
    Game.state.flags.vowRep = "失约";
    applyPenalty("失约", FORFEIT_PENALTY_EXP);
    Game.save && Game.save.write({ view: "hub" });
    Game.setZone && Game.setZone("story");
    Game.renderHeader && Game.renderHeader();
    mountEl().innerHTML =
      '<div class="story-page">' +
      '  <h2>三年之约 · 失约</h2>' +
      '  <div class="story-body">' +
      '    <p>院试大比那日，沈砚没有出现。</p>' +
      '    <p>第二日，第三日，仍没有。高台上的裴照临等了整整一炷香，最终连一个眼神都没留，转身下台——比起当众击败一个废物，无视一个连面都不敢露的爽约者，更让裴氏体面。</p>' +
      '    <p>' + h("“沈砚失约”四个字，被人用最不屑的语气，在弃字阶反复学说。三年前那场哄笑，这一次没有对手替他终结——是他自己，把它续上了。") + '</p>' +
      '    <p class="penalty-line">失约之耻：言气损耗 ' + (Game.state.flags.vowPenalty ? Game.state.flags.vowPenalty.exp : FORFEIT_PENALTY_EXP) + '；声望与一段机缘随之蒙尘（不扣永久属性，主线继续）。</p>' +
      '  </div>' +
      '  <button class="btn btn-gold continue" id="vow-forfeit-back">咽下此辱，回到月课</button>' +
      '</div>';
    mountEl().querySelector("#vow-forfeit-back").onclick = () => Game.hub.show("你失约了三年之约，主线继续。");
  }

  Game.storyflow = { startNext, hasNextStory, nextStoryTitle, nextStoryInfo, completeNode, bossDue, vowBehind, showBossPrompt, checkVowForfeit, vowGraceLeft, vowDeadline };
})(window.Game = window.Game || {});
