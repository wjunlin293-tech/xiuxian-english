/* ───────────────────────────────────────────────────────────────
 * main.js · 装配与启动
 * R1 时间养成骨架：启动进月度 hub，剧情流后续作为节点接入。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  let realmDisplayOverride = null;

  function renderHeader() {
    const h = document.getElementById("topbar");
    if (!h) return;
    Game.normalizeState && Game.normalizeState();
    const s = Game.state;
    const realmLabel = realmDisplayOverride || Game.realmName();
    h.innerHTML =
      '<div class="tb-left"><span class="tb-realm">' + realmLabel + '</span>' +
      '  <span class="tb-time">' + Game.time.label() + '</span>' +
      '  <span class="tb-yanqi">言气 ' + s.exp + '/' + s.expToBreak + '</span>' +
      '  <span class="tb-life">寿元 ' + (Game.lifeLabel ? Game.lifeLabel(s.lifespan) : s.lifespan + "月") + '</span>' +
      '  <span class="tb-money">' + (Game.moneyLabel ? Game.moneyLabel(s.money) : ((s.money || 0) + " 灵石")) + '</span>' +
      (s.free > 0 ? '<span class="tb-free">可加点 ' + s.free + '</span>' : '') + '</div>' +
      '<div class="tb-right">' +
      '  <button class="btn btn-mini" id="tb-mute" title="背景音乐">' + (Game.audio && Game.audio.isMuted() ? "🔇" : "🔊") + '</button>' +
      '  <button class="btn btn-mini" id="tb-status">识海</button></div>';
    h.querySelector("#tb-status").onclick = openStatus;
    const mute = h.querySelector("#tb-mute");
    if (mute) mute.onclick = () => { Game.audio && Game.audio.toggleMute(); renderHeader(); };
    renderEventBar();
  }

  // ── 事件栏（P-28）：顶栏下常驻一行；折叠显示标记/最近事件，可展开列表标记 ──
  let eventbarOpen = false;
  function ebEsc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function renderEventBar() {
    const el = document.getElementById("eventbar");
    if (!el) return;
    const bar = Game.barEvent && Game.barEvent();
    if (!bar) { el.innerHTML = ""; return; } // 还没有任何事件→不显示
    const pinned = Game.pinnedEvent && Game.pinnedEvent();
    if (!eventbarOpen) {
      el.innerHTML =
        '<div class="eb-collapsed">' +
        '  <span class="eb-icon">' + (pinned ? "📌" : "🕘") + '</span>' +
        '  <span class="eb-text">' + ebEsc(bar.text) + '</span>' +
        '  <button class="btn btn-mini eb-toggle" id="eb-toggle">展开 ▾</button>' +
        '</div>';
    } else {
      const list = (Game.state.events || []).slice(-15).reverse().map((e) => {
        const isPin = Game.state.pinnedEventId === e.id;
        return '<div class="eb-row' + (isPin ? " pinned" : "") + '">' +
          '<span class="eb-text">' + ebEsc(e.text) + '</span>' +
          '<button class="btn btn-mini eb-pin" data-id="' + e.id + '">' + (isPin ? "📌 已标记" : "标记") + '</button>' +
          '</div>';
      }).join("");
      el.innerHTML =
        '<div class="eb-open">' +
        '  <div class="eb-head"><b>事件</b><button class="btn btn-mini eb-toggle" id="eb-toggle">收起 ▴</button></div>' +
        '  <div class="eb-list">' + (list || '<div class="dim small">暂无事件</div>') + '</div>' +
        '</div>';
    }
    const t = el.querySelector("#eb-toggle");
    if (t) t.onclick = () => { eventbarOpen = !eventbarOpen; renderEventBar(); };
    el.querySelectorAll(".eb-pin").forEach((b) => {
      b.onclick = () => {
        Game.pinEvent && Game.pinEvent(Number(b.dataset.id));
        // 保留当前界面 view 再存（别把 view 覆盖成 hub）
        Game.save && Game.save.write(Game.save.read() || {});
        renderEventBar();
      };
    });
  }

  function openStatus() {
    const ov = document.getElementById("overlay");
    ov.classList.add("show");
    Game.radar.statusScreen(ov.querySelector(".overlay-body"));
  }
  function closeStatus() {
    const ov = document.getElementById("overlay");
    if (!ov || !ov.classList.contains("show")) return false;
    ov.classList.remove("show");
    return true;
  }

  function isTextInput(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
  }

  function backToHub(message) {
    if (!Game.hub || !Game.hub.show) return false;
    Game.save && Game.save.write({ view: "hub" });
    Game.hub.show(message || "");
    return true;
  }

  function escapeSavedView() {
    const sv = Game.save && Game.save.read && Game.save.read();
    const view = sv && sv.view;
    const hubViews = {
      craft: true,
      inventory: true,
      market: true,
      explore: true,
      relations: true,
      yantian: true,
      shentian: true,
      ghost_review: true,
      boss_prompt: true,
      ending_freeplay: true,
    };
    if (hubViews[view]) return backToHub("");
    if (view === "origin_builder") {
      Game.visual && Game.visual.toast && Game.visual.toast("先定下这一世的入世构筑。", "rose");
      return true;
    }
    if (view === "life_death") return true;
    const stage = document.getElementById("stage");
    if (stage && stage.querySelector(".market-screen, .craft-screen, .relations-screen, .yt-screen, .sg-screen, .explore-screen")) {
      return backToHub("");
    }
    return false;
  }

  function escapeHubToMenu() {
    const stage = document.getElementById("stage");
    if (!stage || !stage.querySelector(".hub-screen")) return false;
    if (!Game.menu || !Game.menu.backToMenu) return false;
    Game.menu.backToMenu();
    return true;
  }

  function handleEscape(e) {
    if (e.key !== "Escape" || isTextInput(e.target)) return;
    let handled = false;
    if (Game.imagePreview && Game.imagePreview.isOpen && Game.imagePreview.isOpen()) {
      Game.imagePreview.close();
      handled = true;
    } else if (Game.modal && Game.modal.isOpen && Game.modal.isOpen()) {
      Game.modal.close(false);
      handled = true;
    } else if (closeStatus()) {
      handled = true;
    } else if (Game.menu && Game.menu.handleEscape && Game.menu.handleEscape()) {
      handled = true;
    } else if (Game.cultivate && Game.cultivate.handleEscape && Game.cultivate.handleEscape()) {
      handled = true;
    } else if (Game.paged && Game.paged.handleEscape && Game.paged.handleEscape()) {
      handled = true;
    } else if (escapeHubToMenu()) {
      handled = true;
    } else {
      handled = escapeSavedView();
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function restart() {
    const doRestart = () => {
      Game.save && Game.save.clear();
      location.reload();
    };
    if (Game.modal && Game.modal.confirm) {
      return Game.modal.confirm({
        title: "重开本世？",
        body: "当前时间养成进度会清除；真实学习记忆仍按现有轮回规则保留。",
        confirmText: "重开",
        cancelText: "留下"
      }, doRestart);
    }
    if (!confirm("重新开始？当前时间养成进度会清除。")) return;
    doRestart();
  }

  function boot() {
    const ov = document.getElementById("overlay");
    const close = ov.querySelector(".overlay-close");
    const closeNow = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      closeStatus();
    };
    if (close) {
      close.onpointerdown = closeNow;
      close.onclick = closeNow;
    }
    ov.addEventListener("pointerdown", (e) => { if (e.target === ov) closeNow(e); });
    document.addEventListener("keydown", handleEscape);
    // 背景乐需用户手势激活：Chrome 可能拒绝页面打开时自动播放。
    // 不只监听 once；若首次点击发生在文件还没准备好/浏览器仍拦截，后续交互继续补播，直到真正 active。
    function nudgeAudio() {
      if (!Game.audio || !Game.audio.activate) return;
      if (Game.audio.isMuted && Game.audio.isMuted()) return;
      if (Game.audio.isActive && Game.audio.isActive()) return;
      Game.audio.activate();
    }
    document.addEventListener("pointerdown", nudgeAudio);
    // 按键音效(P-35)：点到按钮就播极轻的"嗒"
    document.addEventListener("click", function (e) {
      nudgeAudio();
      if (e.target && e.target.closest && e.target.closest("button, .btn")) Game.audio && Game.audio.sfx && Game.audio.sfx("click");
    });

    Game.insight && Game.insight.boot();       // P-INSIGHT：会话开始
    Game.insight && Game.insight.mark("open");  // 漏斗：打开页面
    Game.save && Game.save.migrateLegacy && Game.save.migrateLegacy();
    if (Game.menu) return Game.menu.showGate ? Game.menu.showGate() : Game.menu.showMain();
    loadSlot((Game.save && Game.save.lastSlot && Game.save.lastSlot()) || 1);
  }

  function loadSlot(slot) {
    if (!Game.save || !Game.save.setCurrentSlot(slot)) return;
    closeStatus();
    Game.menu && Game.menu.leaveMenuMode && Game.menu.leaveMenuMode();
    Game.resetState && Game.resetState();
    const sv = Game.save.read(slot);
    if (sv) Game.save.apply(sv);
    if (Game.dev && Game.dev.sanitizeLoadedState && Game.dev.sanitizeLoadedState()) {
      Game.save && Game.save.write({ view: "hub" });
    }
    Game.normalizeState && Game.normalizeState();
    Game.audio && Game.audio.applySettings && Game.audio.applySettings();
    Game.syncCrossBookKnown && Game.syncCrossBookKnown(); // P-AUTOMARK：读档后静默同步当前书的跨书已会词（不弹窗）
    renderHeader();
    if ((Game.state && Game.state.lifeDead) || (sv && sv.view === "life_death")) {
      return Game.life && Game.life.showDeath ? Game.life.showDeath() : Game.hub.show("");
    }
    restoreView(sv);
  }

  function newGame(slot) {
    if (!Game.save || !Game.save.setCurrentSlot(slot)) return;
    closeStatus();
    Game.menu && Game.menu.leaveMenuMode && Game.menu.leaveMenuMode();
    Game.save.clear(slot);
    Game.save.setCurrentSlot(slot);
    Game.resetState && Game.resetState();
    Game.rebirth && Game.rebirth.applyGlobalMemoryToState && Game.rebirth.applyGlobalMemoryToState();
    Game.normalizeState && Game.normalizeState();
    Game.audio && Game.audio.applySettings && Game.audio.applySettings();
    Game.syncCrossBookKnown && Game.syncCrossBookKnown(); // P-AUTOMARK：转世/新档继承全局已掌握后静默同步
    renderHeader();
    if (Game.rebirth && Game.rebirth.shouldShowOrigin && Game.rebirth.shouldShowOrigin()) {
      return Game.rebirth.showOriginBuilder("new");
    }
    restoreView(null);
  }

  function storyNodeByChapterId(id) {
    return (Game.STORY_NODES || []).find((node) => node.chapter && node.chapter.id === id);
  }

  // 恢复界面加保护：任一界面渲染出错时回退到月课主页（保证"继续上次"一定进得去），
  // 并把真实错误打到控制台与屏幕，便于定位。
  function restoreView(sv) {
    try {
      return restoreViewInner(sv);
    } catch (e) {
      try { console.error("[restoreView] 恢复上次界面出错，已回退月课：", e); } catch (_) {}
      try {
        return Game.hub.show("已接续上次进度（上次所在界面恢复异常，已回到月课）。");
      } catch (e2) {
        const stage = document.getElementById("stage");
        if (stage) stage.innerHTML =
          '<div class="story-page"><div class="story-body"><p>读取存档时出错：' +
          ((e2 && e2.message) || String(e2)) + '</p></div>' +
          '<button class="btn btn-gold" onclick="location.reload()">刷新重试</button></div>';
      }
    }
  }

  function restoreViewInner(sv) {
    if (Game.state && Game.state.lifeDead && Game.life && Game.life.showDeath) return Game.life.showDeath();
    if (!sv) return Game.hub.show("");
    if (Game.state.activeCultivation && Game.cultivate &&
        (sv.view === "cultivate" || sv.view === "cultivate_resume")) {
      return Game.cultivate.showResumePrompt();
    }
    if (sv.view === "breakthrough" && Game.state.activeBreak && Game.cultivate && Game.cultivate.restoreBreakthrough) {
      return Game.cultivate.restoreBreakthrough(); // P-BREAK：天劫雷劫中途刷新续上
    }
    if (sv.view === "craft" && Game.craft) return Game.craft.show("已接续上次丹房进度。");
    if (sv.view === "inventory" && Game.craft) return Game.craft.showInventory("已接续上次背包进度。");
    if (sv.view === "market" && Game.market) return Game.market.show("已接续上次坊市进度。");
    if (sv.view === "explore" && Game.explore) return Game.explore.showZones("已接续上次探险选择。");
    if (sv.view === "relations" && Game.relations) return Game.relations.show("已接续上次人物谱。");
    if (sv.view === "cultivate_menu" && Game.cultivate) return Game.cultivate.chooseSession();
    if (sv.view === "yantian" && Game.yantian) return Game.yantian.show(Game.state.vocabBookId);
    if (sv.view === "shentian" && Game.yantian) return Game.yantian.showGarden();
    if (sv.view === "ending_credits" && Game.ending) return Game.ending.showCredits();
    if (sv.view === "ending_cta" && Game.ending) return Game.ending.showCta();
    if (sv.view === "ending_freeplay" && Game.ending) return Game.ending.showFreeplayIntro();
    if (sv.view === "ghost_review" && Game.rebirth) return Game.rebirth.showGhosts("已接续前世鬼魂复习。");
    if (sv.view === "origin_builder" && Game.rebirth) return Game.rebirth.showOriginBuilder("resume");
    if (sv.view === "boss_prompt" && Game.storyflow && Game.storyflow.bossDue()) return Game.storyflow.showBossPrompt();
    if (sv.view === "paged" && sv.chapterId && typeof sv.idx === "number") {
      const node = storyNodeByChapterId(sv.chapterId);
      if (node) {
        return Game.paged.start(node.chapter, "stage", function () {
          if (Game.storyflow && Game.storyflow.completeNode) return Game.storyflow.completeNode(node);
          Game.hub.show("剧情节点「" + node.title + "」已推进。");
        }, sv.idx);
      }
    }
    Game.hub.show("已接续上次月课进度。");
  }

  // 场景背景：各界面进入时设 body[data-zone]，切换氛围底图(见 style.css #zone-backdrop)
  function setZone(zone) {
    try {
      if (zone) document.body.dataset.zone = zone;
      else document.body.removeAttribute("data-zone");
      clearEmber();
    } catch (e) {}
    if (zone !== "story") realmDisplayOverride = null;
    Game.audio && Game.audio.mood && Game.audio.mood(zone); // 按界面切背景乐(P-34)
  }
  // hub 浮粒子(余烬)：注入一层缓慢上浮的 .ember；切到别的界面时由 clearEmber 移除
  function clearEmber() {
    const old = document.getElementById("ember-layer");
    if (old) old.remove();
  }
  function spawnEmber() {
    clearEmber();
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = document.createElement("div");
    layer.className = "ember-layer"; layer.id = "ember-layer";
    for (let i = 0; i < 9; i++) {
      const e = document.createElement("span");
      e.className = "ember";
      e.style.left = Math.round(Math.random() * 100) + "%";
      e.style.setProperty("--drift", (Math.round(Math.random() * 60) - 30) + "px");
      e.style.animationDuration = (9 + Math.random() * 7).toFixed(1) + "s";
      e.style.animationDelay = "-" + (Math.random() * 12).toFixed(1) + "s";
      layer.appendChild(e);
    }
    document.body.appendChild(layer);
  }

  Game.restart = restart;
  Game.loadSlot = loadSlot;
  Game.newGame = newGame;
  Game.restoreView = restoreView;
  Game.renderHeader = renderHeader;
  Game.handleEscape = handleEscape;
  Game.setRealmDisplayOverride = function (name) { realmDisplayOverride = name || null; };
  Game.setZone = setZone;
  Game.spawnEmber = spawnEmber;
  Game.clearEmber = clearEmber;
  document.addEventListener("DOMContentLoaded", boot);
})(window.Game = window.Game || {});
