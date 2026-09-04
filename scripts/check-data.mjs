/**
 * 词库自检脚本： npm run check
 *
 * 扩充词库后跑一遍，可以提前发现缺字段、拼音漏声调、笔画异常、重复条目等问题。
 * 退出码 0 = 全部通过，1 = 存在错误（警告不阻断）。
 */
import { HANZI_LEVELS, HANZI_ALL } from '../src/data/hanzi.js'
import { EN_CATEGORIES, EN_ALL } from '../src/data/english.js'

const errors = []
const warnings = []

const err = (msg) => errors.push(msg)
const warn = (msg) => warnings.push(msg)

/* ─── 汉字校验 ─── */
const seenChar = new Map()
const TONE = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/
// 常见轻声字：本来就不标声调，不算缺陷
const LIGHT_TONE = new Set(['men', 'le', 'de', 'ma', 'ne', 'ba', 'a', 'zhe', 'guo', 'zi'])

console.log('═══ 汉字词库校验 ═══\n')

for (const lv of HANZI_LEVELS) {
  const inLevel = new Set()
  for (const it of lv.items) {
    const tag = `[${lv.id}/${it.char}]`

    if (!/^[一-龥]$/.test(it.char)) err(`${tag} 不是单个汉字`)
    if (!it.pinyin) err(`${tag} 缺少拼音`)
    else if (!TONE.test(it.pinyin) && !LIGHT_TONE.has(it.pinyin))
      warn(`${tag} 拼音「${it.pinyin}」没有声调符号`)
    if (!it.radical) err(`${tag} 缺少部首`)
    if (!Number.isInteger(it.strokes) || it.strokes < 1 || it.strokes > 30)
      err(`${tag} 笔画数异常：${it.strokes}`)
    if (!Array.isArray(it.words) || it.words.length === 0) err(`${tag} 缺少组词`)
    else if (it.words.some((w) => !w.includes(it.char)))
      warn(`${tag} 组词「${it.words.join('、')}」中有不含本字的词`)
    if (!it.sentence) err(`${tag} 缺少例句`)
    else if (!it.sentence.includes(it.char)) warn(`${tag} 例句中不包含本字`)
    if (!it.emoji) err(`${tag} 缺少 emoji 插图`)

    if (inLevel.has(it.char)) err(`${tag} 在 ${lv.id} 内重复`)
    inLevel.add(it.char)

    if (seenChar.has(it.char)) warn(`${tag} 与 ${seenChar.get(it.char)} 重复（跨级，若有意请忽略）`)
    else seenChar.set(it.char, lv.id)
  }
  console.log(`  ${lv.emoji} ${lv.id} ${lv.name}（${lv.age}）：${lv.items.length} 字`)
}

console.log(`\n  汉字总计：${HANZI_ALL.length} 字\n`)

/* ─── 英语校验 ─── */
console.log('═══ 英语词库校验 ═══\n')

for (const cat of EN_CATEGORIES) {
  const inCat = new Set()
  for (const it of cat.items) {
    const tag = `[${cat.id}/${it.word}]`

    if (!it.word) err(`${tag} 缺少单词`)
    else if (!/^[a-zA-Z ]+$/.test(it.word)) err(`${tag} 单词含非法字符`)
    if (!it.ipa) err(`${tag} 缺少音标`)
    else if (!it.ipa.startsWith('/')) warn(`${tag} 音标「${it.ipa}」未用 / 包裹`)
    if (!it.zh) err(`${tag} 缺少中文释义`)
    if (!it.emoji) err(`${tag} 缺少 emoji 插图`)
    if (!it.sentence) err(`${tag} 缺少英文例句`)
    else if (!/[.?!]$/.test(it.sentence)) warn(`${tag} 英文例句缺少句末标点`)
    if (!it.sentenceZh) err(`${tag} 缺少例句翻译`)

    if (inCat.has(it.word)) err(`${tag} 在 ${cat.id} 内重复`)
    inCat.add(it.word)
  }
  console.log(`  ${cat.emoji} ${cat.name}（${cat.age}）：${cat.items.length} 词`)
}

console.log(`\n  英语总计：${EN_ALL.length} 词\n`)

/* ─── 汇总 ─── */
console.log('═══ 结果 ═══\n')

if (warnings.length) {
  console.log(`⚠️  警告 ${warnings.length} 条：`)
  warnings.forEach((w) => console.log(`   - ${w}`))
  console.log('')
}

if (errors.length) {
  console.log(`❌ 错误 ${errors.length} 条：`)
  errors.forEach((e) => console.log(`   - ${e}`))
  console.log('\n请修复后再提交。')
  process.exit(1)
}

console.log(`✅ 全部通过：汉字 ${HANZI_ALL.length} 字 / 英语 ${EN_ALL.length} 词` + (warnings.length ? `（${warnings.length} 条警告）` : ''))
