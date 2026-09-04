import { defineStore } from 'pinia'
import { HANZI_LEVELS, HANZI_ALL } from '@/data/hanzi'
import { EN_CATEGORIES, EN_ALL } from '@/data/english'

const STORAGE_KEY = 'kid-literacy-progress-v1'

function todayKey(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 共享的「未学习」只读对象：模板里会高频读取，避免每次生成新对象
const EMPTY = Object.freeze({ seen: 0, correct: 0, wrong: 0, mastered: false, updatedAt: 0 })

function emptyItem() {
  return { seen: 0, correct: 0, wrong: 0, mastered: false, updatedAt: 0 }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    return {
      hanzi: data.hanzi || {},
      english: data.english || {},
      daily: data.daily || {},
      settings: { rate: 0.85, autoSpeak: true, kidName: '', ...(data.settings || {}) }
    }
  } catch (err) {
    console.warn('[progress] 读取本地进度失败，已重置：', err)
    return null
  }
}

export const useProgressStore = defineStore('progress', {
  state: () => {
    const saved = loadFromStorage()
    return {
      hanzi: saved?.hanzi || {},
      english: saved?.english || {},
      daily: saved?.daily || {},
      settings: saved?.settings || { rate: 0.85, autoSpeak: true, kidName: '' }
    }
  },

  getters: {
    /** 取某个模块下某条目的学习记录 */
    itemOf: (state) => (module, id) => {
      const table = module === 'hanzi' ? state.hanzi : state.english
      return table[id] || EMPTY
    },

    /** 某模块已学（至少看过一次）的条目数量 */
    learnedCountOf: (state) => (module, scopeId = null) => {
      const table = module === 'hanzi' ? state.hanzi : state.english
      const pool =
        module === 'hanzi'
          ? scopeId
            ? HANZI_LEVELS.find((l) => l.id === scopeId)?.items || []
            : HANZI_ALL
          : scopeId
            ? EN_CATEGORIES.find((c) => c.id === scopeId)?.items || []
            : EN_ALL
      return pool.filter((it) => table[it.id]?.seen > 0).length
    },

    /** 某模块已掌握（连续答对达标并手动/自动标记）的条目数量 */
    masteredCountOf: (state) => (module) => {
      const table = module === 'hanzi' ? state.hanzi : state.english
      return Object.values(table).filter((v) => v.mastered).length
    },

    /** 某模块总正确率（0-100，无数据时返回 0） */
    accuracyOf: (state) => (module) => {
      const table = module === 'hanzi' ? state.hanzi : state.english
      let correct = 0
      let total = 0
      for (const v of Object.values(table)) {
        correct += v.correct || 0
        total += (v.correct || 0) + (v.wrong || 0)
      }
      return total === 0 ? 0 : Math.round((correct / total) * 100)
    },

    /** 错题库：答错次数 > 0 且尚未掌握的条目，按错误次数倒序 */
    wrongListOf: (state) => (module) => {
      const table = module === 'hanzi' ? state.hanzi : state.english
      const pool = module === 'hanzi' ? HANZI_ALL : EN_ALL
      return pool
        .map((it) => ({ ...it, record: table[it.id] || EMPTY }))
        .filter((it) => it.record.wrong > 0 && !it.record.mastered)
        .sort((a, b) => b.record.wrong - a.record.wrong)
        .slice(0, 40)
    },

    /** 今日统计 */
    todayStat(state) {
      return state.daily[todayKey()] || { cards: 0, quiz: 0, correct: 0, wrong: 0 }
    },

    /** 连续学习天数：今天还没学则从昨天往前追溯，不立即中断 */
    streak(state) {
      if (!Object.keys(state.daily).length) return 0
      const cursor = new Date()
      if (!state.daily[todayKey(cursor)]) cursor.setDate(cursor.getDate() - 1)
      let count = 0
      while (state.daily[todayKey(cursor)]) {
        count++
        cursor.setDate(cursor.getDate() - 1)
      }
      return count
    },

    totalLearned(state) {
      return this.learnedCountOf('hanzi') + this.learnedCountOf('english')
    }
  },

  actions: {
    _touch() {
      const k = todayKey()
      if (!this.daily[k]) this.daily[k] = { cards: 0, quiz: 0, correct: 0, wrong: 0 }
      return this.daily[k]
    },

    _slot(module, id) {
      const table = module === 'hanzi' ? this.hanzi : this.english
      if (!table[id]) table[id] = emptyItem()
      return table[id]
    },

    /** 翻看了一张识字卡片 */
    markSeen(module, id) {
      const slot = this._slot(module, id)
      slot.seen += 1
      slot.updatedAt = Date.now()
      this._touch().cards += 1
      this.persist()
    },

    /** 回答问题：correct=true 记对，false 记错；连对 3 次自动标记掌握 */
    recordAnswer(module, id, correct) {
      const slot = this._slot(module, id)
      const day = this._touch()
      day.quiz += 1
      slot.updatedAt = Date.now()
      if (correct) {
        slot.correct += 1
        day.correct += 1
        if (slot.correct >= 3 && !slot.mastered) slot.mastered = true
      } else {
        slot.wrong += 1
        day.wrong += 1
        slot.mastered = false
      }
      this.persist()
    },

    toggleMastered(module, id) {
      const slot = this._slot(module, id)
      slot.mastered = !slot.mastered
      slot.updatedAt = Date.now()
      this.persist()
    },

    updateSettings(patch) {
      this.settings = { ...this.settings, ...patch }
      this.persist()
    },

    resetModule(module) {
      if (module === 'hanzi') this.hanzi = {}
      else if (module === 'english') this.english = {}
      else {
        this.hanzi = {}
        this.english = {}
        this.daily = {}
      }
      this.persist()
    },

    persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            hanzi: this.hanzi,
            english: this.english,
            daily: this.daily,
            settings: this.settings
          })
        )
      } catch (err) {
        console.warn('[progress] 保存本地进度失败：', err)
      }
    }
  }
})
