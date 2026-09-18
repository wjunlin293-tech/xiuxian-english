/* ───────────────────────────────────────────────────────────────
 * hub.js · 时间养成主界面
 * 时间养成主界面：年月、境界、言气条、五维雷达、月行动和时间事件入口。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const mountId = "stage";

  function mountEl() { return document.getElementById(mountId); }

  function expPercent() {
    Game.normalizeState && Game.normalizeState();
    if (!Game.state.expToBreak) return 0;
    return Math.max(0, Math.min(100, Math.round(Game.state.exp / Game.state.expToBreak * 100)));
  }

  function realmWallHtml() {
    if (!(Game.isRealmWallReady && Game.isRealmWallReady())) return "";
    return '<div class="deadline-box realm-wall-box">' +
      '<b>凝言圆满 · 破境受阻</b>' +
      '<span>第 4 境界需要外界灵脉与突破丹；书院内无法继续破境。</span>' +
      '<button class="btn btn-gold" id="realm-wall-open">查看所缺</button>' +
      '</div>';
  }

  function actionButton(label, sub, id, disabled) {
    return '<button class="hub-action" id="' + id + '"' + (disabled ? ' disabled' : '') + '>' +
      '<span class="ha-label">' + label + '</span>' +
      '<span class="ha-sub">' + sub + '</span>' +
      '</button>';
  }

  function vowCountdown() {
    const month = Game.time && Game.time.totalMonths ? Game.time.totalMonths() : Game.currentMonthNumber();
    return Math.max(0, 36 - month);
  }

  // 三年之约赴约期限提示：逾期即失约（连面都不露，比避战更重）。
  function vowGraceText() {
    if (!Game.storyflow || !Game.storyflow.vowGraceLeft) return "";
    const left = Game.storyflow.vowGraceLeft();
    const deadline = Game.storyflow.vowDeadline ? Game.storyflow.vowDeadline() : 38;
    if (left <= 0) return '<b class="vow-urgent">　·　最后期限！本月不赴约即失约。</b>';
    return '<b class="vow-urgent">　·　⏳第 ' + deadline + ' 月散场，逾期即失约（还剩 ' + left + ' 月）</b>';
  }

  function storySubtext() {
    if (!Game.storyflow || !Game.storyflow.nextStoryInfo) return "暂无新的剧情节点";
    const info = Game.storyflow.nextStoryInfo();
    if (!info.title) return info.requirement || "暂无新的剧情节点";
    if (info.canStart) {
      let s = (info.timeText || "耗时 1 月") + "，推进「" + info.title + "」";
      // 机缘期限倒计时：让玩家自主权衡是否赴约（拖过期限将错过）。
      if (info.monthsToDeadline != null) {
        s += "　·　⏳机缘期限：第 " + info.deadline + " 月前赴约，还剩 " + info.monthsToDeadline + " 月";
      }
      return s;
    }
    let s = "未解锁「" + info.title + "」：" + info.requirement;
    // 解锁倒计时：还差多少月可触发。
    if (info.monthsToUnlock != null) s += "（还需 " + info.monthsToUnlock + " 月）";
    return s;
  }
  function lifeCost(type, opts) {
    return Game.life && Game.life.costLine ? Game.life.costLine(type, opts) : "耗时 1 月";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function equippedItem(slot) {
    if (Game.canonicalGearSlot) slot = Game.canonicalGearSlot(slot);
    const id = Game.state && Game.state.equip && Game.state.equip[slot];
    return id && Game.state.gear ? Game.state.gear[id] : null;
  }

  function gearLayerHtml(slot, item) {
    const fallback = slot === "weapon" ? "武" : (slot === "artifact" ? "宝" : "衣");
    const style = item && Game.marketIconStyle ? Game.marketIconStyle(item.id) : "";
    return '<span class="avatar-gear-layer avatar-gear-' + slot + (item ? ' equipped' : '') + '"' +
      (item ? ' aria-label="' + esc(item.name) + '"' : ' aria-hidden="true"') +
      (style ? ' style="' + style + '"' : '') + '><b>' + fallback + '</b></span>';
  }

  function gearLayersHtml(items, gender, mode, layer) {
    if (Game.gearAppearance && Game.gearAppearance.layersHtml) {
      return Game.gearAppearance.layersHtml(items, gender, mode, layer);
    }
    if (layer !== "front") return "";
    return gearLayerHtml("outfit", items.outfit) + gearLayerHtml("artifact", items.artifact) + gearLayerHtml("weapon", items.weapon);
  }

  function gearSpec(item) {
    if (!item || !Game.gearAppearance || !Game.gearAppearance.APPEARANCE) return null;
    const raw = Game.gearAppearance.APPEARANCE[item.id];
    return raw && Game.gearAppearance.resolveSpec ? Game.gearAppearance.resolveSpec(raw) : raw;
  }

  function gearArt(item, slot, gender, mode) {
    if (!item) return "";
    if (slot === "outfit") {
      if (mode) {
        return (item.showcaseImages && item.showcaseImages[gender]) ||
          (item.images && item.images[gender]) ||
          (item.paperdollImages && item.paperdollImages[gender]) || "";
      }
      return (item.paperdollImages && item.paperdollImages[gender]) ||
        (item.images && item.images[gender]) || "";
    }
    const spec = gearSpec(item);
    if (mode && spec && spec.showcase && spec.showcase.art) return spec.showcase.art;
    return spec && spec.art ? spec.art : "";
  }

  const SHOWCASE_DEFAULTS = {
    outfit: { x:"60%", y:"58%", w:"76%", h:"78%", r:"0deg" },
    weapon: { x:"50%", y:"51.5%", w:"78%", h:"48%", r:"-90deg", sx:"50%", sy:"84%", sw:"76%", sh:"12%", sr:"0deg", so:".5" },
    artifact: { x:"22%", y:"43%", w:"42%", h:"34%", r:"0deg", iw:"32%", ih:"70%" }
  };

  function showcasePose(slot, item, mode) {
    const spec = gearSpec(item);
    const raw = spec && spec.showcase;
    const base = Object.assign({}, SHOWCASE_DEFAULTS[slot] || {});
    if (raw && raw.default) Object.assign(base, raw.default);
    if (raw && raw[mode]) Object.assign(base, raw[mode]);
    return base;
  }

  function showcaseStyle(slot, item, mode) {
    const p = showcasePose(slot, item, mode || "panel");
    return [
      "--showcase-x:" + (p.x || "50%"),
      "--showcase-y:" + (p.y || "50%"),
      "--showcase-w:" + (p.w || "60%"),
      "--showcase-h:" + (p.h || "40%"),
      "--showcase-r:" + (p.r || "0deg"),
      "--showcase-img-w:" + (p.iw || "100%"),
      "--showcase-img-h:" + (p.ih || "100%"),
      "--showcase-contact-x:" + (p.sx || "50%"),
      "--showcase-contact-y:" + (p.sy || "70%"),
      "--showcase-contact-w:" + (p.sw || "62%"),
      "--showcase-contact-h:" + (p.sh || "14%"),
      "--showcase-contact-r:" + (p.sr || "0deg"),
      "--showcase-contact-o:" + (p.so || ".5")
    ].join(";");
  }

  const AVATAR_PRELOAD_CACHE = Object.create(null);

  function preloadImage(src) {
    if (!src || AVATAR_PRELOAD_CACHE[src] || typeof Image === "undefined") return;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    if (img.decode) img.decode().catch(() => {});
    AVATAR_PRELOAD_CACHE[src] = img;
  }

  function currentAvatarItems() {
    return {
      weapon: equippedItem("weapon"),
      artifact: equippedItem("artifact"),
      outfit: equippedItem("outfit")
    };
  }

  function preloadAvatarAssets() {
    const info = Game.avatarInfo ? Game.avatarInfo() : null;
    const items = currentAvatarItems();
    if (info && info.image) preloadImage(info.image);
    if (Game.gearAppearance && Game.gearAppearance.preload) Game.gearAppearance.preload(items);
    return items;
  }

  function avatarOutfitName() {
    const outfit = Game.state && Game.state.avatar && Game.state.avatar.outfit;
    const names = {
      academy_ragged: "书院旧衫",
      default: "素色道衣"
    };
    return names[outfit] || "素色道衣";
  }

  function previewLine(label, value) {
    return '<span><em>' + esc(label) + '</em><b>' + esc(value) + '</b></span>';
  }

  function gearDisplayName(item, empty) {
    if (!item) return esc(empty);
    return Game.qName ? Game.qName(item.id, esc(item.name)) : esc(item.name);
  }

  function showcaseImage(slot, item, gender, mode) {
    const art = gearArt(item, slot, gender || "male", mode || "panel");
    if (!art) return "";
    return '<img class="gear-showcase-img gear-showcase-' + slot + '-img" src="' + esc(art) + '" alt="">';
  }

  function showcaseHtml(items, gender, mode) {
    const outfit = items.outfit;
    const weapon = items.weapon;
    const artifact = items.artifact;
    return '<div class="gear-showcase gear-showcase-' + mode + '">' +
      '  <div class="gear-showcase-scene" aria-hidden="true"></div>' +
      '  <section class="gear-bay gear-bay-outfit" aria-label="衣服展示">' +
      '    <div class="gear-bay-label"><span>衣服</span><b>' + gearDisplayName(outfit, "未挂衣服") + '</b></div>' +
      (outfit ? '<span class="gear-showcase-holder gear-showcase-outfit-holder" style="' + showcaseStyle("outfit", outfit, mode) + '">' + showcaseImage("outfit", outfit, gender, mode) + '</span>' : '<span class="gear-empty-slot gear-empty-outfit" aria-hidden="true"></span>') +
      '  </section>' +
      '  <section class="gear-bay gear-bay-weapon" aria-label="武器展示">' +
      '    <div class="gear-bay-label"><span>武器</span><b>' + gearDisplayName(weapon, "未置武器") + '</b></div>' +
      (weapon ? '<span class="gear-showcase-holder gear-showcase-weapon-holder" style="' + showcaseStyle("weapon", weapon, mode) + '">' + showcaseImage("weapon", weapon, gender, mode) + '</span>' : '<span class="gear-empty-slot gear-empty-weapon" aria-hidden="true"></span>') +
      '  </section>' +
      '  <section class="gear-bay gear-bay-artifact" aria-label="法宝展示">' +
      '    <div class="gear-bay-label"><span>法宝</span><b>' + gearDisplayName(artifact, "未置法宝") + '</b></div>' +
      (artifact ? '<div class="gear-artifact-orbit" style="' + showcaseStyle("artifact", artifact, mode) + '">' + showcaseImage("artifact", artifact, gender, mode) + '</div>' : '<span class="gear-empty-slot gear-empty-artifact" aria-hidden="true"></span>') +
      '  </section>' +
      '</div>';
  }

  function appearancePreviewHtml() {
    const info = Game.avatarInfo ? Game.avatarInfo() : { gender: "male", label: "男侠", title: "问言少侠", image: "../素材/主角/player-male-paperdoll-base.png" };
    const preloaded = preloadAvatarAssets();
    const weapon = preloaded.weapon;
    const artifact = preloaded.artifact;
    const outfit = preloaded.outfit;
    const items = { weapon, artifact, outfit };
    return '<div class="avatar-preview gear-preview-wide avatar-' + info.gender + '">' +
      '  <div class="avatar-preview-stage gear-showcase-stage" aria-label="' + esc(info.title) + '装备展示柜">' +
           showcaseHtml(items, info.gender, "preview") +
      '  </div>' +
      '  <div class="avatar-preview-meta">' +
           previewLine("身份", info.title + " · " + info.label) +
           previewLine("境界", Game.realmName()) +
           '<span><em>衣服</em><b>' + gearDisplayName(outfit, "默认空衣架") + '</b></span>' +
           '<span><em>法宝</em><b>' + gearDisplayName(artifact, "未置法宝") + '</b></span>' +
           '<span><em>武器</em><b>' + gearDisplayName(weapon, "未置武器") + '</b></span>' +
      '  </div>' +
      '</div>';
  }

  function showAppearancePreview() {
    if (!Game.modal || !Game.modal.open) return false;
    preloadAvatarAssets();
    const info = Game.avatarInfo ? Game.avatarInfo() : { title: "主角外观" };
    Game.modal.open({
      kind: "avatar",
      tag: "装备栏",
      title: info.title + " · 装备展示柜",
      html: appearancePreviewHtml(),
      closeText: "收起"
    });
    return true;
  }

  // 把立绘面板的「点击/Enter/Space 看外观」绑定抽出来，hub 与背包共用（实时装备预览）。
  function bindAvatarPreview(root) {
    const avatar = root && root.querySelector(".avatar-preview-trigger");
    if (!avatar) return;
    avatar.onclick = showAppearancePreview;
    avatar.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showAppearancePreview();
      }
    };
  }

  function avatarPanelHtml() {
    const info = Game.avatarInfo ? Game.avatarInfo() : { gender: "male", label: "男侠", title: "问言少侠", image: "../素材/主角/player-male-base.png" };
    const preloaded = preloadAvatarAssets();
    const weapon = preloaded.weapon;
    const artifact = preloaded.artifact;
    const outfit = preloaded.outfit;
    const items = { weapon, artifact, outfit };
    return '<div class="avatar-panel avatar-' + info.gender + '">' +
      '  <div class="avatar-stage avatar-preview-trigger gear-showcase-trigger" role="button" tabindex="0" title="点击查看装备柜" aria-label="查看' + esc(info.title) + '装备柜">' +
           showcaseHtml(items, info.gender, "panel") +
      '  </div>' +
      '  <div class="avatar-caption"><b>装备柜</b><span>' + esc(Game.realmName()) + ' · ' + esc(info.label) + '</span></div>' +
      '  <div class="avatar-gear-summary">' +
      '    <span><em>衣服</em><b>' + gearDisplayName(outfit, "默认空衣架") + '</b></span>' +
      '    <span><em>法宝</em><b>' + gearDisplayName(artifact, "未置法宝") + '</b></span>' +
      '    <span><em>武器</em><b>' + gearDisplayName(weapon, "未置武器") + '</b></span>' +
      '  </div>' +
      '</div>';
  }

  // 强提醒（§11 防节奏跑偏）：言气满了该突破 / 剧情解锁太久没推，醒目横幅推玩家去行动。
  const STORY_STALE_MONTHS = 4; // 剧情解锁后搁置 ≥4 月视为"太久没推"
  function hubNudges() {
    const out = [];
    if (Game.readyToBreak && Game.readyToBreak()) {
      out.push('<div class="hub-nudge nudge-break">⚡ <b>雷云压进识海</b>，你的言气已足以引来天劫，下一境界的门槛近在眼前：' +
        ((Game.REALMS && Game.REALMS[(Game.state.realmIndex || 0) + 1]) || "下一境界") +
        '。</div>');
    }
    const info = Game.storyflow && Game.storyflow.nextStoryInfo ? Game.storyflow.nextStoryInfo() : null;
    if (info && info.canStart && info.monthsSinceUnlock != null && info.monthsSinceUnlock >= STORY_STALE_MONTHS) {
      out.push('<div class="hub-nudge nudge-story">📜 <b>「' + info.title + '」在书院风声里搁了 ' + info.monthsSinceUnlock +
        ' 月</b>。有些人还在等，有些事却不会永远停在原地。</div>');
    }
    return out.join("");
  }
  function onboardingHtml() {
    if (Game.state.flags && Game.state.flags.hubGuideSeen) return "";
    return '<div class="hub-onboard" id="hub-onboard">' +
      '<b>初入书院</b>' +
      '<span>想变强先点「修炼背词」；想知道发生了什么点「推进剧情」；想整理词书进修炼页里的「言田」。所有行动都可自由选择，没有必须背满的硬墙。</span>' +
      '<button class="btn btn-mini" id="hub-guide-close">知道了</button>' +
      '</div>';
  }
  // 三年之约到点但剧情没跟上：醒目催赶（去推进剧情/突破补前情），逾期则失约。
  function vowBehindBox() {
    if (!Game.storyflow || !Game.storyflow.vowBehind || !Game.storyflow.vowBehind()) return "";
    const left = Game.storyflow.vowGraceLeft ? Game.storyflow.vowGraceLeft() : 0;
    const deadline = Game.storyflow.vowDeadline ? Game.storyflow.vowDeadline() : 38;
    const tail = left > 0
      ? '第 ' + deadline + ' 月前还来得及赶上，还剩 ' + left + ' 月。'
      : '<b>最后期限！本月再补不上就失约。</b>';
    return '<div class="deadline-box vow-behind"><b>三年之约将至，你却还没走到那一步</b>' +
      '<span>这三年你太沉于闭关，前情未了、境界未足，贸然赴约只是送死。速去「推进剧情」与「突破」补上——' + tail + '</span></div>';
  }
  function ghostSubtext() {
    const n = Game.rebirth && Game.rebirth.ghostCount ? Game.rebirth.ghostCount() : 0;
    return n ? "前世未稳之词来寻你 · " + n + " 个" : "暂无前世鬼魂";
  }

  function show(message) {
    Game.normalizeState && Game.normalizeState();
    if (Game.life && Game.life.guard && Game.life.guard(message)) return;
    // 三年之约逾期拦截：拖过期限回到月课即触发「失约」，堵住"无限拖、零代价"。
    if (Game.storyflow && Game.storyflow.checkVowForfeit && Game.storyflow.checkVowForfeit()) return;
    Game.setZone && Game.setZone("hub");
    Game.spawnEmber && Game.spawnEmber();
    if (message && Game.logEvent) Game.logEvent(message); // 月度行动结果入事件栏(P-28)
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "hub" });
    const s = Game.state;
    const pct = expPercent();
    const canBreak = Game.readyToBreak && Game.readyToBreak(); // P-BREAK：言气满且未封顶→显示突破按钮
    const bossDue = Game.storyflow && Game.storyflow.bossDue();
    const storyInfo = Game.storyflow && Game.storyflow.nextStoryInfo ? Game.storyflow.nextStoryInfo() : null;
    const monthsLeft = vowCountdown();
    const el = mountEl();
    el.innerHTML =
      '<div class="hub-screen">' +
      '  <section class="hub-hero">' +
      '    <div class="hub-hero-actions"><button class="btn btn-mini" id="hub-menu-return">返回主菜单</button></div>' +
      '    <div class="hub-time">' + Game.time.label() + '</div>' +
      '    <h1>问言书院 · 月课</h1>' +
      '    <div class="hub-meta">' + s.name + ' · ' + Game.realmName() + ' · 已掌握 ' + Game.masteredCount() + ' 言</div>' +
      '    <div class="hub-life">寿元 ' + (Game.lifeLabel ? Game.lifeLabel(s.lifespan) : s.lifespan + "月") + ' / ' + (Game.lifeLabel ? Game.lifeLabel(s.lifespanMax) : s.lifespanMax + "月") + '</div>' +
      (Game.yiguo ? Game.yiguo.entryHtml() : '') +
      (monthsLeft > 0 && !s.flags.vowBossDone && !s.flags.vowBossSkipped && !s.flags.vowBossLost ? '    <div class="hub-deadline">距三年之约还有 ' + monthsLeft + ' 月</div>' : '') +
      onboardingHtml() +
      hubNudges() +
      '    <div class="exp-box' + (canBreak ? ' can-break' : '') + '">' +
      '      <div class="exp-head"><span>言气</span><b>' + s.exp + ' / ' + s.expToBreak + '</b></div>' +
      '      <div class="exp-row">' +
      '      <div class="exp-track"><div class="exp-fill" style="width:' + pct + '%"></div></div>' +
      (canBreak ? '      <button class="btn btn-gold exp-break-btn" id="hub-break">突 破</button>' : '') +
      '      </div>' +
      (canBreak ? '      <div class="exp-break-hint">言气已满，可引天劫雷劫突破到' + (Game.REALMS[s.realmIndex + 1] || "下一境界") + '。</div>' : '') +
      '    </div>' +
      realmWallHtml() +
      (Game.dev && Game.dev.hubHtml ? Game.dev.hubHtml() : '') +
      (message ? '    <div class="hub-note">' + message + '</div>' : '') +
      (bossDue ? '    <div class="deadline-box"><b>三年之约已至</b><span>院试大比正在等你。' + vowGraceText() + '</span><button class="btn btn-gold" id="deadline-boss">处理此事</button></div>' : '') +
      vowBehindBox() +
      '  </section>' +
      '  <section class="hub-grid">' +
      '    <div class="hub-panel hub-radar">' +
             avatarPanelHtml() +
      '      <div class="panel-title">五维识海</div>' +
             Game.radar.radarSVG(230) +
      (s.free > 0 ? '      <button class="btn btn-gold" id="hub-alloc">分 配 根 基（' + s.free + '）</button>' : '') +
      '    </div>' +
      '    <div class="hub-panel">' +
      '      <div class="panel-title">本月行动</div>' +
      '      <div class="hub-actions">' +
             actionButton("修炼背词", "稳妥修行；大闭关才额外折寿", "act-cultivate", false) +
             actionButton("推进剧情", storySubtext(), "act-story", !(storyInfo && storyInfo.canStart)) +
             actionButton("探险打野", "胜利只耗时；退避/重伤会额外折寿", "act-explore", false) +
             actionButton("悟道静参", lifeCost("contemplate") + "，换一缕言气感悟", "act-contemplate", !Game.life) +
             actionButton("前世鬼魂", ghostSubtext(), "act-ghosts", !(Game.rebirth && Game.rebirth.ghostCount && Game.rebirth.ghostCount())) +
             actionButton("坊市", "买卖材料、丹药、装备；卖出价为买入价四成", "act-market", !Game.market) +
             actionButton("炼丹 / 制武", "消耗材料，制作丹药与装备", "act-craft", false) +
             actionButton("背包", "服用丹药，装卸衣服、法宝和武器", "act-inventory", false) +
             actionButton("人物谱", "查看相识之人、情谊与结缘进度", "act-relations", !Game.relations) +
      '      </div>' +
      '      <div class="hub-bag"><div class="panel-title">背包材料</div><div class="bag-list">' + (Game.explore ? Game.explore.bagSummary() : '<span class="dim">暂无材料</span>') + '</div></div>' +
      '    </div>' +
      (Game.worldFeel ? '    <div class="hub-panel hub-world">' + Game.worldFeel.panelHtml() + '</div>' : '') +
      '  </section>' +
      '</div>';
    if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0);

    const cultivate = el.querySelector("#act-cultivate");
    if (cultivate) cultivate.onclick = () => Game.cultivate.chooseSession();
    const story = el.querySelector("#act-story");
    if (story) story.onclick = () => Game.storyflow.startNext();
    const explore = el.querySelector("#act-explore");
    if (explore) explore.onclick = () => Game.explore.showZones();
    const contemplate = el.querySelector("#act-contemplate");
    if (contemplate) contemplate.onclick = () => Game.life && Game.life.showContemplate();
    const ghosts = el.querySelector("#act-ghosts");
    if (ghosts) ghosts.onclick = () => Game.rebirth && Game.rebirth.showGhosts();
    const market = el.querySelector("#act-market");
    if (market) market.onclick = () => Game.market && Game.market.show();
    const craft = el.querySelector("#act-craft");
    if (craft) craft.onclick = () => Game.craft.show();
    const inventory = el.querySelector("#act-inventory");
    if (inventory) inventory.onclick = () => Game.craft.showInventory();
    const relations = el.querySelector("#act-relations");
    if (relations) relations.onclick = () => Game.relations.show();
    const alloc = el.querySelector("#hub-alloc");
    if (alloc) alloc.onclick = showAllocate;
    const boss = el.querySelector("#deadline-boss");
    if (boss) boss.onclick = () => Game.storyflow.showBossPrompt();
    const wall = el.querySelector("#realm-wall-open");
    if (wall) wall.onclick = () => Game.cultivate && Game.cultivate.showRealmWall && Game.cultivate.showRealmWall();
    const breakBtn = el.querySelector("#hub-break");
    if (breakBtn) breakBtn.onclick = () => Game.cultivate && Game.cultivate.startBreakthrough && Game.cultivate.startBreakthrough();
    const yiguo = el.querySelector("#hub-yiguo");
    if (yiguo) yiguo.onclick = () => Game.yiguo.showCodex();
    const menu = el.querySelector("#hub-menu-return");
    if (menu) menu.onclick = () => Game.menu && Game.menu.backToMenu();
    const guideClose = el.querySelector("#hub-guide-close");
    if (guideClose) guideClose.onclick = () => {
      Game.state.flags = Game.state.flags || {};
      Game.state.flags.hubGuideSeen = true;
      const guide = el.querySelector("#hub-onboard");
      if (guide) guide.remove();
      Game.save && Game.save.write({ view: "hub" });
    };
    bindAvatarPreview(el);
    if (Game.dev && Game.dev.bindHub) Game.dev.bindHub(el);
    if (message && Game.monthEvents && Game.monthEvents.showPending) Game.monthEvents.showPending();
  }

  function showAllocate() {
    const el = mountEl();
    el.innerHTML = '<div class="story-page"><div id="hub-alloc-mount"></div></div>';
    Game.radar.allocateCard(el.querySelector("#hub-alloc-mount"), function () {
      show("根基已纳入识海。");
    });
  }

  Game.hub = { show, avatarPanelHtml, bindAvatarPreview, preloadAvatarAssets };
})(window.Game = window.Game || {});
