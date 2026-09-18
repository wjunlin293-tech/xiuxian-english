/* ───────────────────────────────────────────────────────────────
 * world_feel.js · P-FEEL 自由行动手感
 * 只展示世界态势与行动痕迹；不派任务、不发属性、不强制路线。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const ACTION_LABELS = {
    cultivate: "闭关",
    explore: "探险",
    explore_flee: "退避",
    explore_defeat: "重伤",
    story: "旧事",
    craft: "炼制",
    market: "坊市",
    contemplate: "悟道",
    ghosts: "前世",
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function totalMonth() {
    return Game.time && Game.time.totalMonths ? Game.time.totalMonths() : (Game.currentMonthNumber ? Game.currentMonthNumber() : 1);
  }

  function feelState() {
    Game.normalizeState && Game.normalizeState();
    const wf = Game.state.worldFeel || {};
    if (!Array.isArray(wf.history)) wf.history = [];
    if (typeof wf.streak !== "number") wf.streak = 0;
    if (typeof wf.lastType !== "string") wf.lastType = "";
    if (typeof wf.lastTraceMonth !== "number") wf.lastTraceMonth = 0;
    Game.state.worldFeel = wf;
    return wf;
  }

  function family(type) {
    if (type === "explore_flee" || type === "explore_defeat") return "explore";
    return type || "";
  }

  // P-FEEL-D/E 文案池：每类风向多条备选，按当月稳定随机抽一条（同月不变、跨月生变），避免每月一模一样。
  // 铁律（沿用 Codex P-FEEL-A/B）：只写观察式风向——描述江湖氛围/他人反应/自身征兆，
  // 绝不出现"建议/推荐/应该/去做某事/点某按钮"等催促玩家的话。
  function pickFrom(pool, saltNum) {
    if (!pool || !pool.length) return "";
    const m = totalMonth();
    const idx = (m * 2654435761 + (saltNum || 0) * 40503) % pool.length;
    return pool[(idx % pool.length + pool.length) % pool.length];
  }

  const POOLS = {
    // 行迹·连月同类行动的风声（streak 高＝沉迷更深）
    cultivate_deep: [
      "你连月闭关，静室门外的尘痕已经没人去扫。",
      "静室的灯一夜连着一夜，路过的弟子渐渐不再敲门。",
      "有人说那间静室里住着个只认字、不认人的怪人。",
      "你久不露面，膳堂给你留的那份饭，凉了又热了好几回。",
      "闭关日久，连你自己都快忘了后山黄昏是什么颜色。",
    ],
    cultivate_light: [
      "你这阵子少出静室，书院里开始有人低声猜测。",
      "偶尔有人在廊下瞥见你，说你眼底比从前沉了些。",
      "你行功的动静不大，却已有几个同窗暗暗留意。",
      "静室门半掩着，路过的人都放轻了脚步。",
    ],
    explore_deep: [
      "你屡屡入山，坊市摊主已经认得你衣角的泥腥。",
      "山里的雾气像是记住了你，每次都放你更深一层。",
      "你回回带伤而归，医庐的老人见你已不多问。",
      "后山的野物见你的次数多了，反倒学会了先躲。",
      "有樵夫说，近来常见一个少年独自往雾里去，不知深浅。",
    ],
    explore_light: [
      "你近日常往山野去，归来时身上总带着草木与血气。",
      "你鞋底的泥换了几种颜色，像是走过了不止一处山径。",
      "你从山里回来时，眉宇间总还留着一点未散的杀意。",
      "有人注意到你近来常在天未亮时出门。",
    ],
    market: [
      "你近来常去坊市，几个摊主看见你已会先压低声音。",
      "坊市的老摊主给你留了个眼熟的位置，货未摆先冲你点头。",
      "你在坊市转得勤，连收摊的都记住了你挑货的手势。",
      "有摊主背后议论，说你这少年出手不阔绰，眼光却毒。",
    ],
    story: [
      "旧事一环扣一环，书院里有些目光重新落到你身上。",
      "有些被翻起的旧事，正顺着廊柱间的风悄悄传开。",
      "书院里几个消息灵通的人，最近总把话头往你这边引。",
      "你搅动的那潭旧水，涟漪已经荡到了你看不见的角落。",
    ],
    craft: [
      "丹房与炉火近日常亮，药香在月课后还未散尽。",
      "你炉上的火没怎么歇过，隔壁静室都嫌那味太冲。",
      "丹房的老人说，近来总闻见一股不肯认输的焦味。",
      "你捣药的声响入了夜还在，惹得几只夜鸟绕着丹房飞。",
    ],
    // P-FEEL-D NPC 自生活（`43`§2）·仅相逢且情谊≥25 时低频轮显·只是文本痕迹·不改关系值
    er_liang_life: [
      "二两最近迷上了蹲在坊市口听价，说要给你攒个“发财的门路”，结果三天赔了俩铜板。",
      "二两把省下的半块饼硬塞给你，转头又在账本上给自己记了一笔“亏”。",
      "二两不知从哪弄来只瘸腿的野猫，取名叫“灵石”，说图个吉利。",
      "二两听说你近来常出入险地，嘴上骂你不要命，却偷偷把你的名字往账本最前页挪了挪。",
    ],
    long_bo_life: [
      "聋伯这几日把灶火养得格外旺，路过的人说，那火像在等谁回来吃饭。",
      "聋伯又在灶沿上添了一道新刻痕。没人知道他在数什么，他也从不说。",
      "聋伯把你上回没吃完的半块红薯，用灰埋着煨了一夜，说“凉了伤身”。",
      "有人见聋伯对着院试台的方向出神，站了很久，手里的火钳都忘了动。",
    ],
    pei_zhao_life: [
      "有人说，近来裴氏旁支那位小姐，总在无人时往弃字阶这边望一眼，又很快收回目光。",
      "书院采买的名录上，弃字阶那份份例悄悄多了些，经手的字迹清瘦，无人细究。",
      "裴昭近来称病，不大出门。可你路过时，总觉得那扇半掩的窗后有目光落过来。",
      "流言说裴氏在替这位旁支小姐另议亲事，她既没应，也没有辩。",
    ],
    qin_fuzi_life: [
      "秦夫子把你上回那份被他骂作“朽木”的卷子，压在了案头最上头，没再动过。",
      "秦夫子近来批卷格外严，唯独在你的卷角，会不着痕迹地把边理齐。",
      "有同窗说，秦夫子私下提过一句“那扫地的，字里有股不肯认命的劲”，随即又板起脸。",
      "秦夫子的戒尺打得比往日轻了些，尤其是在你答错、却答得认真的时候。",
    ],
    // P-FEEL-E 失败经历化·探险失利归来（`43`§3）·配 recordAction 的 explore_defeat/flee·只给舆论/机会成本·不掉属性
    explore_setback: [
      "你是拖着一身伤回来的。医庐的老人没多问，只把药碾得重了些。",
      "这一趟栽了跟头。坊市摊主瞥见你狼狈的样子，识趣地没提上回你挑剩的货。",
      "败归的消息不知怎么传开了，几道幸灾乐祸的目光跟了你半条街。你没理。",
      "山里那一记教训，比任何人的话都实在。你把它记下，当作下次进山的本钱。",
    ],
    // 自身征兆·突破/瓶颈/寿元
    break_ready: [
      "云气压在识海上方，雷声似乎只隔着一层纸。",
      "识海上方阴云翻卷，你几乎能数清那雷落下的方位。",
      "言气已盈到指尖，只等你抬手引那一道天雷。",
      "行功时天光忽明忽暗，像有什么在识海外头等着你。",
    ],
    break_near: [
      "近来行功时，指骨间偶有细雷游走，像是某个关口在逼近。",
      "你打坐时，识海边缘偶尔炸开一线微光，转瞬即逝。",
      "言气涨得比往日快，某种熟悉的滞涩又浮了上来。",
      "夜里静坐，你听见自己气血里有细微的、催促般的雷声。",
    ],
    wall: [
      "识海深处像撞上无形石壁，言气仍在翻涌，却再难向上。",
      "你一次次撞向那道看不见的界，回响里只剩自己的喘息。",
      "言气在识海里打转，像困在一口望得见天却出不去的井。",
      "那堵墙不痛不痒，却把你所有的势头都稳稳挡了回来。",
    ],
    life_thin: [
      "灯下照见自己的手背，你第一次觉得岁月不是虚词。",
      "夜深时，你摸到脉里那点越来越浅的暖意，沉默了很久。",
      "镜里的人比记忆里憔悴，寿元像漏了缝的沙。",
      "你开始下意识地数日子，尽管从前从不屑于数。",
    ],
    self_calm: [
      "识海尚稳，言典残页在夜里微微发亮。",
      "这些时日心境难得平顺，残页的微光也柔和了些。",
      "言气流转如常，识海像一潭被夜色收拢的静水。",
      "没有惊雷，也没有瓶颈，你难得地睡了个稳觉。",
    ],
    // 坊市行情·背包
    bag_empty: [
      "坊市摊主今日闲坐，药炉与铁砧都还等着材料。",
      "你袋里空空，坊市的热闹与你隔着一层。",
      "铁砧凉着，摊主见你两手空空，便又低头打盹。",
    ],
    bag_rare: [
      "坊市里有人在问残髓与怪果的价，话音压得很低。",
      "你袋中那点异样气息，招来了几道不动声色的打量。",
      "有识货的老者远远盯着你的行囊，欲言又止。",
    ],
    bag_many: [
      "你袋中材料渐杂，丹房与铁砧都能闻到一点机会。",
      "你行囊里叮当作响，几个摊主的眼睛跟着你转。",
      "材料攒得多了，连丹房的老人都主动同你搭了话。",
    ],
    // 人情余波·最亲近之人
    rel_deep: [
      "与你情分已深，旁人偶尔会把你们的名字放在一处说。",
      "你们的交情，已经藏不住了，书院里传得有鼻子有眼。",
      "有人打趣说，如今提起你，总绕不开另一个名字。",
    ],
    rel_mid: [
      "见你时神色已不似初见，书院里有些细微风声。",
      "你们之间的那点熟稔，落在有心人眼里，成了话头。",
      "有人注意到，那人看你的眼神，比对旁人多停了一瞬。",
    ],
    rel_shallow: [
      "已经认得你，只是这份相识还很浅。",
      "点头之交而已，可总归是这书院里记得你名字的人。",
      "偶尔照面会颔首，交情还薄得像初春的冰。",
    ],
    // 机缘风向
    chance_deadline: [
      "有桩机缘正悬着，风声说它不会一直等在原处。",
      "某处的机缘像悬在枝头的果，风一日紧似一日。",
      "江湖里隐约有话在传，说那桩机缘的门，快要合上了。",
    ],
    chance_fruit: [
      "雾岭深处偶有果香，像隔着瘴气看你一眼，又很快隐去。",
      "北边的风里裹着一缕甜香，若有若无，勾着人心。",
      "有猎户说雾岭近来不太平，夜里总闻见说不清的香气。",
    ],
    chance_ghost: [
      "前世未稳的字影在识海边缘游荡，时近时远。",
      "识海最深处，有几个旧字影影绰绰，像在等你回头。",
      "夜里合眼，总有几个模糊的字从很远的地方浮上来。",
    ],
    chance_calm: [
      "后山雾色如常，只在黄昏时比昨日更沉一点。",
      "江湖平静，风里没有什么特别的消息。",
      "这些时日风平浪静，连流言都懒得动一动。",
    ],
    // 无痕迹起步
    trace_start: [
      "你这一世刚起步，世上还没留下多少属于你的痕迹。",
      "你的名字还轻，落在书院这潭水里，连圈都没漾开。",
      "一切才刚开头，江湖尚未记住你这个人。",
    ],
    trace_generic: [
      "书院风声轻轻偏了一寸。",
      "你的行止落进了旁人眼里，成了半句谈资。",
      "有什么在你身后悄悄挪了位置，你没回头。",
    ],
  };

  function traceText(type, streak) {
    const f = family(type);
    if (streak < 2) return "";
    if (f === "cultivate") return pickFrom(streak >= 4 ? POOLS.cultivate_deep : POOLS.cultivate_light, streak);
    if (f === "explore") return pickFrom(streak >= 4 ? POOLS.explore_deep : POOLS.explore_light, streak);
    if (f === "market") return pickFrom(POOLS.market, streak);
    if (f === "story") return pickFrom(POOLS.story, streak);
    if (f === "craft") return pickFrom(POOLS.craft, streak);
    return "";
  }

  function recordAction(type, detail) {
    const wf = feelState();
    const m = totalMonth();
    const f = family(type);
    const prev = family(wf.lastType);
    wf.streak = f && f === prev ? (wf.streak || 0) + 1 : 1;
    wf.lastType = type || "";
    wf.history.push({
      type: type || "",
      detail: detail || "",
      month: m,
    });
    wf.history = wf.history.slice(-10);
    const line = traceText(type, wf.streak);
    if (line && wf.lastTraceMonth !== m) {
      wf.lastTraceMonth = m;
      if (Game.logEvent) Game.logEvent("◌ 行迹 · " + line);
    }
    // P-FEEL-E 失败经历化：探险失利/败退归来，转成一条舆论/机会成本风声（不掉属性、不 GameOver）。
    if ((type === "explore_defeat" || type === "explore_flee") && Game.logEvent) {
      Game.logEvent("◌ 风声 · " + pickFrom(POOLS.explore_setback, m + (wf.streak || 0)));
    }
    return line;
  }

  function relationName(id) {
    // CHARACTERS 实为对象 { id: {...} }，此前误当数组 .find() → 一旦有相识角色即崩 hub。兼容两种结构。
    const chars = (Game.relations && Game.relations.CHARACTERS) || null;
    const row = chars && (Array.isArray(chars) ? chars.find((c) => c.id === id) : chars[id]);
    return row ? row.name : id;
  }

  function strongestRelationLine() {
    const rel = Game.state.relations || {};
    const ids = Object.keys(rel).filter((id) => rel[id] > 0);
    if (!ids.length) return "书院里的人仍多半只把你当作一个陌生名字。";
    ids.sort((a, b) => (rel[b] || 0) - (rel[a] || 0));
    const id = ids[0];
    const v = rel[id] || 0;
    if (v >= 80) return relationName(id) + pickFrom(POOLS.rel_deep, 1);
    if (v >= 45) return relationName(id) + pickFrom(POOLS.rel_mid, 2);
    return relationName(id) + pickFrom(POOLS.rel_shallow, 3);
  }

  // P-FEEL-D：故人自生活。取一个已相逢且情谊≥25 的人，按月轮换挑一句"他/她也在过自己日子"。
  // 无够近的人则返回 ""（panelHtml 过滤空行→此行只在有近交时出现）。只读文本，不改关系值。
  const NPC_LIFE_POOLS = {
    er_liang: "er_liang_life",
    long_bo: "long_bo_life",
    pei_zhao: "pei_zhao_life",
    qin_fuzi: "qin_fuzi_life",
  };
  function npcLifeLine() {
    const rel = Game.state.relations || {};
    const ids = Object.keys(NPC_LIFE_POOLS).filter((id) => (rel[id] || 0) >= 25);
    if (!ids.length) return "";
    const m = totalMonth();
    const id = ids[m % ids.length]; // 按月在几位近交间轮换，避免总盯同一人
    return pickFrom(POOLS[NPC_LIFE_POOLS[id]], m);
  }

  function bagLine() {
    const bag = Game.state.bag || {};
    const keys = Object.keys(bag).filter((k) => bag[k] > 0);
    if (!keys.length) return pickFrom(POOLS.bag_empty, 1);
    if (keys.some((k) => k.indexOf("残髓") >= 0 || k.indexOf("异果") >= 0)) {
      return pickFrom(POOLS.bag_rare, 2);
    }
    if (keys.length >= 4) return pickFrom(POOLS.bag_many, 3);
    return "你带回的" + keys.slice(0, 2).join("、") + "已经够摊主多看一眼。";
  }

  function selfLine() {
    Game.normalizeState && Game.normalizeState();
    const s = Game.state;
    if (Game.isRealmWallReady && Game.isRealmWallReady()) {
      return pickFrom(POOLS.wall, 1);
    }
    const pct = s.expToBreak ? s.exp / s.expToBreak : 0;
    if (Game.readyToBreak && Game.readyToBreak()) return pickFrom(POOLS.break_ready, 2);
    if (pct >= 0.82) return pickFrom(POOLS.break_near, 3);
    if (s.lifespanMax && s.lifespan / s.lifespanMax < 0.18) return pickFrom(POOLS.life_thin, 4);
    return pickFrom(POOLS.self_calm, 5);
  }

  function vowLine() {
    const s = Game.state;
    const left = Math.max(0, 36 - totalMonth());
    if (s.flags.vowBossDone) return "裴氏席上仍有人避开你的目光，三年之约的余波没有散尽。";
    if (s.flags.vowBossLost) return "院试榜旁偶有人提起那一败，话音不高，却足够刺耳。";
    if (s.flags.vowBossSkipped || s.flags.vowBossForfeit) return "那场旧约成了书院流言里的一根刺，偶尔会被人重新拨动。";
    if (left <= 0) return "院试大比的钟声已经近了，裴氏那边比往常安静。";
    if (left <= 6) return "裴照临近日常去演武场，裴氏席位附近也少了闲谈声。";
    if (left <= 18) return "裴氏的名字仍在书院里压着一层阴影，只是还未到摊牌时。";
    return "三年之约还远，书院多数人仍把它当作一桩旧笑话。";
  }

  function chanceLine() {
    const info = Game.storyflow && Game.storyflow.nextStoryInfo ? Game.storyflow.nextStoryInfo() : null;
    if (info && info.title && info.canStart && info.monthsToDeadline != null) {
      return pickFrom(POOLS.chance_deadline, 1);
    }
    if (Game.state.flags.fruitZoneUnlocked && !(Game.state.yiguo && Game.state.yiguo.canglan)) {
      return pickFrom(POOLS.chance_fruit, 2);
    }
    const ghosts = Game.rebirth && Game.rebirth.ghostCount ? Game.rebirth.ghostCount() : 0;
    if (ghosts) return pickFrom(POOLS.chance_ghost, 3);
    return pickFrom(POOLS.chance_calm, 4);
  }

  function traceLine() {
    const wf = feelState();
    if (!wf.history.length) return pickFrom(POOLS.trace_start, 0);
    const last = wf.history[wf.history.length - 1];
    const label = ACTION_LABELS[last.type] || ACTION_LABELS[family(last.type)] || "行事";
    const t = traceText(last.type, wf.streak || 1);
    if (t) return t;
    return "最近一次" + label + "之后，" + pickFrom(POOLS.trace_generic, 6);
  }

  // P-DAOXIN：hub 常驻道心状态行，让玩家随时知道复习保持度对战力的影响（坚固时也显示·低调）。
  function daoxinFeelLine() {
    const d = Game.daoxinTier ? Game.daoxinTier() : null;
    if (!d) return "";
    if (d.tier === "ripple") return "道心微澜——有 " + d.overdue + " 个真言逾期未温习，日常战力 −8%。去识海温习到期真言即可复稳。";
    if (d.tier === "unstable") return "心性不稳——逾期真言积压（" + d.overdue + " 个），日常战力 −18%。温习到期真言可复稳（三年之约等生死战不受影响）。";
    return "道心坚固——真言温习无碍，临敌战力如常。";
  }

  // P-DARK 心境·冷意（读 flags.coldHeart，黑化/不帮选择累积）：观察式风向·只写他人反应/氛围·不说教。
  // <3 不显（panelHtml 过滤空行）；3-5 心渐硬；6+ 冷绝。数值/暗值不影响战力（力量铁律）。
  const COLD_POOLS = {
    hard: [
      "你行事越来越不留情面。书院里怕你的人多了，愿意近你的，少了。",
      "有人说你近来眼神冷了。廊下遇见，几个相熟的面孔，也悄悄改了道。",
      "你答话越来越短，笑越来越少。灶房那盏灯还为你留着，可你已许久没去坐。",
      "有人在背后议论，说那个扫地的，如今谁的情面都不给。",
    ],
    cold: [
      "书院里渐渐传开一句话：那个扫地的，眼睛比弃字阶的墨还冷。",
      "你走过时，连素来嚣张的内舍弟子，也下意识屏了声——不是敬，是怕。",
      "有人说你记仇，且不留后路。避着你走的人，一日多过一日。",
      "夜里独坐，你偶尔觉出心口那处比从前更空——可你已经懒得去管它是什么。",
    ],
  };
  function coldHeartFeelLine() {
    Game.normalizeState && Game.normalizeState();
    const c = (Game.state.flags && Game.state.flags.coldHeart) || 0;
    if (c >= 6) return pickFrom(COLD_POOLS.cold, c);
    if (c >= 3) return pickFrom(COLD_POOLS.hard, c);
    return ""; // 未染冷意/偶起冷意：不刷屏
  }

  function worldLines() {
    return [
      { tag: "书院风向", text: vowLine() },
      { tag: "道心", text: daoxinFeelLine() },
      { tag: "心境", text: coldHeartFeelLine() }, // P-DARK：coldHeart<3 返回 ""，panelHtml 过滤掉

      { tag: "自身征兆", text: selfLine() },
      { tag: "坊市行情", text: bagLine() },
      { tag: "人情余波", text: strongestRelationLine() },
      { tag: "机缘风向", text: chanceLine() },
      { tag: "故人近况", text: npcLifeLine() }, // P-FEEL-D：无够近的人时 npcLifeLine 返回 ""，下方 panelHtml 过滤掉
      { tag: "行迹", text: traceLine() },
    ];
  }

  function panelHtml() {
    const rows = worldLines().filter((line) => line.text).map((line) =>
      '<div class="world-line"><span>' + esc(line.tag) + '</span><b>' + esc(line.text) + '</b></div>'
    ).join("");
    return '<div class="world-feel-panel">' +
      '<div class="world-feel-title">江湖风声</div>' +
      '<div class="world-feel-sub">只是风向，不是差遣；去不去、理不理，都由你。</div>' +
      rows +
      '</div>';
  }

  Game.worldFeel = { recordAction, panelHtml, worldLines };
})(window.Game = window.Game || {});
