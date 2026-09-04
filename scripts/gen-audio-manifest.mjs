/**
 * 提取项目中所有会被朗读的文本，生成音频任务清单与运行时清单。
 *
 * 用法：node scripts/gen-audio-manifest.mjs
 * 输出：
 *   - scripts/audio-tasks.json     （供 scripts/gen-audio.py 生成 mp3）
 *   - src/utils/audio-map.js       （运行时文本 → 音频文件哈希表）
 *
 * 哈希算法 FNV-1a(32bit) → base36，与 src/utils/speech.js 保持一致。
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { HANZI_ALL } from '../src/data/hanzi.js'
import { EN_ALL } from '../src/data/english.js'

function fnv1a(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.codePointAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

const tasks = [] // { text, lang }
const seen = new Set()

function add(text, lang) {
  text = String(text).trim()
  // 纯标点（如听写挖空后只剩「。」）无法合成，跳过
  if (!text || seen.has(text)) return
  if (!/[\p{L}\p{N}]/u.test(text)) return
  seen.add(text)
  tasks.push({ text, lang })
}

/* ── 汉字模块：字 / 组词 / 例句 / 听写挖空片段 ── */
for (const item of HANZI_ALL) {
  add(item.char, 'zh-CN')
  for (const w of item.words) add(w, 'zh-CN')
  add(item.sentence, 'zh-CN')
  // 听写页：例句在本字处挖空，朗读「空前面 + 停顿 + 空后面」
  const idx = item.sentence.indexOf(item.char)
  if (idx >= 0) {
    const before = item.sentence.slice(0, idx)
    const after = item.sentence.slice(idx + item.char.length)
    if (before) add(before, 'zh-CN')
    if (after) add(after, 'zh-CN')
  }
}

/* ── 固定中文短语（各视图写死的朗读文案） ── */
const ZH_PHRASES = [
  '太棒啦，这一级全部学完啦！',
  '这一级都写完了，真棒！',
  '写得真好看！',
  '答对啦！',
  '再想想看',
  '太棒啦！',
  '答对了！',
  '真聪明！',
  '好厉害！',
  '完全正确！',
  '棒极了！',
  '没关系，再想想～',
  '差一点点，加油！',
  '看清楚正确答案哦～',
  '太厉害啦，全部答对！',
  '差一点点，看一看正确的拼写吧'
]
ZH_PHRASES.forEach((t) => add(t, 'zh-CN'))
// 闯关结算：答对 N 题，继续加油！（N = 0..10）
for (let n = 0; n <= 10; n++) add(`答对 ${n} 题，继续加油！`, 'zh-CN')

/* ── 英语模块：单词 / 例句 / 固定短语 ── */
for (const item of EN_ALL) {
  add(item.word, 'en-US')
  add(item.sentence, 'en-US')
  add(`I know ${item.word}!`, 'en-US')
}
const EN_PHRASES = ['Great job! You finished this group!', 'Perfect! Great job!']
EN_PHRASES.forEach((t) => add(t, 'en-US'))
for (let n = 0; n <= 10; n++) add(`You got ${n} right!`, 'en-US')

/* ── 校验哈希无碰撞 ── */
const hashSet = new Map()
for (const t of tasks) {
  const h = fnv1a(t.text)
  if (hashSet.has(h) && hashSet.get(h) !== t.text) {
    throw new Error(`哈希碰撞: ${h} → ${hashSet.get(h)} / ${t.text}`)
  }
  hashSet.set(h, t.text)
}

/* ── 输出 ── */
const root = fileURLToPath(new URL('..', import.meta.url))
const taskList = tasks.map(({ text, lang }) => ({ text, lang, hash: fnv1a(text) }))
writeFileSync(`${root}scripts/audio-tasks.json`, JSON.stringify(taskList, null, 0))

const mapEntries = taskList.map((t) => `'${t.hash}':1`).join(',')
const mapFile = `/**
 * 音频清单（自动生成，勿手改）
 * 由 scripts/gen-audio-manifest.mjs 生成，对应 public/audio/<hash>.mp3
 */
export const AUDIO_MAP = {${mapEntries}}
export const AUDIO_COUNT = ${taskList.length}
`
writeFileSync(`${root}src/utils/audio-map.js`, mapFile)

const zh = taskList.filter((t) => t.lang.startsWith('zh')).length
const en = taskList.length - zh
console.log(`共 ${taskList.length} 条（中文 ${zh} / 英文 ${en}），清单已写入 src/utils/audio-map.js`)
