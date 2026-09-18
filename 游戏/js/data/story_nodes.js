/* ───────────────────────────────────────────────────────────────
 * story_nodes.js · R4 纯叙事剧情节点
 * 保留旧 DEMO_CHAPTER 正文资产；运行时生成去词卡/去内嵌战斗/去旧加点的纯叙事章。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  function story(body, cont, heading, musicMood, sfx) {
    const wrapped = typeof body === "function"
      ? function () { return Game.heroText ? Game.heroText(body()) : body(); }
      : function () { return Game.heroText ? Game.heroText(body || "") : (body || ""); };
    return { type: "story", heading: heading, cont: cont || "继续 ▸", body: wrapped, musicMood: musicMood, sfx: sfx };
  }

  function portrait(page, path, name, side, layout) {
    page.portrait = path;
    page.portraitName = name;
    page.portraitSide = side || "right";
    if (layout) page.portraitLayout = layout;
    return page;
  }

  function choice(prompt, options) {
    return { type: "choice", prompt: prompt, options: options };
  }

  function flags() {
    Game.normalizeState && Game.normalizeState();
    return Game.state.flags;
  }

  function coldHeart(n) {
    const f = flags();
    f.coldHeart = (f.coldHeart || 0) + (n || 0);
  }

  function storyIsDone(id) {
    const f = flags();
    return !!(f.storyDone && f.storyDone[id]);
  }

  function grantExp(amount) {
    const gain = Game.applyQiGainRate ? Game.applyQiGainRate(amount) : amount;
    const events = Game.gainExp ? Game.gainExp(gain, { scaled: true }) : [];
    if (Game.visual && Game.visual.toast) Game.visual.toast("言气 +" + gain, "gold");
    if (events && events.length) flags().silentBreakthrough = events[0].to;
  }

  function totalAttrs() {
    return Game.totalAttrs ? Game.totalAttrs() : (Game.state.attrs || {});
  }

  function combatScore() {
    const a = totalAttrs();
    return (a.hp || 0) * 0.22 + (a.mp || 0) * 1.1 + (a.str || 0) * 2.1 +
      (a.def || 0) * 1.6 + (a.sense || 0) * 1.35 + (Game.state.realmIndex || 0) * 38;
  }

  function strongA() { return combatScore() >= 145 || Game.state.realmIndex >= 1; }
  function strongB() { return combatScore() >= 190 || Game.state.realmIndex >= 2; }
  function senseStrong() { return (totalAttrs().sense || 0) >= 30 || Game.state.realmIndex >= 2; }

  function meet(id) {
    if (Game.meetCharacter) Game.meetCharacter(id);
  }

  function affinity(id, n, text) {
    if (Game.addAffinity) Game.addAffinity(id, n, text ? { text: text } : undefined);
  }

  function affinityOnce(key, id, n, text) {
    const f = flags();
    if (!f.affinityOnce) f.affinityOnce = {};
    if (f.affinityOnce[key]) return;
    f.affinityOnce[key] = true;
    affinity(id, n, text);
  }

  function heroine() {
    return !!(Game.state && Game.state.avatar && Game.state.avatar.gender === "female");
  }

  function oldBond() {
    if (heroine()) {
      return {
        id: "pei_zhao",
        realId: "pei_yan",
        name: "裴晏",
        art: "../素材/人物/pei-yan.png",
        call: "沈姑娘",
        childCall: "砚姐姐",
        childVoice: "放轻了，喊",
        title: "裴公子",
        spouse: "未婚夫",
        pronoun: "他",
        outfit: "月白长袍束得很齐，身形清瘦",
        entrance: "停在离墙根三步远的阴影里，像连靠近都要先守住分寸",
        gift: "没有直接递到沈砚手里，只把半块温热的胡饼和一张折得极小的纸条搁在墙头，指节还轻轻压着纸角，像怕风吹走，也怕越过那点距离",
        warning: "说到卯时二字时，他把声音压得更低，没有催，也没有多解释",
        mist: "换了一身素净短打，平日端正的袍袖全收进护腕里。雾岭巡山的修士他竟都识得路数，遇到窄处便先停半息，确认无人窥探后才示意沈砚跟上",
        favor: "（裴晏 对你的态度，似乎暖了几分）"
      };
    }
    return {
      id: "pei_zhao",
      realId: "pei_zhao",
      name: "裴昭",
      art: "../素材/人物/pei-zhao.png",
      call: "沈公子",
      childCall: "砚哥哥",
      childVoice: "怯生生地喊",
      title: "裴小姐",
      spouse: "未婚妻",
      pronoun: "她",
      outfit: "月白绫裙，身形清瘦",
      entrance: "立在阴影里，像怕被谁看见",
      gift: "极快地塞过来半块温热的胡饼，还有一张折得极小的纸条",
      warning: "语速很快",
      mist: "一身利落的玄色短打，褪去了裴氏小姐的绫罗。雾岭巡山的修士她竟都识得路数，带着沈砚专拣盲区走，几次擦着搜山的灵识过去",
      favor: "（裴昭 对你的态度，似乎暖了几分）"
    };
  }

  function frostBond() {
    if (heroine()) {
      return {
        id: "a_shuang",
        realId: "han_shuang",
        name: "韩霜",
        art: "../素材/人物/han-shuang.png",
        short: "一个浅青药衣的少年正蹲在场边替人缠伤。师兄一剑逼来，他没有抬声，只把药结咬住，反手抽剑挡开半寸。那一眼很短，冷得像霜刃贴过灯火。",
        meetText: "（人物谱：韩霜 已相识）"
      };
    }
    return {
      id: "a_shuang",
      realId: "a_shuang",
      name: "阿霜",
      art: "../素材/人物/a-shuang.png",
      short: "一个浅青药衣的少女正被师兄压了一剑。她退了半步，仍倔着眼不肯服输。那一眼很短，却像霜刃擦过灯火。",
      meetText: "（人物谱：阿霜 已相识）"
    };
  }

  // 剧情补发灵石/物品（按 39§5.2 凑"基本够应付"·守铁律：只发资源不发硬战力·一次性防重领）
  function grantMoneyOnce(key, n, reason) {
    const f = flags();
    if (!f.storyGrants) f.storyGrants = {};
    if (f.storyGrants[key]) return;
    f.storyGrants[key] = true;
    Game.gainMoney && Game.gainMoney(n, reason || "剧情所得");
  }
  function grantItemsOnce(key, items) {
    const f = flags();
    if (!f.storyGrants) f.storyGrants = {};
    if (f.storyGrants[key]) return;
    f.storyGrants[key] = true;
    Object.keys(items || {}).forEach((mat) => Game.addItem && Game.addItem(mat, items[mat]));
  }
  // 一次性赠予装备（如配角所赠护符）；已持有则只补一次不重复。
  function grantGearOnce(key, recipeId) {
    const f = flags();
    if (!f.storyGrants) f.storyGrants = {};
    if (f.storyGrants[key]) return;
    f.storyGrants[key] = true;
    const r = ((Game.craft && Game.craft.RECIPES) || []).find((x) => x.id === recipeId);
    if (r && Game.addGear && !(Game.state.gear && Game.state.gear[r.id])) {
      Game.addGear({ id: r.id, name: r.name, slot: r.slot, slotName: r.slotName, bonus: r.bonus });
    }
  }

  const BRIDGES = {
    OBSCURE: story(`
      <p>那个符号在识海里缓缓展开。它所指的，正是此刻的他——卑微、晦涩、不为人知，像一粒被扫进墙角的尘；也正是这卷无人能解的《天外言典》。</p>
      <p>沈砚没有急着给它命名，只是把那一点灼热压进心底。天外之言第一次回应了他，而他第一次确定，自己并非真的一无所有。</p>
    `, "合上残卷 ▸"),
    SCORN: story(`
      <p>满场的轻蔑像针一样落在他身上。可这一次，沈砚没有任它们刺进骨头里。</p>
      <p>他在识海里把那股轻蔑一点点拆开、看清、收束，像把别人泼来的冷水，炼成一线贴骨的寒光。他没有抬头，也没有出声——连恨，都被他压进了那一线光里。</p>
    `, "言意暗沉 ▸"),
    DEFY: story(`
      <p>沈砚迎着那个字参悟下去。不是为了在此刻咆哮，也不是为了让满场的人看见他眼底的火。</p>
      <p>他要违抗的，是这十六年来压在身上的命，是母亲临终时那句卑微的“只求你活下去”，是脚边碎玉，是满场哄笑，也是那一句轻飘飘的“扫地的狗”。</p>
      <p>天外真言沉入识海，第一次化作真正属于他的力量。</p>
    `, "睁眼 ▸"),
    SHATTER: story(`
      <p>沈砚没有追击，只在收势的瞬间，把那道天外真言压成最后一线。</p>
      <p>裴照临周身凝言境的灵光应声碎裂。那不是本土灵文的路数，也不是裴氏见过的任何术法；他连这股力量从何而来都读不懂，自然也挡不住。</p>
    `, "尘埃落定 ▸"),
    DEFIANCE: story(`
      <p>退婚文书裂开的那一刻，沈砚心里反倒安静下来。掌心两半残纸，还留着裴家管事按过的褶。他松开手，任纸屑落地——这一撕，他等了三年。</p>
    `, "立誓 ▸"),
    BATTLE: story(`
      <p>裴照临踉跄后退，第一次真正看向沈砚。</p>
      <p>方才那一瞬，他甚至没能读懂沈砚用了什么。满场的人只看见碎玉化粉、灵光破裂，看见那个高高在上的裴氏嫡子被逼得气息紊乱；却没有人知道，沈砚到底露了几分底牌。</p>
      <p>沈砚没有再进一步。露到这里，够了——他甚至没让人看清，方才那一下，用了几分力。</p>
    `, "收势 ▸"),
    ALLOCATE: story(`
      <p>那股新生的力量仍在四肢百骸间奔涌。沈砚没有任它外泄，只把它一寸寸压回识海，化作日后可以反复打磨的根基。</p>
      <p>真正的分配与修炼，不在这一刻给旁人看见；它会在一个又一个无人注目的月份里，慢慢沉到骨头里。</p>
    `, "收束根基 ▸"),
  };

  function purePagesFromDemo() {
    const out = [];
    (Game.DEMO_CHAPTER.pages || []).forEach((page) => {
      if (page.type === "word") {
        if (BRIDGES[page.word]) out.push(BRIDGES[page.word]);
        return;
      }
      if (page.type === "battle") {
        out.push(BRIDGES.BATTLE);
        return;
      }
      if (page.type === "allocate") {
        out.push(BRIDGES.ALLOCATE);
        return;
      }
      out.push(page);
    });
    return out;
  }

  Game.STORY_NODES = [
    {
      id: "demo_pure",
      title: "序 · 破言",
      onComplete: function () {
        meet("pei_zhao");
        meet("pei_zhaolin");
      },
      chapter: {
        id: "demo_pure",
        title: "序 · 破言",
        musicMood: "read_calm",
        clearSaveOnEnd: false,
        pages: purePagesFromDemo(),
      },
    },
    {
      id: "node_kitchen",
      title: "灶房的人",
      requirementText: "需先完成序章「破言」",
      canStart: function () {
        return !!flags().demoStoryDone;
      },
      onComplete: function () {
        meet("long_bo");
        meet("er_liang");
        affinity("long_bo", 5, "（灶房那盏灯，为你多留了一会儿）");
        affinity("er_liang", 3, "（二两 把你记进了他那本账）");
      },
      chapter: {
        id: "node_kitchen",
        title: "灶房的人",
        musicMood: "read_warm",
        clearSaveOnEnd: false,
        pages: [
          story(`
            <p>去灶房要过一段长廊。沈砚刚拐过去，一只木桶“哐当”砸在脚边，半桶脏水泼了他一身。</p>
            <p>提桶的是个十二三岁、才入门的小弟子，脸还带稚气，手都在抖。身后几个年长的师兄在起哄：“泼啊！怕什么？他是扫地的狗，狗还能咬你不成？”</p>
            <p>沈砚没有抬头，也没有擦。他默默拎起那只滚到脚边的空桶，转身往井边走，重新打水。<b>这段路他走了三年，闭着眼，都知道哪块砖会硌脚。</b></p>
          `, "往灶房去 ▸", "灶房的人"),
          portrait(story(`
            <p>灶房里，老火工正蹲在灶前添柴。书院里没人知道他叫什么，只唤他“聋伯”——耳朵背得厉害，你说东，他能听成西。</p>
            <p>“聋伯，还有热汤么？”</p>
            <p>聋伯回头，浑浊的眼睛眨了眨：“啊？你说……要换缸？”他指了指墙角的水缸，“那缸是漏的，换不得，将就用。”</p>
            <p>沈砚：“……汤。热、汤。”</p>
            <p>“哦——糖啊。”聋伯摸索半天，从灶膛灰里扒出一块烤得焦香的红薯，塞给他，“没糖。这个甜，拿着。”</p>
          `, "接过红薯 ▸"), "../素材/人物/long-bo.png", "聋伯", "right"),
          portrait(story(`
            <p>“嘿，又来蹭聋伯的红薯。”草席上翻起一个瘦小身影，是同住的二两。他眯着眼，掰着手指，“我算算啊——你这月蹭了七回，一回半个红薯，欠聋伯三个半。加上上月的……行，记你账上。”</p>
            <p>“你记这个做什么。”沈砚哭笑不得。</p>
            <p>“人情账，懂不懂？”二两把油乎乎的小本子捂回怀里，“这书院里，谁对你好一分、坏一分，我都记着。万一哪天你飞黄腾达了呢。”</p>
            <p>沈砚没接话。他不知道的是，那本子的最后一页，二两记的不是账。<span class="dim">（人物谱：聋伯、二两 已相识）</span></p>
          `, "看向灶台 ▸"), "../素材/人物/er-liang.png", "二两", "right"),
          story(`
            <p>沈砚啃着红薯，瞥见灶台边沿，密密麻麻全是刻痕，一道挨着一道，像是刻了许多年。</p>
            <p>“聋伯，这是……记的什么？”他凑到聋伯耳边，大声问。</p>
            <p>聋伯的火钳停了一下。他没听岔这一回，却也没答，只是浑浊的眼睛望着灶膛里的火，望了很久。</p>
            <p>“……日子。”他终于含混地说了两个字，又往灶里添了把柴，“火得养着。睡吧。”<span class="dim">（埋 · 灶沿刻痕 / 真名被划去）</span></p>
            <p>夜里回到草席，沈砚摸了摸枕下那只磨得发白的旧布包——里头是母亲临终前塞进他手心的十枚灵石。三年了，他一枚都没舍得动。那是这座书院里，唯一还带着体温的东西。<span class="dim">（你随身有 10 灵石 · 母亲遗留）</span></p>
          `, "回到月课 ▸"),
        ],
      },
    },
    {
      id: "node_tower_whisper",
      title: "藏言楼的低语",
      requirementText: "需完成序章，并达到启言境",
      canStart: function () {
        return !!flags().demoStoryDone && Game.state.realmIndex >= 1;
      },
      chapter: {
        id: "node_tower_whisper",
        title: "藏言楼的低语",
        musicMood: "puzzle_tense",
        clearSaveOnEnd: false,
        pages: [
          story(`
            <p>入启言境后的第一个夜里，沈砚被一阵细得像纸页翻动的声音惊醒。</p>
            <p>那声音并不来自床榻，也不来自窗外的竹影，而是从书院最偏僻的藏言楼深处传来。楼中旧卷多年无人翻检，白日里连执事都嫌那里霉气太重。</p>
            <p>可《天外言典》在识海里轻轻一动，像是听见了同类的回声。</p>
          `, "披衣起身 ▸", "藏言楼的低语", null, "story_wind"),
          story(`
            <p>沈砚站在廊下，没有立刻动身。</p>
            <p>三年前的碎玉让他明白，有些机会是真的机会，有些机会只是别人用来试探的绳套。藏言楼里若真有东西在等他，也未必只等他一个人。</p>
            <p>夜风穿过书院的檐角，远处更夫的梆声落下。他必须决定，是循着那道低语往前一步，还是先把锋芒继续藏进暗处。</p>
          `, "权衡片刻 ▸"),
          choice(`
            <p>那道低语仍在响，像一枚细针扎在识海边缘。</p>
          `, [
            {
              label: "<b>循声而去</b><span>查清藏言楼里的异常。</span>",
              onPick: function () {
                flags().towerBond = true;
                flags().towerChoice = "bond";
                meet("mystery_woman");
                grantMoneyOnce("tower_cache", 40, "藏言楼暗格遗存");
              },
            },
            {
              label: "<b>藏锋不动</b><span>先稳住根基，等它再露破绽。</span>",
              onPick: function () {
                flags().towerCautious = true;
                flags().towerChoice = "cautious";
                grantExp(20);
              },
            },
          ]),
          portrait(story(function () {
            if (flags().towerBond) {
              return `
                <p>沈砚推开藏言楼的侧门。灰尘在月光里浮起，一卷没有书名的残页从最上层的木架缝隙间滑落。</p>
                <p>残页上没有本土灵文，只有几道像被火烧过的断痕。《天外言典》微微发烫，似乎记住了这个地方。</p>
                <p>他没有久留，只把残页重新夹回暗格。指尖离开的刹那，他忽然顿住——那暗格的浮尘上，似乎留着另一道极浅的、新近的指痕。</p>
                <p>暗格最里头，还压着一只褪色旧布囊，绳结一碰即散，滚出几十枚蒙尘的灵石——想是某位前人藏在此处、再没回来取走的私蓄。沈砚默了默，收进怀里。<span class="dim">（灵石 +40 · 藏言楼遗存）</span></p>
                <p>这藏言楼里要找这卷残页的，好像，不止他一个。<span class="dim">（人物谱：神秘女子 已相识 · 埋 F17）</span></p>
              `;
            }
            return `
              <p>沈砚最终没有踏进藏言楼。</p>
              <p>他在廊下盘膝，把那道低语一寸寸拆开，用一整夜压住心里的躁意。天亮前，那声音终于退回楼中，而他的识海反而更稳了几分。</p>
              <p>有些门，不必第一次听见响动就推开。能忍住，也是一种修炼。</p>
            `;
          }, "回到月课 ▸"), function () { return flags().towerBond ? "../素材/人物/mystery-woman.png" : ""; }, "神秘女子", "right"),
        ],
      },
    },
    {
      id: "node_steps_probe",
      title: "弃字阶的窥探",
      requirementText: "需完成「藏言楼的低语」，并到第 6 月以后",
      unlockMonth: 6,
      canStart: function () {
        return storyIsDone("node_tower_whisper") && Game.currentMonthNumber && Game.currentMonthNumber() >= 6;
      },
      onComplete: function () {
        grantMoneyOnce("steps_coin", 20, "弃字阶拾得"); // 扫阶时在废卷堆里拾得一枚旧灵石
      },
      chapter: {
        id: "node_steps_probe",
        title: "弃字阶的窥探",
        musicMood: "ominous",
        clearSaveOnEnd: false,
        pages: [
          story(`
            <p>这些时日，弃字阶旁开始多了几道陌生目光。</p>
            <p>他们不拦沈砚，也不明着嘲笑，只在他扫阶、搬卷、去月课堂的路上远远跟着。裴照临的人还没有动手，却已经在重新估量他。</p>
            <p>三年前被一脚踩碎的玉，似乎终于让某些人觉得硌脚了。</p>
          `, "继续观察 ▸", "弃字阶的窥探", null, "story_steps"),
          story(`
            <p>沈砚很清楚，这不是一次正式的挑衅。</p>
            <p>这更像一根探针，试他到底有没有从那夜的低语里得了什么，试他的修为是否只是偶然暴涨，试他还会不会像从前那样任人拿捏。</p>
            <p>他可以继续扮作那个不起眼的扫言童子，也可以露出一线锋芒，让对方知道，沈砚已经不是旧日的沈砚。</p>
          `, "做出应对 ▸"),
          choice(`
            <p>台阶尽头，有人故意把一摞旧卷撞散在他脚边。</p>
          `, [
            {
              label: "<b>继续扮废</b><span>装作没有察觉，把目光引向别处。</span>",
              onPick: function () {
                flags().lowProfile = true;
                flags().stepsChoice = "lowProfile";
              },
            },
            {
              label: "<b>露一线锋芒</b><span>不打正面战，只让对方记住代价。</span>",
              onPick: function () {
                flags().highProfile = true;
                flags().bossAlert = true;
                flags().stepsChoice = "highProfile";
                Game.addItem && Game.addItem("碎灵木", 1);
              },
            },
          ]),
          story(function () {
            if (flags().lowProfile) {
              return `
                <p>沈砚弯腰，把旧卷一本本捡回去，连袖角都没有多抬。</p>
                <p>那几道目光等了许久，什么也没等到，只能把“沈砚仍旧隐忍”这句话带回去。可他们没有看见，他指尖压在书脊上时，已经把对方的气息记得清清楚楚。</p>
                <p>藏锋不是退让，是让敌人直到拔刀前一刻，都看不清刀在哪里。</p>
                <p>收拾散卷时，他在废纸堆底摸到一枚不知谁失落的旧灵石，随手收进了袖里——这弃字阶，本就是堆放无人要之物的地方。<span class="dim">（灵石 +20）</span></p>
              `;
            }
            return `
              <p>沈砚没有抬头，只让一道细碎灵光从袖底擦过。</p>
              <p>撞卷的人脚下一麻，踉跄半步，掌心却多了一根被震裂的碎灵木。他脸色一变，终于明白这不是旧日那个任人推搡的扫言童子。</p>
              <p>沈砚把旧卷放回怀里，没有追击。露一线锋芒就够了，再多，就是把底牌送给别人看。</p>
              <p>收拾散卷时，他在废纸堆底摸到一枚不知谁失落的旧灵石，随手收进了袖里。<span class="dim">（灵石 +20）</span></p>
            `;
          }, "回到月课 ▸"),
        ],
      },
    },
    {
      id: "node_wall",
      title: "墙根下的人",
      requirementText: "需完成「弃字阶的窥探」",
      canStart: function () {
        return storyIsDone("node_steps_probe");
      },
      chapter: {
        id: "node_wall",
        title: "墙根下的人",
        musicMood: "read_soft",
        clearSaveOnEnd: false,
        pages: [
          portrait(story(function () {
            const p = oldBond();
            return '<p>那天傍晚，沈砚去后山倒灰，回来时天已擦黑。弃字阶的墙根下，立着一个人。</p>' +
              '<p>' + p.outfit + '，' + p.entrance + '。那人先开了口，声音很轻：“' + p.call + '。”</p>' +
              '<p>三个字，沈砚却愣在原地。这声音他认得——小时候趴在同一张案上描红时，就是这个声音，' + p.childVoice + p.childCall + '。</p>' +
              '<p>是' + p.name + '。' + p.pronoun + '那位……退婚那日，连面都没露的' + p.spouse + '。</p>';
          }, "听对方说 ▸", "墙根下的人"), function () { return oldBond().art; }, function () { return oldBond().name; }, "right"),
          story(function () {
            const p = oldBond();
            return `
            <p>沈砚没有行礼，也没有应那声“${p.call}”。</p>
            <p>退婚那日的哄笑、脚边的碎玉、那一句“扫地的狗”——还有${p.pronoun}，自始至终没有来。这笔账，他记着。</p>
            <p>“${p.title}找扫地的，”沈砚声音很平，平得没有温度，“不怕脏了袍角。”</p>
            <p>${p.name}被这句噎了一下。${p.pronoun}张了张嘴，却没有辩解，${p.gift}。</p>
          `;
          }, "接过纸条 ▸"),
          story(function () {
            const p = oldBond();
            return `
            <p>“明日裴照临的人会去弃字阶寻你的错处，”${p.pronoun}${p.warning}，“卯时之前，把你藏的东西，挪一挪。”</p>
            <p>说“东西”二字时，${p.pronoun}飞快地看了一眼沈砚怀里的《天外言典》。沈砚心头一凛：${p.pronoun}怎么知道？</p>
            <p>递纸条的那只手，食指上有一道极浅的墨痕，洗了十几年也没褪。${p.pronoun}腰间还挂着半枚玉佩——沈、裴两家定亲信物里，另一枚没有碎的。</p>
          `;
          }, "开口 ▸"),
          choice(function () {
            return `
            <p>那人说完该说的，转身就要走，像多留一息都是罪。沈砚握着那半块还温的胡饼，开口——</p>
          `;
          }, [
            {
              label: function () { return "<b>叫住" + oldBond().pronoun + "，问那句“为什么”</b><span>直面三年前" + oldBond().pronoun + "没出现的旧账。</span>"; },
              onPick: function () {
                flags().baozhao_route = "ask";
                affinityOnce("node_wall", oldBond().id, 3, oldBond().favor);
              },
            },
            {
              label: "<b>什么也不问，收下纸条</b><span>把旧账暂且压在心底。</span>",
              onPick: function () {
                flags().baozhao_route = "silent";
                affinityOnce("node_wall", oldBond().id, 2, oldBond().favor);
              },
            },
            {
              label: "<b>把饼推回去</b><span>沈家不吃裴家的赏。</span>",
              onPick: function () {
                flags().baozhao_route = "refuse";
                flags().baozhao_proud = true;
                affinityOnce("node_wall", oldBond().id, 1, oldBond().favor);
              },
            },
            {
              label: function () { return "<b>顺着" + oldBond().pronoun + "的愧疚，多套一句</b><span>" + oldBond().pronoun + "欠你的，正好拿来用。</span>"; },
              onPick: function () {
                flags().baozhao_route = "exploit";
                affinityOnce("node_wall", oldBond().id, -3, "（" + oldBond().name + " 看你的眼神，凉了一分）");
                coldHeart(1);
              },
            },
            {
              label: function () { return "<b>把三年前那笔账，狠狠还给" + oldBond().pronoun + "</b><span>当年不敢露面，如今凭什么来施舍。</span>"; },
              onPick: function () {
                flags().baozhao_route = "humiliate";
                affinityOnce("node_wall", oldBond().id, -6, "（" + oldBond().name + " 的眼圈红了，却一个字辩不出来）");
                coldHeart(2);
              },
            },
          ]),
          story(function () {
            const p = oldBond();
            if (flags().baozhao_route === "exploit") {
              return '<p>沈砚没有接饼。他盯着' + p.pronoun + '，声音压得很低：“你既知道裴照临要搜山，那裴氏还有什么后手，一并说了。”</p>' +
                '<p>' + p.name + '怔住——' + p.pronoun + '是来还一点旧情的，不是来做他的探子的。可对上沈砚那双没有温度的眼睛，' + p.pronoun + '最终还是一五一十说了，声音比来时冷了许多。</p>' +
                '<p>说完，' + p.name + '把那半块饼默默收回，转身快步没入夜色，腰间那半枚玉佩晃了晃，再没有回头。沈砚捏着套来的消息，没觉得赢，只觉得心口那处，比方才更空了一分。</p>';
            }
            if (flags().baozhao_route === "humiliate") {
              return '<p>“' + p.title + '。”沈砚打断' + p.pronoun + '，唇角扯出一丝冷笑，“退婚那日，你连面都不敢露。如今裴照临要动我，你才想起来递张纸条、送块冷饼——这算什么？裴家的怜悯，我沈砚，消受不起。”</p>' +
                '<p>' + p.name + '被这几句，钉在原地。' + p.pronoun + '张了张嘴，一个字也辩不出来，眼圈却慢慢红了。良久，' + p.pronoun + '把纸条轻轻放在墙头，什么也没再说，转身走了，脚步比来时急，也比来时乱。</p>' +
                '<p>沈砚拾起那张纸条——上面的字迹，被夜露洇开了一点。他盯着看了很久，到底没舍得烧，只是把它，连同心里那点说不清的东西，一起压到了最底下。</p>';
            }
            if (flags().baozhao_route === "ask") {
              return '<p>“' + p.name + '。”沈砚叫住' + p.pronoun + '，用的是名字，不是敬称，“退婚那日，你为什么不来？”</p>' +
                '<p>' + p.pronoun + '背对着沈砚，肩膀几不可察地一抖。良久，才低低地漏出一句：“……来不了。”</p>' +
                '<p>三个字，' + p.pronoun + '没有解释，也没有回头。可沈砚分明听见，那三个字里压着的东西，比满场的哄笑还重。</p>' +
                '<p>沈砚把后面的质问咽回去。' + p.name + '似乎没料到沈砚会收住，只低声说：“那饼……趁热。”便快步没入夜色。</p>';
            }
            if (flags().baozhao_route === "refuse") {
              return '<p>沈砚把那半块饼，连同纸条，轻轻搁回墙头。“沈家就算只剩一个扫地的，也还不必吃裴家的赏。”</p>' +
                '<p>' + p.name + '怔住了。' + p.pronoun + '看着那半块被退回的饼，忽然轻声说：“当年是我们沈、裴两家定的亲，不是裴家施舍给沈家的。”</p>' +
                '<p>这句话，正正撞在三个月前裴照临那句“婚约是裴家施舍给沈家的体面”上。沈砚等那道身影走远，才拾起纸条。他没吃那饼，却记住了一件事：<b>这世上，原来还有一个姓裴的人，不觉得沈家是条狗。</b></p>';
            }
            return '<p>沈砚没有问，也没有谢。他只把那半块饼，稳稳收进怀里，挨着《天外言典》。</p>' +
              '<p>' + p.name + '等了一息，没等到质问，似乎反松了口气。' + p.pronoun + '转身要走，又顿住，极轻补一句：“那饼……趁热。”</p>' +
              '<p>纸条上没有落款，只有一行清秀小楷：卯时弃字阶的搜山布防。沈砚把纸条烧成灰——情可以收，字迹不能留，这是为那人，也是为自己。</p>';
          }, "回到月课 ▸"),
        ],
      },
    },
    {
      id: "node_pei_gift",
      title: "裴氏的回礼",
      requirementText: "需完成「墙根下的人」，并到第 9 月以后",
      unlockMonth: 9,
      canStart: function () {
        return storyIsDone("node_wall") && Game.currentMonthNumber && Game.currentMonthNumber() >= 9;
      },
      onComplete: function () {
        const f = flags();
        if (f.peiGift === "refuse" && f.peiGiftStrong) affinity(oldBond().id, 2, oldBond().favor);
      },
      chapter: {
        id: "node_pei_gift",
        title: "裴氏的回礼",
        musicMood: "ominous",
        clearSaveOnEnd: false,
        pages: [
          story(`
            <p>这一日，一辆不起眼的青篷马车停在了书院偏门。下来的人沈砚不认得，可那人腰间一支朱笔银扣——裴氏的供奉。</p>
            <p>那供奉笑眯眯递来一只锦盒：“公子说，上回那场‘邪术’，让小哥受惊了。这是赔礼。”</p>
            <p>锦盒里是一锭沉甸甸的灵银，和一纸“自愿退出三年后院试”的具结。软刀子——收了银子画了押，三年之约便不战而消。可那锭银子，是他三年都没见过的数目。</p>
          `, "掂量锦盒 ▸", "裴氏的回礼"),
          choice(`
            <p>银子很重，那纸具结却更重。沈砚指尖搭在锦盒边沿，一时没有收回。</p>
          `, [
            {
              label: "<b>原物奉还，分文不取</b><span>这种钱，烫手。</span>",
              onPick: function () {
                flags().peiGift = "refuse";
                flags().peiGiftStrong = !!strongA();
              },
            },
            {
              label: "<b>收下赔银，却退回具结</b><span>银子我要，押，免谈。</span>",
              onPick: function () {
                flags().peiGift = "take";
                // 收下却不画押：得灵石、不退赛（守藏锋·占便宜的底气来自背字）。一次性发放。
                if (!flags().peiGiftPaid) {
                  flags().peiGiftPaid = true;
                  Game.gainMoney && Game.gainMoney(60, "裴氏赔银（收下却未画押退赛）");
                }
              },
            },
            {
              label: "<b>银子收下，再反手讹裴氏一笔</b><span>既然裴家怕这桩“邪术”传出去，就让它值点钱。</span>",
              onPick: function () {
                flags().peiGift = "extort";
                grantMoneyOnce("pei_gift_extort", 60, "讹裴氏供奉的封口钱");
                flags().bossWellPrepared = true;
                coldHeart(1);
              },
            },
          ]),
          story(function () {
            if (flags().peiGift === "extort") {
              return '<p>沈砚把那锭灵银收进怀里，却没有停手。他指尖在那供奉手腕上极轻一搭，一个晦涩的天外之言无声渗入——供奉端着锦盒的手，控制不住地抖了一下。</p>' +
                '<p>“那场‘邪术’的事，”沈砚声音很轻，“传出去，怕是对裴公子的名声不太好。这点封口的意思……裴家应该出得起。”</p>' +
                '<p>供奉脸色青白交加，到底没敢发作，咬着牙又添了一笔，悻悻去了。沈砚掂着到手的灵石，唇角没有半分笑意——他知道，这一笔，裴照临迟早会连本带利，讨回去。<span class="dim">（灵石 +60；裴照临对你更为忌惮，三年之约赴约更有防备。）</span></p>';
            }
            if (flags().peiGift === "take") {
              if (strongA()) {
                return '<p>沈砚伸手，把那锭灵银收进了怀里，却拈起那纸具结，指尖一搭——一个晦涩的天外之言无声渗入，供奉的手猛地一抖。</p>' +
                  '<p>“银子我收下了，”沈砚把具结轻轻推回，声音平得没有起伏，“退赛的话，三年后我自己上台说。”</p>' +
                  '<p>那供奉张了张嘴，到底没敢吭声，揣着那纸空文匆匆去了。<span class="dim">（赔银 +60 灵石入袋，约未改；裴氏赔了夫人又折兵。背下的字，今日替你既挣了里子，又留了脸面。）</span></p>';
              }
              return '<p>沈砚伸手，把那锭灵银收进了怀里，又把退赛的具结，轻轻推了回去，一个字都没解释。</p>' +
                '<p>那供奉愣了愣，想发作，又顾忌着自己亲口说的“赔礼”二字——总不能当众承认这是收买。他冷哼一声，悻悻去了。</p>' +
                '<p class="dim">（赔银 +60 灵石入袋，约未改。你没认怂，这点便宜也没客气——可底气还是薄，真要不怕这种人，还得把字啃下去。）</p>';
            }
            if (strongA()) {
              return '<p>沈砚没有去看那锭银子。他抬眼，指尖在那供奉手腕上极轻地一搭——一个晦涩的天外之言无声渗入，对方端着锦盒的手，竟控制不住地抖了一下。</p>' +
                '<p>“赔礼太重，”沈砚把整只锦盒轻轻推回，“裴公子的话，三年后我当面去听。”</p>' +
                '<p>那供奉脸色一变，匆匆去了。<span class="dim">（银子分文未取；你背下的字，今日替你挣回了体面，裴氏忌惮三年之约。）</span></p>';
            }
            return '<p>沈砚盯着那锭银子看了很久。他没有画押，也没有收银，只是垂着眼，把整只锦盒推了回去，一个字都没多说。</p>' +
              '<p>那供奉冷笑一声，临走“不慎”撞翻了他刚扫好的一整阶落叶，扬长而去。沈砚弯下腰，一片一片，重新扫起。</p>' +
              '<p class="dim">（你没有屈服，可也没有还手的力气。想让这种人不敢撞你的扫帚，只有一个法子：把字啃下去。）</p>';
          }, "回到月课 ▸"),
        ],
      },
    },
    {
      id: "node_evil_rumor",
      title: "流言四起",
      requirementText: "需完成「裴氏的回礼」，并到第 15 月以后",
      unlockMonth: 15,
      canStart: function () {
        return storyIsDone("node_pei_gift") && Game.currentMonthNumber && Game.currentMonthNumber() >= 15;
      },
      onComplete: function () {
        meet("qin_fuzi");
        affinity("qin_fuzi", Game.state.realmIndex >= 2 ? 4 : 2, "（秦夫子在你的卷上，多画了一个圈）");
      },
      chapter: {
        id: "node_evil_rumor",
        title: "流言四起",
        musicMood: "ominous",
        clearSaveOnEnd: false,
        pages: [
          story(`
            <p>不知从哪一日起，“沈砚以邪术伤人”的话，传遍了书院。月课堂里，他一进门，半排人挪开了座。</p>
          `, "面对满堂避讳 ▸", "流言四起"),
          story(function () {
            if (Game.state.realmIndex >= 2) {
              grantMoneyOnce("rumor_hush", 30, "怕事同窗的赔罪礼");
              return '<p>沈砚没有辩。恰好这一日，月课考较真言成形，一名素来嘲他最凶的内门弟子，真言迟迟凝不出。</p>' +
                '<p>沈砚信手在自己案上写了个字。那字旁人看是鬼画符，他识海里却已凝成一缕清晰的言气，稳稳托起——满堂哗然。</p>' +
                '<p>他什么也没解释，收了字。可那日之后，“邪术”二字，悄悄改了味。</p>' +
                '<p>当夜，一个传过谣的同窗在他门缝下塞进一只小布包，几十枚灵石，压着张没署名的纸条：“对不住，往后再不敢嚼舌。”沈砚看了一眼，没退回去——这种赔礼，收得心安。<span class="dim">（灵石 +30）</span></p>';
            }
            return '<p>沈砚想辩，却发现自己连开口的立场都没有——他这点修为，凝一缕言气都勉强，旁人凭什么信他不是邪术？</p>' +
              '<p>那一月，他打的洗脸水被人倒过三回，扫好的院子被人踩脏两趟。他没作声，一遍遍重打、重扫。</p>';
          }, "领卷退下 ▸"),
          portrait(story(`
            <p>月课批卷，轮到沈砚。秦夫子捏着他的卷子，从鼻孔里哼出一声：“朽木不可雕——懂么？老夫教书三十年，见过的朽木比你扫过的落叶还多。你这块……”</p>
            <p>他顿了顿，把那卷子往最上头一搁，压在所有人之上。“……还不够格当朽木。坐下。”</p>
            <p>满堂没人听懂这是骂还是夸。只有沈砚看见，那卷子被搁上去时，秦夫子枯瘦的手指，不着痕迹地，把它的边角拨得整整齐齐。<span class="dim">（人物谱：秦夫子 已相识）</span></p>
          `, "回到月课 ▸"), "../素材/人物/qin-fuzi.png", "秦夫子", "right"),
        ],
      },
    },
    {
      id: "node_erliang_errand",
      title: "陪二两办件事",
      requirementText: "需完成「流言四起」，并到第 18 月以后",
      unlockMonth: 18,
      canStart: function () {
        return storyIsDone("node_evil_rumor") && Game.currentMonthNumber && Game.currentMonthNumber() >= 18;
      },
      chapter: {
        id: "node_erliang_errand",
        title: "陪二两办件事",
        musicMood: "read_warm",
        clearSaveOnEnd: false,
        pages: [
          portrait(story(`
            <p>二两这几日蔫头耷脑。沈砚一问才知道：他攒了大半年、想换一本《引气浅要》的灵石，被管杂役的内门弟子“借”走了，明摆着不打算还。</p>
            <p>“算了算了，”二两摆手，嘴上满不在乎，眼圈却红，“我这种资质，看了那书，也未必引得动气……三个馒头的本，亏就亏了。”</p>
          `, "管这闲事？ ▸", "陪二两办件事"), "../素材/人物/er-liang.png", "二两", "right"),
          choice(`
            <p>沈砚看着他——这个把每一分人情都记在本子上、却把唯一一次为自己的奢望，轻描淡写说成“亏本”的人。</p>
          `, [
            {
              label: "<b>出面替他要回</b><span>有些账，不能这么算。</span>",
              onPick: function () {
                flags().erliangErrand = "recover";
                affinityOnce("node_erliang_errand", "er_liang", strongA() ? 5 : 3, "（二两 把你记进了他那本账）");
              },
            },
            {
              label: "<b>陪他熬过去</b><span>要不回灵石，也不能让他一个人丢掉希望。</span>",
              onPick: function () {
                flags().erliangErrand = "comfort";
                affinityOnce("node_erliang_errand", "er_liang", 3, "（二两 把你记进了他那本账）");
              },
            },
            {
              // 灵石门槛 40（可调）：用你自己攒的钱赎回那本《引气浅要》。够钱才能选。
              label: "<b>替他垫上灵石</b><span>用你自己攒的灵石，把那本《引气浅要》赎回来。（40 灵石）</span>",
              lockedLabel: "<b>替他垫上灵石</b><span class=\"dim\">你囊中羞涩，凑不齐那笔钱。（需 40 灵石）</span>",
              enabled: function () { return (Game.state.money || 0) >= 40; },
              onPick: function () {
                flags().erliangErrand = "pay";
                Game.spendMoney && Game.spendMoney(40, "替二两赎回《引气浅要》");
                affinityOnce("node_erliang_errand", "er_liang", 6, "（二两 红着眼，把你这一笔，记进了账本最前页）");
              },
            },
            {
              label: "<b>懒得管这闲事</b><span>你自己都泥菩萨过江，何必替一个乞儿出头。</span>",
              onPick: function () {
                flags().erliangErrand = "ignore";
                affinityOnce("node_erliang_errand", "er_liang", -4, "（二两 脸上的笑淡了，那点指望，他自己收了回去）");
                coldHeart(1);
              },
            },
            {
              label: "<b>点破他那点可怜的指望</b><span>早点让他认清没人会帮他，也算一种“好”。</span>",
              onPick: function () {
                flags().erliangErrand = "crush";
                affinityOnce("node_erliang_errand", "er_liang", -8, "（二两 第一次没接上话，塞饼的手，僵了一下）");
                coldHeart(2);
              },
            },
          ]),
          story(function () {
            if (flags().erliangErrand === "ignore") {
              return '<p>沈砚看了他一眼，把到嘴边的话，咽了回去。“……算了。你自己的事，自己想办法。”</p>' +
                '<p>二两愣了一下，随即咧嘴笑起来，笑得比平常还大声：“对哈！你说得对，我瞎操心啥。”</p>' +
                '<p>他把那点没说出口的指望，自己收了回去。沈砚转身走开，没有看见——二两翻开那本油乎乎的账本，在他名字后面顿了很久，终究没有再记下新的一笔。</p>';
            }
            if (flags().erliangErrand === "crush") {
              return '<p>“二两，”沈砚的声音很平，平得没有温度，“别指望别人替你出头。这世道，谁的账都得自己认——你那点‘会好起来’的指望，趁早收了，省得日后摔得更疼。”</p>' +
                '<p>二两脸上的笑，一点一点僵住。他张了张嘴，第一次，没接上话。</p>' +
                '<p>那天之后，二两还是照旧咧嘴笑、照旧算他的账，只是再塞饼给沈砚时，动作里，多了一丝说不清的生分。<b>有些光，被人亲手掐灭过一回，就很难再亮回原来的样子。</b></p>';
            }
            if (flags().erliangErrand === "pay") {
              return '<p>沈砚没去和那内门弟子理论，也没空口安慰。他默不作声地数出自己一点点攒下的灵石，去杂役房，把那本《引气浅要》赎了回来，轻轻放进二两手里。</p>' +
                '<p>二两捧着书，手抖个不停。他张了张嘴，本想照例算一句“这得记多大一笔账”，可话到嘴边，眼泪先掉了下来。</p>' +
                '<p>“……你这傻子，”他低着头，声音闷得几乎听不清，“那是你自己的灵石啊。”他翻开那本油乎乎的账本，在最前面一页，一笔一画，认认真真写下了沈砚的名字。<b>这一笔，他记了一辈子。</b></p>';
            }
            if (flags().erliangErrand === "recover" && strongA()) {
              return '<p>沈砚找到那名“借”灵石的内门弟子，没动手，只在错身时，极轻地说了一句他听不懂、却莫名脊背发凉的话。</p>' +
                '<p>当天傍晚，那袋灵石被人“主动”送回了杂役房，附带一句结结巴巴的“先前拿错了”。</p>' +
                '<p>二两捧着失而复得的灵石，张大嘴看着沈砚，半天憋出一句：“你……你这朋友，我交定了。”他翻开账本，又顿住，把笔一搁——这一笔，他没记。</p>';
            }
            return '<p>沈砚去理论，可他这点身份，那弟子正眼都欠奉。灵石没要回来。</p>' +
              '<p>他没说空话安慰，只回头把自己那本翻得起毛的《引气浅要》旧抄本，塞给了二两：“我抄的，字丑。你将就看。”</p>' +
              '<p>二两捧着那本旧抄，愣了好久。“……你这人，真不会做生意。亏本买卖。”可他把那抄本，宝贝似的揣进了怀里最里头。</p>';
          }, "回到月课 ▸"),
        ],
      },
    },
    {
      id: "node_first_fruit_clue",
      title: "第一缕异果线索",
      requirementText: "需完成「陪二两办件事」，并达到凝言境或到第 14 月以后",
      unlockMonth: 14,
      canStart: function () {
        return storyIsDone("node_erliang_errand") &&
          (Game.state.realmIndex >= 2 ||
            (Game.currentMonthNumber && Game.currentMonthNumber() >= 14));
      },
      onComplete: function () {
        grantItemsOnce("fruit_clue_relic", { "凝言髓": 1, "古篆残片": 2 }); // 残卷灼烫退去凝出的残料
      },
      chapter: {
        id: "node_first_fruit_clue",
        title: "第一缕异果线索",
        musicMood: "puzzle_tense",
        clearSaveOnEnd: false,
        pages: [
          story(`
            <p>子时三刻，杂役房的油灯早灭了。沈砚却被识海里一阵灼烫烧醒——怀里那卷《天外言典》正无风自动，残页一张张翻过，纸页摩擦的声响轻得像谁伏在耳边吐息。</p>
            <p>他指尖按上去，那股灼烫顺着经脉直窜上来，烫得他几乎要叫出声，却又死死咬住了牙。三年里他学会的头一件事，就是再疼，也不能出声。</p>
            <p>残页停在一处空白上。没有本土灵文，没有真言，只有一缕极淡的气息自纸面渗出，顺着识海一路向北——清晰得不像幻觉，倒像有什么东西，正在那个方向，等着他。</p>
            <p>灼烫退去时，纸缝里竟簌簌落下几点温润的言髓，和两片残缺的古篆——像是天外之言流转一夜，凝在了现世。沈砚小心收起。<span class="dim">（凝言髓 ×1、古篆残片 ×2）</span></p>
          `, "凝神细听 ▸", "第一缕异果线索"),
          story(`
            <p>“向北。”那道藏言楼的残魂再度响起，断续，却比以往任何一次都笃定，“雾岭深处，有一缕‘果香’。”</p>
            <p>“那是一枚异果，早脱了草木形骸，自成精怪。天地间散着十枚这样的果——得一枚，便是一段旁人求不来的道基。”</p>
            <p>沈砚把“异果”二字压进识海。他想起残卷里那些无人能解的天外之言，又想起自己这具被人踩在脚底的凡身，第一次隐约摸到一条比三年之约更长、更远的路的边沿。</p>
            <p>可那点雀跃只撑了一息。残魂的下半句，像一盆兜头冷水：“……但凭你如今这点根基，此刻闯进雾岭，不是你食它——是它食你。”</p>
          `, "权衡去留 ▸"),
          choice(`
            <p>果香在识海北端若隐若现，像一根钓线，悬着一枚他暂时够不着的饵。</p>
          `, [
            {
              label: "<b>即刻探明</b><span>趁线索还新，先去雾岭探个虚实。</span>",
              onPick: function () {
                flags().fruitZoneUnlocked = true;
                flags().fruitChoice = "seek";
              },
            },
            {
              label: "<b>先备底牌</b><span>多攒几分境界与丹器，再赴险地。</span>",
              onPick: function () {
                flags().fruitChoice = "prepare";
              },
            },
          ]),
          story(function () {
            if (flags().fruitChoice === "seek") {
              return '<p>沈砚还是把雾岭的方位，一笔一划刻进了识海。</p>' +
                (flags().towerBond ? '<p>那道残魂沉默片刻，似是认可了他的孤勇，又多吐露半句：“果核入腹，方成道基。取之有两途——杀其持有者而夺，或待其心甘情愿，双手奉上。”他默默记下，只觉得后一条，听起来比前一条还难。</p>' : '') +
                '<p>他不知道自己够不够格去碰那枚果。可有些路，得先把脚迈出去，才知道腿够不够长。<span class="dim">（雾岭外谷已定位；可探残髓，真果不在野外采集。）</span></p>';
            }
            return '<p>沈砚没有急着北上。</p>' +
              '<p>他低头看了看自己这双手——三年扫地磨出的茧，握扫帚稳，握刀却还嫌嫩。有些猎物，要等自己长出足够的牙，才配去碰；提前扑上去，只是把命白白喂进对方嘴里。</p>' +
              '<p>雾岭的果香被他压进识海最深处，像埋下一粒种子。他记着方位，也记着那句“是它食你”——总有一天，他要让这句话，反过来。</p>';
          }, "回到月课 ▸"),
        ],
      },
    },
    {
      id: "node_mist_chance",
      title: "雾岭外的机缘",
      requirementText: "需完成「第一缕异果线索」，并到第 21 月以后",
      unlockMonth: 21,
      // 高重要度机缘：解锁后须在第 30 月前赴约，拖过则果香易主、永久错失这枚异果道基资格。
      // 守力量铁律：错过=失去一条路（资格/线索），不掉属性、不走弱路；后期补救要付更大代价（钩子）。
      deadline: 30,
      canStart: function () {
        return storyIsDone("node_first_fruit_clue") && Game.currentMonthNumber && Game.currentMonthNumber() >= 21;
      },
      onMissed: function () {
        flags().fruitMissed = true;        // 失去这枚异果道基资格
        flags().fruitRecoverCostly = true; // 后期补救须付更大代价（留给正式版/后续支线的钩子）
      },
      onComplete: function () {
        if (flags().fruitMissed) return;   // 错失机缘则无所获
        grantMoneyOnce("mist_haul", 40, "雾岭带回的山货");
        grantItemsOnce("mist_relic", { "异果果髓": 1 });
      },
      // 过期改演：越过第 30 月仍未赴约时，storyflow 改用这段"错过"正文。
      missedChapter: {
        id: "node_mist_chance",
        title: "错失的机缘",
        musicMood: "puzzle_tense",
        clearSaveOnEnd: false,
        pages: [
          story(`
            <p>子时，识海北端那缕牵了他许久的果香，毫无征兆地——断了。</p>
            <p>不是被瘴气掩住，是干干净净地，没了。仿佛有人一把将那枚悬在他够不着处的果子，从枝头摘走。</p>
          `, "凝神探问 ▸", "错失的机缘"),
          story(`
            <p>那道残魂久违地开口，语气里第一次有了近乎叹息的东西：“迟了。雾岭那枚异果，已易他人之手。”</p>
            <p>“天地间散着十枚这样的果，得一枚便是一段道基。可它们从不等人——你犹豫的这些时日，自有比你更急、更狠的人，先一步动了手。”</p>
            <p>沈砚沉默良久。他想起自己一次次把“去雾岭”往后推：先把境界养稳些、先把那点丹器备齐些……桩桩件件都有道理，可机缘不认道理，只认谁先到。</p>
            <p>“记住这一回，”残魂的声音淡下去，“往后再有这样的果香——别再让它，等你。”<span class="dim">（雾岭异果·已易主；这枚道基资格，永久错失。）</span></p>
          `, "回到月课 ▸"),
        ],
      },
      chapter: {
        id: "node_mist_chance",
        title: "雾岭外的机缘",
        musicMood: "puzzle_tense",
        clearSaveOnEnd: false,
        pages: [
          story(`
            <p>雾岭凶险，残魂说过，以他如今的根基，独闯九死一生。临行前，他可以带一个人……也可以谁都不带。</p>
            <p>残魂又低低提醒了一句：“那缕果香不会一直悬着——天地间求果的，不止你一个。早些去。”<span class="dim">（机缘有期限，拖过则错失。可在主页「推进剧情」处查看还剩多少月。）</span></p>
          `, "决定同行者 ▸", "雾岭外的机缘"),
          choice(`
            <p>这一路要摸到异果所在，却不能真的去碰它。带谁同行，也是一种取舍。</p>
          `, [
            {
              label: function () { return "<b>带" + oldBond().name + "</b><span>" + oldBond().pronoun + "懂裴氏门路。</span>"; },
              onPick: function () {
                flags().mist_with = "pei_zhao";
                affinityOnce("node_mist_main", oldBond().id, 4, oldBond().favor);
                affinityOnce("node_mist_cost", "er_liang", -1, "（二两 嘟囔着，往你账上记了一笔“亏”）");
              },
            },
            {
              label: "<b>带二两</b><span>怂归怂，多双手。</span>",
              onPick: function () {
                flags().mist_with = "er_liang";
                affinityOnce("node_mist_main", "er_liang", 4, "（二两 把你记进了他那本账）");
              },
            },
            {
              label: "<b>带二两——真出事，也有个挡在前头的</b><span>他那条命，眼下，比你的贱。</span>",
              onPick: function () {
                flags().mist_with = "er_liang";
                flags().mistColdUse = true;
                coldHeart(2);
                affinityOnce("node_mist_main", "er_liang", 2, "（二两 只当你终于肯带他，乐颠颠地就来了）");
              },
            },
            {
              label: "<b>独自去</b><span>不连累任何人。</span>",
              onPick: function () {
                flags().mist_with = "alone";
                affinityOnce("node_mist_main", "er_liang", -1, "（二两 嘟囔着，往你账上记了一笔“亏”）");
              },
            },
          ]),
          portrait(story(function () {
            if (flags().mist_with === "pei_zhao") {
              const p = oldBond();
              return '<p>' + p.name + p.mist + '。</p>' +
                '<p>“你怎么……这么熟门路？”沈砚低声问。' + p.pronoun + '脚步没停：“裴氏的耳目，我从小学着躲。”</p>' +
                '<p>歇脚时，' + p.pronoun + '摩挲着腰间那半枚玉佩，裂口深处似有一丝极淡的光华，一闪即逝。沈砚把这一闪的光华，连同那一瞬的慌，一起记进了识海。<span class="dim">（埋 玉佩藏物 F5）</span></p>';
            }
            if (flags().mist_with === "er_liang") {
              if (flags().mistColdUse) {
                return '<p>二两一路念叨，嘴上说十成十赔本，脚步却跟得比谁都紧。沈砚听着他的碎碎念，心里早把利害算过一遍：真出事，多一个人挡在前头，总比独自硬扛强。</p>' +
                  '<p>话没念完，雾里窜出一只异果精怪，扑向沈砚后心。二两脑子还没反应，人已经先扑了上去，一把将沈砚推开，自己被尾鞭抽得滚出去老远。</p>' +
                  '<p>夜里生火疗伤，他疼得眼泪都出来，却还咧嘴：“记账上啊，你又欠我半条命。”沈砚瞥见他账本最后一页，那上面写着：<b>沈砚，会成大器。</b>他算计的那点冷，第一次硌得心口发疼。</p>';
              }
              return '<p>“我跟你说啊，这趟十成十赔本！”二两一路念叨，腿肚子直转筋。</p>' +
                '<p>话没念完，雾里窜出一只异果精怪，扑向沈砚后心。二两脑子还没反应，人已经先扑了上去，一把将沈砚推开，自己被尾鞭抽得滚出去老远。</p>' +
                '<p>夜里生火疗伤，他疼得眼泪都出来，却还咧嘴：“记账上啊，你又欠我半条命。”沈砚瞥见他账本最后一页，那上面写着：<b>沈砚，会成大器。</b></p>';
            }
            return '<p>沈砚谁也没带。有些险，他不愿分给别人。</p>' +
              '<p>雾岭深处，残魂罕见地多说了几句：“上一个这样独闯雾岭的，也是这般倔。”</p>' +
              '<p>“上一个？”沈砚心头一动。残魂沉默良久，才极轻地吐出半句：“读得懂我的人，你不是第一个。能走到最后的……一个都没有。”<span class="dim">（埋 历代言典持有者 F10）</span></p>';
          }, "摸到果香 ▸"), function () {
            if (flags().mist_with === "pei_zhao") return oldBond().art;
            if (flags().mist_with === "er_liang") return "../素材/人物/er-liang.png";
            return "";
          }, function () {
            if (flags().mist_with === "pei_zhao") return oldBond().name;
            if (flags().mist_with === "er_liang") return "二两";
            return "";
          }, "right"),
          story(function () {
            let tail = "";
            if (flags().mist_with === "pei_zhao") {
              tail = '<p>回书院后，二两酸溜溜地凑过来：“行啊你，宁可带个裴家的，也不带我。我这条命……啧，原来在你账上不值钱。”嘴上骂着，眼里却是真受了点伤。</p>';
            } else if (flags().mistColdUse) {
              tail = '<p>回书院后，二两一瘸一拐地把山货往沈砚怀里塞，还笑说这趟总算没亏。沈砚接过东西，没有立刻说话——有些账，他原以为算得清，如今却忽然不敢往下算。</p>';
            } else if (flags().mist_with === "alone") {
              tail = '<p>回书院后，二两气得直拍大腿：“你又一个人去送死？下回再这样，你欠我的命，我可不记了！”嘴上撂狠话，转头却往沈砚药碗里，多搁了一勺糖。</p>';
            }
            return '<p>无论独行还是同行，沈砚终于在雾岭最深处，触到了那缕“果香”的源头——一道被瘴气护着的山谷。</p>' +
              '<p>残魂的声音响起：“就是这里。可你如今的根基，还碰不得它。记住这个地方——来日，再回来取。”</p>' +
              '<p>沈砚把山谷的方位，一笔一画刻进识海。此行虽未夺果，他却没空手回——谷外瘴雾边缘，散落着被果香浸养过的残髓，还有几样雾岭独有、坊市抢手的山货，他一并收进了行囊。<span class="dim">（雾岭异果·已定位；灵石 +40、异果果髓 ×1）</span></p>' + tail;
          }, "回到月课 ▸"),
        ],
      },
    },
    {
      id: "node_pei_spy",
      title: "暗处的眼睛",
      requirementText: "需完成「雾岭外的机缘」，并到第 27 月以后",
      unlockMonth: 27,
      canStart: function () {
        return storyIsDone("node_mist_chance") && Game.currentMonthNumber && Game.currentMonthNumber() >= 27;
      },
      chapter: {
        id: "node_pei_spy",
        title: "暗处的眼睛",
        musicMood: "ominous",
        clearSaveOnEnd: false,
        pages: [
          story(`
            <p>临近三年之约，沈砚察觉，弃字阶外那几道目光，换了花样——不再是寻衅，而是窥探。</p>
            <p>有人在替裴照临，摸他的底：他到底靠的是什么，那“邪术”，究竟是不是真有第二次。</p>
          `, "凝神反查 ▸", "暗处的眼睛"),
          story(function () {
            if (senseStrong()) {
              flags().bossUnderprepared = true;
              return '<p>沈砚识海一沉，神识如水面铺开。那道窥探的灵识刚一探来，便被他不动声色地缠住、反读了个干净。</p>' +
                '<p>他顺势喂了对方一缕假象：识海空空，那点“邪术”早已是强弩之末。探子满意地去了，带走了一个全错的结论。</p>' +
                '<p class="dim">（你藏住了底牌。三年之约，裴照临将带着错误判断赴战。）</p>';
            }
            flags().bossWellPrepared = true;
            return '<p>沈砚想反查，却发现自己的神识还太浅，那道灵识滑不溜手，竟被它把识海里的虚实，探了个七七八八。</p>' +
              '<p>探子去了。沈砚立在原地，心头发沉——三年后台上那个人，会比他预想的，更有防备。</p>' +
              '<p class="dim">（被探知虚实。三年之约会更难缠，但仍非死局。）</p>';
          }, "回到月课 ▸"),
        ],
      },
    },
    {
      id: "node_eve_of_vow",
      title: "临战前夜",
      requirementText: "需到第 33 月以后，且三年之约尚未处理",
      unlockMonth: 33,
      timeCostMonths: function () {
        var m = Game.currentMonthNumber ? Game.currentMonthNumber() : 33;
        return Math.max(1, 36 - m);
      },
      timeCostText: function (n) {
        return n > 1 ? "耗尽最后 " + n + " 月" : "耗时 1 月";
      },
      canStart: function () {
        var m = Game.currentMonthNumber ? Game.currentMonthNumber() : 0;
        var f = Game.state.flags;
        return m >= 33 && !(f.vowBossDone || f.vowBossLost || f.vowBossSkipped);
      },
      chapter: {
        id: "node_eve_of_vow",
        title: "临战前夜",
        musicMood: "read_soft",
        clearSaveOnEnd: false,
        pages: [
          story(`
            <p>三年之约的前夜，沈砚鬼使神差，又踱回了灶房。</p>
            <p>“聋伯，我明日要上院试台。”</p>
            <p>聋伯添着柴，头也不抬：“啊？你说明日……要扫院子？扫吧扫吧，灰大。”</p>
            <p>沈砚张了张嘴，到底没纠正。三年了，跟这聋老头说话，从来如此。他转身要走。</p>
            <p>“坐。”</p>
            <p>这一个字，清清楚楚。沈砚僵在原地——三年里，他从没听聋伯把一个字，说得这么清楚过。</p>
          `, "坐下 ▸", "临战前夜"),
          story(`
            <p>聋伯没回头，火钳在灶沿上一下一下地刻。火光把他佝偻的影子投在墙上，忽明忽暗。</p>
            <p>“沈家那小子，”他开口，声音不再含混，“我认得你爷爷。那年……他和裴家老太爷并称的那年，我也站在院试台上。”</p>
            <p>“我那时候，背字比你还快。后来呢……被裴家的人，一手按了下去。断了道，除了名。我没疯，也没死——<b>我就想，活下去吧，活下去。烧火，也是活。</b>”</p>
          `, "听他说完 ▸"),
          story(`
            <p>聋伯转过身，把一截乌黑的、像是烧不化的炭，塞进沈砚手里。</p>
            <p>那截炭入手，竟是温的。沈砚识海猛地一烫——《天外言典》在里头，极轻地、极反常地，动了一下，像是认得这截炭里封着的什么。</p>
            <p>“明日，”聋伯说，“别扫院子了。”</p>
            <p>“去把那台子，给我踩平了。”<span class="dim">（聋伯 +20 · 解锁义结缔结点）</span></p>
          `, "握紧黑炭 ▸"),
          story(`
            <p>上台前一夜，二两在草席上翻来覆去，终于憋不住凑过来。</p>
            <p>“那个……明天那场，”他难得没算账，搓着手，“我帮不上忙，灵石也没几颗。我就……”他从破碗底下摸出半块省下来的麦饼，塞给沈砚，“吃饱了，有力气揍他。”</p>
            <p>沈砚接过那半块饼。二两别开脸，闷声补了一句，声音发抖却认真：<b>“你要是真飞起来了……记得当初有个二两，劝过你别飞。”</b><span class="dim">（二两 +3）</span></p>
          `, "收好麦饼 ▸"),
          portrait(story(function () {
            flags().ashuang_glimpse = true;
            meet("a_shuang");
            const f = frostBond();
            if (flags().baozhao_route) {
              const p = oldBond();
              return '<p>院试榜前，裴照临忽然当众转向沈砚：“你一个引不动文气的废物，三个月里境界却涨得蹊跷。是不是……有人在背后，递了你什么东西？”</p>' +
                '<p>沈砚顺着那道目光，看见了人群边缘的' + p.name + '。' + p.pronoun + '脸色发白，攥紧了袖口。只要沈砚露出半分与' + p.pronoun + '相关的神色，那夜墙根下的相见，就全成了' + p.pronoun + '“通敌”的罪证。</p>' +
                '<p>“裴公子说笑了。”沈砚声音冷得像石阶，“我一个扫地的，谁会正眼看我？更别说——裴家的人。”</p>' +
                '<p>人群散去后，他脚边不知何时多了一卷《历届院试·裴氏门人比斗手札》。没有落款。可那纸角，沾着一点极淡、洗不净的墨痕。' + p.pronoun + '什么都懂，却什么都没计较。</p>' +
                '<p>沈砚把手札收入袖中，又看见远处演武场上，' + f.short + '<span class="dim">' + f.meetText + '</span></p>';
            }
            return '<p>院试榜前人群如潮。沈砚在人群最外圈停了一息，看见远处演武场上，' + f.short + '</p>' +
              '<p>他只看了一眼便收回目光。书院里每个人都有自己的台子，只是明日，该轮到他了。<span class="dim">' + f.meetText + '</span></p>';
          }, "走向院试榜 ▸"), function () { return frostBond().art; }, function () { return frostBond().name; }, "right"),
          story(`
            <p>这一日，院试榜张贴在书院正门。朱砂写就的名字在晨光里红得刺眼。</p>
            <p>人群挤在榜前。有人念到“沈砚”二字时，特意把声调拖长，引来一阵压低的哄笑——三年前那个被当众退婚、被唤作“扫地的狗”的废物，竟也敢把名字挂上院试榜。</p>
            <p>沈砚提着扫帚立在人群最外圈，没有挤进去。他不必看：那两个字是他拿三年灰尘换来的，刻在哪儿他都认得。</p>
            <p>裴照临从榜前走过，停了一息。他没有看沈砚，只对着那张榜淡淡留下一句，像在说一件早已注定的闲事：“三年了。让我看看，那天，是不是侥幸。”</p>
          `, "夜不能寐 ▸", "临战前夜"),
          story(`
            <p>那一夜，杂役房的灯亮到天明。</p>
            <p>沈砚盘膝坐在草席上，摊开五指。三年里背下的每一个天外之言、渡过的每一道雷劫、咽下的每一句轻蔑，此刻都沉在识海里，像一池蓄到将满的水，只差一个决口。</p>
            <p>窗外更声一更一更地敲，敲得他心口发紧。他比谁都清楚：这三年攒下的根基有多深，那一日台上的胜负，就有多稳。</p>
            <p>只剩最后一个决定——是把仅剩的时日全押上去，再逼自己一把；还是稳住心神、养精蓄锐，静待那一日。</p>
          `, "做出抉择 ▸"),
          choice(`
            <p>更声又是一记。距三年之约，只剩最后几月。</p>
          `, [
            {
              label: "<b>闭死关，临阵磨枪</b><span>把剩下的时日都押在修炼与丹器上。</span>",
              onPick: function () {
                flags().vowReady = true;
                flags().eveChoice = "grind";
              },
            },
            {
              label: "<b>静待其时，藏锋如故</b><span>该来的躲不掉，先稳住心神。</span>",
              onPick: function () {
                flags().eveChoice = "calm";
              },
            },
          ]),
          story(function () {
            if (Game.state.realmIndex >= 2) {
              return '<p>沈砚闭上眼。三年磨一字，如今识海稳如深潭，言气盈满四肢百骸，连呼吸都比从前沉了三分。</p>' +
                '<p>他已无须再问胜负——只等那一日上台，把三年前满场的轻蔑，一分不少，原数奉还。</p>';
            }
            return '<p>夜里，沈砚再次摊开五指。言气在掌心流转，却还浅——离他想要的那一截，差得他自己都心慌。</p>' +
              '<p>胜负仍在五五之间。他没有把握，身后却早没了退路。还差一口气而已——那就用最后这点时日，把这口气，从牙缝里硬挣回来。</p>';
          }, "回到月课 ▸"),
        ],
      },
      onComplete: function () {
        affinity("long_bo", 20, "（灶房那盏灯，为你多留了一会儿）");
        affinity("er_liang", 3, "（二两 把你记进了他那本账）");
        if (flags().baozhao_route) affinity(oldBond().id, 2, oldBond().favor);
        if (flags().ashuang_glimpse) meet("a_shuang");
      },
    },
    {
      id: "node_after_vow",
      title: "约后 · 分流",
      requirementText: "需先处理三年之约：胜、败或避战",
      canStart: function () {
        var f = Game.state.flags;
        return !!(f.vowBossDone || f.vowBossLost || f.vowBossSkipped);
      },
      onComplete: function () {
        var f = flags();
        if (f.vowBossDone) { f.vowRep = "雪耻"; }
        else if (f.vowBossLost) { f.vowRep = "败约"; f.grudge = true; }
        else if (f.vowForfeit) { f.vowRep = "失约"; f.thornLeft = true; f.disgrace = true; } // 拖到失约：比避战更难堪
        else if (f.vowBossSkipped) { f.vowRep = "避锋"; f.thornLeft = true; }
        f.actOneDone = true;
        // 离院盘缠 + 护身（秦夫子盘缠 + 一枚没有落款的护符）——配角们不说出口的牵挂。
        grantMoneyOnce("parting_purse", 100, "离院盘缠");
        grantGearOnce("parting_talisman", "liuyun_talisman");
      },
      chapter: {
        id: "node_after_vow",
        title: "约后 · 分流",
        musicMood: "battle_end",
        clearSaveOnEnd: false,
        pages: [
          story(function () {
            var f = flags();
            if (f.vowBossDone) {
              return '<p>要走了。沈砚最后一次回杂役房。</p>' +
                '<p>二两堵在门口，搓着手，欲言又止，最后从怀里塞给他一包硬邦邦的干粮：“路上吃。我、我就不送了啊，丢人。”转身抹了把脸，声音发哽，“……你真成了。”</p>' +
                '<p>灶房的方向，那盏灯还亮着。沈砚远远望了一眼，没有过去——聋伯不喜欢告别，他知道。可他知道，那把火，今夜一定旺。</p>';
            }
            if (f.vowBossLost) {
              return '<p>要走了。沈砚最后一次回杂役房。</p>' +
                '<p>二两破天荒没算账，只重重拍了他肩一下：“输一场怎么了！账还长着呢，咱慢慢挣回来。”嘴硬，眼圈却红。</p>' +
                '<p>灶房的灯亮着。聋伯没问输赢，只往他手里塞了块热红薯，含混道：“火……没灭。下回的。”<b>这世上输了还肯给你留口热乎的，没几个。</b></p>';
            }
            if (f.vowForfeit) {
              return '<p>要走了。沈砚最后一次回杂役房。</p>' +
                '<p>二两这回没替他辩半句，只闷头把账本翻得哗哗响，半晌憋出一句：“你那日……连去都没去。”说完别过脸，声音低下去，“我不是怪你。我就是……替你不甘。”</p>' +
                '<p>灶房的灯还亮着。聋伯没塞红薯，也没拨火，只是看了他一眼，那眼神里头一回有了几分沉：“躲得过一时的羞，躲不过自己夜里那关。火给你留着——可这道坎，得你自己迈。”</p>';
            }
            return '<p>要走了。沈砚最后一次回杂役房。</p>' +
              '<p>二两没敢多问他为何避战，只低声道：“躲一时不算怂……我懂。”又飞快补一句，“那根刺，你记着就行，别自己跟自己过不去。”</p>' +
              '<p>灶房的灯还亮着。聋伯似乎什么都知道，什么都没说，只把火拨得旺了些：“路……自己走。火，给你留着。”</p>';
          }, "向书院外去 ▸", "约后 · 故人"),
          story(function () {
            var f = flags();
            if (f.vowBossDone) {
              return '<p>裴照临单膝触地的那一刻，满场死寂。</p>' +
                '<p>没人看懂他是怎么败的——那不是本土灵文的任何一种术法，灵光碎裂得无声无息，像被一只看不见的手，从根上掐断。三年扫地的灰，在这一息里，终于落定。</p>' +
                '<p>“扫言童子”四个字，从此再没人敢当着沈砚的面提起。可他立在台上，听着脚下渐起的喧哗，心里却异样地静——他知道自己只露了几分，更知道，这一战之于他要走的路，不过是第一个字而已。</p>';
            }
            if (f.vowBossLost) {
              return '<p>沈砚是被人从台上扶下来的。</p>' +
                '<p>裴照临居高临下看了他一眼，那眼神比三年前更倨傲，却也第一次，多了一丝别的东西。他什么也没说，转身走了。</p>' +
                '<p>这一败，沈砚一个字一个字地记下了。识海里的《天外言典》没有冷，它只在他几乎撑不住时，极轻地说了一句：起来，下一个字，还在等你。败约的耻不会让路断掉——它只会让他往后的每一步，都走得更狠。</p>';
            }
            if (f.vowForfeit) {
              return '<p>院试大比那日，台上没有沈砚——往后几日，也没有。</p>' +
                '<p>“沈砚失约”四个字，被人重重写在院试榜旁，比当年“扫地的狗”更刺眼。这一次，没有对手把他踩下去——是他自己，没敢站上来。</p>' +
                '<p>那四个字，烙进了他识海最深处，比任何一道伤都烫。不是不报——是他欠了自己一场。这笔账他记着，记给将来某一日，亲自站回那座台、亲手把它擦净的那一刻。</p>';
            }
            return '<p>院试大比那日，台上没有沈砚。</p>' +
              '<p>“沈砚避战”四个字，被人潦草地写在院试榜旁，墨迹歪斜，像一句随口的嘲弄。沈砚远远看了一眼，没有去擦。</p>' +
              '<p>那四个字，也落进了他识海里，成了一根没拔出的刺。不是不报——是时候未到。这根刺他留着，留给将来某一日，亲手拔掉、亲手擦净的那一刻。</p>';
          }, "前路 ▸", "约后 · 分流"),
          story(`
            <p>无论这一场是胜、是败，还是避，问言书院这方小小的天地，已经装不下他要走的路了。</p>
            <p>藏言楼的低语、雾岭深处那一缕果香、散落天地间的十枚异果……沈砚最后扫了一遍杂役房的青砖，把那柄跟了他三年的旧扫帚靠在墙角，没有带走。</p>
            <p>临行清点行囊，他才发现里头不知何时多了些东西：一袋沉甸甸的灵石，是秦夫子托人捎来的，附了张纸条——“出门在外，别饿着，丢书院的脸。”还有一枚流云护符，针脚细密，没有落款。这一程，他到底不是空着手走的。<span class="dim">（灵石 +100、流云护符）</span></p>
            <p>他第一次，把目光投向书院之外——更广的人界，正在那里，等着一个再不肯低头的人。</p>
            <p class="dim">—— 学院篇 · 第一阶 终。更远的路，在书院之外。</p>
          `, "回到月课 ▸"),
        ],
      },
    },
  ];
})(window.Game = window.Game || {});
