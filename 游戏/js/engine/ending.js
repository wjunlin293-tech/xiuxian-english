/* ───────────────────────────────────────────────────────────────
 * ending.js · demo 片尾 / 完整版 CTA / 继续修行
 * P-END：N5 约后分流完成后进入纯净片尾，再给完整版 CTA 与 freeplay 入口。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  function mountEl() { return document.getElementById("stage"); }
  function flags() { Game.normalizeState && Game.normalizeState(); return Game.state.flags; }
  function h(s) { return Game.heroText ? Game.heroText(s) : s; }
  function rep() { return flags().vowRep || (flags().vowBossDone ? "雪耻" : flags().vowBossLost ? "败约" : flags().vowBossSkipped ? "避锋" : "未竟"); }

  function repLead() {
    const r = rep();
    if (r === "雪耻") return "可这惊天动地的一战，不过是沈砚迈出书院的，第一步。";
    if (r === "败约") return h("他败了一场。可那根没拔的刺，会陪他，走得更远。");
    if (r === "避锋") return h("那一日，台上没有他。有些账，他留着——亲手去清。");
    return h("有些路，尚未走完；有些字，还在等他。");
  }

  function saveView(view) {
    Game.save && Game.save.write({ view: view });
  }

  function start() {
    flags().endingStarted = true;
    showCredits();
  }

  function showCredits() {
    Game.setZone && Game.setZone("ending");
    Game.renderHeader && Game.renderHeader();
    saveView("ending_credits");
    mountEl().innerHTML =
      '<div class="ending-screen ending-credits">' +
      '  <div class="wc-tag">学院篇 · 片尾</div>' +
      '  <div class="ending-body">' +
      '    <p>夜色漫过问言书院。藏言楼顶那一线幽光，静静望着杂役房那盏将熄的灯。</p>' +
      '    <p>片尾曲起——</p>' +
      '  </div>' +
      '  <div class="credits-roll" aria-label="片尾字幕">' +
      '    <div class="credits-inner">' +
      '      <p>策划 / 编剧 / 系统设计</p><b>Codex × Claude × Zhuanz</b>' +
      '      <p>美术方向</p><b>原创国漫仙侠 · 黑暗东方幻想</b>' +
      '      <p>音乐与音效</p><b>程序合成氛围乐 · 可替换本地曲目</b>' +
      '      <p>词库来源致谢</p><b>公开词表 / ECDICT / 项目内清洗工具链</b>' +
      '      <p>特别鸣谢</p><b>仍愿意把一个字一个字背下去的你</b>' +
      '    </div>' +
      '  </div>' +
      '  <button class="btn btn-gold ending-next" id="ending-next">字幕落尽 ▸</button>' +
      '</div>';
    mountEl().querySelector("#ending-next").onclick = showCta;
  }

  function showCta() {
    Game.setZone && Game.setZone("ending");
    Game.renderHeader && Game.renderHeader();
    saveView("ending_cta");
    mountEl().innerHTML =
      '<div class="ending-screen ending-cta">' +
      '  <div class="wc-tag">学院篇 · 第一阶 完</div>' +
      '  <h2>书院之外，才是人界</h2>' +
      '  <div class="ending-body">' +
      '    <p>学院篇 · 第一阶，到此为止。</p>' +
      '    <p>' + repLead() + '</p>' +
      '    <p>' + h("更广的人界、散落的十枚异果、失踪的父亲、那半枚没碎的玉佩、识海最深处沉睡的秘密……都在【完整版】里，等他。") + '</p>' +
      '  </div>' +
      '  <div class="cta-panel">' +
      '    <button class="btn" id="full-version">了解完整版</button>' +
      '    <button class="btn btn-gold" id="freeplay">继续修行 ▸</button>' +
      '  </div>' +
      '  <p class="dim small" id="full-version-note">继续修行不会清档；你可以留在凝言门前继续背词、历练、炼丹，等待出世之日。</p>' +
      '</div>';
    mountEl().querySelector("#full-version").onclick = () => {
      const note = mountEl().querySelector("#full-version-note");
      if (note) note.textContent = "完整版信息暂未接入。当前 demo 已保留购买入口位置，后续可替换为 Steam / 官网 / 应用商店链接。";
    };
    mountEl().querySelector("#freeplay").onclick = showFreeplayIntro;
  }

  function showFreeplayIntro() {
    Game.setZone && Game.setZone("ending");
    Game.renderHeader && Game.renderHeader();
    saveView("ending_freeplay");
    mountEl().innerHTML =
      '<div class="ending-screen ending-freeplay">' +
      '  <div class="wc-tag">继续修行</div>' +
      '  <h2>故事未尽，字还在</h2>' +
      '  <div class="ending-body">' +
      '    <p>故事，到这里告一段落。</p>' +
      '    <p>可你若还想陪沈砚走下去——就在凝言境的门槛前，继续背字、问道、采药炼丹，等一个能走出书院的日子。背得越多，来日那扇门后的天地，你才走得越远。</p>' +
      '    <p class="dim">继续修行：自由背词与历练。寿元随年月流逝；大限到时，自有来世。</p>' +
      '  </div>' +
      '  <button class="btn btn-gold ending-next" id="freeplay-enter">回到月课 ▸</button>' +
      '</div>';
    mountEl().querySelector("#freeplay-enter").onclick = continuePractice;
  }

  function continuePractice() {
    flags().endingSeen = true;
    flags().freeplayUnlocked = true;
    Game.logEvent && Game.logEvent("卷终 · 学院篇第一阶完，继续修行已开启");
    Game.save && Game.save.write({ view: "hub" });
    Game.hub.show("学院篇第一阶已完。你仍可继续背词、探险、炼丹；凝言之上的路，在书院之外。");
  }

  Game.ending = { start, showCredits, showCta, showFreeplayIntro, continuePractice };
})(window.Game = window.Game || {});
