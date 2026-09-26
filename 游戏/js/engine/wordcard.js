/* ───────────────────────────────────────────────────────────────
 * wordcard.js · 背词题型（C-09 纯百词斩式·系统按词阶段派题）
 * 题型：learn 先学 / recognize 再认 / spell 默写(逐级提示) / context 语境 / listen 听力。
 * 听力＝Web Speech API（零音频素材·无语音则静默降级）。自评(温故)已移除(bug源)。
 * legacyRender 保留给 paged 旧剧情词卡兼容。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  function wordOf(wordKey) { return Game.WORDS && Game.WORDS[wordKey]; }
  function meaning(w) { return w.mainMeaning || w.cn || ""; }
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function dedupe(arr) {
    const out = [];
    arr.forEach((x) => { if (x && out.indexOf(x) < 0) out.push(x); });
    return out;
  }

  function distractorMeanings(word, n) {
    const pool = Object.values(Game.WORDS || {}).filter((w) => w.word !== word.word);
    shuffle(pool);
    return pool.slice(0, n).map(meaning);
  }

  function distractorWords(word, n) {
    const pool = Object.values(Game.WORDS || {}).filter((w) => w.word !== word.word);
    shuffle(pool);
    return pool.slice(0, n).map((w) => w.word);
  }

  function blankExample(w) {
    const re = new RegExp(w.word, "i");
    return exampleEn(w).replace(re, "____");
  }

  // P-18B 第一层质量防线：generated 词库里有大量仅占位用的模板例句。
  // 这些句子有时语法可通，但搭配非常僵硬，甚至会误导玩家；正式精修前先不让它们进入学习题面。
  function isTemplateExample(en) {
    const s = String(en || "").trim();
    if (!s) return true;
    return [
      /^They talked about the .+ in class today\.$/i,
      /^She decided to .+ the problem right away\.$/i,
      /^Everyone agreed the result was quite .+\.$/i,
      /^He answered the question .+\.$/i,
      /^We use .+ to connect two related ideas\.$/i,
      /^This is a useful word: .+\.$/i,
    ].some((re) => re.test(s));
  }

  function hasGoodExample(w) {
    return !!(w && w.ex_en && w.ex_cn && !isTemplateExample(w.ex_en));
  }

  function exampleEn(w) {
    return hasGoodExample(w) ? w.ex_en : "";
  }

  function exampleCn(w) {
    return hasGoodExample(w) ? w.ex_cn : "";
  }

  function exampleHtml(w) {
    if (hasGoodExample(w)) {
      return '<div class="wc-ex"><span class="en">' + w.ex_en + '</span><br><span class="cn">' + w.ex_cn + '</span></div>';
    }
    return '<div class="wc-ex wc-ex-muted">例句待精修。本轮先记核心义与音形，避免模板例句误导。</div>';
  }

  function cleanAnswer(s) {
    return String(s || "").trim().toLowerCase();
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // 反馈短文案（C-02C / 文档12）·随机取句防重复
  const FB = {
    spellOkTag:  ["默写正确。", "一笔不差。", "笔落字定。"],
    spellOkNote: ["拼写已入识海。", "妥了，成字。", "一字不差，言成。"],
    spellBadTag: ["默写未稳。", "差之毫厘。", "笔下还生。"],
    recognizeOk: ["认得这字。", "识海微亮，记下了。", "一照即明。"],
    contextOk:   ["语境择词正确，入句天成。", "放对了位，句意通了。", "这一字，正合此境。"],
    listenOk:    ["闻声知意。", "入耳即明。", "听得真切。"],
  };

  // ── 听力 / TTS（回收旧参考游戏 R 组健壮实现·en-US·零依赖） ──
  // 旧版踩过的坑：① macOS Chrome 同帧 cancel()→speak() 会静默丢弃 → 仅占用时 cancel + 延后一拍；
  // ② 播放中 utterance 被 GC 掐断 → 持引用；③ voices 异步加载 → onvoiceschanged 回填；④ Chrome 偶发暂停 → resume 轻踢。
  function ttsSupported() {
    return typeof window !== "undefined" && !!window.speechSynthesis &&
      typeof window.speechSynthesis.getVoices === "function";
  }
  function ttsOn() {
    return !(Game.state && Game.state.settings && Game.state.settings.tts === false);
  }
  // 有发音文件兜底后，听力题不再依赖系统语音包
  function ttsAvailable() { return ttsOn() && (typeof Audio !== "undefined" || ttsSupported()); }

  // 美音/英音切换（用户 2026-06-19）：settings.accent="us"(en-US·默认) / "uk"(en-GB)
  function accent() {
    return (Game.state && Game.state.settings && Game.state.settings.accent === "uk") ? "uk" : "us";
  }
  const _voices = { us: null, uk: null };
  function pickVoices() {
    if (!ttsSupported()) return;
    const vs = window.speechSynthesis.getVoices() || [];
    if (!vs.length) return;
    _voices.us = vs.find((v) => /^en-US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || vs[0];
    _voices.uk = vs.find((v) => /^en-GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || vs[0];
  }
  if (ttsSupported()) {
    try { pickVoices(); window.speechSynthesis.onvoiceschanged = pickVoices; } catch (e) {}
  }

  // ── 发音文件（2026-09-26）：优先播 ../发音/<us|uk>/<slug>.mp3（Piper 离线生成·公有领域语音），
  // 不依赖玩家电脑装没装英文语音包；文件缺失 / 加载超时才退回系统 TTS。
  const AUDIO_BASE = "../发音/";
  const AUDIO_TIMEOUT_MS = 2500;
  const _audioCache = new Map();
  let _audioNow = null;
  let _speakSeq = 0;
  function audioSlug(text) {
    return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }
  function audioFor(text, acc) {
    const key = acc + "/" + audioSlug(text);
    let a = _audioCache.get(key);
    if (!a) {
      a = new Audio(encodeURI(AUDIO_BASE + key + ".mp3"));
      a.preload = "auto";
      _audioCache.set(key, a);
      if (_audioCache.size > 40) _audioCache.delete(_audioCache.keys().next().value);
    }
    return a;
  }
  function preloadWord(text) {
    if (!text || !ttsOn() || typeof Audio === "undefined") return;
    try { const a = audioFor(text, accent()); if (a.readyState === 0) a.load(); } catch (e) {}
  }
  function markLoading(btn, on) {
    const btns = btn ? [btn] : document.querySelectorAll(".wc-say[data-say]");
    btns.forEach((b) => b.classList.toggle("is-loading", !!on));
  }
  function stopSpeech() {
    if (_audioNow) { try { _audioNow.pause(); } catch (e) {} _audioNow = null; }
    if (ttsSupported()) { try { if (window.speechSynthesis.speaking) window.speechSynthesis.cancel(); } catch (e) {} }
  }
  function speak(text, btn) {
    if (!ttsOn() || !text) return;
    if (typeof Audio === "undefined") return speakTTS(text);
    const seq = ++_speakSeq;
    let a;
    try { a = audioFor(text, accent()); } catch (e) { return speakTTS(text); }
    stopSpeech();
    _audioNow = a;
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      markLoading(btn, false);
      if (!ok) {
        try { a.pause(); } catch (e) {}
        if (seq === _speakSeq) speakTTS(text);
      }
    };
    const timer = setTimeout(() => finish(false), AUDIO_TIMEOUT_MS);
    if (a.readyState < 3) markLoading(btn, true);   // 还没缓冲好 → 喇叭显示加载中
    a.onplaying = () => { if (settled) { try { a.pause(); } catch (e) {} return; } finish(true); }; // 超时已改用 TTS → 晚到的文件不再叠播
    a.onerror = () => finish(false);
    try {
      a.currentTime = 0;
      a.volume = 0.8;
      const p = a.play();
      if (p && p.catch) p.catch(() => finish(false));
    } catch (e) { finish(false); }
  }

  let _ttsUtter = null;
  function speakTTS(text) {
    if (!ttsSupported() || !ttsOn() || !text) return;
    try {
      const synth = window.speechSynthesis;
      const acc = accent();
      const go = () => {
        const u = new SpeechSynthesisUtterance(String(text));
        if (!_voices[acc]) pickVoices();
        if (_voices[acc]) u.voice = _voices[acc];
        u.lang = acc === "uk" ? "en-GB" : "en-US";
        u.rate = 0.9;
        u.volume = 0.5;                         // 用户 2026-06-19：音量调低 50%
        _ttsUtter = u;                          // 持引用·防播放中被 GC 掐断
        synth.speak(u);
        if (synth.paused) { try { synth.resume(); } catch (e) {} }
      };
      if (synth.speaking || synth.pending) { synth.cancel(); setTimeout(go, 130); } // 仅占用时 cancel+延后
      else go();
    } catch (e) { /* 不支持时静默降级 */ }
  }
  function autoSpeakWord(word) {
    if (!word) return;
    setTimeout(() => speak(word), 80);
  }

  // 音标（回收旧版 IPA_MAP·美式）。优先词条 w.ipa，缺则查表。
  function ipaOf(w) {
    if (!w) return "";
    if (w.ipa) return w.ipa;
    const m = Game.IPA_MAP || {};
    return m[(w.word || "").toLowerCase()] || m[w.word] || "";
  }
  function ipaHtml(w) {
    const ipa = ipaOf(w);
    return ipa ? '<div class="wc-ipa">' + ipa + '</div>' : '';
  }
  // 🔊 朗读 + 美/英音切换（用户 2026-06-19：切换键放喇叭旁）
  function audioCtrl() {
    return '<button class="btn btn-mini wc-say" data-say data-wc-control="say" title="朗读">🔊</button>' +
      '<button class="btn btn-mini wc-acc" data-acc data-wc-control="accent" title="美音 / 英音">' + (accent() === "uk" ? "英" : "美") + '</button>';
  }
  function bindAudio(scope, word) {
    preloadWord(word); // 出题即预载本词发音，点喇叭时通常已就绪
    scope.querySelectorAll(".wc-say[data-say]").forEach((say) => {
      say.onclick = () => speak(word, say);
    });
    scope.querySelectorAll(".wc-acc[data-acc]").forEach((acc) => {
      acc.onclick = () => {
        const next = accent() === "uk" ? "us" : "uk";
        if (Game.saveUserSettings) Game.saveUserSettings({ accent: next });
        else {
          Game.state.settings = Game.state.settings || {};
          Game.state.settings.accent = next;
        }
        const label = accent() === "uk" ? "英" : "美";
        scope.querySelectorAll(".wc-acc[data-acc]").forEach((x) => { x.textContent = label; });
        speak(word, scope.querySelector(".wc-say[data-say]")); // 切换即试听
      };
    });
  }
  function sayBtn() { return audioCtrl(); } // 兼容旧调用

  function activeBookId() {
    return (Game.state && Game.state.vocabBookId) || "gaokao";
  }

  function actionBar(wordKey) {
    const bookId = activeBookId();
    const stat = Game.peekWordStat ? Game.peekWordStat(bookId, wordKey) : null;
    const marked = !!(stat && stat.markedKnown);
    const favored = !!(Game.isFavorite && Game.isFavorite(bookId, wordKey));
    return '<div class="wc-actions" aria-label="词条操作">' +
      '<button class="btn btn-mini wc-mark-known' + (marked ? ' marked' : '') + '" data-wc-mark-known data-wc-control="mark-known" data-book="' + esc(bookId) + '" data-key="' + esc(wordKey) + '"' + (marked ? ' disabled' : '') + '>' + (marked ? '已标熟' : '标熟') + '</button>' +
      '<button class="btn btn-mini wc-star' + (favored ? ' active' : '') + '" data-wc-star data-wc-control="favorite" data-book="' + esc(bookId) + '" data-key="' + esc(wordKey) + '" aria-label="' + (favored ? '取消收藏' : '收藏') + '">' + (favored ? '★' : '☆') + '</button>' +
      '</div>';
  }

  function frequencyMeta(wordKey) {
    const info = Game.wordFrequencyInfo && Game.wordFrequencyInfo(activeBookId(), wordKey);
    if (!info) return "";
    return '<div class="wc-meta-row"><span class="freq-badge freq-' + info.tier + (info.estimated ? ' freq-est' : '') + '" title="' + esc(info.detail) + '">' + esc(info.badge) + '</span></div>';
  }

  let actionBound = false;
  function bindWordActions() {
    if (actionBound) return;
    actionBound = true;
    document.addEventListener("click", function (e) {
      const markBtn = e.target && e.target.closest ? e.target.closest("[data-wc-mark-known]") : null;
      if (markBtn) {
        e.preventDefault();
        if (markBtn.disabled) return;
        const changed = Game.markKnown && Game.markKnown(markBtn.dataset.book || activeBookId(), markBtn.dataset.key);
        if (changed) {
          Game.save && Game.save.write({ view: "cultivate" });
          markBtn.textContent = "已标熟";
          markBtn.classList.add("marked");
          markBtn.disabled = true;
          Game.visual && Game.visual.toast("已标熟：之后不再作为新词派出。", "gold");
        }
        return;
      }
      const starBtn = e.target && e.target.closest ? e.target.closest("[data-wc-star]") : null;
      if (!starBtn) return;
      e.preventDefault();
      if (!Game.toggleFavorite) return;
      const was = Game.isFavorite && Game.isFavorite(starBtn.dataset.book || activeBookId(), starBtn.dataset.key);
      const changed = Game.toggleFavorite(starBtn.dataset.book || activeBookId(), starBtn.dataset.key);
      if (!changed) return;
      Game.save && Game.save.write({ view: "cultivate" });
      const now = !was;
      starBtn.textContent = now ? "★" : "☆";
      starBtn.classList.toggle("active", now);
      starBtn.setAttribute("aria-label", now ? "取消收藏" : "收藏");
      Game.visual && Game.visual.toast(now ? "已收入收藏簿。" : "已移出收藏簿。", now ? "gold" : "rose");
    });
  }

  function wordDetail(w, extra, wordKey) {
    return '<div class="wc-answer">' +
      (extra ? '<div class="wc-answer-line">' + extra + '</div>' : '') +
      '  <div class="wc-answer-main"><b>' + w.word + '</b>　' + audioCtrl() + '　' + w.pos + '　' + meaning(w) + '</div>' +
      ipaHtml(w) +
      (wordKey ? frequencyMeta(wordKey) : '') +
      '  <div class="wc-answer-hint">' + w.senseHint + '</div>' +
      exampleHtml(w) +
      '</div>';
  }

  function continueAfter(mount, result, onDone, autoContinue) {
    const next = mount.querySelector("#wc-next");
    if (!next) return onDone && onDone(result);
    requestAnimationFrame(function () {
      // 按钮已在屏内就不滚；屏外才直接跳到（不再平滑滚动，避免内容从鼠标下滑走的"延迟感"）
      try {
        const r = next.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) next.scrollIntoView({ block: "nearest", inline: "nearest" });
        next.focus({ preventScroll: true });
      } catch (e) {
        try { next.scrollIntoView(false); } catch (_) {}
      }
    });
    let done = false;
    let timer = null;
    function finish() {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      onDone && onDone(result);
    }
    next.onclick = finish;
    if (autoContinue) {
      next.textContent = "继续参悟（自动）";
      timer = setTimeout(finish, (Game.autoContinueDelay && Game.autoContinueDelay()) || 1100);
    }
  }

  // ── learn 学习卡：五法合参用于“先学”，掠影识言用于“只过词”。 ──
  function renderLearn(mount, wordKey, opts, onDone) {
    const w = wordOf(wordKey);
    const skim = !!(opts && opts.studyMode === "skim");
    mount.innerHTML =
      '<div class="wordcard">' +
      actionBar(wordKey) +
      '  <div class="wc-tag">' + (skim ? '掠影识言 · 快速过词' : '初见真言 · 先学后验') + '</div>' +
      '  <div class="wc-word">' + w.word + '　' + audioCtrl() + '</div>' +
      ipaHtml(w) +
      frequencyMeta(wordKey) +
      '  <div class="wc-pos">' + w.pos + '　' + meaning(w) + '</div>' +
      '  <div class="wc-en">' + w.senseHint + '</div>' +
      exampleHtml(w) +
      '  <button class="btn btn-gold" id="wc-go" data-wc-control="learn-go">' + (skim ? '继续过词' : '入题验心') + '</button>' +
      '</div>';
    autoSpeakWord(w.word);
    bindAudio(mount, w.word);
    mount.querySelector("#wc-go").onclick = () =>
      onDone && onDone({ wordKey, type: "learn", mode: "learn", learn: true, correct: true, score: 2 });
  }

  // ── recognize 再认（看词选义·四选一） ──
  function renderRecognize(mount, wordKey, opts, onDone) {
    const w = wordOf(wordKey);
    const autoContinue = !!(opts && opts.autoContinue);
    const options = shuffle(dedupe([meaning(w)].concat(distractorMeanings(w, 3))));
    mount.innerHTML =
      '<div class="wordcard">' +
      actionBar(wordKey) +
      '  <div class="wc-tag">再认 · 此言何意？</div>' +
      '  <div class="wc-word">' + w.word + '　' + audioCtrl() + '</div>' +
      ipaHtml(w) +
      frequencyMeta(wordKey) +
      '  <div class="wc-options" id="wc-opts"></div>' +
      '</div>';
    bindAudio(mount, w.word);
    autoSpeakWord(w.word);
    const box = mount.querySelector("#wc-opts");
    options.forEach((opt) => {
      const b = document.createElement("button");
      b.className = "btn wc-opt";
      b.dataset.wcOption = "meaning";
      b.textContent = opt;
      b.onclick = () => {
        const correct = opt === meaning(w);
        box.querySelectorAll("button").forEach((x) => { x.disabled = true; });
        b.classList.add(correct ? "ok" : "bad");
        box.querySelectorAll("button").forEach((x) => { if (x.textContent === meaning(w)) x.classList.add("ok"); });
        if (correct) Game.visual.correctFlash();
        const result = { wordKey, type: "recognize", mode: "recognize", rating: correct ? "known" : "forgot", score: correct ? 2 : 0, correct };
        mount.querySelector(".wordcard").insertAdjacentHTML("beforeend",
          wordDetail(w, '<span class="' + (correct ? "ok" : "bad") + '">' + (correct ? pick(FB.recognizeOk) : "此言意为：" + meaning(w)) + '</span>', wordKey) +
          '<button class="btn btn-gold wc-next" id="wc-next" data-wc-next data-wc-control="continue">继续参悟</button>'
        );
        bindAudio(mount, w.word);
        continueAfter(mount, result, onDone, autoContinue);
      };
      box.appendChild(b);
    });
  }

  // ── listen 听音辨义（无语音则降级为再认） ──
  function renderListen(mount, wordKey, opts, onDone) {
    if (!ttsAvailable()) return renderRecognize(mount, wordKey, opts, onDone);
    const w = wordOf(wordKey);
    const autoContinue = !!(opts && opts.autoContinue);
    const options = shuffle(dedupe([meaning(w)].concat(distractorMeanings(w, 3))));
    mount.innerHTML =
      '<div class="wordcard">' +
      actionBar(wordKey) +
      '  <div class="wc-tag">入耳 · 听音辨义</div>' +
      '  <div class="wc-word">' + audioCtrl() + '</div>' +
      '  <p class="dim small">只闻其声，辨其意。</p>' +
      '  <div class="wc-options" id="wc-opts"></div>' +
      '</div>';
    speak(w.word);
    bindAudio(mount, w.word);
    const box = mount.querySelector("#wc-opts");
    options.forEach((opt) => {
      const b = document.createElement("button");
      b.className = "btn wc-opt";
      b.dataset.wcOption = "meaning";
      b.textContent = opt;
      b.onclick = () => {
        const correct = opt === meaning(w);
        box.querySelectorAll("button").forEach((x) => { x.disabled = true; });
        b.classList.add(correct ? "ok" : "bad");
        box.querySelectorAll("button").forEach((x) => { if (x.textContent === meaning(w)) x.classList.add("ok"); });
        if (correct) Game.visual.correctFlash();
        const result = { wordKey, type: "listen", mode: "listen", rating: correct ? "known" : "forgot", score: correct ? 2 : 0, correct };
        mount.querySelector(".wordcard").insertAdjacentHTML("beforeend",
          wordDetail(w, '<span class="' + (correct ? "ok" : "bad") + '">' + (correct ? pick(FB.listenOk) : "此言为：" + w.word) + '</span>', wordKey) +
          '<button class="btn btn-gold wc-next" id="wc-next" data-wc-next data-wc-control="continue">继续参悟</button>'
        );
        bindAudio(mount, w.word);
        continueAfter(mount, result, onDone, autoContinue);
      };
      box.appendChild(b);
    });
  }

  // ── spell 默写（逐级提示：首字母→例句→给答案）。opts.listen=听写变体 ──
  function renderSpell(mount, wordKey, opts, onDone) {
    const w = wordOf(wordKey);
    const autoContinue = !!(opts && opts.autoContinue);
    const listen = !!(opts && opts.listen) && ttsAvailable();
    let attempts = 0;

    function draw(hintHtml) {
      mount.innerHTML =
        '<div class="wordcard">' +
        actionBar(wordKey) +
        '  <div class="wc-tag">' + (listen ? '入耳 · 听写真言' : '默写真言 · 主动回忆') + '</div>' +
        (listen
          ? '  <div class="wc-word">' + audioCtrl() + '</div>'
          : '  <div class="wc-pos">' + w.pos + '　' + meaning(w) + '</div>' +
            frequencyMeta(wordKey) +
            '  <div class="wc-en">' + w.senseHint + '</div>' +
            (hasGoodExample(w)
              ? '  <div class="wc-ex"><span class="cn">' + w.ex_cn + '</span></div>'
              : '  <div class="wc-ex wc-ex-muted">例句待精修。请根据核心义默写。</div>')) +
        '  <input class="wc-input" id="wc-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="输入英文单词">' +
        '  <button class="btn btn-gold wc-submit" id="wc-submit" data-wc-control="spell-submit">验 心</button>' +
        '  <div class="wc-feedback" id="wc-feedback">' + (hintHtml || '') + '</div>' +
        '</div>';
      if (listen) {
        speak(w.word);
        bindAudio(mount, w.word);
      }
      const input = mount.querySelector("#wc-input");
      const submit = mount.querySelector("#wc-submit");
      input.focus();
      input.onkeydown = (e) => { if (e.key === "Enter") submit.click(); };
      submit.onclick = () => submitAnswer(input.value);
    }

    // §1 默写默认给首字母（听写变体不给）：同义词太多，没首字母无从判断要哪个词。
    function letterHint() {
      return '提示：' + w.word.charAt(0) + '＿'.repeat(Math.max(0, w.word.length - 1)) + '（共 ' + w.word.length + ' 字母）';
    }
    function baseHint() {
      return listen ? '' : '<span class="wc-hint">' + letterHint() + '</span>';
    }
    function hintFor(n) {
      const ipa = ipaOf(w);
      const lead = listen ? '' : letterHint() + '　';
      if (n === 1) return '<span class="bad">' + pick(FB.spellBadTag) + '</span>　' + lead + (ipa ? '音标 ' + ipa : '');
      const ex = hasGoodExample(w) ? '例句：' + w.ex_en : '核心义：' + meaning(w);
      return '<span class="bad">再想想。</span>　' + lead + (ipa ? '音标 ' + ipa + '　' : '') + ex;
    }

    function submitAnswer(val) {
      if (cleanAnswer(val) === cleanAnswer(w.word)) return finishSpell(true);
      attempts += 1;
      if (attempts >= 3) return copyToLearn(); // §4 背不对不直接结束→照写过关
      draw(hintFor(attempts));
    }

    // §4 照写入识海：答错 3 次，必须把正确词 type 对才能继续（不改评分，仍记未稳）。
    function copyToLearn() {
      mount.innerHTML =
        '<div class="wordcard">' +
        actionBar(wordKey) +
        '  <div class="wc-tag">未稳 · 照写入识海</div>' +
        '  <div class="wc-feedback"><span class="bad">这个字还没记牢。照着写一遍，把它刻进识海。</span></div>' +
        '  <div class="wc-word">' + w.word + '　' + audioCtrl() + '</div>' +
        ipaHtml(w) +
        frequencyMeta(wordKey) +
        '  <div class="wc-pos">' + w.pos + '　' + meaning(w) + '</div>' +
        '  <input class="wc-input" id="wc-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="照着上面写一遍">' +
        '  <button class="btn btn-gold wc-submit" id="wc-copy" data-wc-control="copy-submit">写下 ▸</button>' +
        '  <div class="wc-feedback" id="wc-copy-fb"></div>' +
        '</div>';
      autoSpeakWord(w.word); // §3 揭晓时自动读一遍
      bindAudio(mount, w.word);
      const input = mount.querySelector("#wc-input");
      const btn = mount.querySelector("#wc-copy");
      const fb = mount.querySelector("#wc-copy-fb");
      input.focus();
      function tryCopy() {
        if (cleanAnswer(input.value) === cleanAnswer(w.word)) return finishSpell(false);
        fb.innerHTML = '<span class="bad">再来一次——照着上面写对才算数。</span>';
        input.value = "";
        input.focus();
      }
      input.onkeydown = (e) => { if (e.key === "Enter") tryCopy(); };
      btn.onclick = tryCopy;
    }

    function finishSpell(correct) {
      if (correct) Game.visual.correctFlash();
      const result = {
        wordKey, type: "spell", mode: "spell",
        rating: correct ? "easy" : "forgot",
        score: correct ? (attempts === 0 ? 3 : 2) : 0,
        correct, attempts,
      };
      mount.innerHTML =
        '<div class="wordcard">' +
        actionBar(wordKey) +
        '  <div class="wc-tag">默写真言</div>' +
        '  <div class="wc-feedback">' + (correct
          ? '<span class="ok">' + pick(FB.spellOkTag) + '</span>'
          : '<span class="bad">未稳，正确拼写：' + w.word + '　</span>' + audioCtrl()) + '</div>' + // §3 答案可点读
        wordDetail(w, correct ? pick(FB.spellOkNote) : '', wordKey) +
        '  <button class="btn btn-gold wc-next" id="wc-next" data-wc-next data-wc-control="continue">继续参悟</button>' +
        '</div>';
      bindAudio(mount, w.word); // §3 绑定答案朗读
      continueAfter(mount, result, onDone, autoContinue);
    }

    draw(baseHint()); // §1 初始就显示首字母提示
  }

  // ── context 语境择词 ──
  function renderContext(mount, wordKey, opts, onDone) {
    const w = wordOf(wordKey);
    if (!hasGoodExample(w)) return renderRecognize(mount, wordKey, opts, onDone);
    const autoContinue = !!(opts && opts.autoContinue);
    const options = shuffle(dedupe([w.word].concat(distractorWords(w, 3))));
    mount.innerHTML =
      '<div class="wordcard">' +
      actionBar(wordKey) +
      '  <div class="wc-tag">入境用言 · 语境择词</div>' +
      '  <div class="wc-pos">' + meaning(w) + '</div>' +
      frequencyMeta(wordKey) +
      '  <div class="wc-ex"><span class="en">' + blankExample(w) + '</span><br><span class="cn">' + exampleCn(w) + '</span></div>' +
      '  <div class="wc-options" id="wc-opts"></div>' +
      '</div>';
    const box = mount.querySelector("#wc-opts");
    autoSpeakWord(w.word);
    options.forEach((opt) => {
      const b = document.createElement("button");
      b.className = "btn wc-opt";
      b.dataset.wcOption = "word";
      b.textContent = opt;
      b.onclick = () => {
        const correct = opt === w.word;
        box.querySelectorAll("button").forEach((x) => { x.disabled = true; });
        b.classList.add(correct ? "ok" : "bad");
        box.querySelectorAll("button").forEach((x) => { if (x.textContent === w.word) x.classList.add("ok"); });
        if (correct) Game.visual.correctFlash();
        const result = { wordKey, type: "context", mode: "context", rating: correct ? "known" : "forgot", score: correct ? 2 : 0, correct };
        mount.querySelector(".wordcard").insertAdjacentHTML("beforeend",
          wordDetail(w, '<span class="' + (correct ? "ok" : "bad") + '">' + (correct ? pick(FB.contextOk) : "此处当为：" + w.word) + '</span>', wordKey) +
          '<button class="btn btn-gold wc-next" id="wc-next" data-wc-next data-wc-control="continue">继续参悟</button>'
        );
        bindAudio(mount, w.word);
        continueAfter(mount, result, onDone, autoContinue);
      };
      box.appendChild(b);
    });
  }

  // ── 旧剧情词卡（paged.js word 页兼容·先学后考选释义） ──
  function legacyRender(mount, wordKey, onMastered) {
    const w = wordOf(wordKey);
    if (!w) { onMastered && onMastered(); return; }
    learn();
    function learn() {
      mount.innerHTML =
        '<div class="wordcard">' +
        '  <div class="wc-tag">天外真言 · 参悟</div>' +
        '  <div class="wc-word">' + w.word + '</div>' +
        '  <div class="wc-pos">' + w.pos + '　' + meaning(w) + '</div>' +
        '  <div class="wc-en">' + w.en + '</div>' +
        exampleHtml(w) +
        '  <button class="btn btn-gold" id="wc-go" data-wc-control="legacy-go">参 悟 完 毕，验 心</button>' +
        '</div>';
      mount.querySelector("#wc-go").onclick = quiz;
      autoSpeakWord(w.word);
    }
    function quiz() {
      const options = shuffle(dedupe([meaning(w)].concat(distractorMeanings(w, 3))));
      mount.innerHTML =
        '<div class="wordcard">' +
        '  <div class="wc-tag">验心 · 此言何意？</div>' +
        '  <div class="wc-word">' + w.word + '</div>' +
        '  <div class="wc-options" id="wc-opts"></div>' +
        '</div>';
      const box = mount.querySelector("#wc-opts");
      autoSpeakWord(w.word);
      options.forEach((opt) => {
        const b = document.createElement("button");
        b.className = "btn wc-opt";
        b.dataset.wcOption = "meaning";
        b.textContent = opt;
        b.onclick = () => choose(b, opt);
        box.appendChild(b);
      });
    }
    function choose(btn, opt) {
      const correct = opt === meaning(w);
      mount.querySelectorAll(".wc-opt").forEach((b) => { b.disabled = true; });
      if (correct) {
        btn.classList.add("ok");
        Game.visual.correctFlash();
        const first = Game.masterWord(w.word);
        setTimeout(() => onMastered && onMastered(first), 650);
      } else {
        btn.classList.add("bad");
        mount.querySelectorAll(".wc-opt").forEach((b) => { if (b.textContent === meaning(w)) b.classList.add("ok"); });
        setTimeout(learn, 1100);
      }
    }
  }

  // 题型分发：opts.type ∈ learn/recognize/spell/context/listen（默认 recognize）。
  // 键盘快捷选答（全局只绑一次）：数字键 1-4（主键盘/小键盘）选对应选项；
  // 答完出现「继续参悟」后，Enter/空格 直接继续。输入框聚焦（默写）或弹窗时不抢键。
  let kbdBound = false;
  function bindAnswerKeys() {
    if (kbdBound) return;
    kbdBound = true;
    document.addEventListener("keydown", function (e) {
      if (document.body.classList.contains("modal-open")) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      // 已出结果 → Enter/空格 继续参悟；先学卡/语境题 → Enter/空格「入题验心」
      if (e.key === "Enter" || e.key === " " || e.code === "Space") {
        const nx = document.getElementById("wc-next") ||
          document.getElementById("wc-go") ||
          document.getElementById("wc-submit") ||
          document.getElementById("wc-copy");
        if (nx && !nx.disabled) { e.preventDefault(); nx.click(); }
        return;
      }
      // 数字键 1-9 → 选第 N 个选项
      let n = -1;
      if (/^[1-9]$/.test(e.key)) n = parseInt(e.key, 10);
      else if (/^Numpad[1-9]$/.test(e.code)) n = parseInt(e.code.slice(6), 10);
      if (n < 1) return;
      const box = document.getElementById("wc-opts");
      if (!box) return;
      const b = box.querySelectorAll(".wc-opt")[n - 1];
      if (!b || b.disabled) return;
      e.preventDefault();
      b.click();
    });
  }

  function render(mount, wordKey, opts, onDone) {
    bindAnswerKeys();
    bindWordActions();
    if (typeof opts === "function") return legacyRender(mount, wordKey, opts);
    const w = wordOf(wordKey);
    if (!w) { onDone && onDone({ wordKey, correct: false, score: 0 }); return; }
    const type = (opts && (opts.type || opts.mode)) || "recognize";
    if (type === "learn") return renderLearn(mount, wordKey, opts, onDone);
    if (type === "spell") return renderSpell(mount, wordKey, opts, onDone);
    if (type === "context") return renderContext(mount, wordKey, opts, onDone);
    if (type === "listen") return renderListen(mount, wordKey, opts, onDone);
    return renderRecognize(mount, wordKey, opts, onDone);
  }

  // 供修炼队列预载下一题发音
  function preload(wordKey) { const w = wordOf(wordKey); if (w && w.word) preloadWord(w.word); }
  Game.wordcard = { render, meaning, speak, ttsAvailable, preload };
})(window.Game = window.Game || {});
