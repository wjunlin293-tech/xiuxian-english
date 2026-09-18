/* ───────────────────────────────────────────────────────────────
 * market.js · P-MONEY / P-MARKET 灵石与坊市买卖
 * 买入按完整价；卖出固定为买入价 40%（少 60%），防倒卖刷钱。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const SELL_RATE = 0.4;
  const MATERIAL_PRICES = {
    "碎灵木": 8,
    "低阶兽骨": 10,
    "凝露草": 14,
    "寒铁屑": 16,
    "玄铁砂": 24,
    "月华露": 26,
    "兽魂晶": 30,
    "古篆残片": 34,
    "凝言髓": 48,
    "异果果髓": 80,
  };
  const MATERIAL_REALM_REQ = {
    "玄铁砂": 1,
    "月华露": 1,
    "兽魂晶": 1,
    "古篆残片": 1,
    "凝言髓": 2,
    "异果果髓": 2,
  };
  const RECIPE_PRICES = {
    huoxue_powder: 32,
    ninglu_pill: 42,
    guyuan_pill: 76,
    yunxi_pill: 92,
    yuehua_pill: 78,
    cuigu_pill: 72,
    tongxuan_pill: 118,
    mana_pill: 140,
    sense_pill: 140,
    wood_sword: 60,
    iron_talisman: 72,
    iron_heavy_sword: 130,
    fruit_wordblade: 220,
    ningyan_jade_talisman: 190,
    yg_guixu: 280,
    yg_fengao: 280,
    yg_shihun: 320,
  };
  const MARKET_ICON_IDS = [
    "碎灵木", "低阶兽骨", "凝露草", "寒铁屑", "玄铁砂", "月华露",
    "兽魂晶", "古篆残片", "凝言髓", "异果果髓",
    "huoxue_powder", "ninglu_pill", "guyuan_pill", "yunxi_pill", "yuehua_pill", "cuigu_pill",
    "tongxuan_pill", "mana_pill", "sense_pill",
    "wood_sword", "iron_talisman", "iron_heavy_sword", "fruit_wordblade", "ningyan_jade_talisman",
    "qingfeng_sword", "lieshi_axe", "liuyun_talisman"
  ];
  const ICON_IMAGE_URLS = {
    wood_sword: "../素材/装备/wood_sword_layer.png",
    qingfeng_sword: "../素材/装备/qingfeng_sword_layer.png",
    hanyue_shortblade: "../素材/装备/hanyue_shortblade_layer.png",
    iron_heavy_sword: "../素材/装备/iron_heavy_sword_layer.png",
    lieshi_axe: "../素材/装备/lieshi_axe_layer.png",
    mojian_flying_sword: "../素材/装备/mojian_flying_sword_layer.png",
    fruit_wordblade: "../素材/装备/fruit_wordblade_layer.png",
    yg_guixu: "../素材/装备/yg_guixu_layer.png",
    yg_fengao: "../素材/装备/yg_fengao_layer.png",
    yg_shihun: "../素材/装备/yg_shihun_layer.png",
    iron_talisman: "../素材/装备/iron_talisman_layer.png",
    ningyan_jade_talisman: "../素材/装备/ningyan_jade_talisman_layer.png",
    liuyun_talisman: "../素材/装备/liuyun_talisman_layer.png",
    xuanling_bell: "../素材/装备/xuanling_bell_layer.png",
    stargaze_astrolabe: "../素材/装备/stargaze_astrolabe_layer.png",
    qingbu_robe: "../素材/装备/qingbu_robe_showcase_male.png",
    xuanwen_robe: "../素材/装备/xuanwen_robe_showcase_male.png",
  };
  const ICON_ALIASES = {
    break_pill_qiyan: "ninglu_pill",
    break_pill_ningyan: "tongxuan_pill",
  };

  function mountEl() { return document.getElementById("stage"); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function moneyText(n) {
    return Game.moneyLabel ? Game.moneyLabel(n) : String(n || 0) + " 灵石";
  }
  function iconBgStyle(id) {
    const i = MARKET_ICON_IDS.indexOf(id);
    if (i < 0) return "";
    const x = (i % 6) * 20;
    const y = Math.floor(i / 6) * 25;
    return 'background-position:' + x + '% ' + y + '%';
  }
  function iconStyle(id) {
    const bg = iconBgStyle(id);
    return bg ? ' style="' + bg + '"' : "";
  }
  function fallbackText(type, slot) {
    return type === "material" ? "材" : (type === "pill" || type === "breakpill" ? "丹" : (slot === "weapon" ? "武" : (slot === "artifact" ? "宝" : (slot === "outfit" ? "衣" : "器"))));
  }
  function iconImageStyle(id) {
    const url = ICON_IMAGE_URLS[id] || ICON_IMAGE_URLS[ICON_ALIASES[id]];
    return url ? "background-image:url('" + url + "');background-size:contain;background-position:center;background-repeat:no-repeat" : "";
  }
  function itemIconHtml(id, name, opts) {
    opts = opts || {};
    const tag = opts.tag || "span";
    const lookup = ICON_ALIASES[id] || id;
    const imageStyle = iconImageStyle(id);
    const atlasStyle = imageStyle ? "" : iconBgStyle(lookup);
    const style = imageStyle || atlasStyle;
    const cls = "item-icon " + (imageStyle ? "item-icon-image" : "item-icon-atlas") + (opts.className ? " " + opts.className : "");
    const label = esc(name == null ? id : name);
    const aria = opts.decorative ? ' aria-hidden="true"' : ' role="img" aria-label="' + label + '"';
    const fallback = opts.fallback || fallbackText(opts.type, opts.slot);
    return '<' + tag + ' class="' + cls + '"' + aria + (style ? ' style="' + style + '"' : '') + '><span>' + esc(fallback) + '</span></' + tag + '>';
  }
  function iconHtml(row) {
    const slot = row.recipe && row.recipe.slot;
    return itemIconHtml(row.id, row.name, { tag: "div", className: "market-icon", type: row.type, slot });
  }
  function recipes() {
    return (Game.craft && Game.craft.RECIPES) || [];
  }
  function recipeById(id) {
    return recipes().find((r) => r.id === id);
  }
  function bonusText(bonus) {
    if (!bonus || !Game.ATTRS) return "";
    return Game.ATTRS.filter((a) => bonus[a.key]).map((a) => a.name + " +" + bonus[a.key]).join("、");
  }
  function materialIds() {
    const ids = {};
    Object.keys(MATERIAL_PRICES).forEach((k) => { ids[k] = true; });
    recipes().forEach((r) => Object.keys(r.cost || {}).forEach((k) => { ids[k] = true; }));
    if (Game.explore && Array.isArray(Game.explore.ZONES)) {
      Game.explore.ZONES.forEach((z) => (z.drops || []).forEach((d) => { ids[d.key] = true; }));
    }
    return Object.keys(ids);
  }
  function materialPrice(id) {
    return MATERIAL_PRICES[id] || 12;
  }
  function materialCost(recipe) {
    if (!recipe || !recipe.cost) return 0;
    return Object.keys(recipe.cost).reduce((sum, key) => sum + materialPrice(key) * (recipe.cost[key] || 0), 0);
  }
  function sellPrice(row) {
    const buyPrice = typeof row === "number" ? row : (row && row.price);
    const normal = Math.max(1, Math.floor((buyPrice || 0) * SELL_RATE));
    // 材料配方回收至少低于材料进价 1 灵石，杜绝买料制作后倒卖获利。
    const input = row && row.recipe ? materialCost(row.recipe) : 0;
    return input > 0 ? Math.min(normal, Math.max(1, input - 1)) : normal;
  }
  function recipePrice(r) {
    if (!r) return 0;
    if (RECIPE_PRICES[r.id]) return RECIPE_PRICES[r.id];
    const mat = Object.keys(r.cost || {}).reduce((sum, k) => sum + materialPrice(k) * (r.cost[k] || 0), 0);
    const attr = Object.keys(r.bonus || {}).reduce((sum, k) => sum + Math.max(0, r.bonus[k] || 0), 0);
    return Math.max(20, mat + attr * (r.kind === "equip" ? 5 : 4));
  }
  function realmReqOk(req) {
    return (Game.state.realmIndex || 0) >= (req || 0);
  }
  function reqLabel(req) {
    return Game.REALMS && Game.REALMS[req] ? Game.REALMS[req] : "更高境界";
  }
  function fruitOk(recipe) {
    return !recipe.yiguoReq || (Game.yiguo && Game.yiguo.obtained(recipe.yiguoReq));
  }
  function fruitName(recipe) {
    return Game.yiguo && Game.yiguo.nameOf ? Game.yiguo.nameOf(recipe.yiguoReq) : recipe.yiguoReq;
  }
  function canBuy(price, req, recipe) {
    if (!realmReqOk(req)) return { ok: false, why: "需" + reqLabel(req) };
    // 异果资格仍单独校验：果=道基资格，不能只靠灵石绕过。
    if (recipe && !fruitOk(recipe)) return { ok: false, why: "需见过「" + fruitName(recipe) + "」" };
    if ((Game.state.money || 0) < price) return { ok: false, why: "灵石不足" };
    if (recipe && recipe.kind === "equip" && Game.state.gear && Game.state.gear[recipe.id]) return { ok: false, why: "已持有" };
    return { ok: true, why: "买入" };
  }
  function sellCount(row) {
    Game.normalizeState && Game.normalizeState();
    if (row.type === "material") return Game.bagCount ? Game.bagCount(row.id) : ((Game.state.bag && Game.state.bag[row.id]) || 0);
    if (row.type === "pill") return Game.inventoryCount ? Game.inventoryCount(row.id) : ((Game.state.items && Game.state.items[row.id]) || 0);
    if (row.type === "equip") return Game.state.gear && Game.state.gear[row.id] ? 1 : 0;
    return 0;
  }
  function rowsFor(kind, slot) {
    if (kind === "material") {
      return materialIds().map((id) => ({
        type: "material",
        id,
        name: id,
        desc: "探险、炼丹、制武常用材料。",
        req: MATERIAL_REALM_REQ[id] || 0,
        price: materialPrice(id),
        effect: "材料",
      }));
    }
    // 异果武器(yiguoReq)是"把稀有异果果髓沁进剑身"亲手炼的，只在「制武」可炼，不在坊市售卖。
    return recipes().filter((r) => {
      if (r.kind !== kind || r.yiguoReq) return false;
      return !slot || (Game.canonicalGearSlot ? Game.canonicalGearSlot(r.slot) : r.slot) === slot;
    }).map((r) => ({
      type: kind,
      id: r.id,
      name: r.name,
      desc: r.desc,
      req: r.realmReq || 0,
      recipe: r,
      price: recipePrice(r),
      effect: r.kind === "pill" ? "丹药：" + bonusText(r.bonus) : (Game.gearSlotName ? Game.gearSlotName(r.slot) : (r.slotName || "装备")) + "：" + bonusText(r.bonus),
    }));
  }
  function rowHtml(row) {
    const price = row.price;
    const sale = sellPrice(row);
    const owned = sellCount(row);
    const buy = canBuy(price, row.req, row.recipe);
    const realmLocked = !realmReqOk(row.req);
    const fruitLocked = row.recipe && row.recipe.yiguoReq && !fruitOk(row.recipe);
    const tag = (realmLocked ? '<span class="market-req">需' + esc(reqLabel(row.req)) + '</span>' : '') +
      (fruitLocked ? '<span class="market-req">需「' + esc(fruitName(row.recipe)) + '」</span>' : '');
    // 可堆叠物（材料/丹药）给数量滑杆；装备唯一，单买单卖。
    const stackable = row.type === "material" || row.type === "pill";
    const affordable = price > 0 ? Math.floor((Game.state.money || 0) / price) : 0;
    const maxQty = Math.max(1, Math.min(99, Math.max(affordable, owned)));
    const key = row.type + "-" + row.id;
    const slider = (stackable && maxQty > 1)
      ? '    <div class="market-qty"><span class="mq-cap">数量</span>' +
        '<input type="range" class="market-qty-input" id="qs-' + esc(key) + '" min="1" max="' + maxQty + '" value="1" data-type="' + esc(row.type) + '" data-id="' + esc(row.id) + '" data-price="' + price + '" data-sale="' + sale + '">' +
        '<b class="market-qty-lbl" id="ql-' + esc(key) + '">×1</b></div>'
      : '';
    const totSpan = stackable ? '<span class="mkt-tot" id="bt-' + esc(key) + '"></span>' : '';
    const sellTotSpan = stackable ? '<span class="mkt-tot" id="st-' + esc(key) + '"></span>' : '';
    return '<div class="market-row' + (realmLocked ? ' locked' : '') + '">' +
      iconHtml(row) +
      '  <div class="market-main">' +
      '    <div class="market-title"><b>' + (Game.qName ? Game.qName(row.id, esc(row.name)) : esc(row.name)) + '</b>' + tag + '</div>' +
      '    <p>' + esc(row.desc) + '</p>' +
      '    <div class="market-effect">' + esc(row.effect) + '</div>' +
      '    <div class="market-prices">买入 ' + moneyText(price) + ' · 卖出 ' + moneyText(sale) + ' · 持有 ' + owned + '</div>' +
      slider +
      '  </div>' +
      '  <div class="market-actions">' +
      '    <button class="btn btn-gold market-buy" data-type="' + esc(row.type) + '" data-id="' + esc(row.id) + '"' + (buy.ok ? "" : " disabled") + '>' + esc(buy.why) + totSpan + '</button>' +
      '    <button class="btn market-sell" data-type="' + esc(row.type) + '" data-id="' + esc(row.id) + '"' + (owned > 0 ? "" : " disabled") + '>卖出' + sellTotSpan + '</button>' +
      '  </div>' +
      '</div>';
  }
  function sectionHtml(title, kind) {
    const rows = rowsFor(kind);
    return '<section class="market-section">' +
      '  <div class="panel-title">' + title + '</div>' +
      '  <div class="market-list">' + rows.map(rowHtml).join("") + '</div>' +
      '</section>';
  }
  function gearSectionHtml(title, slot) {
    const rows = rowsFor("equip", slot);
    if (!rows.length) return "";
    return '<section class="market-section">' +
      '  <div class="panel-title">' + title + '</div>' +
      '  <div class="market-list">' + rows.map(rowHtml).join("") + '</div>' +
      '</section>';
  }
  function allRows() {
    return rowsFor("material").concat(rowsFor("pill")).concat(rowsFor("equip"));
  }
  function rowBy(type, id) {
    return allRows().find((r) => r.type === type && r.id === id);
  }
  function show(message) {
    Game.normalizeState && Game.normalizeState();
    Game.setZone && Game.setZone("market");
    if (!message && Game.audio && Game.audio.sfx) Game.audio.sfx("market");
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "market" });
    mountEl().innerHTML =
      '<div class="market-screen craft-screen">' +
      '  <button class="btn btn-mini zone-back" id="market-back">退出</button>' +
      '  <div class="craft-head">' +
      '    <div class="wc-tag">坊市 · 灵石</div>' +
      '    <h2>书院坊市</h2>' +
      '    <p class="dim small">材料、丹药、装备都可买卖。同一物品卖出价固定为买入价四成，少六成，防止倒卖刷钱。</p>' +
      '    <div class="market-wallet"><b>' + moneyText(Game.state.money || 0) + '</b><span>当前灵石</span></div>' +
      (message ? '    <div class="hub-note">' + esc(message) + '</div>' : '') +
      '  </div>' +
         sectionHtml("材料铺", "material") +
         sectionHtml("丹药摊", "pill") +
         gearSectionHtml("武器架", "weapon") +
         gearSectionHtml("法宝架", "artifact") +
         gearSectionHtml("衣服铺", "outfit") +
      '</div>';
    mountEl().querySelectorAll(".market-buy").forEach((b) => {
      b.onclick = () => buy(b.dataset.type, b.dataset.id);
    });
    mountEl().querySelectorAll(".market-sell").forEach((b) => {
      b.onclick = () => sell(b.dataset.type, b.dataset.id);
    });
    // 数量滑杆：实时更新 ×N 与买入/卖出总价（用 getElementById 兼容中文 id）。
    mountEl().querySelectorAll(".market-qty-input").forEach((sl) => {
      const refresh = () => {
        const q = Math.max(1, Number(sl.value) || 1);
        const key = sl.dataset.type + "-" + sl.dataset.id;
        const price = Number(sl.dataset.price) || 0, sale = Number(sl.dataset.sale) || 0;
        const lbl = document.getElementById("ql-" + key); if (lbl) lbl.textContent = "×" + q;
        const bt = document.getElementById("bt-" + key); if (bt) bt.textContent = "（×" + q + "·" + (price * q) + "）";
        const st = document.getElementById("st-" + key); if (st) st.textContent = "（×" + q + "·" + (sale * q) + "）";
      };
      sl.oninput = refresh; refresh();
    });
    mountEl().querySelector("#market-back").onclick = () => Game.hub && Game.hub.show();
    if (Game.modal && Game.modal.firstTime) {
      Game.modal.firstTime("market_intro", {
        tag: "坊市初见",
        title: "灵石可换万物，也会被万物换走",
        body: "材料、丹药、装备都能在此买卖。同一物品卖出只得买入价四成，别把刚买来的东西原价倒回去。\n普通买卖只给轻提示；出售装备这类不可逆操作会再问一次。"
      });
    }
  }
  // 读滑杆数量（中文 id 用 getElementById）。装备唯一→恒 1。
  function qtyOf(type, id) {
    if (type === "equip") return 1;
    const sl = document.getElementById("qs-" + type + "-" + id);
    return sl ? Math.max(1, Number(sl.value) || 1) : 1;
  }
  function buy(type, id) {
    const row = rowBy(type, id);
    if (!row) return show("坊市账册里没有此物。");
    const check = canBuy(row.price, row.req, row.recipe);
    if (!check.ok) return show(check.why + "。");
    let qty = qtyOf(type, id);
    if (type !== "equip" && row.price > 0) {
      const affordable = Math.floor((Game.state.money || 0) / row.price);
      qty = Math.max(1, Math.min(qty, affordable));
    }
    const total = row.price * qty;
    if (!Game.spendMoney(total, "坊市买入" + row.name + (qty > 1 ? "×" + qty : ""))) return show("灵石不足。");
    if (type === "material") Game.addItem && Game.addItem(id, qty);
    else if (type === "pill") Game.addInventoryItem && Game.addInventoryItem(id, qty);
    else if (type === "equip") {
      const r = row.recipe;
      Game.addGear && Game.addGear({
        id: r.id,
        name: r.name,
        slot: r.slot,
        slotName: r.slotName,
        bonus: r.bonus,
        images: r.images
      });
    }
    Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("market", "买入" + row.name);
    Game.save && Game.save.write({ view: "market" });
    show("买入" + row.name + (qty > 1 ? " ×" + qty : "") + "，花费 " + moneyText(total) + "。");
  }
  function sell(type, id) {
    const row = rowBy(type, id);
    if (!row) return show("坊市账册里没有此物。");
    const owned = sellCount(row);
    if (owned <= 0) return show("你没有可卖的" + row.name + "。");
    const qty = Math.max(1, Math.min(qtyOf(type, id), owned));
    if (type === "equip" && Game.modal && Game.modal.confirm) {
      return Game.modal.confirm({
        title: "卖出「" + row.name + "」？",
        body: "装备卖出后会从背包移除；若正在装备，也会自动卸下。卖出价为 " + moneyText(sellPrice(row)) + "。",
        confirmText: "卖出",
        cancelText: "留着"
      }, function () { doSell(row, 1); });
    }
    doSell(row, qty);
  }
  function doSell(row, qty) {
    const type = row.type;
    const id = row.id;
    qty = Math.max(1, qty || 1);
    if (type === "material") {
      const cost = {}; cost[id] = qty;
      if (!Game.spendItems(cost)) return show("你没有足够的" + row.name + "。");
    } else if (type === "pill") {
      if (!(Game.spendInventoryItem && Game.spendInventoryItem(id, qty))) return show("你没有足够的" + row.name + "。");
    } else if (type === "equip") {
      qty = 1;
      if (Game.state.equip) {
        Object.keys(Game.state.equip).forEach((slot) => {
          if (Game.state.equip[slot] === id) Game.unequipItem && Game.unequipItem(slot);
        });
      }
      if (Game.state.gear) delete Game.state.gear[id];
    }
    const total = sellPrice(row) * qty;
    Game.gainMoney && Game.gainMoney(total, "坊市卖出" + row.name + (qty > 1 ? "×" + qty : ""));
    Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("market", "卖出" + row.name);
    Game.save && Game.save.write({ view: "market" });
    show("卖出" + row.name + (qty > 1 ? " ×" + qty : "") + "，获得 " + moneyText(total) + "。");
  }

  Game.marketIconStyle = iconBgStyle;
  Game.itemIconHtml = itemIconHtml;
  Game.market = { show, sellPrice, rowsFor };
})(window.Game = window.Game || {});
