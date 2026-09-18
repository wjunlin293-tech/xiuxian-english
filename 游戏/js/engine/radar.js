/* ───────────────────────────────────────────────────────────────
 * radar.js · 五维雷达（SVG）+ 加点卡 + 只读识海/状态屏
 * R19 起为五维模型（血/法/力/防/神识），暴击并入法力的术式爆发。
 * 加点入口：升级时弹"加点卡"；状态屏只读看雷达，不作养成入口。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  // 画一个五维雷达 SVG，返回字符串。opts.benchmark=true 时叠加"当前境界标准值"对比层。
  function radarSVG(size, opts) {
    size = size || 240;
    opts = opts || {};
    Game.normalizeState && Game.normalizeState();
    const total = Game.totalAttrs ? Game.totalAttrs() : Game.state.attrs;
    const bonus = Game.equipBonus ? Game.equipBonus() : {};
    const bench = (opts.benchmark && Game.realmStandard) ? Game.realmStandard() : null;
    const cx = size / 2, cy = size / 2, R = size * 0.38;
    const attrs = Game.ATTRS, n = attrs.length;
    const ang = (i) => (-Math.PI / 2) + (i * 2 * Math.PI / n);
    const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];

    let grid = "";
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      const p = attrs.map((_, i) => pt(i, R * f).map((v) => v.toFixed(1)).join(",")).join(" ");
      grid += '<polygon points="' + p + '" class="rdr-grid"/>';
    });
    let axes = "", labels = "";
    attrs.forEach((a, i) => {
      const [x, y] = pt(i, R);
      axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" class="rdr-axis"/>';
      const [lx, ly] = pt(i, R + 18);
      // 按顶点在左/右/中决定锚点，防右侧标签(如「法力」)向右溢出被裁。
      const anchor = lx > cx + 1 ? "end" : (lx < cx - 1 ? "start" : "middle");
      const val = total[a.key];
      const plus = bonus[a.key] ? '<tspan class="rdr-bonus"> +' + bonus[a.key] + '</tspan>' : '';
      // 低于本境界标准 → 标红 + ▾ 提示
      const low = bench && val < bench[a.key];
      const mark = low ? '<tspan class="rdr-low"> ▾</tspan>' : '';
      labels += '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="' + anchor + '" class="' + (low ? "rdr-label rdr-low" : "rdr-label") + '">' + a.name + '<tspan class="rdr-val"> ' + val + '</tspan>' + plus + mark + '</text>';
    });
    // 有境界标准(bench)时：以"该境界标准"为基准环(STD_R)——标准画成正五边形，玩家相对它(超标突出/不足内缩)；
    // 无标准时(hub)：按"各维/各维上限"显示绝对成长。
    const STD_R = 0.55;
    function polyOf(getVal) {
      return attrs.map((a, i) => {
        let f;
        if (bench) f = STD_R * (getVal(a) / (bench[a.key] || 1));
        else f = getVal(a) / a.max;
        f = Math.max(0.06, Math.min(1, f));
        return pt(i, R * f).map((v) => v.toFixed(1)).join(",");
      }).join(" ");
    }
    const shape = polyOf((a) => total[a.key]);
    // 标准层用自身值 → 每维 f=STD_R(相等)=正五边形
    const benchPoly = bench ? '<polygon points="' + polyOf((a) => bench[a.key] || 0) + '" class="rdr-bench"/>' : "";

    return '<svg class="radar" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">' +
      grid + axes + benchPoly +
      '<polygon points="' + shape + '" class="rdr-shape"/>' +
      labels + '</svg>';
  }

  // 只读状态屏（识海）
  function statusScreen(mount) {
    mount.innerHTML =
      '<div class="status-screen">' +
      '  <h2>识 海</h2>' +
      '  <div class="ss-meta">' + Game.state.name + '　·　' + Game.realmName() +
      '    <span class="dim">　言气 ' + Game.state.exp + '/' + Game.state.expToBreak + '　已掌握 ' + Game.masteredCount() + ' 言</span></div>' +
      '  <div class="ss-radar">' + radarSVG(260, { benchmark: true }) + '</div>' +
      '  <p class="dim small">＊实线＝你的五维（含装备加成）；虚线＝<b>' + Game.realmName() + '</b>境界标准。<span class="rdr-low">▾</span> 标红为低于标准的维度</p>' +
      '</div>';
  }
  // 「词库来源」框已按用户要求移除（VOCAB_SOURCES 数据仍在·署名等上架前放 credits/about 即可）

  // 加点卡：升级时弹出，分配 free 点
  function allocateCard(mount, onDone) {
    // 本轮各属性已加点数：作为「－」撤回上限，只能撤回这次破境分配的点。
    // 刷新即清零（回到存档基线，未点「纳入识海」前的加点本就未存档）。
    const added = {};
    function draw() {
      const total = Game.totalAttrs ? Game.totalAttrs() : Game.state.attrs;
      const bonus = Game.equipBonus ? Game.equipBonus() : {};
      const rows = Game.ATTRS.map((a) =>
        '<div class="alloc-row">' +
        '  <span class="ar-name">' + a.name + '</span>' +
        '  <span class="ar-val">' + total[a.key] + (bonus[a.key] ? '<em> 装备+' + bonus[a.key] + '</em>' : '') + '</span>' +
        '  <button class="btn btn-mini ar-minus" data-k="' + a.key + '"' + ((added[a.key] || 0) <= 0 ? ' disabled' : '') + '>－</button>' +
        '  <button class="btn btn-mini ar-plus" data-k="' + a.key + '"' + (Game.state.free <= 0 ? ' disabled' : '') + '>＋</button>' +
        '</div>'
      ).join("");
      mount.innerHTML =
        '<div class="alloc-card">' +
        '  <div class="wc-tag">破境 · 分配根基</div>' +
        '  <div class="alloc-radar">' + radarSVG(220) + '</div>' +
        '  <div class="alloc-free">可分配：<b>' + Game.state.free + '</b><span class="dim small">　确认前可点「－」撤回重分</span></div>' +
        '  <div class="alloc-rows">' + rows + '</div>' +
        '  <button class="btn btn-gold" id="alloc-done"' + (Game.state.free > 0 ? ' disabled' : '') + '>纳 入 识 海</button>' +
        '</div>';
      mount.querySelectorAll(".alloc-row .ar-plus").forEach((b) => {
        b.onclick = () => {
          const k = b.dataset.k;
          if (Game.allocate(k)) { added[k] = (added[k] || 0) + 1; draw(); }
        };
      });
      mount.querySelectorAll(".alloc-row .ar-minus").forEach((b) => {
        b.onclick = () => {
          const k = b.dataset.k;
          if ((added[k] || 0) > 0 && Game.deallocate && Game.deallocate(k)) { added[k] -= 1; draw(); }
        };
      });
      mount.querySelector("#alloc-done").onclick = () => onDone && onDone();
    }
    draw();
  }

  Game.radar = { radarSVG, statusScreen, allocateCard };
})(window.Game = window.Game || {});
