/* ───────────────────────────────────────────────────────────────
 * relations.js · P-CAST 人物谱 / 情谊 / 结缘底座
 * 人物是否相逢：state.relations 中存在 id。
 * 情谊满值：100；后续剧情可触发 Game.joinRelation(id) 缔结/义结。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const RECRUIT_AFFINITY = 100;

  const CHARACTERS = {
    pei_zhao: {
      name: "裴昭",
      title: "裴氏旁支 · 退婚的青梅",
      icon: "昭",
      art: "../素材/人物/pei-zhao.png",
      slot: "old_betrothal",
      avatar: "male",
      bondType: "道侣",
      appearance: "素衣利落，鬓边常压一枚旧银簪；眼神清亮，像一柄未出鞘的短剑。",
      personality: "嘴硬心细，不爱卖惨；认定的事会自己扛到底。",
      voice: "“我不求你替我赢谁。你若真要赢，先别输给自己。”",
      relation: "主角旧识。退婚后仍保持距离地关照主角，是早期情感线与裴氏线的主要支点。",
      perk: "锦书暗度",
      perkDesc: "后续可做成剧情提示/风险预警类能力：重要节点前给出一条偏人情或立场的提醒。",
      joined: "裴昭把旧银簪压在案上，说：‘这次不是裴家替我选，是我自己选。’"
    },
    pei_yan: {
      name: "裴晏",
      title: "裴氏旁支 · 退婚的竹马",
      icon: "晏",
      art: "../素材/人物/pei-yan.png",
      slot: "old_betrothal",
      avatar: "female",
      bondType: "道侣",
      appearance: "月白长袍总束得很齐，腰间压着半枚旧玉；说话前常先退半步，像连靠近都要问过分寸。",
      personality: "守礼、克制，做事先留退路。歉意不挂在嘴边，更多是把风险提前挡开，把能用的线索放到你手边。",
      voice: "“我不求你立刻信我。你往前走时，我至少能替你看住身后一盏灯。”",
      relation: "主角旧识。退婚后仍保持距离地关照主角，是女侠路线早期情感线与裴氏线的主要支点。",
      perk: "锦书暗度",
      perkDesc: "后续可做成剧情提示/风险预警类能力：重要节点前给出一条偏人情或立场的提醒。",
      joined: "裴晏把半枚旧玉压在案上，说：‘这次不是裴家替我选，是我自己选。’"
    },
    pei_zhaolin: {
      name: "裴照临",
      title: "裴氏嫡子 · 三年之约的对手",
      icon: "照",
      art: "../素材/人物/pei-zhaolin.png",
      bondType: "宿敌",
      appearance: "月白锦袍，玉立人群之前；眉目疏淡，像从来不必向谁解释自己的高处。",
      personality: "自持、骄傲、重体面。未必全然恶毒，但习惯把旁人的命运看作可以安排的事。",
      voice: "“你若不服，三年后，来问言台。”",
      relation: "序章中与你立下三年之约的人。当前认知里，他是裴氏压力、退婚羞辱和院试终局的正面象征。",
      perk: "三年之约",
      perkDesc: "宿敌线暂不提供结缘能力；他主要作为压力、目标和后续裴氏线入口存在。",
      joined: ""
    },
    long_bo: {
      name: "聋伯",
      title: "灶房老人 · 半聋半醒",
      icon: "灶",
      art: "../素材/人物/long-bo.png",
      bondType: "义结",
      appearance: "灰布短褂，袖口常沾柴灰；耳背却总能听见最要紧的一句话。",
      personality: "慢、稳、护短。嘴上嫌你添乱，手里已经把热粥推过来。",
      voice: "“别急。火候不到，米再好也夹生。”",
      relation: "书院灶房老人。前期生活感、庇护感和底层见闻的来源。",
      perk: "灶火不灭",
      perkDesc: "后续可做成轻度保底能力：失败/濒危后给一次恢复或降低惩罚。",
      joined: "聋伯把灶火拨亮，只说：‘往后饿了，来这儿。别管别人认不认你，我认。’"
    },
    er_liang: {
      name: "二两",
      title: "小乞儿 · 嘴甜腿快",
      icon: "两",
      art: "../素材/人物/er-liang.png",
      bondType: "义结",
      appearance: "衣衫补丁很多，眼睛却亮；跑起来像巷口一阵风。",
      personality: "机灵、贪吃、讲义气。怕死，但更怕欠人情。",
      voice: "“哥，话先说好，跑路我第一，回来也第一。”",
      relation: "街巷线伙伴。适合承接市井消息、逃亡分支与前世鬼魂式循环提示。",
      perk: "巷尾耳报",
      perkDesc: "后续可做成探索情报能力：进入部分事件前揭示一个收益/危险倾向。",
      joined: "二两把半块糖塞给你：‘以后你有难我先跑——跑去喊人。’"
    },
    qin_fuzi: {
      name: "秦夫子",
      title: "书院夫子 · 刀子嘴戒尺心",
      icon: "秦",
      art: "../素材/人物/qin-fuzi.png",
      bondType: "师友",
      appearance: "青衫洗得发白，戒尺从不离手；写字时腕骨很稳。",
      personality: "严厉、清醒、重规矩，但不会把弱者推给规矩送死。",
      voice: "“天资不足不是罪，明知不足还糊弄，才是。”",
      relation: "书院教学线核心人物。承担世界规则、修行代价和学习压力的解释。",
      perk: "戒尺点心",
      perkDesc: "后续可做成学习增益：复习失败后的损失降低，或错题更快进入有效复习。",
      joined: "秦夫子把戒尺横在掌心：‘从今日起，我不只教你识字，也教你别被字吃了。’"
    },
    a_shuang: {
      name: "阿霜",
      title: "演武药庐 · 孤剑少女",
      icon: "霜",
      art: "../素材/人物/a-shuang.png",
      slot: "frost_sword",
      avatar: "male",
      bondType: "道侣",
      appearance: "常穿浅青药衣，袖口束得很紧；练剑时眉眼锋利，收剑后指尖却有淡淡药香。",
      personality: "冷面、倔强、护短。她不爱安慰人，却总能看见别人硬撑到快断的那一刻。",
      voice: "“疼就说疼。修仙不是把自己熬成石头。”",
      relation: "演武场与药庐线人物。demo 只是一眼相逢，后续可连接寿元、丹药、疗伤、剑伤与温柔支线。",
      perk: "药香留脉",
      perkDesc: "后续可做成恢复/丹药能力：丹药副作用降低，或战后回复增强。",
      joined: "阿霜替你系紧药囊：‘别弄丢。药可以再配，人不能总靠命硬。’"
    },
    han_shuang: {
      name: "韩霜",
      title: "演武药庐 · 孤剑少年",
      icon: "霜",
      art: "../素材/人物/han-shuang.png",
      slot: "frost_sword",
      avatar: "female",
      bondType: "道侣",
      appearance: "浅青药衣束得干净，腕上缠着护具；药囊系在左侧，剑却压在右手最顺的位置。",
      personality: "沉默、硬直、护短。很少安慰人，先看伤口、先递药，再用一句短话把人从逞强里拉回来。",
      voice: "“别硬撑。伤口不会因为你不认，就自己合上。”",
      relation: "演武场与药庐线人物。demo 只是一眼相逢，后续可连接寿元、丹药、疗伤、剑伤与温柔支线。",
      perk: "药香留脉",
      perkDesc: "后续可做成恢复/丹药能力：丹药副作用降低，或战后回复增强。",
      joined: "韩霜替你系紧药囊：‘别弄丢。药可以再配，人不能总靠命硬。’"
    },
    mystery_woman: {
      name: "？？？",
      knownName: "神秘女子",
      title: "藏言楼残页 · 惊鸿一瞥",
      icon: "？",
      art: "../素材/人物/mystery-woman.png",
      bondType: "未明",
      hidden: true,
      appearance: "一袭玄衣掠过灯影，发间像落着一线霜白。",
      personality: "目的未明。她似乎比任何人都更早知道残页的危险。",
      voice: "“这页东西，不该这么早落到你手里。”",
      relation: "与异果、藏言楼残页和后续大线有关；demo 阶段只保留悬念。",
      perk: "未解残页",
      perkDesc: "后续解锁。"
    }
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function avatarGender() {
    return Game.state && Game.state.avatar && Game.state.avatar.gender === "female" ? "female" : "male";
  }

  function resolveId(id) {
    const c = CHARACTERS[id];
    if (!c || !c.slot) return id;
    const gender = avatarGender();
    const match = Object.keys(CHARACTERS).find((key) => {
      const item = CHARACTERS[key];
      return item && item.slot === c.slot && item.avatar === gender;
    });
    return match || id;
  }

  function visibleCharacterIds() {
    const gender = avatarGender();
    return Object.keys(CHARACTERS).filter((id) => {
      const c = CHARACTERS[id];
      return !c.slot || c.avatar === gender;
    });
  }

  function store() {
    Game.normalizeState && Game.normalizeState();
    return Game.state.relations || (Game.state.relations = {});
  }

  function displayName(id) {
    id = resolveId(id);
    const c = CHARACTERS[id];
    return c ? (c.knownName || c.name) : id;
  }

  function currentMonth() {
    const t = (Game.state && Game.state.time) || { year: 1, month: 1 };
    return (Math.max(1, Number(t.year) || 1) - 1) * 12 + Math.max(1, Number(t.month) || 1);
  }

  function monthLabel(month) {
    const n = Math.max(1, Math.round(Number(month) || currentMonth()));
    const time = { year: Math.floor((n - 1) / 12) + 1, month: ((n - 1) % 12) + 1 };
    return Game.time && Game.time.ageLabel ? Game.time.ageLabel(time) : "第" + time.year + "年" + time.month + "月";
  }

  function logStore() {
    Game.normalizeState && Game.normalizeState();
    return Game.state.relationLog || (Game.state.relationLog = {});
  }

  function relationLogs(id) {
    const logs = logStore();
    if (!Array.isArray(logs[id])) logs[id] = [];
    return logs[id];
  }

  function pushRelationLog(id, text, type) {
    id = resolveId(id);
    if (!CHARACTERS[id] || !text) return;
    const logs = relationLogs(id);
    const month = currentMonth();
    const last = logs[logs.length - 1];
    if (last && last.text === text && Number(last.month) === month) return;
    logs.push({ text: text, month: month, type: type || "note" });
    if (logs.length > 12) logs.splice(0, logs.length - 12);
  }

  function isKnown(id) {
    id = resolveId(id);
    const rel = store();
    return Object.prototype.hasOwnProperty.call(rel, id);
  }

  function meetCharacter(id) {
    id = resolveId(id);
    if (!CHARACTERS[id]) return false;
    const rel = store();
    if (!Object.prototype.hasOwnProperty.call(rel, id)) {
      rel[id] = 0;
      pushRelationLog(id, "初见：" + displayName(id) + "在你的因果簿中留下第一道痕迹。", "meet");
    }
    return true;
  }

  function affinityOf(id) {
    id = resolveId(id);
    const rel = store();
    return Math.max(0, Math.min(100, Number(rel[id]) || 0));
  }

  function affinityCopy(id, delta, next, reason) {
    const c = CHARACTERS[id];
    const name = c ? (c.hidden && !isKnown(id) ? c.name : (c.knownName || c.name)) : id;
    const n = Math.abs(Number(delta) || 0);
    if (reason) return reason;
    if (delta > 0) return name + "对你的情谊加深了（+" + n + "，当前 " + next + "/" + RECRUIT_AFFINITY + "）。";
    if (delta < 0) return name + "与你的距离更远了（-" + n + "，当前 " + next + "/" + RECRUIT_AFFINITY + "）。";
    return "你与" + name + "相逢了。";
  }

  function addAffinity(id, delta, opts) {
    id = resolveId(id);
    if (!meetCharacter(id)) return 0;
    opts = opts || {};
    const before = affinityOf(id);
    const next = Math.max(0, Math.min(RECRUIT_AFFINITY, before + (Number(delta) || 0)));
    store()[id] = next;
    if ((Number(delta) || 0) !== 0) {
      pushRelationLog(id, (opts.text || affinityCopy(id, Number(delta) || 0, next, "")), Number(delta) > 0 ? "up" : "down");
    }
    if ((Number(delta) || 0) !== 0 && Game.logEvent) {
      Game.logEvent(affinityCopy(id, Number(delta) || 0, next, opts.text));
    }
    return next;
  }

  function joinRelation(id) {
    id = resolveId(id);
    if (!meetCharacter(id) || affinityOf(id) < RECRUIT_AFFINITY) return false;
    if (!Array.isArray(Game.state.daolv)) Game.state.daolv = [];
    if (!Game.state.daolv.includes(id)) {
      Game.state.daolv.push(id);
      const c = CHARACTERS[id];
      if (Game.logEvent) Game.logEvent((c.knownName || c.name) + "已与你" + (c.bondType === "义结" ? "义结" : "缔结") + "。");
      pushRelationLog(id, (c.knownName || c.name) + "与你" + (c.bondType === "义结" ? "义结" : "缔结") + "。", "bond");
    }
    return true;
  }

  function knownIds() {
    const visible = new Set(visibleCharacterIds());
    return Object.keys(store()).filter((id) => CHARACTERS[id] && visible.has(id));
  }

  function markKnown(id) {
    id = resolveId(id);
    if (CHARACTERS[id]) meetCharacter(id);
  }

  function syncKnownFromStoryProgress() {
    Game.normalizeState && Game.normalizeState();
    const f = Game.state.flags || {};
    const done = f.storyDone || {};
    const storyIndex = Number(f.storyIndex) || 0;
    const hasDone = (id) => !!done[id];

    // 兼容旧存档：只要序章已经推进/完成，就说明玩家已经见过裴昭与裴照临。
    if (f.demoStoryDone || hasDone("demo_pure") || storyIndex > 0) {
      markKnown("pei_zhao");
      markKnown("pei_zhaolin");
    }
    if (hasDone("node_kitchen") || storyIndex > 1) {
      markKnown("long_bo");
      markKnown("er_liang");
    }
    if (f.towerBond || hasDone("node_tower_whisper") && f.towerChoice === "bond") {
      markKnown("mystery_woman");
    }
    if (f.baozhao_route || hasDone("node_wall") || hasDone("node_pei_gift") || storyIndex > 4) {
      markKnown("pei_zhao");
    }
    if (hasDone("node_evil_rumor") || storyIndex > 6) {
      markKnown("qin_fuzi");
    }
    if (hasDone("node_erliang_errand") || f.mist_with === "er_liang") {
      markKnown("er_liang");
    }
    if (f.ashuang_glimpse || hasDone("node_eve_of_vow") || storyIndex > 10) {
      markKnown("a_shuang");
    }
  }

  function statusText(id) {
    id = resolveId(id);
    const c = CHARACTERS[id];
    if (!isKnown(id)) return "尚未相逢";
    if ((Game.state.daolv || []).includes(id)) return c.bondType === "义结" ? "已义结" : "已结缘";
    const v = affinityOf(id);
    if (v >= RECRUIT_AFFINITY) return "情谊已满 · 可缔结";
    if (v >= 60) return "情谊深厚 · " + v + "/" + RECRUIT_AFFINITY;
    if (v >= 25) return "渐有交情 · " + v + "/" + RECRUIT_AFFINITY;
    return "初识 · " + v + "/" + RECRUIT_AFFINITY;
  }

  // ── P-GIFT 赠礼系统（`50`④）───────────────────────────────
  // 守铁律：赠礼对单人好感总贡献封顶 20（≤满值1/5）——只暖场，道侣/义结仍靠剧情挣。只发好感，不发战力。
  const GIFT_CAP = 20;
  // 送礼好感数值（用户 2026-07-12 提难度·demo 三色调低）：白1/绿2/蓝4，凑满 20 需多送好料，赠礼只暖场。
  const QUALITY_GIFT_VALUE = { white: 1, green: 2, blue: 4, purple: 6, orange: 10, red: 14 };
  // 可赠＝材料 + 丹药 + 装备（用户 2026-07-12 扩）；每物归一个品类（键＝材料名 或 配方 id）。
  const ITEM_CATEGORY = {
    // 材料
    "低阶兽骨": "beast", "兽魂晶": "beast",
    "凝露草": "herb", "月华露": "herb",
    "古篆残片": "scholar",
    "凝言髓": "rare", "异果果髓": "rare",
    "碎灵木": "forge", "寒铁屑": "forge", "玄铁砂": "forge",
    // 丹药：滋补→聋伯 / 药露→裴昭裴晏 / 神识字→秦夫子 / 破境珍稀→二两
    huoxue_powder: "beast", guyuan_pill: "beast", cuigu_pill: "beast",
    ninglu_pill: "herb", yuehua_pill: "herb", yunxi_pill: "herb",
    tongxuan_pill: "scholar", sense_pill: "scholar", mana_pill: "scholar",
    break_pill_qiyan: "rare", break_pill_ningyan: "rare",
    // 装备：武器→阿霜韩霜(剑修) / 法宝术器→秦夫子 / 道袍雅致→裴昭裴晏
    wood_sword: "forge", qingfeng_sword: "forge", hanyue_shortblade: "forge", iron_heavy_sword: "forge",
    lieshi_axe: "forge", fruit_wordblade: "forge", yg_guixu: "forge", yg_fengao: "forge", yg_shihun: "forge",
    iron_talisman: "scholar", ningyan_jade_talisman: "scholar", liuyun_talisman: "scholar",
    xuanling_bell: "scholar", mojian_flying_sword: "scholar", stargaze_astrolabe: "scholar",
    qingbu_robe: "herb", xuanwen_robe: "herb",
  };
  const CATEGORY_NAME = { beast: "兽骨食补", herb: "清雅药露", scholar: "古篆典籍", rare: "珍奇值钱", forge: "金石器料" };
  // 每个可赠角色喜欢的品类 + 收礼回复（喜欢/不喜欢各若干·随机取）。裴昭/裴晏、阿霜/韩霜各自独立（名字/代词已烘进文案）。
  const GIFT_PROFILE = {
    long_bo: { like: "beast", replies: {
      like: ["聋伯掂了掂那块，浑浊的眼睛亮了一下：“好料。今晚……给你炖了。”",
        "“嚯，”聋伯难得没听岔，把东西往灶边一搁，“有心了，{称}。”",
        "聋伯没说谢，只往你手里又塞了半块烤红薯——这是他的规矩。"],
      dislike: ["聋伯翻来覆去看了半天，没看懂：“这……能吃么？”",
        "“留着留着，”聋伯把东西推回来，“我一个烧火的，用不上这个。”"] } },
    er_liang: { like: "rare", replies: {
      like: ["二两双手捧过去，声音都抖了：“这、这么值钱的东西你给我？”半晌，郑重记进账本最前页。",
        "“我的天，”二两眼睛瞪得溜圆，“你是不是傻？这够我吃仨月了！”——嘴上骂，手却攥得死紧。",
        "二两破天荒没算这笔账值多少，只闷声说：“……记你一辈子。”"],
      dislike: ["二两掂了掂，撇嘴：“这玩意儿……坊市收价压得死。心意我领了啊。”",
        "“下回直接给我灵石成不？”二两嘿嘿一笑，还是收下了。"] } },
    qin_fuzi: { like: "scholar", replies: {
      like: ["秦夫子接过，枯瘦的手指抚过那些古痕，半晌，从鼻孔哼出一声——那是他难得的满意。",
        "“尚可。”秦夫子把东西收进袖中，戒尺在掌心轻轻一敲，“知道找字的人，不算蠢。”",
        "秦夫子没抬头，只在你的卷角，不着痕迹地多画了一个圈。"],
      dislike: ["秦夫子瞥了一眼，搁到一边：“老夫要这个作甚。回去多背两个字，比什么都强。”",
        "“心意可嘉，用处欠奉。”秦夫子板着脸，戒尺敲了敲桌沿。"] } },
    pei_zhao: { like: "herb", replies: {
      like: ["裴昭怔了一下，接过，指尖微不可察地收紧：“……你还记得我不惯俗物。”",
        "“难为你寻来。”裴昭把它仔细收好，声音比平日软了半分。",
        "裴昭没有多话，只极轻地“嗯”了一声——可你分明看见，她耳尖红了一下。"],
      dislike: ["裴昭看了一眼，礼数周全地谢过，却没有收：“这般贵重，我受不起。”",
        "“你的心意，我知道了。”裴昭把东西轻轻推回，“可它不该是我的。”"] } },
    pei_yan: { like: "herb", replies: {
      like: ["裴晏怔了一下，接过，指节微不可察地收紧：“……你还记得我不惯俗物。”",
        "“难为你寻来。”裴晏把它仔细收好，声音比平日低了半分。",
        "裴晏没有多话，只极轻地“嗯”了一声——可你分明看见，他耳尖红了一下。"],
      dislike: ["裴晏看了一眼，礼数周全地谢过，却没有收：“这般贵重，我受不起。”",
        "“你的心意，我记下了。”裴晏把东西轻轻推回，“可它不该是我的。”"] } },
    a_shuang: { like: "forge", replies: {
      like: ["阿霜试了试那块料的成色，眉梢一挑：“懂行。这个……我要了。”",
        "“啧，”阿霜嘴角压着笑，别过脸，“算你有点眼力。”——耳尖却红了。",
        "阿霜把料子收进护腕，没道谢，只丢下一句：“下回练剑，替你挡一趟。”"],
      dislike: ["阿霜扫了一眼，摇头：“我要这个没用。你留着炼丹罢。”",
        "“心意收下，东西你拿回去。”阿霜语气不冷，却没有商量。"] } },
    han_shuang: { like: "forge", replies: {
      like: ["韩霜试了试那块料的成色，眉梢一挑：“懂行。这个……我要了。”",
        "“啧，”韩霜嘴角压着笑，别过脸，“算你有点眼力。”——耳尖却红了。",
        "韩霜把料子收进护腕，没道谢，只丢下一句：“下回练剑，替你挡一趟。”"],
      dislike: ["韩霜扫了一眼，摇头：“我要这个没用。你留着炼丹罢。”",
        "“心意收下，东西你拿回去。”韩霜语气不冷，却没有商量。"] } },
  };
  function pick(arr) { return arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : ""; }
  function giftStore() {
    Game.normalizeState && Game.normalizeState();
    const f = Game.state.flags || (Game.state.flags = {});
    return f.giftAffinity || (f.giftAffinity = {}); // 存 flags·随存档·转世自然重置
  }
  function giftTotal(id) { return giftStore()[resolveId(id)] || 0; }
  function giftableProfile(id) { return GIFT_PROFILE[resolveId(id)]; }

  // 赠礼入口：赠礼门槛＝已相逢 + 有 GIFT_PROFILE（宿敌/神秘女子无）。
  function giftTo(id, itemId) {
    id = resolveId(id);
    const prof = GIFT_PROFILE[id];
    if (!prof || !isKnown(id)) return;
    if (!ITEM_CATEGORY[itemId]) return; // 非可赠物
    if (giftOwned(itemId) <= 0) return show("你没有「" + giftItemName(itemId) + "」可赠。");
    const liked = ITEM_CATEGORY[itemId] === prof.like;
    const type = giftItemType(itemId);
    // 装备唯一且珍贵，赠出即失；无论对不对味都二次确认。不对味的材料/丹药也确认。
    if ((type === "equip" || !liked) && Game.modal && Game.modal.confirm) {
      return Game.modal.confirm({
        title: "赠出「" + giftItemName(itemId) + "」？",
        body: type === "equip"
          ? "装备赠出后就归" + displayName(id) + "了，若正装备着会自动卸下、无法取回。" + (liked ? "" : "而且对方并不偏好这类，不会加深情谊。") + "确定送吗？"
          : displayName(id) + "似乎不偏好这类东西，赠出不会加深情谊，物品照样会送出去。仍要送吗？",
        confirmText: "仍要送", cancelText: "算了"
      }, function () { doGift(id, itemId, liked); });
    }
    doGift(id, itemId, liked);
  }
  // 判定可赠物类型：配方 id→丹药/装备，否则材料名。
  function giftItemType(itemId) {
    const r = ((Game.craft && Game.craft.RECIPES) || []).find((x) => x.id === itemId);
    if (r) return r.kind === "equip" ? "equip" : "pill";
    return "material";
  }
  function giftItemName(itemId) {
    const type = giftItemType(itemId);
    if (type === "material") return itemId;
    if (type === "equip") return (Game.state.gear && Game.state.gear[itemId] && Game.state.gear[itemId].name) || itemId;
    const r = ((Game.craft && Game.craft.RECIPES) || []).find((x) => x.id === itemId);
    return (r && r.name) || itemId;
  }
  function giftOwned(itemId) {
    const type = giftItemType(itemId);
    if (type === "material") return Game.bagCount ? Game.bagCount(itemId) : ((Game.state.bag && Game.state.bag[itemId]) || 0);
    if (type === "pill") return Game.inventoryCount ? Game.inventoryCount(itemId) : ((Game.state.items && Game.state.items[itemId]) || 0);
    return Game.state.gear && Game.state.gear[itemId] ? 1 : 0;
  }
  // 消耗一件被赠物；成功返回 true。
  function giftConsume(itemId) {
    const type = giftItemType(itemId);
    if (type === "material") return !!(Game.spendItems && Game.spendItems({ [itemId]: 1 }));
    if (type === "pill") return !!(Game.spendInventoryItem && Game.spendInventoryItem(itemId, 1));
    // equip：卸下并从库存移除
    if (!(Game.state.gear && Game.state.gear[itemId])) return false;
    if (Game.state.equip) Object.keys(Game.state.equip).forEach((slot) => {
      if (Game.state.equip[slot] === itemId) Game.unequipItem && Game.unequipItem(slot);
    });
    delete Game.state.gear[itemId];
    return true;
  }
  function doGift(id, itemId, liked) {
    const gname = giftItemName(itemId);
    if (!giftConsume(itemId)) return show("你没有「" + gname + "」可赠。");
    const prof = GIFT_PROFILE[id];
    const name = displayName(id);
    const gender = avatarGender();
    let reply = pick(liked ? prof.replies.like : prof.replies.dislike).replace(/\{称\}/g, gender === "female" ? "丫头" : "小子");
    let note = "";
    if (liked) {
      const val = QUALITY_GIFT_VALUE[Game.itemQuality ? Game.itemQuality(itemId) : "white"] || 1;
      const gs = giftStore();
      const given = gs[id] || 0;
      const add = Math.max(0, Math.min(val, GIFT_CAP - given));
      if (add > 0) {
        gs[id] = given + add;
        addAffinity(id, add, { text: name + "收下了你的礼，情谊 +" + add + "。" });
        note = "（情谊 +" + add + "，赠礼已积 " + gs[id] + "/" + GIFT_CAP + "）";
      } else {
        note = "（赠礼能给的情谊已到头 " + GIFT_CAP + "/" + GIFT_CAP + "——往后得靠真心相处，不是东西能换的）";
      }
    }
    show(reply + (note ? "　" + note : ""));
  }

  // 卡片内赠礼区：折叠面板，列出背包里可赠的材料/丹药/装备（品质色 + 是否对味）。
  function giftSectionHtml(id) {
    id = resolveId(id);
    if (!GIFT_PROFILE[id] || !isKnown(id)) return "";
    const prof = GIFT_PROFILE[id];
    const s = Game.state || {};
    // 收集三类持有物：材料(bag) / 丹药(items) / 装备(gear)，且在 ITEM_CATEGORY 内。
    const list = [];
    Object.keys(s.bag || {}).forEach((k) => { if (s.bag[k] > 0 && ITEM_CATEGORY[k]) list.push({ id: k, n: s.bag[k] }); });
    Object.keys(s.items || {}).forEach((k) => { if (s.items[k] > 0 && ITEM_CATEGORY[k]) list.push({ id: k, n: s.items[k] }); });
    Object.keys(s.gear || {}).forEach((k) => { if (ITEM_CATEGORY[k]) list.push({ id: k, n: 1 }); });
    const items = list.length
      ? list.map((it) => {
          const liked = ITEM_CATEGORY[it.id] === prof.like;
          const nm = Game.qName ? Game.qName(it.id, giftItemName(it.id)) : giftItemName(it.id);
          return '<button class="rel-gift-item' + (liked ? ' liked' : '') + '" data-char="' + esc(id) + '" data-item="' + esc(it.id) + '">' +
            nm + ' ×' + it.n + (liked ? ' <em>·合意</em>' : '') + '</button>';
        }).join("")
      : '<span class="dim small">背包里暂无可赠的东西。</span>';
    return '<details class="rel-gift"><summary><span class="rel-gift-btn">🎁 赠礼</span><span class="rel-gift-hint">偏好：' + CATEGORY_NAME[prof.like] + '　已积 ' + giftTotal(id) + '/' + GIFT_CAP + '</span></summary>' +
      '<div class="rel-gift-list">' + items + '</div>' +
      '<p class="dim small">可赠材料/丹药/装备；送对偏好按品质加情谊（白1/绿2/蓝4），赠礼总共最多加 ' + GIFT_CAP + '，再往上要靠剧情相处。装备赠出不可取回。</p>' +
      '</details>';
  }

  function cardHtml(id) {
    id = resolveId(id);
    const c = CHARACTERS[id];
    const known = isKnown(id);
    const joined = (Game.state.daolv || []).includes(id);
    const displayName = known ? (c.knownName || c.name) : "？？？";
    const title = known ? c.title : "尚未相逢";
    const affinity = known ? affinityOf(id) : 0;
    const logs = known ? relationLogs(id).slice(-5).reverse() : [];
    if (!known) {
      return '<article class="rel-card rel-card-unknown">' +
        '<div class="rel-avatar">?</div>' +
        '<div class="rel-body"><div class="rel-top"><h3>？？？</h3><span>未相逢</span></div>' +
        '<p>这段因果尚未显影。推进剧情后，人物会在此处留下痕迹。</p></div>' +
        '</article>';
    }
    return '<article class="rel-card' + (joined ? ' joined' : '') + '">' +
      '<div class="rel-avatar">' + (c.art ? '<img src="' + esc(c.art) + '" alt="' + esc(displayName) + '">' : esc(c.icon || displayName[0])) + '</div>' +
      '<div class="rel-body">' +
      '  <div class="rel-top"><div><h3>' + esc(displayName) + '</h3><span>' + esc(title) + '</span></div><b>' + esc(statusText(id)) + '</b></div>' +
      '  <div class="rel-meter"><i style="width:' + affinity + '%"></i></div>' +
      '  <div class="rel-tags"><span>' + esc(c.bondType) + '</span><span>' + esc(c.perk) + '</span></div>' +
      '  <p class="rel-line">' + esc(c.relation) + '</p>' +
      '  <details class="rel-detail"><summary>查看人物细节</summary>' +
      '    <p><b>外貌：</b>' + esc(c.appearance) + '</p>' +
      '    <p><b>性格：</b>' + esc(c.personality) + '</p>' +
      '    <p><b>口吻：</b>' + esc(c.voice) + '</p>' +
      '    <p><b>能力：</b>' + esc(c.perkDesc) + '</p>' +
      '  </details>' +
      giftSectionHtml(id) +
      '  <div class="rel-log"><b>因果记录</b>' + (logs.length ? '<ul>' + logs.map((item) =>
      '<li class="rel-log-' + esc(item.type || "note") + '"><span>' + esc(monthLabel(item.month)) + '</span><p>' + esc(item.text) + '</p></li>'
      ).join("") + '</ul>' : '<p>暂无额外记录。继续推进剧情后，这里会留下好感变化和关键事件。</p>') + '</div>' +
      (joined && c.joined ? '  <div class="rel-joined">' + esc(c.joined) + '</div>' : '') +
      '</div>' +
      '</article>';
  }

  function show(message) {
    Game.normalizeState && Game.normalizeState();
    syncKnownFromStoryProgress();
    Game.setZone && Game.setZone("relations");
    Game.renderHeader && Game.renderHeader();
    Game.save && Game.save.write({ view: "relations" });
    const knownCount = knownIds().length;
    const joinedCount = (Game.state.daolv || []).filter((id) => CHARACTERS[id]).length;
    const el = document.getElementById("stage");
    el.innerHTML =
      '<div class="relations-screen">' +
      '  <section class="relations-hero">' +
      '    <div><div class="eyebrow">神田 · 人物谱</div><h2>因果簿</h2>' +
      '    <p>这里记录你遇见的人、情谊进度和可发展成道侣/义结/师友的关系。标熟词已归入神田词库；人物因果单独在这里展开。</p></div>' +
      '    <button class="btn zone-back" id="rel-back">退出</button>' +
      '  </section>' +
      (message ? '<div class="rel-message">' + esc(message) + '</div>' : '') +
      '  <div class="rel-summary"><span>已相逢 <b>' + knownCount + '</b></span><span>已结缘/义结 <b>' + joinedCount + '</b></span><span>满情谊阈值 <b>' + RECRUIT_AFFINITY + '</b></span></div>' +
      '  <section class="relations-grid">' + visibleCharacterIds().map(cardHtml).join("") + '</section>' +
      '</div>';
    const back = el.querySelector("#rel-back");
    if (back) back.onclick = () => Game.hub && Game.hub.show("");
    el.querySelectorAll(".rel-gift-item").forEach((b) => {
      b.onclick = () => giftTo(b.dataset.char, b.dataset.item);
    });
  }

  Game.relations = { CHARACTERS, RECRUIT_AFFINITY, show, knownIds, isKnown, statusText, resolveId, visibleCharacterIds, giftTo };
  Game.meetCharacter = meetCharacter;
  Game.affinityOf = affinityOf;
  Game.addAffinity = addAffinity;
  Game.joinRelation = joinRelation;
})(window.Game = window.Game || {});
