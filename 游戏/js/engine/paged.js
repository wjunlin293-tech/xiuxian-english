/* ───────────────────────────────────────────────────────────────
 * paged.js · 翻页剧情引擎
 * 一章 = 一串 page；page 类型：story / word / battle / allocate /
 * breakthrough / choice。引擎按序推进，遇交互节点接对应引擎。
 * R4 起剧情节点作为 hub 行动接入；旧 word/battle/allocate 类型仅作兼容。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  let chapter = null, idx = 0, mountId = "stage", onChapterEnd = null, onChapterExit = null;
  // P-CHOICELOCK：返回下界。做完一个选择就不能再退回到该选择页（及更早内容），
  // 防玩家把每个分支结局都看一遍再挑最优。floor 之前的页一律回不去。
  let floor = 0;
  let keysBound = false; // P-KEYNAV：键盘翻页监听只绑一次

  function start(ch, mount, onEnd, startIdx, onExit) {
    chapter = ch; idx = startIdx || 0; mountId = mount || "stage"; onChapterEnd = onEnd;
    onChapterExit = onExit || null;
    if (idx < 0 || idx >= chapter.pages.length) idx = 0;
    // 读档续上：若 resume 点之前有选项页，说明那些选择已做过，重算 floor 锁在最后一个选项之后。
    floor = 0;
    for (let k = idx - 1; k >= 0; k -= 1) {
      if (chapter.pages[k] && chapter.pages[k].type === "choice") { floor = k + 1; break; }
    }
    bindKeys();
    applyChapterMusic();
    renderPage();
  }

  // P-KEYNAV：方向键 / 小键盘左右翻页。仅在叙事页生效（带 .kbd-nav 标记）；
  // 选择题页、背词/战斗等交互页没有标记 → 键盘翻页自动失效，须点按钮/作答。
  function bindKeys() {
    if (keysBound) return;
    keysBound = true;
    document.addEventListener("keydown", function (e) {
      if (document.body.classList.contains("modal-open")) return; // 弹窗打开时不抢键
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const m = mountEl();
      const page = m && m.querySelector(".story-page.kbd-nav");
      if (!page) return; // 当前不是可键盘翻页的叙事页（含选择题页）→ 忽略
      const isNext = e.key === "ArrowRight" || e.code === "Numpad6" || e.key === " " || e.code === "Space";
      const isPrev = e.key === "ArrowLeft" || e.code === "Numpad4";
      if (!isNext && !isPrev) return;
      e.preventDefault();
      if (isNext) next();
      else if (prevIndex() >= 0) prev();
    });
  }

  function mountEl() { return document.getElementById(mountId); }
  function val(x) { return typeof x === "function" ? x() : x; }
  function next() {
    Game.audio && Game.audio.sfx && Game.audio.sfx("page");
    idx += 1; renderPage();
  }

  // 返回上一页：只停在叙事页/选择页，跳过会重复触发副作用的交互页（背词/战斗/加点/破境）。
  function isSafePage(p) { return !!p && (p.type === "story" || !p.type || p.type === "choice"); }
  function prevIndex() {
    let j = idx - 1;
    while (j >= floor && !isSafePage(chapter.pages[j])) j -= 1;
    return j >= floor ? j : -1; // -1 表示前面没有可安全返回的页（或已被选择锁封）
  }
  function prev() { const j = prevIndex(); if (j < 0) return; idx = j; renderPage(); }
  function backBtn() {
    const b = document.createElement("button");
    b.className = "btn btn-mini back";
    b.textContent = "◂ 上一页";
    b.onclick = prev;
    return b;
  }
  // 退出剧情回主页（永远显示）。有 onExit 则记断点下次续上；没有则直接回 hub。
  function exitBtn() {
    const b = document.createElement("button");
    b.className = "btn btn-mini story-exit";
    b.textContent = "✕ 退出，回主页面";
    b.onclick = exitCurrent;
    return b;
  }

  function exitCurrent() {
    const el = mountEl();
    if (!chapter || !el || !el.querySelector(".story-page")) return false;
    if (onChapterExit) onChapterExit(idx);
    else {
      Game.save && Game.save.write({ view: "hub" });
      Game.hub && Game.hub.show("已退出剧情。");
    }
    return true;
  }

  function continueBtn(label, fn) {
    const b = document.createElement("button");
    b.className = "btn btn-gold continue";
    b.textContent = val(label) || "继续 ▸";
    b.onclick = fn;
    return b;
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function plainText(html) {
    return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  function storyCue(p, body, portraitName) {
    const text = plainText(body);
    if (portraitName) return portraitName + "在场";
    if (/三年之约|裴照临|裴氏/.test(text)) return "三年之约";
    if (/母亲|父亲|失踪|身世|旧布包/.test(text)) return "身世余痕";
    if (/异果|果核|果髓|天外言典/.test(text)) return "天外伏笔";
    if (/弃字阶|藏言楼|书院|问言/.test(text)) return "书院暗流";
    if (/寿元|前世|转世|鬼魂/.test(text)) return "生死回响";
    return p && val(p.heading) ? "此章一页" : "继续观文";
  }

  function readBar(cue) {
    const total = chapter && chapter.pages ? chapter.pages.length : 1;
    const current = Math.max(1, Math.min(total, idx + 1));
    const pct = Math.round(current / Math.max(1, total) * 100);
    return '<div class="story-readbar" aria-label="剧情阅读进度">' +
      '<span>卷页 ' + current + '/' + total + '</span>' +
      '<i><b style="width:' + pct + '%"></b></i>' +
      '<em>' + esc(cue || "") + '</em>' +
      '</div>';
  }

  function renderPage() {
    const el = mountEl();
    if (!chapter || idx >= chapter.pages.length) {
      el.innerHTML = '<div class="story-page center"><p class="dim">— demo 切片 完 —</p></div>';
      if (Game.setRealmDisplayOverride) Game.setRealmDisplayOverride(null);
      if (chapter && chapter.clearSaveOnEnd) Game.save && Game.save.clear();
      onChapterEnd && onChapterEnd();
      Game.renderHeader && Game.renderHeader();
      return;
    }
    const p = chapter.pages[idx];
    Game.save && Game.save.write({ chapterId: chapter.id, idx: idx });
    // 境界显示 override 章内"粘住"：页显式声明 realmOverride 才改、realmOverrideClear 才清回真实境界，
    // 其余页保持不变。用于序章"启言境体验卡"——破境后一路显启言境，到"血气翻涌"页再跌回凡身。
    if (Game.setRealmDisplayOverride) {
      if (p.realmOverride) Game.setRealmDisplayOverride(p.realmOverride);
      else if (p.realmOverrideClear) Game.setRealmDisplayOverride(null);
    }
    Game.renderHeader && Game.renderHeader();
    el.scrollTop = 0;
    window.scrollTo(0, 0);

    if (p.type === "story" || !p.type) return renderStory(el, p);
    if (p.type === "word")        return renderWord(el, p);
    if (p.type === "battle")      return renderBattle(el, p);
    if (p.type === "allocate")    return renderAllocate(el, p);
    if (p.type === "breakthrough")return renderBreakthrough(el, p);
    if (p.type === "choice")      return renderChoice(el, p);
    next();
  }

  function applyChapterMusic() {
    if (!Game.audio || !Game.audio.mood) return;
    const mood = (chapter && chapter.musicMood) || "read_calm";
    Game.audio.mood(mood);
  }

  function renderStory(el, p) {
    const body = val(p.body) || "";
    const portraitSrc = val(p.portrait);
    const portraitName = val(p.portraitName);
    const portraitSide = val(p.portraitSide);
    const portraitLayout = val(p.portraitLayout);
    const portraitMode = val(p.portraitMode);
    const heading = val(p.heading);
    const portraitIntro = portraitLayout === "intro" || portraitMode === "intro";
    const cue = storyCue(p, body, portraitName);
    const portrait = portraitSrc
      ? '<figure class="story-portrait ' + (portraitSide === "left" ? "left" : "right") + '">' +
        '  <img src="' + portraitSrc + '" alt="' + (portraitName || "剧情人物") + '">' +
        (portraitName ? '  <figcaption>' + portraitName + '</figcaption>' : '') +
        '</figure>'
      : '';
    const canPrev = prevIndex() >= 0;
    el.innerHTML =
      '<div class="story-page kbd-nav' + (portrait ? ' has-portrait' : '') + (portraitIntro ? ' portrait-intro' : '') + '">' +
      readBar(cue) +
      '<div class="story-scene">' +
      (portrait && (portraitIntro || portraitSide === "left") ? portrait : '') +
      '<div class="story-copy">' +
      (heading ? '<h2>' + heading + '</h2>' : '') +
      '<div class="story-body">' + body + '</div>' +
      '</div>' +
      (portrait && !portraitIntro && portraitSide !== "left" ? portrait : '') +
      '</div>' +
      '</div>';
    const page = el.querySelector(".story-page");
    if (p.sfx && Game.audio && Game.audio.sfx) Game.audio.sfx(p.sfx);
    const img = page.querySelector(".story-portrait img");
    if (img) img.onerror = () => { img.closest(".story-portrait").hidden = true; };
    page.appendChild(continueBtn(p.cont, next));
    if (canPrev) page.appendChild(backBtn());
    page.appendChild(exitBtn());
    // P-KEYNAV 提示：告诉玩家方向键 / 小键盘也能翻页（固定位置，省得每次找按钮）。
    const hint = document.createElement("div");
    hint.className = "kbd-hint";
    hint.innerHTML = (canPrev ? "← 上一页　" : "") + "→ / 空格 下一页　·　方向键、小键盘 ◄ ► 或空格键均可翻页";
    page.appendChild(hint);
  }

  function renderWord(el, p) {
    const lead = val(p.lead);
    el.innerHTML =
      '<div class="story-page">' +
      (lead ? '<div class="story-body word-lead">' + lead + '</div>' : '') +
      '<div id="wc-mount"></div></div>';
    Game.wordcard.render(el.querySelector("#wc-mount"), p.word, function () {
      const raw = p.yanqi != null ? p.yanqi : 12;
      const gain = Game.applyQiGainRate ? Game.applyQiGainRate(raw) : raw;
      const events = Game.gainYanqi(gain, { scaled: true });
      Game.visual.toast('参透「' + p.word + '」　言气 +' + gain, 'gold');
      if (events.length) {
        // 旧剧情兼容：觉醒/破境先放旧横幅，再继续；R1 新流程使用雷劫。
        const m = el.querySelector("#wc-mount");
        m.innerHTML = "";
        Game.visual.breakthroughBanner(m, events[0].from, events[0].to, function () {
          Game.renderHeader && Game.renderHeader();
          m.appendChild(continueBtn(p.cont || "睁眼 ▸", next));
        });
      } else {
        el.querySelector("#wc-mount").appendChild(continueBtn(p.cont, next));
      }
    });
  }

  function renderBattle(el, p) {
    const lead = val(p.lead);
    el.innerHTML =
      '<div class="story-page">' +
      (lead ? '<div class="story-body">' + lead + '</div>' : '') +
      '<div id="cb-mount"></div></div>';
    function run() {
      const mount = el.querySelector("#cb-mount");
      mount.innerHTML = "";
      Game.battle.start(mount, p.enemy, { mustWin: p.mustWin, daoxinExempt: true }, function (res) {
        Game.lastBattle = res;
        // 生死戏(mustWin)败了不推进胜利向正文，原地重来
        if (p.mustWin && !res.win) {
          Game.visual.toast("败了——这一回，藏锋藏过了头。再来。", "rose");
          setTimeout(run, 700);
          return;
        }
        next();
      });
    }
    run();
  }

  function renderAllocate(el, p) {
    const lead = val(p.lead);
    el.innerHTML =
      '<div class="story-page">' +
      (lead ? '<div class="story-body">' + lead + '</div>' : '') +
      '<div id="al-mount"></div></div>';
    Game.radar.allocateCard(el.querySelector("#al-mount"), next);
  }

  function renderBreakthrough(el, p) {
    el.innerHTML = '<div class="story-page"><div id="bt-mount"></div></div>';
    Game.visual.breakthroughBanner(el.querySelector("#bt-mount"), p.from, p.to, function () {
      el.querySelector("#bt-mount").appendChild(continueBtn(p.cont, next));
    });
  }

  function renderChoice(el, p) {
    const prompt = val(p.prompt);
    el.innerHTML =
      '<div class="story-page">' +
      readBar("抉择") +
      (prompt ? '<div class="story-body choice-prompt">' + prompt + '</div>' : '') +
      '<div class="choice-list" id="ch-list"></div></div>';
    const list = el.querySelector("#ch-list");
    p.options.forEach((opt) => {
      const b = document.createElement("button");
      b.className = "btn choice-opt";
      // opt.enabled()：返回 false 时本选项灰掉不可选（如灵石/境界/持物门槛）。
      // 灰掉时优先显示 opt.lockedLabel（讲清为何不可选），否则沿用原 label。
      const ok = !opt.enabled || opt.enabled();
      if (!ok) {
        b.classList.add("choice-opt-locked");
        b.disabled = true;
      }
      b.innerHTML = (!ok && opt.lockedLabel) ? val(opt.lockedLabel) : val(opt.label);
      b.onclick = () => {
        if (b.disabled) return;
        Game.audio && Game.audio.sfx && Game.audio.sfx("story_choice");
        opt.onPick && opt.onPick(); floor = idx + 1; next();
      };
      list.appendChild(b);
    });
    if (prevIndex() >= 0) el.querySelector(".story-page").appendChild(backBtn());
    // 选择页不显示「退出，回主页面」：有选项时必须做决定，不能溜回主界面规避。
  }

  Game.paged = { start, exitCurrent, handleEscape: exitCurrent };
})(window.Game = window.Game || {});
