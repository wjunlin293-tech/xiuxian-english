/* ───────────────────────────────────────────────────────────────
 * craft.js · 炼丹 / 制武 + 背包
 * R26：丹房器室只负责制作；丹药和装备进背包后再服用/装卸。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const RECIPES = [
    {
      id: "huoxue_powder",
      kind: "pill",
      name: "活血散",
      desc: "以低阶兽骨研末入药，温养气血。",
      cost: { "低阶兽骨": 1 },
      bonus: { hp: 5 }, // 丹药数值减半（用户 2026-06-30）
    },
    {
      id: "ninglu_pill",
      kind: "pill",
      name: "凝露丹",
      desc: "凝露草炼成的小丹，能稳住识海与护体真息。",
      cost: { "凝露草": 1 },
      bonus: { mp: 4, def: 2 }, // 丹药数值减半（用户 2026-06-30）
    },
    {
      id: "guyuan_pill",
      kind: "pill",
      name: "固元丹",
      desc: "玄铁砂炼去燥气，药力沉入血肉，固本护体。",
      realmReq: 1,
      cost: { "玄铁砂": 2 },
      bonus: { hp: 10, def: 3 }, // 丹药数值减半（用户 2026-06-30）
    },
    {
      id: "yunxi_pill",
      kind: "pill",
      name: "蕴息丹",
      desc: "凝言髓与玄铁砂相济，蕴养法海，澄明神识。",
      realmReq: 2,
      cost: { "凝言髓": 1, "玄铁砂": 1 },
      bonus: { mp: 5, sense: 3 }, // 丹药数值减半（用户 2026-06-30）
    },
    // P-33 探险奇遇新材料的丹方（月华露/兽魂晶/古篆残片）·数值占位待 C-05
    {
      id: "yuehua_pill",
      kind: "pill",
      name: "月华丹",
      desc: "月华露和凝露草同炼，清心润识，法海如月下静水。",
      realmReq: 1,
      cost: { "月华露": 1, "凝露草": 1 },
      bonus: { mp: 4, sense: 2 }, // 丹药数值减半（用户 2026-06-30）
    },
    {
      id: "cuigu_pill",
      kind: "pill",
      name: "淬骨丹",
      desc: "兽魂晶引气入骨，淬炼血肉筋脉，气力随之沉实。",
      cost: { "兽魂晶": 1, "低阶兽骨": 1 },
      bonus: { hp: 9, str: 3 }, // 丹药数值减半（用户 2026-06-30）
    },
    {
      id: "tongxuan_pill",
      kind: "pill",
      name: "通玄丹",
      desc: "古篆残片与凝言髓共熬，残篆中的古意尽数沉入神魂。",
      realmReq: 2,
      cost: { "古篆残片": 2, "凝言髓": 1 },
      bonus: { sense: 5 }, // 丹药数值减半（用户 2026-06-30）
    },
    {
      id: "wood_sword",
      kind: "equip",
      slot: "weapon",
      slotName: "武器",
      name: "碎灵木剑",
      desc: "以碎灵木削成的短剑，轻而利，适合藏锋出手。",
      cost: { "碎灵木": 2 },
      bonus: { str: 6 }, // 待用户定：装备属性加成
    },
    {
      id: "iron_talisman",
      kind: "equip",
      slot: "artifact",
      slotName: "法宝",
      name: "寒铁护符",
      desc: "寒铁屑淬成的护符，随身浮游能挡一线杀机，也能稳住法海。",
      cost: { "寒铁屑": 2 },
      bonus: { def: 8, mp: 3 }, // 待用户定：装备属性加成
    },
    {
      id: "qingbu_robe",
      kind: "equip",
      slot: "outfit",
      slotName: "衣服",
      name: "青布行衣",
      desc: "青布重新裁过，袖口束紧，行走山路时比旧衫利落许多。",
      cost: { "凝露草": 1, "低阶兽骨": 1 },
      bonus: { hp: 5, def: 3 },
      images: {
        male: "../素材/主角/player-male-outfit-qingbu.png",
        female: "../素材/主角/player-female-outfit-qingbu.png",
      },
      showcaseImages: {
        male: "../素材/装备/qingbu_robe_showcase_male.png",
        female: "../素材/装备/qingbu_robe_showcase_female.png",
      },
      paperdollImages: {
        male: "../素材/主角/player-male-paperdoll-base.png",
        female: "../素材/主角/player-female-paperdoll-base.png",
      },
    },
    {
      id: "iron_heavy_sword",
      kind: "equip",
      slot: "weapon",
      slotName: "武器",
      name: "玄铁重剑",
      desc: "玄铁砂百炼成锋，剑身无巧，唯有沉重锋芒。",
      realmReq: 1,
      cost: { "玄铁砂": 3 },
      bonus: { str: 12 }, // C-03 保守占位数值
    },
    {
      id: "fruit_wordblade",
      kind: "equip",
      slot: "weapon",
      slotName: "武器",
      name: "异果·言锋",
      desc: "异果果髓沁入剑脊，出锋时如真言破雾。",
      realmReq: 2,
      cost: { "异果果髓": 1, "玄铁砂": 2 },
      bonus: { str: 16, sense: 8 }, // C-03 保守占位数值
    },
    {
      id: "ningyan_jade_talisman",
      kind: "equip",
      slot: "artifact",
      slotName: "法宝",
      name: "凝言玉符",
      desc: "凝言髓铸成的玉质法宝，浮于身侧，兼固法海与神魂。",
      realmReq: 2,
      cost: { "凝言髓": 2 },
      bonus: { def: 12, mp: 6, sense: 4 }, // C-03 保守占位数值
    },
    // 坊市武器图纸（用户 2026-06-30）：无境界门槛，可制可买，丰富器物架选择。数值占位待 C-05。
    {
      id: "qingfeng_sword", kind: "equip", slot: "weapon", slotName: "武器",
      name: "青锋剑", desc: "坊市常见的青锋快剑，剑形轻利，适合初出茅庐者起手。",
      cost: { "寒铁屑": 3 },
      bonus: { str: 9 },
    },
    {
      id: "hanyue_shortblade", kind: "equip", slot: "weapon", slotName: "武器",
      name: "寒月腰刀", desc: "寒铁打成细弯刀，刀脊映月，适合近身藏锋。",
      cost: { "寒铁屑": 2, "月华露": 1 },
      bonus: { str: 8, def: 2 },
    },
    {
      id: "lieshi_axe", kind: "equip", slot: "weapon", slotName: "武器",
      name: "裂石重斧", desc: "玄铁与兽骨同铸的重斧，一斧下去，顽石皆裂。",
      cost: { "玄铁砂": 4, "兽魂晶": 1 },
      bonus: { str: 15, def: 4 },
    },
    {
      id: "mojian_flying_sword", kind: "equip", slot: "weapon", slotName: "武器",
      name: "墨纹飞剑", desc: "古篆残意烙入剑脊，悬身时如一笔墨痕破空。",
      realmReq: 1,
      cost: { "古篆残片": 1, "寒铁屑": 2 },
      bonus: { str: 10, sense: 3 },
    },
    {
      id: "liuyun_talisman", kind: "equip", slot: "artifact", slotName: "法宝",
      name: "流云护符", desc: "月华与古篆温养的护符，气息流转如云，护神固识。",
      cost: { "月华露": 2, "古篆残片": 1 },
      bonus: { mp: 8, sense: 5, def: 4 },
    },
    {
      id: "xuanling_bell", kind: "equip", slot: "artifact", slotName: "法宝",
      name: "玄灵铃", desc: "铃声极轻，却能在杂念将起时先震心湖。",
      realmReq: 1,
      cost: { "月华露": 1, "古篆残片": 1 },
      bonus: { mp: 6, sense: 5 },
    },
    {
      id: "stargaze_astrolabe", kind: "equip", slot: "artifact", slotName: "法宝",
      name: "观星罗盘", desc: "盘上星痕自转，能帮你在纷乱言意里辨出一线方位。",
      realmReq: 2,
      cost: { "古篆残片": 2, "凝言髓": 1 },
      bonus: { mp: 5, sense: 12 },
    },
    {
      id: "xuanwen_robe",
      kind: "equip",
      slot: "outfit",
      slotName: "衣服",
      name: "玄纹法袍",
      desc: "玄纹暗缀衣缘，行气时微有沉光，能护住周身要害。",
      realmReq: 1,
      cost: { "月华露": 1, "玄铁砂": 2, "古篆残片": 1 },
      bonus: { hp: 10, def: 7, sense: 3 },
      images: {
        male: "../素材/主角/player-male-outfit-xuanwen.png",
        female: "../素材/主角/player-female-outfit-xuanwen.png",
      },
      showcaseImages: {
        male: "../素材/装备/xuanwen_robe_showcase_male.png",
        female: "../素材/装备/xuanwen_robe_showcase_female.png",
      },
      paperdollImages: {
        male: "../素材/主角/player-male-paperdoll-base.png",
        female: "../素材/主角/player-female-paperdoll-base.png",
      },
    },
    // 异果武器：yiguoReq=需剧情获得对应异果；P-FRUIT 后不再支持雾岭野外刷果。
    {
      id: "yg_guixu", kind: "equip", slot: "weapon", slotName: "武器",
      name: "归墟 · 照渊", desc: "沧澜归墟果髓沁入剑身，挥锋时识海如渊照物，敌招难藏。",
      realmReq: 2, yiguoReq: "cang_lan_gui_xu",
      cost: { "异果果髓": 1 },
      bonus: { sense: 20, str: 8 },
    },
    {
      id: "yg_fengao", kind: "equip", slot: "weapon", slotName: "武器",
      name: "焚膏 · 沸澜", desc: "不灭焚膏果点燃剑脊，越战越炽，术式如沸澜翻涌。",
      realmReq: 2, yiguoReq: "bu_mie_fen_gao",
      cost: { "异果果髓": 1, "凝言髓": 1 },
      bonus: { mp: 20, str: 10 },
    },
    {
      id: "yg_shihun", kind: "equip", slot: "weapon", slotName: "武器",
      name: "噬魂 · 玄铁", desc: "玄铁噬魂果与玄铁同炼，剑沉如山，攻守俱压一头。",
      realmReq: 2, yiguoReq: "xuan_tie_shi_hun",
      cost: { "异果果髓": 2, "玄铁砂": 2 },
      bonus: { str: 22, def: 12, sense: 6 },
    },
    // 言气炼丹（用户 2026-06-18 拍板）：花"言气"炼丹，作为二破封顶后言气的出路。
    // expCost 递增（每炼一颗 +expStep）防无限刷；数值占位·待 C-05 定稿。
    {
      id: "mana_pill",
      kind: "pill",
      name: "凝神法丹",
      desc: "以参悟之力淬炼，温养法海。",
      cost: {},
      expCost: 300, expStep: 120, // 待用户定：言气消耗与递增
      bonus: { mp: 3 }, // 丹药数值减半（用户 2026-06-30）
    },
    {
      id: "sense_pill",
      kind: "pill",
      name: "明识丹",
      desc: "以参悟之力凝练神魂，照见幽微。",
      cost: {},
      expCost: 300, expStep: 120, // 待用户定：言气消耗与递增
      bonus: { sense: 3 }, // 丹药数值减半（用户 2026-06-30）
    },
    // P-BREAK/C-05：突破丹给 +15% 胜算，明显有用但不替代天劫答题。
    // breakRealm = 适用于"从该境界突破"的丹（与 Game.state.realmIndex 对应）。
    {
      id: "break_pill_qiyan",
      kind: "breakpill",
      name: "破蒙丹",
      desc: "兽骨固本、凝露草宁神，化去初境壅塞，启言之障便多一线可破。服下迎劫，胜算略增。",
      breakRealm: 0, breakBonus: 15,
      realmReq: 0,
      cost: { "低阶兽骨": 2, "凝露草": 2 },
    },
    {
      id: "break_pill_ningyan",
      kind: "breakpill",
      name: "凝真丹",
      desc: "玄铁砂镇魂、古篆残片引言、兽魂晶聚念，三材相济凝出一线破境真机。书院坊市求不得此方，乃机缘所赐。",
      breakRealm: 1, breakBonus: 15,
      realmReq: 1,
      cost: { "玄铁砂": 3, "古篆残片": 1, "兽魂晶": 2 },
    },
  ];

  // 物品品质：demo 只用 白/绿/蓝（用户 2026-07-03：越稀有越少·蓝最少，蓝＝最稀的异果一档）。
  // post-demo 再扩紫/橙/红，异果武器上攀。键＝材料中文名 或 配方 id；缺省 white。
  const ITEM_QUALITY = {
    // 材料：常见白→少量绿→异果果髓蓝
    "碎灵木": "white", "低阶兽骨": "white", "凝露草": "white", "寒铁屑": "white", "玄铁砂": "white", "月华露": "white",
    "兽魂晶": "green", "古篆残片": "green", "凝言髓": "green",
    "异果果髓": "blue",
    // 丹药：基础白→进阶绿
    huoxue_powder: "white", ninglu_pill: "white", guyuan_pill: "white", yuehua_pill: "white", cuigu_pill: "white",
    yunxi_pill: "green", tongxuan_pill: "green", mana_pill: "green", sense_pill: "green",
    break_pill_qiyan: "green", break_pill_ningyan: "green",
    // 装备：入门白→进阶绿→异果武器蓝
    wood_sword: "white", iron_talisman: "white", qingfeng_sword: "white", qingbu_robe: "white", hanyue_shortblade: "white",
    iron_heavy_sword: "green", lieshi_axe: "green", xuanling_bell: "green", mojian_flying_sword: "green",
    ningyan_jade_talisman: "green", liuyun_talisman: "green", xuanwen_robe: "green", stargaze_astrolabe: "green",
    // 蓝严格：demo 只有「异果果髓」一件蓝品（用户 2026-07-12）。异果武器暂压绿，post-demo 扩色再上攀。
    fruit_wordblade: "green", yg_guixu: "green", yg_fengao: "green", yg_shihun: "green",
  };
  function itemQuality(id) {
    if (id == null) return "white";
    if (ITEM_QUALITY[id]) return ITEM_QUALITY[id];
    const r = RECIPES.find((x) => x.id === id);
    return (r && r.quality) || "white";
  }
  // 把物品名包成品质色 span。id 用于查品质，name 为显示名（材料 id 即名）。
  function qName(id, name) {
    return '<span class="q-' + itemQuality(id) + '">' + (name == null ? id : name) + '</span>';
  }
  Game.itemQuality = itemQuality;
  Game.qName = qName;

  let pendingExpCraftId = null;

  function recipeIconType(recipe) {
    if (!recipe) return "material";
    return recipe.kind === "breakpill" ? "pill" : recipe.kind;
  }
  function recipeIconFallback(recipe) {
    if (!recipe) return "材";
    if (recipe.kind === "pill" || recipe.kind === "breakpill") return "丹";
    return recipe.slot === "weapon" ? "武" : (recipe.slot === "artifact" ? "宝" : (recipe.slot === "outfit" ? "衣" : "器"));
  }
  function itemIcon(id, name, opts) {
    opts = opts || {};
    if (Game.itemIconHtml) {
      return Game.itemIconHtml(id, name, {
        className: opts.className || "craft-item-icon",
        type: opts.type || "material",
        slot: opts.slot,
        fallback: opts.fallback || "材",
        decorative: opts.decorative !== false,
      });
    }
    return '<span class="' + (opts.className || "craft-item-icon") + '"><span>' + (opts.fallback || "材") + '</span></span>';
  }
  function itemRef(id, name, opts) {
    opts = opts || {};
    return '<span class="craft-item-ref">' +
      itemIcon(id, name, opts) +
      qName(id, name) +
      '</span>';
  }
  function recipeRef(recipe, cls) {
    return '<span class="craft-recipe-ref' + (cls ? ' ' + cls : '') + '">' +
      itemIcon(recipe.id, recipe.name, {
        className: "craft-item-icon recipe-title-icon",
        type: recipeIconType(recipe),
        slot: recipe.slot,
        fallback: recipeIconFallback(recipe),
      }) +
      qName(recipe.id, recipe.name) +
      '</span>';
  }

  // 言气丹递增成本：用 state.flags.craftCount 记录已炼次数（随存档）
  function craftCount(id) {
    Game.normalizeState && Game.normalizeState();
    const f = Game.state.flags;
    if (!f.craftCount) f.craftCount = {};
    return f.craftCount[id] || 0;
  }
  function bumpCraftCount(id) {
    const f = Game.state.flags;
    if (!f.craftCount) f.craftCount = {};
    f.craftCount[id] = (f.craftCount[id] || 0) + 1;
  }
  function expCostOf(recipe) {
    if (!recipe.expCost) return 0;
    return recipe.expCost + craftCount(recipe.id) * (recipe.expStep || 0);
  }
  function isBeforeFirstBreakthrough() {
    Game.normalizeState && Game.normalizeState();
    return (Game.state.realmIndex || 0) <= 0;
  }
  function expCraftWarning(recipe, expCost) {
    if (!expCost) return "";
    if (isBeforeFirstBreakthrough()) {
      return "首破前炼此丹会消耗言气，可能延后第一次雷劫突破。";
    }
    return "消耗当前言气换取永久属性；适合突破暂缓或言气有余时使用。";
  }

  function mountEl() { return document.getElementById("stage"); }

  // 材料消耗显示为「持有/需要」，持有不足则标红，让玩家一眼看出还差多少。
  function costText(cost) {
    return Object.keys(cost || {}).map((k) => {
      const need = cost[k];
      const have = Game.bagCount ? Game.bagCount(k) : 0;
      const lack = have < need;
      return '<span class="craft-cost-ref">' +
        itemRef(k, k, { className: "craft-item-icon craft-cost-icon", type: "material", fallback: "材" }) +
        ' <span class="cost-count' + (lack ? ' cost-lack' : '') + '">' + have + '/' + need + '</span>' +
        '</span>';
    }).join("、");
  }

  function bonusText(bonus) {
    return Game.ATTRS.filter((a) => bonus && bonus[a.key]).map((a) =>
      a.name + " +" + bonus[a.key]
    ).join("、");
  }

  // P-27 借旧版丹药衰减：同一种丹按已服用次数几何递减(×0.93^次·最低30%)，
  // 几何级数自然封顶≈14.3×首颗，防玩家刷材料狂炼同种丹把属性顶满、绕过背词。
  const PILL_DOSE_DECAY = 0.93, PILL_DOSE_FLOOR = 0.30;
  function pillDoses(id) {
    Game.normalizeState && Game.normalizeState();
    return (Game.state.pillDoses && Game.state.pillDoses[id]) || 0;
  }
  function pillDoseMult(doses) { return Math.max(PILL_DOSE_FLOOR, Math.pow(PILL_DOSE_DECAY, doses || 0)); }
  // P-29 第二重衰减(借旧版 pillPotency)：境界越高·单颗丹越弱(趁早炼)，最低 40%。
  // 顺带中和 P-26 凝言境经验偏多→炼丹堆属性偏快。
  function pillPotency() {
    Game.normalizeState && Game.normalizeState();
    return Math.max(0.4, 1 - (Game.state.realmIndex || 0) * 0.06);
  }
  function pillEffMult(id) { return pillDoseMult(pillDoses(id)) * pillPotency(); }
  function scaleBonus(bonus, mult) {
    const out = {};
    Object.keys(bonus || {}).forEach((k) => { const v = Math.round((bonus[k] || 0) * mult); if (v) out[k] = v; });
    return out;
  }

  // 炼丹/制武耗时（越高级越久）：以境界门槛 realmReq 定档——0→1月、1→2月、2→3月；
  // 突破丹、异果武器更费工各 +1 月。可用 recipe.craftMonths 显式覆盖。数值占位待 C-05 微调。
  function craftMonths(recipe) {
    if (!recipe) return 1;
    if (typeof recipe.craftMonths === "number") return Math.max(0, recipe.craftMonths);
    let m = 1 + (recipe.realmReq || 0);
    if (recipe.kind === "breakpill") m += 1;
    if (recipe.yiguoReq) m += 1;
    return m;
  }

  // 炼制成功后统一结算耗时：推进月份→存档→寿元守卫。返回 true 表示寿元已尽（调用方应 return）。
  function advanceCraftTime(recipe) {
    const months = craftMonths(recipe);
    if (months > 0 && Game.time && Game.time.advanceMonths) Game.time.advanceMonths(months);
    Game.worldFeel && Game.worldFeel.recordAction && Game.worldFeel.recordAction("craft", recipe && recipe.name);
    Game.save && Game.save.write({ view: "craft" });
    Game.renderHeader && Game.renderHeader();
    if (months > 0 && Game.life && Game.life.guard &&
        Game.life.guard("炼制" + recipe.name + "耗时 " + months + " 月，寿元已尽。")) return true;
    return false;
  }

  function slotRows() {
    Game.normalizeState && Game.normalizeState();
    const slots = [
      { key: "outfit", name: "衣服", empty: "默认布衣", hint: "基础布衣；后续衣服会在这里换装" },
      { key: "artifact", name: "法宝", empty: "未携法宝", hint: "可装备后获得加成" },
      { key: "weapon", name: "武器" },
    ];
    return slots.map((slot) => {
      const itemId = Game.state.equip[slot.key];
      const item = itemId ? Game.state.gear[itemId] : null;
      return '<div class="equip-row">' +
        '<span>' + slot.name + '</span>' +
        '<b>' + (item ? qName(item.id, item.name) : (slot.empty || "未装备")) + '</b>' +
        (item ? '<em>' + bonusText(item.bonus) + '</em>' : '<em>' + (slot.hint || "可装备后获得加成") + '</em>') +
        (item ? '<button class="btn btn-mini inv-unequip" data-slot="' + slot.key + '">卸 下</button>' : '') +
        '</div>';
    }).join("");
  }

  function recipeCard(recipe) {
    Game.normalizeState && Game.normalizeState();
    const hasMat = Object.keys(recipe.cost || {}).length > 0;
    const enough = !hasMat || Game.canAfford(recipe.cost);
    const expCost = expCostOf(recipe);
    const expOk = !expCost || Game.state.exp >= expCost;
    const owned = recipe.kind === "equip" && Game.state.gear[recipe.id];
    const realmOk = Game.state.realmIndex >= (recipe.realmReq || 0);
    const fruitOk = !recipe.yiguoReq || (Game.yiguo && Game.yiguo.obtained(recipe.yiguoReq));
    const affordable = enough && expOk && realmOk;
    const isPillLike = recipe.kind === "pill" || recipe.kind === "breakpill";
    const disabled = isPillLike ? !affordable : (owned || !enough || !realmOk || !fruitOk);
    const equipTag = recipe.slot === "outfit" ? "制衣" : (recipe.slot === "artifact" ? "制器" : "制武");
    const tag = recipe.kind === "breakpill" ? "炼丹 · 破境" : (recipe.kind === "pill" ? (expCost ? "炼丹 · 言气" : "炼丹") : equipTag);
    let why = isPillLike ? "炼制入包" : "制作入包";
    if (!realmOk) why = (Game.REALMS[recipe.realmReq] || "更高境界") + "解锁";
    else if (!fruitOk) why = "需「" + (Game.yiguo ? Game.yiguo.nameOf(recipe.yiguoReq) : recipe.yiguoReq) + "」";
    else if (!enough) why = "材料不足";
    else if (!expOk) why = "言气不足";
    if (owned) why = "已在背包";
    if (expCost && expOk && isBeforeFirstBreakthrough() && pendingExpCraftId === recipe.id) {
      why = "确认炼制";
    }
    // 消耗行：材料 + 言气（任一存在则显示）
    const costParts = [];
    if (hasMat) costParts.push(costText(recipe.cost));
    if (expCost) costParts.push("言气 ×" + expCost);
    return '<div class="recipe-card ' + (disabled ? 'disabled' : '') + '">' +
      '  <div class="recipe-top"><span>' + tag + '</span><b>' + recipeRef(recipe) + '</b></div>' +
      '  <p>' + recipe.desc + '</p>' +
      '  <div class="recipe-line">消耗：' + (costParts.join("、") || "无") + '</div>' +
      '  <div class="recipe-line">效果：' + (recipe.kind === "breakpill" ? ("突破概率 +" + (recipe.breakBonus || 0) + "%（" + (Game.REALMS[recipe.breakRealm] || "本境") + "突破当次生效）") : bonusText(recipe.bonus)) + '</div>' +
      (recipe.kind === "equip" ? '  <div class="recipe-line">槽位：' + recipe.slotName + '</div>' : '') +
      '  <div class="recipe-line">耗时：' + craftMonths(recipe) + ' 月</div>' +
      (expCost ? '  <div class="recipe-warning">' + expCraftWarning(recipe, expCost) + '</div>' : '') +
      '  <div class="recipe-line">产出：' + recipeRef(recipe, "craft-output-ref") + ' ×1（入背包）</div>' +
      '  <button class="btn btn-gold craft-do" data-id="' + recipe.id + '"' + (disabled ? ' disabled' : '') + '>' + why + '</button>' +
      '</div>';
  }

  function show(message) {
    Game.normalizeState && Game.normalizeState();
    Game.setZone && Game.setZone("alchemy");
    if (!message && Game.audio && Game.audio.sfx) Game.audio.sfx("alchemy");
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "craft" });
    const matPills = RECIPES.filter((r) => r.kind === "pill" && !r.expCost).map(recipeCard).join("");
    const expPills = RECIPES.filter((r) => r.kind === "pill" && r.expCost).map(recipeCard).join("");
    const breakPills = RECIPES.filter((r) => r.kind === "breakpill").map(recipeCard).join("");
    const equips = RECIPES.filter((r) => r.kind === "equip").map(recipeCard).join("");
    mountEl().innerHTML =
      '<div class="craft-screen">' +
      '  <button class="btn btn-mini zone-back" id="craft-back">退出</button>' +
      '  <div class="craft-head">' +
      '    <div class="wc-tag">丹房 · 器室</div>' +
      '    <h2>炼丹 / 制武</h2>' +
      '    <p class="dim small">这里统一炼丹与制武；制作完成后先收入背包，再去背包服用丹药或装卸装备。</p>' +
      (message ? '    <div class="hub-note">' + message + '</div>' : '') +
      '  </div>' +
      '  <section class="craft-grid">' +
      '    <div class="craft-panel">' +
      '      <div class="panel-title">背包材料</div>' +
      '      <div class="bag-list">' + Game.explore.bagSummary() + '</div>' +
      '      <button class="btn btn-gold craft-bag-btn" id="craft-inventory">打开背包</button>' +
      '      <div class="craft-radar">' + Game.radar.radarSVG(220) + '</div>' +
      '    </div>' +
      '    <div class="craft-panel">' +
      '      <div class="panel-title">炼丹 · 材料</div>' +
      '      <div class="recipe-list">' + matPills + '</div>' +
      '      <div class="panel-title recipe-title">炼丹 · 言气（封顶后言气出路）</div>' +
      '      <div class="recipe-list">' + expPills + '</div>' +
      (breakPills ? '      <div class="panel-title recipe-title">炼丹 · 破境（突破天劫提概率）</div>' +
      '      <div class="recipe-list">' + breakPills + '</div>' : '') +
      '      <div class="panel-title recipe-title">制衣 / 制器 / 制武</div>' +
      '      <div class="recipe-list">' + equips + '</div>' +
      '    </div>' +
      '  </section>' +
      '</div>';
    mountEl().querySelectorAll(".craft-do").forEach((b) => {
      b.onclick = () => craft(b.dataset.id);
    });
    mountEl().querySelector("#craft-inventory").onclick = () => showInventory();
    mountEl().querySelector("#craft-back").onclick = () => Game.hub.show();
  }

  function byId(id) {
    return RECIPES.find((r) => r.id === id);
  }

  function emptyInventory(text) {
    return '<div class="empty-line dim small">' + text + '</div>';
  }

  function pillRows() {
    Game.normalizeState && Game.normalizeState();
    const rows = RECIPES.filter((r) => r.kind === "pill" && Game.inventoryCount(r.id) > 0).map((r) => {
      const doses = pillDoses(r.id);
      const mult = pillEffMult(r.id);
      const eff = scaleBonus(r.bonus, mult);
      const note = (doses || mult < 0.999) ? '（药效 ' + Math.round(mult * 100) + '%' + (doses ? '·已服 ' + doses + ' 次' : '') + '）' : '';
      return '<div class="inv-card">' +
        '  <div class="inv-top"><b>' + recipeRef(r) + '</b><span>×' + Game.inventoryCount(r.id) + '</span></div>' +
        '  <p>' + r.desc + '</p>' +
        '  <div class="recipe-line">下一颗：永久获得 ' + (bonusText(eff) || "药力已散") + note + '</div>' +
        '  <button class="btn btn-gold inv-use" data-id="' + r.id + '">服 用</button>' +
        '</div>';
    }).join("");
    return rows || emptyInventory("暂无丹药。去丹房炼制后会收入这里。");
  }

  function gearRows() {
    Game.normalizeState && Game.normalizeState();
    const ids = Object.keys(Game.state.gear || {});
    const rows = ids.map((id) => {
      const item = Game.state.gear[id];
      item.slot = Game.canonicalGearSlot ? Game.canonicalGearSlot(item.slot) : item.slot;
      item.slotName = Game.gearSlotName ? Game.gearSlotName(item.slot) : (item.slotName || "装备");
      const equipped = Game.state.equip[item.slot] === id;
      return '<div class="inv-card inv-gear-card' + (equipped ? ' equipped' : '') + '">' +
        '  <div class="inv-top"><b>' + itemRef(item.id, item.name, { className: "craft-item-icon recipe-title-icon", type: "equip", slot: item.slot, fallback: recipeIconFallback(item) }) + '</b><span>' + (equipped ? "已装备" : (item.slotName || "装备")) + '</span></div>' +
        '  <p>' + bonusText(item.bonus) + '</p>' +
        (equipped
          ? '  <button class="btn btn-mini inv-unequip" data-slot="' + item.slot + '">卸 下</button>'
          : '  <button class="btn btn-gold inv-equip" data-id="' + id + '">装 备</button>') +
        '</div>';
    }).join("");
    return rows || emptyInventory("暂无装备。去器室制武后会收入这里。");
  }

  function showInventory(message) {
    Game.normalizeState && Game.normalizeState();
    Game.setZone && Game.setZone(null);
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "inventory" });
    const gearChanged = /已披挂|已卸下/.test(String(message || ""));
    mountEl().innerHTML =
      '<div class="craft-screen inventory-screen' + (gearChanged ? ' gear-swap-feedback' : '') + '">' +
      '  <button class="btn btn-mini zone-back" id="inv-back">退出</button>' +
      '  <div class="craft-head">' +
      '    <div class="wc-tag">背包 · 丹药与装备</div>' +
      '    <h2>背包</h2>' +
      '    <p class="dim small">材料用于炼丹制武；丹药在这里服用，装备在这里装卸。</p>' +
      (message ? '    <div class="hub-note">' + message + '</div>' : '') +
      '  </div>' +
      '  <section class="craft-grid">' +
      '    <div class="craft-panel">' +
      '      <div class="panel-title">材料</div>' +
      '      <div class="bag-list">' + Game.explore.bagSummary() + '</div>' +
      '      <div class="panel-title equip-title">装备栏</div>' +
      // 立绘随装/卸即时显形（武器/法宝/衣服层）：showInventory 在装卸后整屏重渲，立绘随之实时更新。
      (Game.hub && Game.hub.avatarPanelHtml ? '      <div class="inv-avatar">' + Game.hub.avatarPanelHtml() + '</div>' : '') +
      '      <div class="equip-list">' + slotRows() + '</div>' +
      '      <div class="craft-radar">' + Game.radar.radarSVG(220) + '</div>' +
      '    </div>' +
      '    <div class="craft-panel">' +
      '      <div class="panel-title">丹药</div>' +
      '      <div class="inventory-list">' + pillRows() + '</div>' +
      '      <div class="panel-title recipe-title">装备背包</div>' +
      '      <div class="inventory-list">' + gearRows() + '</div>' +
      '    </div>' +
      '  </section>' +
      '  <div class="craft-footer">' +
      '    <button class="btn btn-mini" id="inv-craft">去炼丹 / 制武</button>' +
      '  </div>' +
      '</div>';
    mountEl().querySelectorAll(".inv-use").forEach((b) => {
      b.onclick = () => usePill(b.dataset.id);
    });
    mountEl().querySelectorAll(".inv-equip").forEach((b) => {
      b.onclick = () => equipFromInventory(b.dataset.id);
    });
    mountEl().querySelectorAll(".inv-unequip").forEach((b) => {
      b.onclick = () => unequipFromInventory(b.dataset.slot);
    });
    mountEl().querySelector("#inv-craft").onclick = () => show();
    mountEl().querySelector("#inv-back").onclick = () => Game.hub.show();
    // 背包里的立绘也支持点击/Enter/Space 放大看外观（复用 hub 绑定）。
    Game.hub && Game.hub.bindAvatarPreview && Game.hub.bindAvatarPreview(mountEl());
  }

  function usePill(id) {
    const recipe = byId(id);
    if (!recipe || recipe.kind !== "pill") return;
    if (!Game.spendInventoryItem(id, 1)) {
      showInventory("背包中没有" + recipe.name + "。");
      return;
    }
    const doses = pillDoses(id);
    const mult = pillEffMult(id);
    const eff = scaleBonus(recipe.bonus, mult);
    Game.applyAttrBonus(eff);
    Game.state.pillDoses = Game.state.pillDoses || {};
    Game.state.pillDoses[id] = doses + 1;
    Game.save && Game.save.write({ view: "inventory" });
    showInventory("服下" + recipe.name + "，" + (bonusText(eff) || "药力已散") +
      "（药效 " + Math.round(mult * 100) + "%" + (doses ? "·已服 " + doses + " 次" : "") + "）。");
  }

  function equipFromInventory(id) {
    const item = Game.state.gear[id];
    if (!item) return;
    const slot = Game.canonicalGearSlot ? Game.canonicalGearSlot(item.slot) : item.slot;
    Game.equipItem(slot, id);
    Game.save && Game.save.write({ view: "inventory" });
    Game.hub && Game.hub.preloadAvatarAssets && Game.hub.preloadAvatarAssets();
    showInventory("已披挂「" + item.name + "」，立绘已同步显形；" + bonusText(item.bonus) + "。");
  }

  function unequipFromInventory(slot) {
    const itemId = Game.state.equip[slot];
    const item = itemId && Game.state.gear[itemId];
    Game.unequipItem(slot);
    Game.save && Game.save.write({ view: "inventory" });
    Game.hub && Game.hub.preloadAvatarAssets && Game.hub.preloadAvatarAssets();
    showInventory("「" + (item ? item.name : "装备") + "」已卸下，立绘已同步收起。");
  }

  function craft(id) {
    const recipe = byId(id);
    if (!recipe) return;
    if (recipe.kind === "pill" || recipe.kind === "breakpill") {
      const expCost = expCostOf(recipe);
      if (expCost && Game.state.exp < expCost) {
        pendingExpCraftId = null;
        show("言气不足，无法炼制" + recipe.name + "。");
        return;
      }
      if (expCost && isBeforeFirstBreakthrough() && pendingExpCraftId !== recipe.id) {
        pendingExpCraftId = recipe.id;
        show("首破前炼制" + recipe.name + "会消耗言气 " + expCost + "，可能延后第一次雷劫。若仍要炼，请再点一次确认。");
        return;
      }
      if (!Game.spendItems(recipe.cost)) { // 空 cost 时恒为 true，不影响言气丹
        pendingExpCraftId = null;
        show("材料不足，无法炼制" + recipe.name + "。");
        return;
      }
      if (expCost) Game.spendExp(expCost);
      Game.addInventoryItem(recipe.id, 1);
      Game.audio && Game.audio.sfx && Game.audio.sfx("forge");
      if (recipe.expCost) bumpCraftCount(recipe.id); // 仅言气丹递增成本
      pendingExpCraftId = null;
      const months = craftMonths(recipe);
      if (advanceCraftTime(recipe)) return; // 寿元已尽则中止
      show("炼成" + recipe.name + "，已收入背包（耗时 " + months + " 月" +
        (expCost ? "、耗言气 " + expCost : "") + "）。");
      return;
    }

    if (Game.state.gear[recipe.id]) {
      pendingExpCraftId = null;
      show(recipe.name + "已在背包。");
      return;
    }
    if (!Game.spendItems(recipe.cost)) {
      pendingExpCraftId = null;
      show("材料不足，无法制作" + recipe.name + "。");
      return;
    }
    Game.addGear({
      id: recipe.id,
      name: recipe.name,
      slot: Game.canonicalGearSlot ? Game.canonicalGearSlot(recipe.slot) : recipe.slot,
      slotName: Game.gearSlotName ? Game.gearSlotName(recipe.slot) : recipe.slotName,
      bonus: recipe.bonus,
    });
    pendingExpCraftId = null;
    const months = craftMonths(recipe);
    if (advanceCraftTime(recipe)) return; // 寿元已尽则中止
    show("制成" + recipe.name + "，已收入背包（耗时 " + months + " 月）。");
  }

  // P-BREAK：取适用于"从 realmIndex 突破"的突破丹配方（供天劫流程检测/消耗）。
  function breakPillRecipe(realmIndex) {
    return RECIPES.find((r) => r.kind === "breakpill" && r.breakRealm === realmIndex) || null;
  }
  Game.craft = { RECIPES, show, showInventory, breakPillRecipe };
})(window.Game = window.Game || {});
