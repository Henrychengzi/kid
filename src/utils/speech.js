/**
 * 浏览器原生语音朗读（Web Speech API）
 * 零依赖、离线可用，适合儿童项目的中文 / 英文发音。
 */

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

let cachedVoices = []

function loadVoices() {
  if (!speechSupported) return []
  const voices = window.speechSynthesis.getVoices()
  if (voices && voices.length) cachedVoices = voices
  return cachedVoices
}

if (speechSupported) {
  loadVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices)
}

function pickVoice(lang) {
  if (!speechSupported) return null
  const voices = loadVoices()
  if (!voices.length) return null
  const prefix = lang.slice(0, 2).toLowerCase()
  // 优先挑本地语音（发音更自然、可离线），其次挑匹配语言的任意语音
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith(prefix) && v.localService) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(prefix)) ||
    null
  )
}

/**
 * 朗读一段文本
 * @param {string} text 要朗读的内容
 * @param {object} opts { lang, rate, pitch, volume, onend }
 * @returns {boolean} 是否成功发起朗读（false 表示当前浏览器不支持）
 */
export function speak(text, opts = {}) {
  if (!speechSupported || !text) return false
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

export function stopSpeak() {
  if (speechSupported) window.speechSynthesis.cancel()
}
