/* ───────────────────────────────────────────────────────────────
 * menu.js · 主菜单 / 三槽存档 / 退出页
 * P-37：启动首屏从游戏内拆出，重开语义移到存档槽删除。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const mountId = "stage";
  let currentScreen = "";
  let settingsBack = null;

  function el() { return document.getElementById(mountId); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function fmtDate(ts) {
    if (!ts) return "未记录";
    try {
      return new Date(ts).toLocaleString("zh-CN", {
        month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
      });
    } catch (e) { return "未记录"; }
  }

  function enterMenuMode() {
    document.body.classList.add("menu-mode");
    Game.clearEmber && Game.clearEmber();
    Game.setZone && Game.setZone("menu");
    const top = document.getElementById("topbar");
    const eb = document.getElementById("eventbar");
    if (top) top.innerHTML = "";
    if (eb) eb.innerHTML = "";
  }

  function leaveMenuMode() {
    document.body.classList.remove("menu-mode");
  }

  function lastSlotSummary() {
    const last = Game.save && Game.save.lastSlot && Game.save.lastSlot();
    if (!last) return null;
    const item = (Game.save.list ? Game.save.list() : []).find((x) => x.slot === last);
    return item && !item.empty ? item : null;
  }

  function audioLabel() {
    if (!Game.audio || !Game.audio.isMuted || !Game.audio.isActive) return "关闭音乐";
    if (Game.audio.isMuted()) return "开启音乐";
    return Game.audio.isActive() ? "关闭音乐" : "点击续音";
  }

  function bindAudioButton(button) {
    if (!button) return;
    button.textContent = "♪ " + audioLabel();
    button.onclick = () => {
      if (!Game.audio) return;
      // 自动播放被浏览器拦截时，第一次点这里应该是“恢复播放”，不是把默认开启状态关掉。
      if (Game.audio.isMuted && !Game.audio.isMuted() && Game.audio.isActive && !Game.audio.isActive()) {
        Game.audio.activate && Game.audio.activate();
        button.textContent = "♪ 关闭音乐";
        setTimeout(() => { button.textContent = "♪ " + audioLabel(); }, 120);
        setTimeout(() => { button.textContent = "♪ " + audioLabel(); }, 700);
        return;
      }
      const muted = Game.audio.toggleMute ? Game.audio.toggleMute() : false;
      button.textContent = muted ? "♪ 开启音乐" : "♪ " + audioLabel();
    };
  }

  function settingValue(key, fallback) {
    Game.normalizeState && Game.normalizeState();
    return Game.state && Game.state.settings && typeof Game.state.settings[key] !== "undefined"
      ? Game.state.settings[key]
      : fallback;
  }

  function saveSettings(partial) {
    if (partial && partial.difficulty && Game.difficultyLocked && Game.difficultyLocked()) return;
    if (Game.saveUserSettings) Game.saveUserSettings(partial);
    else {
      Game.state.settings = Object.assign({}, Game.state.settings || {}, partial || {});
    }
    Game.audio && Game.audio.applySettings && Game.audio.applySettings();
    Game.renderHeader && Game.renderHeader();
  }

  function pct(n) {
    const v = Math.max(0, Math.min(1, Number(n) || 0));
    return Math.round(v * 100);
  }

  function difficultyCards() {
    const locked = Game.difficultyLocked && Game.difficultyLocked();
    const current = Game.activeDifficultyKey ? Game.activeDifficultyKey() : settingValue("difficulty", "normal");
    const list = Game.DIFFICULTIES || {};
    return Object.keys(list).map((key) => {
      const d = list[key];
      return '<button class="setting-choice' + (key === current ? ' active' : '') + (locked ? ' locked' : '') + '" data-difficulty="' + esc(key) + '"' + (locked ? ' disabled' : '') + '>' +
        '<b>' + esc(d.name) + '</b>' +
        '<span>言气获取 ' + Math.round((d.qiRate || 1) * 100) + '%</span>' +
        '<small>' + esc(d.desc || "") + '</small>' +
      '</button>';
    }).join("");
  }

  function showSettings(backFn) {
    currentScreen = "settings";
    settingsBack = backFn || showMain;
    enterMenuMode();
    Game.setZone && Game.setZone("menu");
    Game.normalizeState && Game.normalizeState();
    const s = (Game.state && Game.state.settings) || {};
    const muted = Game.audio && Game.audio.isMuted ? Game.audio.isMuted() : !!(s.audio && s.audio.muted);
    const autoMode = s.autoContinueMode || (s.autoContinue ? "normal" : "off");
    el().innerHTML =
      '<section class="settings-screen">' +
      '  <div class="settings-head">' +
      '    <button class="btn btn-mini" id="settings-back">← 返回</button>' +
      '    <h2>游戏设置</h2>' +
      '    <p class="dim small">设置会作为全局偏好保存；新档和读档都会沿用。</p>' +
      '  </div>' +
      '  <div class="settings-grid">' +
      '    <section class="settings-panel">' +
      '      <div class="panel-title">阅读 / 显示设置</div>' +
      '      <div class="setting-row"><span><b>字号</b><small>只影响阅读和界面显示，不影响布局逻辑。</small></span><div class="setting-inline"><button class="btn btn-mini font-choice' + (s.fontSize === "small" ? ' active' : '') + '" data-font="small">小</button><button class="btn btn-mini font-choice' + (s.fontSize !== "small" && s.fontSize !== "large" ? ' active' : '') + '" data-font="normal">中</button><button class="btn btn-mini font-choice' + (s.fontSize === "large" ? ' active' : '') + '" data-font="large">大</button></div></div>' +
      '      <label class="setting-row"><span><b>降低动态效果</b><small>关闭粒子/呼吸等持续动画，阅读更稳。</small></span><input id="set-motion" type="checkbox" ' + (s.reducedMotion ? 'checked' : '') + '></label>' +
      '      <div class="setting-row"><span><b>自动继续</b><small>答题反馈后自动进入下一题；关掉时手动点击继续。</small></span><div class="setting-inline"><button class="btn btn-mini auto-choice' + (autoMode === "off" ? ' active' : '') + '" data-auto="off">关</button><button class="btn btn-mini auto-choice' + (autoMode === "slow" ? ' active' : '') + '" data-auto="slow">慢</button><button class="btn btn-mini auto-choice' + (autoMode === "normal" ? ' active' : '') + '" data-auto="normal">普通</button><button class="btn btn-mini auto-choice' + (autoMode === "fast" ? ' active' : '') + '" data-auto="fast">快</button></div></div>' +
      '    </section>' +
      '    <section class="settings-panel">' +
      '      <div class="panel-title">音频设置</div>' +
      '      <button class="setting-row setting-button" id="set-audio"><span><b>背景音乐</b><small>当前：' + (muted ? '关闭' : '开启') + '</small></span><strong>' + (muted ? '开启' : '关闭') + '</strong></button>' +
      '      <label class="setting-row"><span><b>BGM 音量</b><small id="set-bgm-volume-label">当前：' + pct(s.bgmVolume) + '%</small></span><input id="set-bgm-volume" class="setting-range" type="range" min="0" max="100" value="' + pct(s.bgmVolume) + '"></label>' +
      '      <label class="setting-row"><span><b>音效</b><small>按钮、战斗、坊市等短音效。</small></span><input id="set-sfx" type="checkbox" ' + (s.sfx === false ? '' : 'checked') + '></label>' +
      '      <label class="setting-row"><span><b>音效音量</b><small id="set-sfx-volume-label">当前：' + pct(s.sfxVolume) + '%</small></span><input id="set-sfx-volume" class="setting-range" type="range" min="0" max="100" value="' + pct(s.sfxVolume) + '"></label>' +
      '      <label class="setting-row"><span><b>单词发音</b><small>修炼时保留/关闭 TTS 读音。</small></span><input id="set-tts" type="checkbox" ' + (s.tts === false ? '' : 'checked') + '></label>' +
      '      <div class="setting-row"><span><b>发音口音</b><small>影响单词卡朗读。</small></span><div class="setting-inline"><button class="btn btn-mini accent-choice' + (s.accent !== "uk" ? ' active' : '') + '" data-accent="us">美音</button><button class="btn btn-mini accent-choice' + (s.accent === "uk" ? ' active' : '') + '" data-accent="uk">英音</button></div></div>' +
      '    </section>' +
      '    <section class="settings-panel settings-panel-wide">' +
      '      <div class="panel-title">游戏设置</div>' +
      '      <p class="dim small">' + ((Game.difficultyLocked && Game.difficultyLocked()) ? '本档难度已在开档时定下；只影响后续言气获取，不改已获得言气，也不改词库掌握。' : '新档会沿用这里选中的默认难度；进入入世构筑时仍可最终确认。难度只调整后续言气获取。') + '</p>' +
      '      <div class="difficulty-row">' + difficultyCards() + '</div>' +
      '    </section>' +
      '  </div>' +
      '</section>';
    el().querySelector("#settings-back").onclick = () => (settingsBack || showMain)();
    el().querySelector("#set-motion").onchange = (e) => saveSettings({ reducedMotion: !!e.target.checked });
    el().querySelector("#set-tts").onchange = (e) => saveSettings({ tts: !!e.target.checked });
    el().querySelector("#set-sfx").onchange = (e) => saveSettings({ sfx: !!e.target.checked });
    el().querySelector("#set-bgm-volume").oninput = (e) => {
      const value = Number(e.target.value);
      el().querySelector("#set-bgm-volume-label").textContent = "当前：" + value + "%";
      saveSettings({ bgmVolume: value / 100, audio: { muted: muted, vol: value / 100 } });
    };
    el().querySelector("#set-sfx-volume").oninput = (e) => {
      const value = Number(e.target.value);
      el().querySelector("#set-sfx-volume-label").textContent = "当前：" + value + "%";
      saveSettings({ sfxVolume: value / 100 });
    };
    el().querySelectorAll(".font-choice").forEach((b) => {
      b.onclick = () => {
        saveSettings({ fontSize: b.dataset.font });
        showSettings(settingsBack);
      };
    });
    el().querySelectorAll(".auto-choice").forEach((b) => {
      b.onclick = () => {
        saveSettings({ autoContinueMode: b.dataset.auto, autoContinue: b.dataset.auto !== "off" });
        showSettings(settingsBack);
      };
    });
    el().querySelectorAll(".accent-choice").forEach((b) => {
      b.onclick = () => {
        saveSettings({ accent: b.dataset.accent === "uk" ? "uk" : "us" });
        showSettings(settingsBack);
      };
    });
    el().querySelector("#set-audio").onclick = () => {
      if (Game.audio && Game.audio.toggleMute) Game.audio.toggleMute();
      showSettings(settingsBack);
    };
    el().querySelectorAll("[data-difficulty]").forEach((b) => {
      b.onclick = () => {
        if (b.disabled || (Game.difficultyLocked && Game.difficultyLocked())) return;
        saveSettings({ difficulty: b.dataset.difficulty });
        showSettings(settingsBack);
      };
    });
  }

  function showGate() {
    currentScreen = "gate";
    settingsBack = null;
    enterMenuMode();
    Game.setZone && Game.setZone("cover");
    el().innerHTML =
      '<section class="main-menu entry-gate">' +
      '  <div class="menu-logo-wrap"><img class="menu-logo" src="../素材/logo.png" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\';"><h1 class="menu-title-fallback">世外果缘</h1></div>' +
      '  <p class="menu-sub">问言入道，识海开田。</p>' +
      '  <button class="btn btn-gold entry-start" id="entry-start">点击入道</button>' +
      '  <div class="menu-foot small dim">点击后进入主菜单；若未静音，会同时接续音乐。网页端需要这一次点击来通过 Chrome 的音频策略。</div>' +
      '</section>';
    const gate = el().querySelector(".entry-gate");
    const start = el().querySelector("#entry-start");
    if (gate && start) {
      let entering = false;
      const enter = () => {
        if (entering) return;
        entering = true;
        Game.audio && Game.audio.mood && Game.audio.mood("menu");
        Game.audio && Game.audio.activate && Game.audio.activate();
        start.disabled = true;
        start.textContent = "入道中…";
        setTimeout(showMain, 180);
      };
      gate.onclick = enter;
      start.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        enter();
      };
    }
  }

  function showMain() {
    Game.insight && Game.insight.mark("menu"); // 漏斗：过了标题屏

    currentScreen = "main";
    settingsBack = null;
    enterMenuMode();
    Game.setZone && Game.setZone("cover");
    // 视觉用封面背景，但 BGM 明确用主菜单曲，不跟 cover mood 走。
    Game.audio && Game.audio.mood && Game.audio.mood("menu");
    Game.audio && Game.audio.activate && Game.audio.activate();
    const last = lastSlotSummary();
    el().innerHTML =
      '<section class="main-menu">' +
      '  <div class="menu-logo-wrap"><img class="menu-logo" src="../素材/logo.png" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\';"><h1 class="menu-title-fallback">世外果缘</h1></div>' +
      '  <p class="menu-sub">问言入道，识海开田。</p>' +
      '  <div class="menu-actions">' +
      (last ? '    <button class="btn btn-gold" id="menu-continue">继续上次 · ' + esc(last.realm) + ' ' + esc(last.timeLabel || ("第" + last.year + "年" + last.month + "月")) + '</button>' : '') +
      '    <button class="btn btn-gold" id="menu-start">开始游戏</button>' +
      '    <button class="btn btn-mini" id="menu-settings">游戏设置</button>' +
      '    <button class="btn" id="menu-exit">退出游戏</button>' +
      '  </div>' +
      '  <div class="menu-foot small dim">音乐遵循你的静音设置；Chrome 若拦截自动播放，未静音时点击任意按钮后会接续。网页端退出会显示可关闭页面，打包后可接入真正退出。</div>' +
      '</section>';
    const start = el().querySelector("#menu-start");
    if (start) start.onclick = () => { Game.audio && Game.audio.activate && Game.audio.activate(); showSlots(); };
    const cont = el().querySelector("#menu-continue");
    if (cont && last) cont.onclick = () => { Game.loadSlot && Game.loadSlot(last.slot); };
    const exit = el().querySelector("#menu-exit");
    if (exit) exit.onclick = showExit;
    const settings = el().querySelector("#menu-settings");
    if (settings) settings.onclick = () => showSettings(showMain);
  }

  function slotHtml(item) {
    if (item.empty) {
      return '<article class="slot-card empty" data-slot="' + item.slot + '">' +
        '  <div class="slot-top"><b>存档 ' + item.slot + '</b><span>空档</span></div>' +
        '  <p>开辟一段新的修行。</p>' +
        '  <button class="btn btn-gold slot-open" data-slot="' + item.slot + '">新建修行</button>' +
        '</article>';
    }
    const identity = item.identityLabel || (item.gender === "female" ? "女侠线" : "男侠线");
    return '<article class="slot-card" data-slot="' + item.slot + '">' +
      '  <div class="slot-top"><b>存档 ' + item.slot + ' · ' + esc(item.name) + '</b><span>' + esc(identity) + ' · ' + esc(item.realm) + '</span></div>' +
      '  <p>' + esc(item.timeLabel || ("第" + item.year + "年" + item.month + "月")) + ' · 已掌握 ' + item.mastered + ' 言</p>' +
      '  <p class="small dim">最后游玩：' + esc(fmtDate(item.savedAt)) + '</p>' +
      '  <div class="slot-actions">' +
      '    <button class="btn btn-gold slot-open" data-slot="' + item.slot + '">进入</button>' +
      '    <button class="btn slot-delete" data-slot="' + item.slot + '">删除</button>' +
      '  </div>' +
      '</article>';
  }

  function showSlots() {
    currentScreen = "slots";
    settingsBack = null;
    enterMenuMode();
    const slots = Game.save && Game.save.list ? Game.save.list() : [];
    el().innerHTML =
      '<section class="slot-screen">' +
      '  <div class="slot-head"><button class="btn btn-mini" id="slot-back">← 返回主菜单</button><button class="btn btn-mini" id="slot-settings">游戏设置</button><h2>选择存档</h2><p class="dim small">三个独立存档。删除后，该槽会变为空档，可重新开局。</p></div>' +
      '  <div class="slot-grid">' + slots.map(slotHtml).join("") + '</div>' +
      '</section>';
    el().querySelector("#slot-back").onclick = showMain;
    el().querySelector("#slot-settings").onclick = () => showSettings(showSlots);
    el().querySelectorAll(".slot-open").forEach((b) => {
      b.onclick = () => {
        const slot = Number(b.dataset.slot);
        const data = Game.save && Game.save.read(slot);
        if (data) Game.loadSlot && Game.loadSlot(slot);
        else {
          Game.audio && Game.audio.activate && Game.audio.activate();
          Game.newGame && Game.newGame(slot);
        }
      };
    });
    el().querySelectorAll(".slot-delete").forEach((b) => {
      b.onclick = () => {
        const slot = Number(b.dataset.slot);
        const del = () => {
          Game.save && Game.save.clear(slot);
          showSlots();
        };
        if (Game.modal && Game.modal.confirm) {
          return Game.modal.confirm({
            title: "抹去存档 " + slot + "？",
            body: "此操作不可恢复。该槽的本世进度会清空；跨世学习记忆不随单槽删除而清除。",
            confirmText: "确认删除",
            cancelText: "保留"
          }, del);
        }
        if (!confirm("删除存档 " + slot + "？此操作不可恢复。")) return;
        del();
      };
    });
  }

  function showExit() {
    currentScreen = "exit";
    settingsBack = null;
    if (Game.save && Game.save.getCurrentSlot && Game.save.getCurrentSlot()) {
      Game.save.write(Game.save.read() || { view: "hub" });
    }
    try { window.close(); } catch (e) {}
    enterMenuMode();
    el().innerHTML =
      '<section class="goodbye-screen">' +
      '  <h2>已退出修行</h2>' +
      '  <p class="dim">网页版通常不能直接关闭手动打开的标签页。进度已保存，你可以直接关闭此页。</p>' +
      '  <button class="btn btn-gold" id="bye-menu">返回主菜单</button>' +
      '</section>';
    el().querySelector("#bye-menu").onclick = showMain;
  }

  function backToMenu() {
    if (Game.save) Game.save.write({ view: "hub" });
    showMain();
  }

  function handleEscape() {
    if (!document.body.classList.contains("menu-mode")) return false;
    if (currentScreen === "settings") {
      (settingsBack || showMain)();
      return true;
    }
    if (currentScreen === "slots" || currentScreen === "exit") {
      showMain();
      return true;
    }
    return true; // gate/main 只吞掉 Esc，不让网页或浏览器误处理
  }

  Game.menu = { showGate, showMain, showSlots, showSettings, showExit, backToMenu, leaveMenuMode, handleEscape };
})(window.Game = window.Game || {});
