# 发音 · 单词发音文件

- `us/`：美音，Piper TTS + 语音 `en_US-ljspeech-high`（LJ Speech 数据集，公有领域），espeak 音素规则 `en-us`
- `uk/`：英音，Piper TTS + 语音 `en_GB-cori-high`（LibriVox 录音，公有领域），espeak 音素规则 `en`
- 文件名：单词转小写，非字母数字的字符替换为 `_`（与 `游戏/js/engine/wordcard.js audioSlug()` 一致）
- 生成于 2026-09-26，共 9253 词 × 2 口音。经过自动时长质检，异常的词已重新生成；dead / baby / pad / chromosome 四个词的英音直接沿用美音文件（读音相同或极近）。
