/**
 * 统一朗读模块（多级兜底，保证微信 / QQ / 各大浏览器都有声音）
 *
 * 播放策略：
 *   1. 优先播放打包好的本地音频（public/audio，由 scripts/gen-audio.py 生成）
 *      —— 走 HTMLAudioElement，微信 / QQ 内置浏览器、iOS Safari 均可出声。
 *   2. 文本为「字，词」等组合时，拆开按顺序连播。
 *   3. 清单未覆盖的动态文本，回退浏览器原生 speechSynthesis。
 *
 * 兼容性处理：
 *   - iOS / 微信要求首次播放在用户手势内解锁：全局监听首次 touch/click，
 *     用同一个 Audio 元素播放一段静音来完成解锁（后续任意时机均可出声）。
 *   - 通过 playbackRate 实现语速调节，preservesPitch 保持音调不变。
 */
import { AUDIO_MAP, AUDIO_COUNT } from './audio-map'

const speechSynthesisSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window

/** 朗读能力总开关：有本地音频或浏览器原生 TTS 即视为可用 */
export const speechSupported = AUDIO_COUNT > 0 || speechSynthesisSupported

/* ── 文本 → 音频文件名（与 scripts/gen-audio-manifest.mjs 的 FNV-1a 保持一致） ── */
function fnv1a(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.codePointAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/* ── 音频基址：站点可能部署在 /kid/、/kid/index.html 等子路径 ── */
let audioBase = ''
function getAudioBase() {
  if (audioBase) return audioBase
  let p = window.location.pathname
  if (!p.endsWith('/')) p = p.slice(0, p.lastIndexOf('/') + 1)
  audioBase = `${p}audio/`
  return audioBase
}

/* ── 共享 Audio 元素：iOS/微信解锁后必须复用同一个元素 ── */
let audioEl = null
let unlocked = false
let token = 0 // 播放序号，打断旧播放

function getAudioEl() {
  if (audioEl) return audioEl
  audioEl = new Audio()
  audioEl.preload = 'auto'
  return audioEl
}

// 首次用户手势时解锁（静音 0.1s），之后任意时机都能播放
if (typeof window !== 'undefined') {
  const unlock = () => {
    if (unlocked) return
    unlocked = true
    try {
      const el = getAudioEl()
      el.src =
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
      el.play()
        .then(() => {
          el.pause()
          el.currentTime = 0
        })
        .catch(() => {})
    } catch (e) {
      /* ignore */
    }
  }
  window.addEventListener('touchstart', unlock, { capture: true, once: true, passive: true })
  window.addEventListener('click', unlock, { capture: true, once: true })
}

/* ── 本地音频播放 ── */
function playFile(src, rate, onended, onerror) {
  const el = getAudioEl()
  let finished = false
  const done = (err) => {
    if (finished) return
    finished = true
    el.removeEventListener('ended', onEnd)
    el.removeEventListener('error', onError)
    err ? onerror?.() : onended?.()
  }
  const onEnd = () => done(false)
  const onError = () => done(true)
  el.addEventListener('ended', onEnd)
  el.addEventListener('error', onError)
  el.src = src
  el.playbackRate = rate > 0.3 && rate < 2 ? rate : 1
  try {
    el.preservesPitch = true
    el.mozPreservesPitch = true
    el.webkitPreservesPitch = true
  } catch (e) {
    /* 老内核不支持时退化为变调，可接受 */
  }
  el.play().catch(() => done(true))
}

/** 按顺序连播多个音频片段 */
function playSequence(hashes, lang, rate, onend) {
  const my = ++token
  const gap = lang.toLowerCase().startsWith('zh') ? 520 : 420
  let i = 0
  const step = () => {
    if (my !== token) return
    if (i >= hashes.length) {
      onend?.()
      return
    }
    const h = hashes[i++]
    playFile(
      `${getAudioBase()}${h}.mp3`,
      rate,
      () => setTimeout(step, gap),
      () => {
        // 本地音频失败（如被拦截），整段回退原生 TTS
        if (my === token) speakFallback(lastText, lastOpts)
      }
    )
  }
  step()
}

/* ── 浏览器原生 speechSynthesis 兜底 ── */
let cachedVoices = []

function loadVoices() {
  if (!speechSynthesisSupported) return []
  const voices = window.speechSynthesis.getVoices()
  if (voices && voices.length) cachedVoices = voices
  return cachedVoices
}

if (speechSynthesisSupported) {
  loadVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices)
}

function pickVoice(lang) {
  if (!speechSynthesisSupported) return null
  const voices = loadVoices()
  if (!voices.length) return null
  const prefix = lang.slice(0, 2).toLowerCase()
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith(prefix) && v.localService) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(prefix)) ||
    null
  )
}

let lastText = ''
let lastOpts = {}

function speakFallback(text, opts = {}) {
  if (!speechSynthesisSupported || !text) return false
  const { lang = 'zh-CN', rate = 0.85, pitch = 1.15, volume = 1, onend } = opts
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(String(text))
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume
    const voice = pickVoice(lang)
    if (voice) utterance.voice = voice
    if (onend) utterance.onend = onend
    window.speechSynthesis.speak(utterance)
    return true
  } catch (err) {
    console.warn('[speech] 朗读失败：', err)
    return false
  }
}

/* ── 对外主入口 ── */

/**
 * 朗读一段文本
 * @param {string} text 要朗读的内容
 * @param {object} opts { lang, rate, pitch, volume, onend }
 * @returns {boolean} 是否成功发起朗读
 */
export function speak(text, opts = {}) {
  if (!text) return false
  const textStr = String(text).trim()
  if (!textStr) return false

  lastText = textStr
  lastOpts = opts
  const { lang = 'zh-CN', rate = 0.85, onend } = opts

  // 1) 完整文本有对应音频 → 直接播
  const fullHash = fnv1a(textStr)
  if (AUDIO_MAP[fullHash]) {
    playSequence([fullHash], lang, rate, onend)
    return true
  }

  // 2) 组合文本（如「水，水果」「cat, cat」）→ 拆段连播
  if (AUDIO_COUNT > 0 && /[，,]/.test(textStr)) {
    const parts = textStr.split(/[，,]\s*/).filter(Boolean)
    const hashes = parts.map((p) => fnv1a(p))
    if (hashes.length > 1 && hashes.every((h) => AUDIO_MAP[h])) {
      playSequence(hashes, lang, rate, onend)
      return true
    }
  }

  // 3) 回退浏览器原生 TTS
  return speakFallback(textStr, opts)
}

export function stopSpeak() {
  token++
  if (audioEl) {
    audioEl.pause()
    audioEl.currentTime = 0
  }
  if (speechSynthesisSupported) window.speechSynthesis.cancel()
}
