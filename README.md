# 修仙英文录 · 背单词修仙

**一款把背单词做成修仙故事的英语词汇学习软件。你背下的每一个单词，就是你的修为。**

大多数背单词 App 靠打卡连胜、排行榜和"你已经 3 天没背了"来留住人。修仙英文录换了个思路：
**单词是角色变强的唯一来源**。背得多，境界涨得快，剧情走爽路；背得少，照样能玩下去，只是路难走一点。
不逼你，也不锁你。

**▶ [浏览器直接打开](https://wjunlin293-tech.github.io/xiuxian-english/)** —— 免安装、免注册，加载一次后可离线使用。

> 想看另一种玩法？还有一个节奏更快、更热血的 **[《重生之我在仙界学英语》](https://github.com/wjunlin293-tech/reborn-immortal-english)**，欢迎两版都试试，告诉我更喜欢哪个。

<!-- B站演示视频：发布后把链接填到这里 -->

![标题画面](docs/screenshots/01-title.jpg)

---

## 适合谁

- **备考中考 / 高考 / 四六级 / 雅思 / 托福 / GRE 的学生**：按考试选词书，词书之间去重，不会反复背同一批词
- **背单词总是坚持不下去的人**：不靠打卡焦虑，靠"想知道后面发生什么"
- **喜欢修仙网文、想顺便把词汇量提上去的人**

## 一眼看懂

| | |
|---|---|
| **词书** | 8 本，去重后共 9,245 词 —— 中考 · 高考 · 四级 · 六级 · 雅思 · 托福 · GRE · 留学 |
| **题型** | 先学 → 再认 → 默写（逐级提示）· 语境题 · 听音辨义 · 听写 |
| **复习节奏** | 参考 SM-2 的间隔复习，按掌握程度间隔 1 / 1 / 2 / 4 / 7 / 15 天，按真实日历计算 |
| **释义** | 取多个常用义项，避免只显示生僻的第一个意思 |
| **发音** | 每个词都有美音、英音两份发音文件，一键切换，另有音标显示 |
| **词源数据** | 开源词典 [ECDICT](https://github.com/skywind3000/ECDICT)（MIT 协议），按词频筛选、剔除功能词、跨书去重 |
| **运行环境** | 纯 HTML / CSS / JavaScript，无框架、无依赖，电脑浏览器即开即用 |

---

## 学习流程

### 1 · 每个月只能做一件事

游戏里时间按"月"推进，背词、历练、推进剧情都要花一个月。时间有限，背词这件事就显得值钱，
而不是一项任务。寿元、剧情节点的倒计时一直显示在界面上，不背会少什么，你自己看得见，不需要谁来催。

![修炼主界面](docs/screenshots/02-hub.jpg)

### 2 · 选一本词书

8 本词书覆盖国内考试和出国考试。每本都从 ECDICT 单独生成：按各自难度设词频门槛，去掉 the / of 这类功能词，
再和其他词书去重。比如六级词书已排除全部四级词，GRE 词书已排除四六级词。

![选择词书](docs/screenshots/03-wordbooks.jpg)

### 3 · 先学，再考

新词先看释义、例句、发音，之后系统按你对这个词的熟悉程度派题：从"认得"到"能拼写"，再到"听得出"。
默写答错会逐级给提示（先给首字母、音标等线索，最后才给答案），而不是直接判错了事。

到期的复习按**真实日历**计算。今天连刷两遍不算数，明天回来复习才算。这样系统记录的是你真正记住的，
而不是你刚刚点过的。已经会的词可以直接标熟跳过。

![单词卡](docs/screenshots/04-wordcard.jpg)

### 4 · 背下的词，就是你的战斗力

战斗强度取决于境界，境界取决于词汇掌握度。上周真正记住的单词，就是这一场打赢的原因，
这也是整套设计里的正反馈。

![战斗](docs/screenshots/05-battle.jpg)

---

## 设计原则：鼓励，不逼迫

整个开发过程只守一条规则：**背得越多越强，但不背也不会玩不下去。**

- 剧情本身不发放力量，变强只能靠背单词
- 背得少的玩家也能走完故事，只是走更难的路线，剧情会有不同反应
- 失败不会扣除属性或清空进度
- 数值曲线在调整前用脚本模拟过，专门确认"每月只背很少的词"时这条规则依然成立

目标是做一个奖励学习、但不惩罚生活的学习软件。

## 更多玩法

背单词是主线，围绕它还有一整套修仙养成。

### 突破境界：雷劫就是一场单词大考

<table>
<tr>
<td><img src="docs/screenshots/06-breakthrough.jpg" alt="天劫将至"></td>
<td><img src="docs/screenshots/07-tribulation.jpg" alt="雷劫答题"></td>
</tr>
</table>

修为攒满后可以引动天劫。雷劫就是一连串的单词题：每答对一题，破境的胜算就更高一分。突破前最好先去丹房炼好对应的突破丹，没有也可以硬闯雷劫。失败会折损部分修为、轻微折寿，但不会掉属性，攒够了随时能再来。

### 识海：五维属性一眼看清

![识海五维雷达](docs/screenshots/08-status.jpg)

血量、法力、力量、防御、神识五项属性画成雷达图，还和当前境界的标准线对比，哪一项偏弱一眼就能看出来。

### 剧情：每一章都有人物立绘

![翻页剧情](docs/screenshots/09-story.jpg)

主角从书院最底层的扫字童子起步。剧情按章节翻页推进，重要人物都有立绘，剧情里的选择会影响你和配角之间的好感。

### 炼丹、制武、背包

<table>
<tr>
<td><img src="docs/screenshots/10-craft.jpg" alt="炼丹制武"></td>
<td><img src="docs/screenshots/11-inventory.jpg" alt="背包"></td>
</tr>
</table>

探险带回的材料可以炼成丹药、打造成兵器和法宝。丹药在背包里服用，同一种丹吃得越多，效果越弱，所以没法靠刷材料绕过背单词。装备可以穿戴，人物外观会跟着变化。

### 坊市与异果

<table>
<tr>
<td><img src="docs/screenshots/12-market.jpg" alt="书院坊市"></td>
<td><img src="docs/screenshots/13-yiguo.jpg" alt="言典十果"></td>
</tr>
</table>

坊市里用灵石买卖材料、丹药和装备，只要钱够，没有境界限制。「言典十果」是世间十枚异果的图鉴，真果只会随剧情因果现身，每一枚都会改变你的属性，还能用来锻造专属兵器。

### 因果簿：人物、好感与赠礼

![因果簿](docs/screenshots/14-relations.jpg)

一路遇到的人都记在因果簿里，见过面才会解锁。每个人都有好感度（0–100），剧情选择和送礼都会影响它；好感满了可以结为道侣或义结金兰。每个人喜欢的礼物不一样，送对了才加得多。

### 神田：背过的词都有归处

![神田](docs/screenshots/15-garden.jpg)

真正记住的词会收进神田，按数量解锁修行称号和成就，看着它一点点长满。

### 每月奇遇，以及寿元与转世

<table>
<tr>
<td><img src="docs/screenshots/16-event.jpg" alt="月度奇遇"></td>
<td><img src="docs/screenshots/17-rebirth.jpg" alt="寿元耗尽"></td>
</tr>
</table>

每过一个月都可能碰上一段小奇遇。寿元是有限的：寿元耗尽，这一世就结束了。但背过的字不会白背：转世之后，前世记下的词会化作「鬼魂」回来找你，这一世重新拾起来更快。

### 声音

- 18 首古风背景音乐，按场景自动切换；翻页、战斗、突破都有音效
- 9,253 个词的美音、英音发音文件，由开源语音模型离线生成（语音数据为公有领域），不依赖电脑有没有装英文语音包

## 目录结构

```
index.html          入口，跳转到游戏
游戏/                主程序：js/engine（引擎模块）、js/data（词书与剧情）、css
素材/                图片素材：场景、人物、装备、道具
bgm/                背景音乐
音效/                音效
发音/                单词发音（us/ 美音、uk/ 英音）
docs/screenshots/   README 截图
```

设计文档、词书生成脚本和数值模拟脚本放在另一个私有仓库。

## 当前状态

这是一个 **Demo 版本**，内容和数值还在持续调整。欢迎试玩后在 [Issues](https://github.com/wjunlin293-tech/xiuxian-english/issues) 或 B 站评论区反馈：
哪些词释义不准、哪里卡关、哪里觉得在被逼着背，都很有帮助。

## 致谢与署名

游戏设计、系统设计、剧情与词书筛选：**Junlin (Jeff) Wu**
开发过程中使用了 AI 辅助编程。
词汇数据来自 [ECDICT](https://github.com/skywind3000/ECDICT)（MIT License）。

---

<details>
<summary><b>English summary</b></summary>

**修仙英文录 (Xianxia English)** is a Chinese-language English-vocabulary learning app that replaces streak-based
motivation with narrative: the words you learn and review are the *only* source of your character's power
in a xianxia (cultivation) story. Study more and the story opens up; study less and you take a harder path,
but you are never locked out.

- 8 word books, 9,245 distinct words (Zhongkao, Gaokao, CET-4, CET-6, IELTS, TOEFL, GRE, study-abroad), generated from ECDICT (MIT) with frequency filtering and cross-book de-duplication
- Question types: learn, recognise, spell (with graded hints), context, listening, dictation
- Spaced review inspired by SM-2, with 1/1/2/4/7/15-day intervals on real calendar time
- Plain HTML/CSS/JS, no dependencies. [Play in the browser](https://wjunlin293-tech.github.io/xiuxian-english/)

</details>
