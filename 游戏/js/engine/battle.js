/* ───────────────────────────────────────────────────────────────
 * battle.js · 轻量叙事化战斗（上=血量条，下=对战小剧场）
 * 藏锋机制：玩家选"展露几成功力"——展露越低，扮猪吃虎信息差越大，
 * 低展露取胜额外爽。战斗与五维总属性挂钩。
 * demo 版：回合制·点"出手"逐回合推进·每回合生成小剧场旁白。
 * R17：接入神识探知/秒杀。
 * R19：删除独立暴击，改由法力派生术式爆发率；溢流法力提高爆发倍率。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  function h(s) { return Game.heroText ? Game.heroText(s) : s; }

  // start(mount, enemy, opts, onEnd) ; onEnd({win, reveal, rounds, fled})
  function start(mount, enemy, opts, onEnd) {
    opts = opts || {};
    const P = Game.state;
    const A = Game.totalAttrs ? Game.totalAttrs() : P.attrs;
    const player = { name: P.name, hp: A.hp, max: A.hp };
    const foes = ((Array.isArray(enemy.enemies) && enemy.enemies.length) ? enemy.enemies : [enemy]).map((e, i) => ({
      idx: i,
      name: e.name,
      hp: e.hp,
      max: e.hp,
      str: e.str,
      def: e.def,
      sense: e.sense || 0,
      realm: e.realm || enemy.realm,
      art: e.art || enemy.art || opts.enemyArt || "",
    }));
    const enemyCount = foes.length;
    const groupName = enemy.name || (enemyCount > 1 ? foes.map((f) => f.name).join("、") : foes[0].name);
    const avatar = Game.avatarInfo ? Game.avatarInfo() : null;
    const playerArt = opts.playerArt || (avatar && avatar.image) || "../素材/主角/player-male-base.png";
    const enemyArt = enemy.art || foes[0].art || opts.enemyArt || "";
    // 神识探知/秒杀：r = 我方神识 ÷ 敌方神识。敌人无合法 sense 则整层失效（不秒杀、不探知）。
    const pSense = A.sense || 0;
    const eSenseMax = Math.max.apply(null, foes.map((f) => f.sense || 0));
    const eSense = eSenseMax > 0 ? eSenseMax : null;
    const ratio = eSense ? pSense / eSense : null;
    const seeRealm = ratio != null && ratio > 1;   // >100% 看清境界
    const seeStats = ratio != null && ratio >= 2;  // ≥200% 看清属性
    const canInstakill = ratio != null && ratio >= 3; // ≥300% 秒杀
    // 藏锋：展露功力起手值＝上次调好的值（记忆功能），默认三成；本场仍可再调。
    let reveal = (Game.state.settings && typeof Game.state.settings.combatReveal === "number")
      ? Game.state.settings.combatReveal : 0.3;
    let rounds = 0;
    let actionBusy = false;
    let autoMode = false;
    let ended = false;
    let rendered = false;
    const log = [];
    const burst = manaBurst();
    // P-DAOXIN：道心 debuff 只削日常战斗攻势；生死战（剧情 mustWin / boss daoxinExempt）豁免。
    const daoxinInfo = Game.daoxinTier ? Game.daoxinTier() : null;
    const daoxinExempt = !!(opts.mustWin || opts.daoxinExempt);
    const daoxinFactor = (daoxinExempt || !daoxinInfo) ? 1 : daoxinInfo.factor;

    function manaBurst() {
      const mp = A.mp || 0;
      const chance = Math.min(35, 5 + mp / 3);
      const overflow = Math.max(0, mp - 90);
      const multiplier = Math.min(2, 1.5 + overflow * 0.01);
      return { chance, overflow, multiplier };
    }

    function livingFoes() {
      return foes.filter((f) => f.hp > 0);
    }

    function leadFoe() {
      return livingFoes()[0] || foes[0];
    }

    function dmgToFoe(target) {
      const base = A.str * reveal * daoxinFactor; // P-DAOXIN 道心系数（生死战为 1）

      const burstHit = Math.random() * 100 < burst.chance;
      const raw = Math.max(2, Math.round((base * (burstHit ? burst.multiplier : 1)) - target.def * 0.4));
      return { v: raw, burstHit };
    }
    function dmgToPlayer() {
      const attackers = livingFoes();
      const total = attackers.reduce((sum, f) => sum + Math.max(1, Math.round(f.str - A.def * 0.5)), 0);
      return { v: total, count: attackers.length };
    }

    // 神识探知信息行（战斗界面常驻）
    function detectLine() {
      if (ratio == null) return '';
      let s;
      if (seeStats) {
        const alive = livingFoes();
        const strSum = alive.reduce((sum, f) => sum + f.str, 0);
        const maxDef = Math.max.apply(null, alive.map((f) => f.def));
        s = '神识看穿 · 敌数 ' + alive.length + '　合力 ' + strSum + '　最高防 ' + maxDef;
      }
      else if (seeRealm) s = '神识探知 · 境界 ' + (enemy.realm || '未明');
      else s = '神识不足 · 此人深浅难测';
      return '<div class="cb-detect dim small">' + s + '</div>';
    }

    // P-DAOXIN 战前/战中道心状态行：只在被削（微澜/心性不稳且未豁免）时提示，让玩家知道战力打了折。
    function daoxinLine() {
      if (daoxinFactor >= 1 || !daoxinInfo) return '';
      const pct = Math.round((1 - daoxinFactor) * 100);
      return '<div class="cb-detect cb-daoxin small">' + daoxinInfo.label + ' · 攻势 −' + pct +
        '%（逾期真言 ' + daoxinInfo.overdue + ' 未温习·去识海温习可复稳）</div>';
    }

    // 法力作用：法力越厚，越容易触发术式爆发；超过阈值后转为爆发倍率。
    function manaLine() {
      let s = '法力激荡 · 爆发率 ' + Math.round(burst.chance) + '%　爆发 ' + Math.round(burst.multiplier * 100) + '%';
      if (burst.overflow > 0) s += '　溢流增伤 +' + Math.round((burst.multiplier - 1.5) * 100) + '%';
      return '<div class="cb-detect dim small">' + s + '</div>';
    }

    function artCard(src, name, side) {
      return '<div class="cb-art ' + side + '">' +
        '<div class="cb-art-fallback">' + name.slice(0, 1) + '</div>' +
        (src ? '<img src="' + src + '" alt="' + name + '">' : '') +
        '<span>' + name + '</span>' +
        '</div>';
    }

    function bindArtFallbacks() {
      mount.querySelectorAll(".cb-art img").forEach((img) => {
        img.onerror = () => { img.hidden = true; };
      });
    }

    // 神识碾压 ≥300%：免战取胜
    function instakill() {
      mount.innerHTML =
        '<div class="battle">' +
        '  <div class="cb-visuals">' + artCard(enemyArt, groupName, "foe") + '<div class="cb-vs">一念</div>' + artCard(playerArt, player.name, "self") + '</div>' +
        '  <div class="cb-detect dim small">神识碾压 · 敌数 ' + enemyCount + '</div>' +
        '  <div class="cb-result win"><b class="hl">一念诛敌</b>——' + groupName + '尚未察觉，神识已如山岳压落，其形神当场溃散。</div>' +
        '</div>';
      bindArtFallbacks();
      setTimeout(() => onEnd && onEnd({ win: true, instakill: true, reveal: 0, rounds: 0 }), 1400);
    }

    function narrate(d, target) {
      const pct = Math.round(reveal * 100);
      const power = Math.round(reveal * 10) + "成";
      let line;
      if (d.burstHit) line = '<b class="hl">术式爆发！</b>法力骤然激荡，一字落下，' + target.name + '闷哼喷血，退了三步。';
      else if (reveal <= 0.3) line = h('他只抬了半分力') + '（展露' + power + '），' + target.name + h('已觉气血翻涌——场中人却只当他侥幸。');
      else if (reveal >= 0.8) line = '沈砚不再藏掖，真言尽吐（展露' + power + '），' + target.name + '面色骤变。';
      else line = '一言既出，' + target.name + '勉力架住，腕臂发麻（展露' + power + '）。';
      return line + '　<span class="dim small">[-' + d.v + ' 气血]</span>';
    }

    function foeBarsHtml() {
      return foes.map((f) => (
        '    <div class="cb-side cb-foe-side" data-foe="' + f.idx + '">' +
        '      <div class="cb-name">' + f.name + '<span class="dim small"> 敌' + (enemyCount > 1 ? ' · ' + (f.idx + 1) : '') + '</span></div>' +
        '      <div class="cb-hp foe"><div class="cb-hp-fill" id="cb-foe-fill-' + f.idx + '"></div></div>' +
        '      <div class="cb-hp-num" id="cb-foe-num-' + f.idx + '"></div>' +
        '    </div>'
      )).join("");
    }

    function renderShell() {
      mount.innerHTML =
        '<div class="battle">' +
        '  <div class="cb-visuals">' + artCard(enemyArt, groupName, "foe") + '<div class="cb-vs">' + (enemyCount > 1 ? '群战' : '对决') + '</div>' + artCard(playerArt, player.name, "self") + '</div>' +
        '  <div class="cb-bars">' +
        foeBarsHtml() +
        '    <div class="cb-side">' +
        '      <div class="cb-name">' + player.name + '<span class="dim small"> 我</span></div>' +
        '      <div class="cb-hp self"><div class="cb-hp-fill" id="cb-self-fill"></div></div>' +
        '      <div class="cb-hp-num" id="cb-self-num"></div>' +
        '    </div>' +
        '  </div>' +
        detectLine() +
        manaLine() +
        daoxinLine() +
        '  <div class="cb-stage" id="cb-stage"></div>' +
        '  <div class="cb-ctrl">' +
        '    <label class="cb-reveal">藏锋 · 展露功力 <b id="cb-rv-lbl">' + Math.round(reveal * 100) + '%</b>' +
        '      <input type="range" id="cb-reveal" min="10" max="100" step="10" value="' + Math.round(reveal * 100) + '">' +
        '    </label>' +
        (opts.canFlee ? '    <button class="btn btn-mini" id="cb-flee">' + (opts.fleeLabel || '退 避') + '</button>' : '') +
        '    <button class="btn btn-gold" id="cb-hit">攻击一回合</button>' +
        '    <button class="btn" id="cb-auto">自动攻击</button>' +
        '  </div>' +
        '</div>';
      rendered = true;
      bindArtFallbacks();
      bindControls();
    }

    function bindControls() {
      const rv = mount.querySelector("#cb-reveal");
      rv.oninput = () => {
        reveal = rv.value / 100;
        mount.querySelector("#cb-rv-lbl").textContent = rv.value + "%";
      };
      // 记住玩家调好的展露值，下场战斗默认沿用（持久化到用户设置）。
      rv.onchange = () => {
        Game.saveUserSettings && Game.saveUserSettings({ combatReveal: rv.value / 100 });
      };
      const flee = mount.querySelector("#cb-flee");
      if (flee) flee.onclick = fleeBattle;
      mount.querySelector("#cb-hit").onclick = doManualRound;
      mount.querySelector("#cb-auto").onclick = startAuto;
    }

    function setText(sel, text) {
      const el = mount.querySelector(sel);
      if (el) el.textContent = text;
    }

    function setWidth(sel, pct) {
      const el = mount.querySelector(sel);
      if (el) { el.style.width = pct + "%"; el.classList.toggle("low", pct < 30); } // 低血脉动(借旧版 hpLowPulse)
    }

    function draw() {
      if (!rendered) renderShell();
      const pHp = Math.max(0, player.hp);
      const logHtml = log.slice(-6).map((l) => '<div class="cb-line">' + l + '</div>').join("");
      foes.forEach((f) => {
        const fHp = Math.max(0, f.hp);
        setWidth("#cb-foe-fill-" + f.idx, fHp / f.max * 100);
        setText("#cb-foe-num-" + f.idx, fHp + " / " + f.max);
        const side = mount.querySelector('.cb-foe-side[data-foe="' + f.idx + '"]');
        if (side) side.classList.toggle("dead", f.hp <= 0);
      });
      setWidth("#cb-self-fill", pHp / player.max * 100);
      setText("#cb-self-num", pHp + " / " + player.max);
      mount.querySelector("#cb-stage").innerHTML = logHtml || '<div class="cb-line dim">' + h('气机锁定——他垂眸，掩去识海中翻涌的真言。') + '</div>';
      const rv = mount.querySelector("#cb-reveal");
      const hit = mount.querySelector("#cb-hit");
      const flee = mount.querySelector("#cb-flee");
      const auto = mount.querySelector("#cb-auto");
      if (rv) rv.disabled = actionBusy || rounds > 0 || autoMode;
      if (flee) flee.disabled = actionBusy || ended;
      if (hit) {
        hit.disabled = actionBusy || autoMode || ended;
        hit.textContent = actionBusy ? "回合中…" : "攻击一回合";
      }
      if (auto) {
        auto.disabled = actionBusy || autoMode || ended;
        auto.textContent = autoMode ? "自动攻击中…" : "自动攻击";
      }
    }

    function doManualRound() {
      if (actionBusy || autoMode || ended) return;
      actionBusy = true;
      Game.audio && Game.audio.sfx && Game.audio.sfx("battle_swing");
      draw();
      setTimeout(() => {
        if (!round()) {
          actionBusy = false;
          draw();
        }
      }, 260);
    }

    function startAuto() {
      if (actionBusy || autoMode || ended) return;
      autoMode = true;
      Game.audio && Game.audio.sfx && Game.audio.sfx("battle_swing");
      draw();
      setTimeout(autoLoop, 320);
    }

    function fleeBattle() {
      if (actionBusy || ended) return;
      ended = true;
      actionBusy = true;
      log.push('<span class="dim">沈砚压下识海翻涌的真言，借一口余息退入暗处。</span>');
      draw();
      setTimeout(() => onEnd && onEnd({ win: false, fled: true, reveal, rounds }), 500);
    }
    function autoLoop() {
      if (ended) return;
      actionBusy = true;
      const done = round();
      if (!done) {
        actionBusy = false;
        draw();
        setTimeout(autoLoop, 650);
      }
    }

    // 推进一回合；返回 true 表示战斗结束（已触发 finish）
    function round() {
      if (ended) return true;
      rounds++;
      const target = leadFoe();
      const d = dmgToFoe(target);
      target.hp -= d.v;
      log.push(narrate(d, target));
      Game.audio && Game.audio.sfx && Game.audio.sfx(d.burstHit ? "battle_burst" : "battle_hit");
      const targetDown = target.hp <= 0;
      if (targetDown) log.push('<span class="hl">' + target.name + '形神一散，倒退出战圈。</span>');
      if (!livingFoes().length) { draw(); Game.visual.burstAt && Game.visual.burstAt(mount.querySelector("#cb-foe-fill-" + target.idx), { n: 14 }); finish(true); return true; }
      const e = dmgToPlayer();
      const wasOk = player.hp / player.max >= 0.3;
      player.hp -= e.v;
      log.push('<span class="dim">' + (e.count > 1 ? '群敌合扑' : livingFoes()[0].name + '反扑') + '，' + player.name + '不闪不避。</span>　<span class="dim small">[-' + e.v + ' 气血]</span>');
      Game.audio && Game.audio.sfx && Game.audio.sfx("battle_clash");
      if (player.hp <= 0) { draw(); finish(false); return true; }
      draw();
      if (d.v > 0 && Game.visual.burstAt) Game.visual.burstAt(mount.querySelector("#cb-foe-fill-" + target.idx)); // 命中迸发(P-29)
      if (wasOk && player.hp / player.max < 0.3 && Game.visual.redFlash) Game.visual.redFlash(); // 跌入危险红闪(P-29)
      return false;
    }

    function finish(win) {
      ended = true;
      actionBusy = true;
      const lowReveal = reveal <= 0.4;
      setTimeout(() => {
        mount.querySelector("#cb-hit") && (mount.querySelector("#cb-hit").disabled = true);
        mount.querySelector("#cb-auto") && (mount.querySelector("#cb-auto").disabled = true);
        mount.querySelector("#cb-flee") && (mount.querySelector("#cb-flee").disabled = true);
        const tag = win
          ? (lowReveal ? '<b class="hl">扮猪吃虎</b>——' + h('他始终只露了') + Math.round(reveal * 10) + '成，满场哗然。'
                       : '<b class="hl">当众碾压</b>——真言尽吐，' + groupName + '伏地。')
          : '<span class="hl-rose">力竭</span>——' + h('这一回，是他低估了对手。');
        const banner = document.createElement("div");
        banner.className = "cb-result " + (win ? "win" : "lose");
        banner.innerHTML = tag;
        mount.querySelector(".battle").appendChild(banner);
        setTimeout(() => onEnd && onEnd({ win, reveal, rounds, lowReveal }), 1400);
      }, 500);
    }

    if (canInstakill) return instakill();
    draw();
  }

  Game.battle = { start };
})(window.Game = window.Game || {});
