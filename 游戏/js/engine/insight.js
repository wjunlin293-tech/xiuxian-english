/* ───────────────────────────────────────────────────────────────
 * insight.js · 匿名学习数据统计（P-INSIGHT）
 *
 * 目的：回答「有没有人用、学到了什么、坚持了多久」。
 *
 * 隐私原则（不可妥协）：
 *   - 数据只存本机 localStorage，不主动外发，无网络请求。
 *   - 不采集姓名/邮箱/IP/设备指纹/精确位置。
 *   - 玩家主动点「导出」才产生一段可分享文本，内容当场可见。
 *   - 安装 id 是随机数，与任何身份无关，仅用于去重同一台机器。
 *
 * 与存档的关系：独立 key，不进 save 槽位，重开档不清空
 *（因为要统计的是「这个人用了多久」，不是「这个存档进度」）。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const KEY = "xiuxian_insight_v1";
  const DAY_MS = 86400000;

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function blank() {
    return {
      v: 1,
      installId: Math.random().toString(36).slice(2, 10),  // 随机·非身份
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      days: [],            // 去重的活跃日期 ["2026-09-23", ...]
      sessions: 0,         // 启动次数
      studySessions: 0,    // 完成的闭关（修炼）次数
      newWords: 0,         // 累计学习新词次数
      reviews: 0,          // 累计复习到期词次数
      correct: 0,          // 累计答对
      wrong: 0,            // 累计答错
      months: 0,           // 推进的游戏内月份（进度深度）
      realmMax: 0,         // 到达过的最高境界
      funnel: {},          // 漏斗节点 { nodeName: count }
    };
  }

  let data = null;

  function read() {
    if (data) return data;
    try {
      const raw = localStorage.getItem(KEY);
      data = raw ? Object.assign(blank(), JSON.parse(raw)) : blank();
    } catch (e) { data = blank(); }
    return data;
  }

  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  /** 记一个计数型事件。amount 默认 1。 */
  function bump(field, amount) {
    const d = read();
    if (typeof d[field] !== "number") return;
    d[field] += (typeof amount === "number" ? amount : 1);
    touch();
  }

  /** 记一个漏斗节点（首次到达某个环节），用于看用户卡在哪。 */
  function mark(node) {
    const d = read();
    d.funnel[node] = (d.funnel[node] || 0) + 1;
    touch();
  }

  /** 记录最高值型指标。 */
  function peak(field, value) {
    const d = read();
    if (typeof value === "number" && value > (d[field] || 0)) { d[field] = value; }
    touch();
  }

  function touch() {
    const d = read();
    d.lastSeen = Date.now();
    const t = todayStr();
    if (d.days[d.days.length - 1] !== t && d.days.indexOf(t) < 0) {
      d.days.push(t);
      if (d.days.length > 400) d.days = d.days.slice(-400);
    }
    write();
  }

  /** 会话开始（每次打开页面调一次）。 */
  function boot() {
    const d = read();
    d.sessions += 1;
    touch();
  }

  /** 汇总成给玩家看 / 给开发者读的摘要。 */
  function summary() {
    const d = read();
    const daysActive = d.days.length;
    const spanDays = Math.max(1, Math.round((d.lastSeen - d.firstSeen) / DAY_MS) + 1);
    const answered = d.correct + d.wrong;
    return {
      installId: d.installId,
      daysActive: daysActive,                                    // 真实活跃天数＝留存
      spanDays: spanDays,                                        // 首末跨度
      retained: daysActive > 1,                                  // 是否回来过
      sessions: d.sessions,
      studySessions: d.studySessions,
      newWords: d.newWords,
      reviews: d.reviews,                                        // 到期复习次数＝SRS 真被用了
      accuracy: answered ? Math.round((d.correct / answered) * 100) : null,
      months: d.months,
      realmMax: d.realmMax,
      funnel: d.funnel,
      firstSeen: new Date(d.firstSeen).toISOString().slice(0, 10),
      lastSeen: new Date(d.lastSeen).toISOString().slice(0, 10),
    };
  }

  /** 导出为一行紧凑文本，方便测试者复制发回。内容对玩家完全可见。 */
  function exportText() {
    const s = summary();
    return "XIUXIAN-INSIGHT/1 " + JSON.stringify(s);
  }

  Game.insight = {
    boot: boot,
    bump: bump,
    mark: mark,
    peak: peak,
    summary: summary,
    exportText: exportText,
    reset: function () { data = blank(); write(); },
  };
})(window.Game = window.Game || {});
