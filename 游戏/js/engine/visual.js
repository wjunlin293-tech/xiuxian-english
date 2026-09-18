/* ───────────────────────────────────────────────────────────────
 * visual.js · 视觉反馈（雷劫突破 / toast / 答对脉冲 / 飘字）
 * 复用旧版被验证过的视觉语言（配色 + keyframes），重写为独立模块。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  function toast(msg, kind) {
    const t = document.createElement("div");
    t.className = "toast" + (kind ? " toast-" + kind : "");
    t.innerHTML = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.classList.add("out"); }, 1500);
    setTimeout(() => { t.remove(); }, 1900);
  }

  function reduceMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  // P-29 借旧版：金色粒子自 (x,y) 放射（答对/命中迸发）
  function burst(x, y, opts) {
    opts = opts || {};
    if (reduceMotion()) return;
    const n = opts.n || 10;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("div");
      p.className = "cb-particle";
      const ang = (Math.PI * 2 * i / n) + Math.random() * 0.6;
      const dist = 26 + Math.random() * 36;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "px");
      p.style.setProperty("--dy", (Math.sin(ang) * dist).toFixed(1) + "px");
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 460);
    }
  }
  function burstAt(el, opts) {
    if (!el || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, opts);
  }

  // P-29 连击弹出（连对/连击）
  function comboPop(text) {
    if (!text) return;
    const c = document.createElement("div");
    c.className = "cb-combo";
    c.textContent = text;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 950);
  }

  // P-29 连击中断 / 受击 红闪
  function redFlash() {
    if (reduceMotion()) return;
    const f = document.createElement("div");
    f.className = "cb-redflash";
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 420);
  }

  // P-29 破境回声（渡劫庆祝增强·可点掉·1.8s 自散）
  function breakEcho(text, onDone) {
    const e = document.createElement("div");
    e.className = "break-echo";
    e.innerHTML = '<div class="be-text">' + (text || "破 境") + '</div>';
    document.body.appendChild(e);
    let done = false;
    const close = () => { if (done) return; done = true; e.remove(); onDone && onDone(); };
    e.onclick = close;
    setTimeout(close, 1800);
  }

  function correctFlash() {
    const app = document.getElementById("app");
    if (!app) return;
    app.classList.remove("correct-flash");
    void app.offsetWidth; // 重启动画
    app.classList.add("correct-flash");
    burst(window.innerWidth / 2, window.innerHeight * 0.46, { n: 9 }); // 答对金粒
  }

  // 旧破境横幅：from→to 境界；R1 新流程使用 thunderTribulation。
  function breakthroughBanner(mount, from, to, onDone) {
    const el = document.createElement("div");
    el.className = "banner-breakthrough";
    el.innerHTML =
      '<div class="title">✦ 破 境 ✦</div>' +
      '<div class="sub"><span class="from">' + from + '</span> → <span class="to">' + to + '</span></div>' +
      '<div class="bt-glow"></div>';
    mount.appendChild(el);
    if (onDone) setTimeout(onDone, 1600);
    return el;
  }

  // R1 雷劫演出：暂不做失败判定，默认渡劫成功；强度/风险机制待用户定。
  function thunderTribulation(mount, from, to, onDone) {
    const el = document.createElement("div");
    el.className = "tribulation";
    el.innerHTML =
      '<div class="trib-sky">' +
      '  <span class="bolt b1"></span><span class="bolt b2"></span><span class="bolt b3"></span>' +
      '</div>' +
      '<div class="trib-title">渡 天 雷</div>' +
      '<div class="trib-sub"><span class="from">' + from + '</span> → <span class="to">' + to + '</span></div>' +
      '<div class="trib-text">雷声压过问言书院，沈砚识海中的《天外言典》翻开一页，万千真言化作一线清光。</div>';
    mount.appendChild(el);
    if (onDone) setTimeout(onDone, 2300);
    return el;
  }

  function floatNumber(x, y, text, kind) {
    const f = document.createElement("div");
    f.className = "floatnum" + (kind ? " fn-" + kind : "");
    f.textContent = text;
    f.style.left = x + "px";
    f.style.top = y + "px";
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 900);
  }

  Game.visual = { toast, correctFlash, breakthroughBanner, thunderTribulation, floatNumber, burst, burstAt, comboPop, redFlash, breakEcho };
})(window.Game = window.Game || {});
