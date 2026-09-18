/* ───────────────────────────────────────────────────────────────
 * words.js · demo 词书
 * R7：先建词书系统，每本先放少量高质量 demo 词验证流程。
 * R10：雅思词书已替换为 NAWL 30 词样板。
 * P-18：正式雅思数据由 ielts.generated.js 覆盖，与游戏代码分开发布。
 * 每条优先维护 mainMeaning：先教最有用、最常见、最贴合例句的主释义。
 * 后续完整词库走“标准词表 → 脚本生成 → 自动校验 → 少量抽查”，不手工逐词改。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  function w(word, pos, cn, mainMeaning, senseHint, en, ex_en, ex_cn, extraMeanings) {
    return { word, pos, cn, mainMeaning, senseHint, en, ex_en, ex_cn, extraMeanings: extraMeanings || [] };
  }

  function pack(list) {
    const out = {};
    list.forEach((item) => { out[item.word.toUpperCase().replace(/[^A-Z0-9]+/g, "_")] = item; });
    return out;
  }

  Game.WORD_BOOKS = {
    zhongkao: {
      id: "zhongkao",
      name: "中考词书",
      desc: "基础高频词，先打稳阅读和日常表达根基。",
      words: pack([
        w("achieve", "v.", "实现；达到", "实现；达到目标", "常用于目标、成绩、梦想被完成。", "to succeed in doing or reaching something", "He worked hard to achieve his goal.", "他努力实现自己的目标。", [{ meaning: "获得；赢得", unlockAt: 3 }]),
        w("improve", "v.", "提高；改善", "提高；变得更好", "成绩、能力、状况变好都常用。", "to become better or make something better", "Daily review can improve your memory.", "每天复习能提高记忆效果。", [{ meaning: "改善某种情况", unlockAt: 3 }]),
        w("prepare", "v.", "准备", "准备；预备", "考试、旅行、行动前做准备。", "to make ready for something", "She prepared for the exam for two weeks.", "她为考试准备了两周。", [{ meaning: "使做好准备", unlockAt: 3 }]),
        w("protect", "v.", "保护", "保护；防护", "保护人、物、权利或安全。", "to keep someone or something safe", "The wall protected the village from the wind.", "那道墙保护村子免受风吹。", [{ meaning: "防止受损", unlockAt: 3 }]),
        w("search", "v./n.", "寻找；搜索", "寻找；搜索", "找人、找物、查资料都常用。", "to look carefully for something", "They searched the room for the lost key.", "他们在房间里寻找丢失的钥匙。", [{ meaning: "搜索行动", unlockAt: 2 }]),
        w("suggest", "v.", "建议；暗示", "建议；提出想法", "先记“给建议”，暗示义后面再扩。", "to give an idea or plan for someone to consider", "The teacher suggested a simpler method.", "老师建议了一个更简单的方法。", [{ meaning: "暗示；表明", unlockAt: 4 }]),
        w("support", "v./n.", "支持；支撑", "支持；帮助", "支持某人、观点或计划。", "to help or agree with someone or something", "His friends supported him during the hard days.", "朋友们在困难时期支持他。", [{ meaning: "支撑；承托", unlockAt: 3 }]),
        w("wonder", "v./n.", "想知道；奇迹", "想知道；感到疑惑", "阅读里常见“I wonder...”表示想知道。", "to want to know something", "I wonder why the door is still open.", "我想知道门为什么还开着。", [{ meaning: "奇迹；惊叹", unlockAt: 4 }]),
      ]),
    },
    gaokao: {
      id: "gaokao",
      name: "高考词书",
      desc: "高中阅读常见词，主打文章理解和表达迁移。",
      words: pack([
        w("analyze", "v.", "分析", "分析；细看原因", "阅读、图表、问题拆解常见。", "to examine something carefully to understand it", "We need to analyze the result before deciding.", "决定前我们需要分析结果。", [{ meaning: "解析；分解", unlockAt: 4 }]),
        w("approach", "v./n.", "接近；方法", "方法；处理方式", "高频阅读义先记“方法”。", "a way of dealing with something", "This approach saved a lot of time.", "这种方法节省了很多时间。", [{ meaning: "接近；靠近", unlockAt: 3 }]),
        w("benefit", "n./v.", "好处；使受益", "好处；益处", "先记名词“好处”，动词义后续扩展。", "an advantage or useful effect", "Exercise has clear benefits for the mind.", "锻炼对心智有明显好处。", [{ meaning: "使受益；得益于", unlockAt: 3 }]),
        w("challenge", "n./v.", "挑战；质疑", "挑战；难题", "考试阅读里常指困难任务。", "a difficult task or problem", "The climb was a real challenge for beginners.", "这次攀登对新手是真正的挑战。", [{ meaning: "质疑；挑战观点", unlockAt: 4 }]),
        w("determine", "v.", "决定；查明", "决定；影响结果", "先记“决定结果/影响走向”。", "to decide or strongly influence something", "Your choices determine the path ahead.", "你的选择决定前方道路。", [{ meaning: "查明；测定", unlockAt: 4 }]),
        w("evidence", "n.", "证据", "证据；依据", "议论文和说明文高频词。", "facts or signs that show something is true", "The report offered evidence for the claim.", "报告为这个说法提供了证据。", [{ meaning: "迹象；证明", unlockAt: 3 }]),
        w("perspective", "n.", "角度；观点", "观点；看问题的角度", "阅读题常考不同立场和视角。", "a way of thinking about something", "The story changed his perspective on failure.", "这个故事改变了他看待失败的角度。", [{ meaning: "透视法；远景", unlockAt: 5 }]),
        w("significant", "adj.", "重要的；显著的", "重要的；明显的", "数据变化、影响和意义都常用。", "important or large enough to notice", "The new rule made a significant difference.", "新规则带来了显著变化。", [{ meaning: "有特殊意义的", unlockAt: 4 }]),
      ]),
    },
    toefl: {
      id: "toefl",
      name: "托福词书",
      desc: "学术阅读和校园语境常见词。",
      words: pack([
        w("hypothesis", "n.", "假设", "假设；待验证的解释", "科学类文章高频。", "an idea that may explain something and can be tested", "The experiment tested the original hypothesis.", "实验检验了最初的假设。", [{ meaning: "假说", unlockAt: 3 }]),
        w("indicate", "v.", "表明；指出", "表明；显示", "图表、证据、研究结果常用。", "to show or suggest something", "The data indicate a change in climate.", "数据显示气候发生了变化。", [{ meaning: "指出方向", unlockAt: 4 }]),
        w("maintain", "v.", "保持；主张", "保持；维持", "系统、状态、观点都可搭配。", "to keep something in the same condition", "Plants maintain balance by controlling water loss.", "植物通过控制水分流失来维持平衡。", [{ meaning: "坚持认为；主张", unlockAt: 4 }]),
        w("obtain", "v.", "获得", "获得；取得", "学术语境里常比 get 更正式。", "to get something, especially by effort", "Researchers obtained samples from the river.", "研究人员从河中取得了样本。", [{ meaning: "存在；通行", unlockAt: 5 }]),
        w("process", "n./v.", "过程；处理", "过程；步骤", "自然过程、实验步骤、处理流程常见。", "a series of actions or changes", "Photosynthesis is a process that stores energy.", "光合作用是储存能量的过程。", [{ meaning: "处理；加工", unlockAt: 3 }]),
        w("region", "n.", "地区；区域", "地区；区域", "地理、生态、历史文章常见。", "a particular area or part of a place", "This region receives little rain in winter.", "这个地区冬季降雨很少。", [{ meaning: "身体部位区域", unlockAt: 4 }]),
        w("require", "v.", "需要；要求", "需要；要求", "条件、规定、系统需求常用。", "to need something or make something necessary", "The course requires weekly reading.", "这门课要求每周阅读。", [{ meaning: "命令；规定", unlockAt: 3 }]),
        w("structure", "n./v.", "结构；组织", "结构；组成方式", "建筑、生物、文章结构都常见。", "the way parts are arranged together", "The structure of the leaf helps it absorb light.", "叶子的结构帮助它吸收光。", [{ meaning: "组织；安排", unlockAt: 4 }]),
      ]),
    },
    ielts: {
      id: "ielts",
      name: "雅思词书",
      desc: "雅思学术阅读/写作核心候选词样板。",
      words: pack([
        w("absorb", "v.", "吸收；理解", "吸收；理解", "常用于材料吸收水分、人体吸收营养、学习吸收信息。", "to take in liquid, energy, information, or ideas", "Plants absorb water through their roots.", "植物通过根部吸收水分。", [{ meaning: "承受；承担", unlockAt: 4 }]),
        w("accelerate", "v.", "加速；促进", "加速；促进", "用于过程、增长、变化变快。", "to make something happen faster or sooner", "Technology can accelerate economic change.", "技术可以加速经济变化。", [{ meaning: "车辆加速", unlockAt: 3 }]),
        w("accumulation", "n.", "积累；堆积", "积累；累积", "常见于数据、财富、污染物、知识逐渐增多。", "the process of collecting or increasing over time", "The accumulation of plastic waste harms oceans.", "塑料废弃物的累积伤害海洋。", [{ meaning: "堆积物", unlockAt: 4 }]),
        w("accuracy", "n.", "准确性", "准确性", "数据、测量、报道和判断是否准确。", "the quality of being correct and exact", "The accuracy of the survey depends on sample size.", "调查的准确性取决于样本规模。", [{ meaning: "精确度", unlockAt: 3 }]),
        w("adaptation", "n.", "适应；改编", "适应；适应性变化", "生物、个人、社会对环境变化作出调整。", "a change that helps someone or something fit new conditions", "Adaptation to a new culture takes time.", "适应一种新文化需要时间。", [{ meaning: "改编作品", unlockAt: 4 }]),
        w("adjacent", "adj.", "相邻的", "相邻的；邻近的", "地图、建筑、区域描述中常见。", "next to or very near something", "The library is adjacent to the science building.", "图书馆紧邻科学楼。", [{ meaning: "毗连的", unlockAt: 3 }]),
        w("adolescent", "n./adj.", "青少年；青春期的", "青少年", "教育、心理、健康类话题常见。", "a young person who is developing into an adult", "Many adolescents need more sleep than adults.", "许多青少年比成年人需要更多睡眠。", [{ meaning: "青春期的", unlockAt: 3 }]),
        w("adverse", "adj.", "不利的；有害的", "不利的；有害的", "常搭配 effect、condition、impact。", "negative or harmful", "Air pollution has adverse effects on health.", "空气污染对健康有不利影响。", [{ meaning: "相反的", unlockAt: 5 }]),
        w("aggregate", "n./v./adj.", "总计；集合", "总计；合计", "数据、数量、结果合在一起。", "to combine separate things into a total", "Researchers aggregate the data from several studies.", "研究人员汇总了多项研究的数据。", [{ meaning: "集合体；总数", unlockAt: 3 }]),
        w("allocate", "v.", "分配", "分配；划拨", "资源、时间、资金被分给不同用途。", "to give a share of something for a particular purpose", "The city will allocate more funds to public transport.", "城市将把更多资金分配给公共交通。", [{ meaning: "指派；安排", unlockAt: 4 }]),
        w("arbitrary", "adj.", "任意的；武断的", "武断的；随意决定的", "强调缺少合理依据或规则。", "based on personal choice rather than clear reason", "The deadline seemed arbitrary to many students.", "许多学生觉得这个截止日期很武断。", [{ meaning: "任意的", unlockAt: 3 }]),
        w("artificial", "adj.", "人工的；人造的", "人工的；人造的", "和 natural 相对，常见于技术、材料、智能。", "made by people rather than existing naturally", "Artificial light can affect sleep patterns.", "人工光会影响睡眠模式。", [{ meaning: "不自然的；虚假的", unlockAt: 4 }]),
        w("aspect", "n.", "方面", "方面；层面", "分析话题时常用来拆分不同角度。", "one part or feature of a situation or subject", "Cost is only one aspect of the problem.", "成本只是这个问题的一个方面。", [{ meaning: "外观；朝向", unlockAt: 5 }]),
        w("assert", "v.", "断言；主张", "断言；明确主张", "用于作者、研究者、政策方提出强观点。", "to state firmly that something is true", "The author asserts that education reduces inequality.", "作者断言教育可以减少不平等。", [{ meaning: "维护；坚持权利", unlockAt: 4 }]),
        w("assignment", "n.", "任务；作业", "任务；作业", "校园和工作语境都常见。", "a task or piece of work that someone is given", "The assignment required students to compare two studies.", "这项作业要求学生比较两项研究。", [{ meaning: "分配；指派", unlockAt: 4 }]),
        w("authority", "n.", "权威；当局", "权威；权力", "可指有权决定的人、机构或权力本身。", "the power or right to make decisions", "Local authorities introduced new recycling rules.", "地方当局推出了新的回收规定。", [{ meaning: "专家；权威人士", unlockAt: 4 }]),
        w("autonomy", "n.", "自治；自主", "自主；自治", "教育、工作、政治和个人选择话题常见。", "the ability or right to make your own decisions", "Students need some autonomy in choosing research topics.", "学生在选择研究主题时需要一定自主权。", [{ meaning: "自治权", unlockAt: 3 }]),
        w("availability", "n.", "可获得性；供应情况", "可获得性；供应情况", "资源、服务、住房、医疗是否容易获得。", "the state of being easy to get or use", "The availability of clean water varies by region.", "清洁水的可获得性因地区而异。", [{ meaning: "有空；可用状态", unlockAt: 4 }]),
        w("bacteria", "n.", "细菌", "细菌", "健康、环境、食品安全类文章常见。", "very small living things, some of which cause disease", "Some bacteria can survive in extreme environments.", "一些细菌能在极端环境中生存。", [{ meaning: "bacterium 的复数", unlockAt: 3 }]),
        w("behavioral", "adj.", "行为的", "行为的", "心理、教育、社会研究常用。", "relating to the way people or animals act", "The program aims to change behavioral patterns.", "该项目旨在改变行为模式。", [{ meaning: "行为学的", unlockAt: 3 }]),
        w("binary", "adj./n.", "二元的；二进制", "二元的；二分的", "常指只有两类或两种选择。", "involving two parts, choices, or values", "The debate is often framed as a binary choice.", "这场讨论常被框成二元选择。", [{ meaning: "二进制的", unlockAt: 3 }]),
        w("biodiversity", "n.", "生物多样性", "生物多样性", "环境、生态、保护类雅思高频话题。", "the variety of living things in an area", "Biodiversity is essential for a stable ecosystem.", "生物多样性对稳定生态系统至关重要。", [{ meaning: "物种多样性", unlockAt: 3 }]),
        w("bound", "adj./v.", "必然的；受约束的", "必然的；很可能的", "be bound to 表示几乎必然会发生。", "certain or very likely to happen", "Rapid growth is bound to create new challenges.", "快速增长必然会带来新挑战。", [{ meaning: "受约束的；被绑定的", unlockAt: 4 }]),
        w("broadly", "adv.", "大体上；广泛地", "大体上；广泛地", "用于概括观点或范围。", "in a general way or over a wide range", "The results broadly support the original theory.", "这些结果大体上支持原理论。", [{ meaning: "明显地；开阔地", unlockAt: 5 }]),
        w("candidate", "n.", "候选人；考生", "候选人；申请者", "可指职位候选人、考试考生、可能选项。", "a person or thing being considered for a position or choice", "Each candidate must complete an interview.", "每位候选人都必须完成一次面试。", [{ meaning: "可能的选择；候选项", unlockAt: 4 }]),
        w("chronic", "adj.", "慢性的；长期的", "慢性的；长期的", "健康类常指慢性病，也可指长期问题。", "lasting for a long time or repeatedly happening", "Chronic stress can damage both body and mind.", "长期压力会损害身心健康。", [{ meaning: "严重的；积习难改的", unlockAt: 5 }]),
        w("circulate", "v.", "循环；传播", "循环；传播", "液体、空气、信息在人群中流动。", "to move around or spread from person to person", "False information can circulate quickly online.", "虚假信息会在网上迅速传播。", [{ meaning: "传阅；流通", unlockAt: 3 }]),
        w("clarify", "v.", "澄清；阐明", "澄清；说明清楚", "写作和口语中常用于把观点讲清。", "to make something easier to understand", "The chart helps clarify the main trend.", "这张图有助于说明主要趋势。", [{ meaning: "净化液体；使清澈", unlockAt: 5 }]),
        w("classification", "n.", "分类", "分类；类别划分", "科学、教育、数据分析常见。", "the act or system of arranging things into groups", "The classification of species is based on shared features.", "物种分类基于共同特征。", [{ meaning: "类别；等级", unlockAt: 3 }]),
        w("classify", "v.", "分类；归类", "分类；归类", "把事物按标准放入不同类别。", "to arrange things into groups by type", "Researchers classify the responses into three groups.", "研究人员把回答分为三组。", [{ meaning: "列为机密", unlockAt: 5 }]),
      ]),
    },
    gre: {
      id: "gre",
      name: "GRE词书",
      desc: "偏抽象和学术的高阶词，先放少量可验证样本。",
      words: pack([
        w("ambiguous", "adj.", "含糊的；有歧义的", "含糊的；有歧义的", "信息不清楚、可多种理解时常用。", "having more than one possible meaning", "The answer was ambiguous and caused debate.", "这个回答含糊不清，引发了争论。", [{ meaning: "模棱两可的", unlockAt: 3 }]),
        w("arbitrary", "adj.", "任意的；武断的", "武断的；随意决定的", "强调缺少合理依据。", "based on personal choice rather than reason", "The rule seemed arbitrary to the students.", "学生们觉得这条规则很武断。", [{ meaning: "任意的", unlockAt: 3 }]),
        w("coherent", "adj.", "连贯的；一致的", "连贯的；有条理的", "论证、文章、计划常用。", "clear, logical, and consistent", "Her argument was coherent from start to finish.", "她的论证从头到尾都很连贯。", [{ meaning: "凝聚的；一致的", unlockAt: 4 }]),
        w("diligent", "adj.", "勤勉的", "勤勉的；认真努力的", "形容持续认真做事的人。", "careful and hardworking", "A diligent student reviews mistakes every week.", "勤勉的学生每周复盘错误。", [{ meaning: "用心细致的", unlockAt: 3 }]),
        w("elaborate", "adj./v.", "复杂的；详细说明", "详细说明", "动词义在考试里很常见。", "to explain something in more detail", "Please elaborate on your main point.", "请详细说明你的主要观点。", [{ meaning: "精巧复杂的", unlockAt: 3 }]),
        w("mitigate", "v.", "缓解；减轻", "缓解；减轻坏影响", "常用于风险、伤害、问题。", "to make something less severe or harmful", "Trees can mitigate the heat in cities.", "树木可以缓解城市热度。", [{ meaning: "使缓和", unlockAt: 3 }]),
        w("scrutinize", "v.", "仔细审查", "仔细审查；细看", "强调认真、细致地检查。", "to examine something very carefully", "The committee scrutinized every detail.", "委员会仔细审查了每个细节。", [{ meaning: "严密观察", unlockAt: 4 }]),
        w("tenacious", "adj.", "顽强的；执着的", "顽强的；不轻易放弃的", "形容坚持目标或抓住不放。", "very determined and unwilling to give up", "Her tenacious effort finally changed the result.", "她顽强的努力最终改变了结果。", [{ meaning: "黏着力强的", unlockAt: 5 }]),
      ]),
    },
    abroad: {
      id: "abroad",
      name: "出国留学词书",
      desc: "申请、校园、住宿和日常办事场景。",
      words: pack([
        w("accommodation", "n.", "住宿", "住宿；住处", "留学租房和学校住宿高频。", "a place to live or stay", "The university offers accommodation for first-year students.", "大学为一年级学生提供住宿。", [{ meaning: "调节；便利安排", unlockAt: 5 }]),
        w("appointment", "n.", "预约；任命", "预约", "看医生、办手续、见导师都常用。", "an arrangement to meet someone at a set time", "I made an appointment with the advisor.", "我和顾问预约了时间。", [{ meaning: "任命；职位", unlockAt: 4 }]),
        w("application", "n.", "申请；应用", "申请；申请表", "学校申请、签证申请都常用。", "a formal request for a place or permission", "Her application was submitted before the deadline.", "她的申请在截止日前提交了。", [{ meaning: "应用程序；应用", unlockAt: 3 }]),
        w("deposit", "n./v.", "押金；存款", "押金；订金", "租房、住宿、银行场景高频。", "money paid as a guarantee or first payment", "The landlord asked for a one-month deposit.", "房东要求一个月押金。", [{ meaning: "存款；沉积物", unlockAt: 4 }]),
        w("enroll", "v.", "注册；入学", "注册；入学", "课程注册、入学手续常用。", "to officially join a course, school, or program", "She enrolled in a language course.", "她注册了一门语言课程。", [{ meaning: "登记加入", unlockAt: 3 }]),
        w("insurance", "n.", "保险", "保险", "医疗保险、旅行保险都常用。", "an agreement that pays costs if something bad happens", "Health insurance is required by the school.", "学校要求购买医疗保险。", [{ meaning: "保障；保险业", unlockAt: 4 }]),
        w("landlord", "n.", "房东", "房东", "租房场景核心词。", "a person who rents a room or building to others", "The landlord repaired the heater quickly.", "房东很快修好了暖气。", [{ meaning: "业主", unlockAt: 3 }]),
        w("transcript", "n.", "成绩单；文字记录", "成绩单", "申请学校时优先记“成绩单”。", "an official record of a student's courses and grades", "The program requires an official transcript.", "这个项目要求官方成绩单。", [{ meaning: "文字记录；抄本", unlockAt: 4 }]),
      ]),
    },
  };

  Game.VOCAB_SOURCES = {
    ielts: {
      short: "基于 NAWL，非 IELTS 官方。",
      title: "雅思词书来源",
      name: "New Academic Word List (NAWL) 1.0",
      authors: "Charles Browne, Brent Culligan, Joseph Phillips",
      url: "https://www.newgeneralservicelist.org/nawl-new-academic-word-list/",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      note: "本项目仅取 30 个候选词作雅思学术核心样板；中文主释义、例句和扩展义由本项目整理。"
    }
  };

  Game.refreshWords && Game.refreshWords();
  if (!Game.WORDS) Game.WORDS = Game.WORD_BOOKS.gaokao.words;
})(window.Game = window.Game || {});
