/* ───────────────────────────────────────────────────────────────
 * audio.js · 背景音乐（程序合成·借旧版 Web Audio 方案）
 * 五声音阶古风氛围乐：drone 持续低音 + 随机散音；按界面(zone)切 mood。
 * 默认程序合成兜底；若存在用户选定 mp3，则按 mood 显式映射播放。
 * AudioContext 需用户手势激活（首次 pointerdown）。静音/音量存 settings.audio。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  // mood 预设（借旧版·sine/triangle 柔波·避免刺耳谐波）。base=低频Hz·scale=五声半音·decay=散音秒·interval=触发ms
  const MOODS = {
    serene:   { base: 130.81, scale: [0, 3, 5, 7, 10], decay: 4.5, interval: 4200, droneGain: 0.04, noteGain: 0.035, droneType: "sine", noteType: "sine" },
    main:     { base: 123.47, scale: [0, 2, 5, 7, 9],  decay: 4.0, interval: 3500, droneGain: 0.04, noteGain: 0.040, droneType: "sine", noteType: "triangle" },
    meditate: { base: 110.00, scale: [0, 2, 4, 7, 9],  decay: 5.5, interval: 5000, droneGain: 0.04, noteGain: 0.030, droneType: "sine", noteType: "sine" },
    scroll:   { base: 138.59, scale: [0, 2, 5, 7, 10], decay: 5.0, interval: 4600, droneGain: 0.03, noteGain: 0.028, droneType: "sine", noteType: "sine" },
    warm:     { base: 174.61, scale: [0, 4, 5, 7, 11], decay: 4.0, interval: 3600, droneGain: 0.03, noteGain: 0.035, droneType: "sine", noteType: "sine" },
    story:    { base: 116.54, scale: [0, 2, 5, 7, 10], decay: 5.0, interval: 4800, droneGain: 0.04, noteGain: 0.035, droneType: "sine", noteType: "sine" },
    tense:    { base: 87.31,  scale: [0, 3, 7, 10],    decay: 2.0, interval: 1700, droneGain: 0.05, noteGain: 0.050, droneType: "sine", noteType: "triangle" },
    storm:    { base: 82.41,  scale: [0, 3, 6, 7, 10], decay: 1.5, interval: 1200, droneGain: 0.06, noteGain: 0.055, droneType: "sine", noteType: "triangle" },
  };
  // 这些 mood 主要走文件层；没有文件时复用相近合成预设兜底。
  MOODS.menu = MOODS.main;
  MOODS.cover = MOODS.main;
  MOODS.ending = MOODS.story;
  MOODS.dream = MOODS.story;
  MOODS.travel = MOODS.serene;
  MOODS.read_calm = MOODS.story;      // 普通阅读：最淡，不抢文字
  MOODS.read_soft = MOODS.meditate;   // 偏安静：独处/沉思/温情
  MOODS.read_warm = MOODS.warm;       // 偏热闹：灶房/市井/二两
  MOODS.ominous = MOODS.tense;        // 压迫/诡异/权势压场
  MOODS.puzzle_tense = MOODS.tense;   // 探秘/解谜/潜入
  MOODS.battle_end = MOODS.story;     // 战后收束

  // 用户 2026-06-23 选定 BGM。index.html 位于 游戏/，所以这里用 ../bgm/ 指向项目根目录音乐文件。
  const FILE_BY_MOOD = {
    cover: "../bgm/封面.mp3",
    menu: "../bgm/主菜单.mp3",
    main: "../bgm/宗门:城市bgm.mp3",
    meditate: "../bgm/休闲场景用的音乐.mp3",
    warm: "../bgm/休闲场景用的音乐.mp3",
    serene: "../bgm/探险解谜.mp3",
    tense: "../bgm/与boss战斗.mp3",
    storm: "../bgm/与boss战斗.mp3",
    story: "../bgm/感动.mp3",
    read_calm: "../bgm/阅读安静.mp3",
    read_soft: "../bgm/阅读偏安静.mp3",
    read_warm: "../bgm/阅读偏热闹.mp3",
    ominous: "../bgm/压迫感诡异轻音乐.mp3",
    puzzle_tense: "../bgm/解谜紧张轻音乐.mp3",
    battle_end: "../bgm/战斗结束.mp3",
    scroll: "../bgm/神田.mp3",
    ending: "../bgm/好听！end尾曲，制片人.....mp3",
    dream: "../bgm/幻境，梦境.mp3",
    travel: "../bgm/赶路的小曲.mp3",
  };

  // zone(P-24 的 body[data-zone]) → mood
  const ZONE_MOOD = {
    menu: "menu", cover: "cover",
    hub: "main", practice: "meditate", wild: "serene", combat: "tense",
    alchemy: "warm", story: "read_calm", library: "scroll", codex: "scroll",
    ending: "ending",
    dream: "dream", travel: "travel",
  };

  let ctx = null, musicGain = null, sfxGain = null, nodes = [], timer = null, curMood = null;
  let desiredMood = "main";
  const SFX_VOL = 0.16; // 按键音效整体音量·刻意很小(用户要求声音一定要小)
  let bgmAudio = null; // mp3 文件层（有则用文件·替代合成）
  const fileTried = {}; // mood → "ok"/"no"
  const USER_SETTINGS_KEY = "xiuxian_user_settings_v1";
  const SAVE_SLOT_PREFIX = "xiuxian_save_slot";
  const LAST_SLOT_KEY = "xiuxian_last_slot";
  const FILE_SFX = {
    page: { src: "../音效/1_剧情foley/翻页_单页_BSB0164.mp3", vol: 0.16, maxMs: 650, gapMs: 500 },
    story_choice: { src: "../音效/4_UI杂项/磬_单声_BSB3360.mp3", vol: 0.14, maxMs: 900, gapMs: 350 },
    story_door: { src: "../音效/1_剧情foley/木门_吱呀开_BSB0539.mp3", vol: 0.15, maxMs: 1600, gapMs: 1800 },
    story_steps: { src: "../音效/1_剧情foley/脚步_石阶_BSB0606.mp3", vol: 0.12, maxMs: 1200, gapMs: 1500 },
    story_wind: { src: "../音效/2_环境氛围/风_林中风_BSB0904.mp3", vol: 0.10, maxMs: 1800, gapMs: 2200 },
    story_bell: { src: "../音效/4_UI杂项/风铃_清雅_BSB2687.mp3", vol: 0.13, maxMs: 1800, gapMs: 1800 },
    story_write: { src: "../音效/1_剧情foley/写字_笔书纸上_BSB0221.mp3", vol: 0.11, maxMs: 1300, gapMs: 1600 },
    story_thunder: { src: "../音效/2_环境氛围/雷_单声炸雷_BSB3115.mp3", vol: 0.18, maxMs: 1800, gapMs: 2500 },
    breakthrough: { src: "../音效/4_UI杂项/钟_寺院大钟_BSB0135.mp3", vol: 0.22, maxMs: 2600, gapMs: 2600 },
    market: { src: "../音效/1_剧情foley/人群_露天市集_BSB2728.mp3", vol: 0.13, maxMs: 2200, gapMs: 3500 },
    alchemy: { src: "../音效/2_环境氛围/火_炉火可循环_BSB3322.mp3", vol: 0.12, maxMs: 1800, gapMs: 3500 },
    forge: { src: "../音效/3_战斗动作/磨刀_砺石制武_BSB0832.mp3", vol: 0.16, maxMs: 1000, gapMs: 1400 },
    battle_swing: { src: "../音效/3_战斗动作/剑_挥击破空_BSB0572.mp3", vol: 0.16, maxMs: 700, gapMs: 450 },
    battle_hit: { src: "../音效/3_战斗动作/剑_劈砍中物_BSB0127.mp3", vol: 0.17, maxMs: 700, gapMs: 450 },
    battle_clash: { src: "../音效/3_战斗动作/兵刃_刀刃相击_BSB0833.mp3", vol: 0.14, maxMs: 700, gapMs: 550 },
    battle_burst: { src: "../音效/3_战斗动作/爆炸_近距_BSB1808.mp3", vol: 0.16, maxMs: 900, gapMs: 900 },
  };
  const sfxLast = {};

  function audioSettings() {
    Game.state.settings = Game.state.settings || {};
    if (!Game.state.settings.audio) Game.state.settings.audio = { muted: false, vol: 0.3 };
    if (typeof Game.state.settings.bgmVolume === "number") Game.state.settings.audio.vol = Game.state.settings.bgmVolume;
    return Game.state.settings.audio;
  }

  function persistedMuted() {
    try {
      const rawSettings = localStorage.getItem(USER_SETTINGS_KEY);
      if (rawSettings) {
        const settings = JSON.parse(rawSettings);
        if (settings && settings.audio && typeof settings.audio.muted === "boolean") return settings.audio.muted;
      }
      const slot = localStorage.getItem(LAST_SLOT_KEY);
      if (!slot) return null;
      const rawSave = localStorage.getItem(SAVE_SLOT_PREFIX + slot);
      if (!rawSave) return null;
      const save = JSON.parse(rawSave);
      const audio = save && save.state && save.state.settings && save.state.settings.audio;
      return audio && typeof audio.muted === "boolean" ? audio.muted : null;
    } catch (e) {
      return null;
    }
  }

  function isMuted() {
    const a = audioSettings();
    if (a.muted) return true;
    return persistedMuted() === true;
  }

  // 2026-09-26 用户：游戏本体音乐/音效实际输出整体降到 70%（滑块数值不变，所有玩家生效）
  const OUTPUT_SCALE = 0.7;
  function gainVal() { const a = audioSettings(); return isMuted() ? 0 : (typeof a.vol === "number" ? a.vol : 0.3) * OUTPUT_SCALE; }
  function sfxGainVal() {
    const s = Game.state && Game.state.settings ? Game.state.settings : {};
    if (isMuted() || s.sfx === false) return 0;
    return (typeof s.sfxVolume === "number" ? Math.max(0, Math.min(1, s.sfxVolume)) : SFX_VOL) * OUTPUT_SCALE;
  }
  function stopFile() {
    if (bgmAudio) {
      try { bgmAudio.pause(); } catch (e) {}
    }
  }
  function stopMusic() {
    stopSynth();
    stopFile();
    if (musicGain) musicGain.gain.value = 0;
  }

  function ensure() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume().catch(function () {}); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    musicGain = ctx.createGain();
    musicGain.gain.value = gainVal();
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 60;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4200; lp.Q.value = 0.7;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 6; comp.attack.value = 0.005; comp.release.value = 0.18;
    musicGain.connect(hp).connect(lp).connect(comp).connect(ctx.destination);
    // 音效链（独立·小音量·压缩防破音）
    sfxGain = ctx.createGain();
    sfxGain.gain.value = sfxGainVal();
    const sComp = ctx.createDynamicsCompressor();
    sComp.threshold.value = -12; sComp.knee.value = 8; sComp.ratio.value = 4; sComp.attack.value = 0.003; sComp.release.value = 0.12;
    sfxGain.connect(sComp).connect(ctx.destination);
    return ctx;
  }

  // 按键音效（程序合成·借旧版 sfx 思路）：极轻的"嗒"·受静音控制
  function clickBlip() {
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(1200, t);
    o.frequency.exponentialRampToValueAtTime(680, t + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g).connect(sfxGain);
    o.start(t); o.stop(t + 0.08);
  }
  function fileSfx(name) {
    const spec = FILE_SFX[name];
    if (!spec) return false;
    const now = Date.now();
    if (sfxLast[name] && now - sfxLast[name] < (spec.gapMs || 0)) return true;
    sfxLast[name] = now;
    try {
      const a = new Audio(spec.src);
      a.preload = "auto";
      a.volume = Math.max(0, Math.min(1, (spec.vol || SFX_VOL) * (sfxGainVal() / SFX_VOL)));
      a.play().catch(function () {});
      if (spec.maxMs) setTimeout(function () { try { a.pause(); a.currentTime = 0; } catch (e) {} }, spec.maxMs);
      return true;
    } catch (e) {
      return false;
    }
  }
  function sfx(name) {
    if (isMuted() || (Game.state && Game.state.settings && Game.state.settings.sfx === false)) return;
    if (FILE_SFX[name]) return fileSfx(name);
    if (!ensure() || ctx.state !== "running") return;
    if (name === "click" || !name) clickBlip();
  }

  function stopSynth() {
    if (timer) { clearInterval(timer); timer = null; }
    nodes.forEach(function (n) { try { n.stop && n.stop(); } catch (e) {} });
    nodes = [];
  }
  function startDrone(p) {
    [[1, 1], [2, 0.5]].forEach(function (m) {
      const o = ctx.createOscillator(); o.type = p.droneType; o.frequency.value = p.base * m[0];
      const g = ctx.createGain(); g.gain.value = p.droneGain * m[1];
      o.connect(g).connect(musicGain); o.start(); nodes.push(o);
    });
  }
  function pentNote(p) {
    if (!ctx || ctx.state !== "running") return;
    const semi = p.scale[Math.floor(Math.random() * p.scale.length)] + 12 * (Math.random() < 0.5 ? 1 : 2);
    const freq = p.base * Math.pow(2, semi / 12);
    const o = ctx.createOscillator(); o.type = p.noteType; o.frequency.value = freq;
    const g = ctx.createGain(); g.gain.value = 0;
    o.connect(g).connect(musicGain);
    const t = ctx.currentTime;
    g.gain.linearRampToValueAtTime(p.noteGain, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);
    o.start(t); o.stop(t + p.decay + 0.1);
    nodes.push(o);
  }

  // mp3 文件层：有 FILE_BY_MOOD[mood] 就用文件循环，没有则合成。文件音量直接走 <audio>.volume（避免 file:// CORS）。
  function playFile(mood) {
    if (isMuted()) { stopFile(); return true; }
    if (fileTried[mood] === "no") return false;
    if (bgmAudio && bgmAudio.dataset.mood === mood) {
      bgmAudio.volume = gainVal();
      if (bgmAudio.paused && !isMuted()) bgmAudio.play().catch(function () {});
      return true;
    }
    const src = FILE_BY_MOOD[mood] || ("music/" + mood + ".mp3");
    const a = new Audio(src);
    a.loop = true; a.preload = "auto"; a.dataset.mood = mood; a.volume = gainVal();
    a.playsInline = true;
    function adoptFile() {
      fileTried[mood] = "ok";
      stopSynth(); if (bgmAudio) { try { bgmAudio.pause(); } catch (e) {} }
      bgmAudio = a;
    }
    a.addEventListener("canplaythrough", function () {
      if (bgmAudio !== a) a.play().then(adoptFile).catch(function () {});
    }, { once: true });
    a.addEventListener("error", function () { fileTried[mood] = "no"; synth(mood); }, { once: true });
    try { a.load(); } catch (e) {}
    // 用户点击后应立即尝试播放；不要只等 canplaythrough，否则本地文件有时一直静默。
    a.play().then(adoptFile).catch(function () {
      // 浏览器若仍认为没有手势授权，保留合成兜底；下次点击 activate() 会再尝试。
    });
    return true;
  }

  function synth(mood) {
    if (isMuted()) { stopMusic(); return; }
    if (!ensure()) return;
    stopSynth();
    if (bgmAudio) { try { bgmAudio.pause(); } catch (e) {} bgmAudio = null; }
    const p = MOODS[mood] || MOODS.serene;
    startDrone(p); pentNote(p);
    timer = setInterval(function () { pentNote(p); }, p.interval);
  }

  function playMood(mood) {
    if (!MOODS[mood]) mood = "serene";
    if (isMuted()) {
      curMood = mood;
      stopMusic();
      return;
    }
    if (curMood === mood && (timer || (bgmAudio && bgmAudio.dataset.mood === mood))) {
      // 若首次自动播放被拦后只剩合成兜底，用户交互后要继续重试真实 mp3。
      if (!isMuted() && (!bgmAudio || bgmAudio.dataset.mood !== mood || bgmAudio.paused) && fileTried[mood] !== "no") {
        playFile(mood);
      }
      return;
    }
    curMood = mood;
    if (!ensure()) return; // 未激活(无手势)→等 activate
    // 先尝试文件层；文件不存在 onerror 会回退 synth
    if (fileTried[mood] === "ok") { playFile(mood); return; }
    if (fileTried[mood] === undefined) { playFile(mood); }
    synth(mood); // 立即合成；若文件随后 canplaythrough 会切换到文件
  }

  // 外部接口
  function mood(zone) {
    desiredMood = ZONE_MOOD[zone] || (MOODS[zone] ? zone : "serene");
    if (ctx) playMood(desiredMood); // 已激活才即时切；否则等首次手势
  }
  function activate() {
    if (isMuted()) {
      stopMusic();
      return false;
    }
    const c = ensure();
    if (!c) return false;
    if (c.state === "suspended") {
      c.resume().then(function () { playMood(desiredMood); }).catch(function () {});
    } else {
      playMood(desiredMood);
    }
    return true;
  } // 首次用户手势调用
  function isActive() {
    return !!((ctx && ctx.state === "running" && (timer || bgmAudio)) || (bgmAudio && !bgmAudio.paused));
  }
  function toggleMute() {
    const a = audioSettings(); a.muted = !isMuted();
    if (Game.saveUserSettings) Game.saveUserSettings({ audio: { muted: a.muted, vol: a.vol }, bgmVolume: a.vol });
    Game.save && Game.save.write(Game.save.read() || {}); // 持久化静音偏好·不覆盖 view
    if (a.muted) {
      stopMusic();
      if (sfxGain) sfxGain.gain.value = 0;
    } else {
      ensure();
      if (musicGain) musicGain.gain.value = gainVal();
      if (sfxGain) sfxGain.gain.value = sfxGainVal();
      if (bgmAudio) bgmAudio.volume = gainVal();
      activate();
    }
    return a.muted;
  }

  function applySettings() {
    if (isMuted()) {
      stopMusic();
      if (sfxGain) sfxGain.gain.value = 0;
      return;
    }
    if (musicGain) musicGain.gain.value = gainVal();
    if (sfxGain) sfxGain.gain.value = sfxGainVal();
    if (bgmAudio) bgmAudio.volume = gainVal();
  }

  Game.audio = { mood, activate, toggleMute, isMuted, isActive, sfx, applySettings };
})(window.Game = window.Game || {});
