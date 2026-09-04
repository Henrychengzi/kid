<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useProgressStore } from '@/store/progress'
import { HANZI_LEVELS, HANZI_ALL } from '@/data/hanzi'
import { EN_CATEGORIES, EN_ALL } from '@/data/english'

const router = useRouter()
const store = useProgressStore()

const tab = ref('overview') // overview | wrong | level | settings

const hanziLearned = computed(() => store.learnedCountOf('hanzi'))
const enLearned = computed(() => store.learnedCountOf('english'))
const hanziWrong = computed(() => store.wrongListOf('hanzi'))
const enWrong = computed(() => store.wrongListOf('english'))

/* 最近 7 天学习量 */
const week = computed(() => {
  const days = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const pad = (n) => String(n).padStart(2, '0')
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const stat = store.daily[key] || { cards: 0, quiz: 0, correct: 0, wrong: 0 }
    days.push({
      key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      total: stat.cards + stat.quiz,
      isToday: i === 0
    })
  }
  return days
})

const weekMax = computed(() => Math.max(1, ...week.value.map((d) => d.total)))
const weekTotal = computed(() => week.value.reduce((s, d) => s + d.total, 0))

const accuracy = computed(() => {
  const correct = Object.values(store.daily).reduce((s, d) => s + (d.correct || 0), 0)
  const wrong = Object.values(store.daily).reduce((s, d) => s + (d.wrong || 0), 0)
  return correct + wrong === 0 ? 0 : Math.round((correct / (correct + wrong)) * 100)
})

/* ── 设置 ── */
const nameInput = ref(store.settings.kidName)
const rate = ref(store.settings.rate)

function saveName() {
  store.updateSettings({ kidName: nameInput.value.trim().slice(0, 12) })
}

function saveRate() {
  store.updateSettings({ rate: Number(rate.value) })
}

/* ── 数据管理 ── */
const fileInput = ref(null)

function exportData() {
  const payload = {
    app: 'kid-literacy',
    version: 1,
    exportedAt: new Date().toISOString(),
    hanzi: store.hanzi,
    english: store.english,
    daily: store.daily,
    settings: store.settings
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kid-literacy-progress-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result))
      if (!data || typeof data !== 'object') throw new Error('格式不正确')
      store.hanzi = data.hanzi || {}
      store.english = data.english || {}
      store.daily = data.daily || {}
      if (data.settings) store.settings = { ...store.settings, ...data.settings }
      store.persist()
      alert('导入成功！')
    } catch (err) {
      alert(`导入失败：${err.message}`)
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function resetAll() {
  const ok = window.confirm('确定要清空全部学习记录吗？\n\n此操作不可恢复，建议先「导出数据」备份。')
  if (!ok) return
  const ok2 = window.confirm('再确认一次：真的要清空吗？')
  if (!ok2) return
  store.resetModule('all')
  alert('已清空全部学习记录。')
}
</script>

<template>
  <main class="page">
    <AppHeader title="家长中心" emoji="👨‍👩‍👧" subtitle="查看学习进度与错字本" back-to="/" color="#4dabf7" />

    <!-- Tab -->
    <div class="tabs">
      <button
        v-for="t in [
          { id: 'overview', name: '学习总览', emoji: '📊' },
          { id: 'wrong', name: '错字本', emoji: '📕' },
          { id: 'level', name: '分级进度', emoji: '🗂️' },
          { id: 'settings', name: '设置', emoji: '⚙️' }
        ]"
        :key="t.id"
        class="tab"
        :class="{ 'tab--on': tab === t.id }"
        type="button"
        @click="tab = t.id"
      >
        {{ t.emoji }} {{ t.name }}
      </button>
    </div>

    <!-- ═══ 总览 ═══ -->
    <section v-if="tab === 'overview'" class="anim-rise">
      <div class="grid4 card">
        <div class="kpi">
          <strong style="color: var(--c-orange)">{{ hanziLearned }}</strong>
          <span>已学汉字</span>
          <i>/ {{ HANZI_ALL.length }}</i>
        </div>
        <div class="kpi">
          <strong style="color: var(--c-teal)">{{ enLearned }}</strong>
          <span>已学单词</span>
          <i>/ {{ EN_ALL.length }}</i>
        </div>
        <div class="kpi">
          <strong style="color: var(--c-green)">
            {{ store.masteredCountOf('hanzi') + store.masteredCountOf('english') }}
          </strong>
          <span>已掌握</span>
          <i>累计</i>
        </div>
        <div class="kpi">
          <strong style="color: var(--c-purple)">{{ store.streak }}</strong>
          <span>连续学习</span>
          <i>天</i>
        </div>
      </div>

      <div class="card chart">
        <div class="chart__head">
          <h3>最近 7 天学习量</h3>
          <span class="tag">共 {{ weekTotal }} 次互动</span>
        </div>
        <div class="chart__body">
          <div v-for="d in week" :key="d.key" class="col">
            <span class="col__num">{{ d.total || '' }}</span>
            <div class="col__bar" :style="{ height: Math.max(6, (d.total / weekMax) * 100) + '%' }" />
            <span class="col__label" :class="{ 'col__label--today': d.isToday }">{{ d.label }}</span>
          </div>
        </div>
      </div>

      <div class="card overall">
        <div class="overall__row">
          <span>累计答题正确率</span>
          <b>{{ accuracy }}%</b>
        </div>
        <div class="bar">
          <div class="bar__fill" :style="{ width: accuracy + '%', background: 'var(--c-blue)' }" />
        </div>
        <div class="overall__row overall__row--sub">
          <span>汉字正确率</span>
          <b>{{ store.accuracyOf('hanzi') }}%</b>
        </div>
        <div class="overall__row overall__row--sub">
          <span>英语正确率</span>
          <b>{{ store.accuracyOf('english') }}%</b>
        </div>
      </div>

      <div class="card tips">
        <h3>给家长的小建议</h3>
        <ul>
          <li>每天 10-15 分钟、认识 5-8 个新字，比一次学 30 个效果好得多。</li>
          <li>让孩子跟着"跟我读"大声念出来，听觉 + 视觉一起记更牢固。</li>
          <li>错字本里的字，第二天复习一次，基本就能长期记住。</li>
          <li>尽量和孩子一起玩闯关，答对了给一个真实的拥抱。</li>
        </ul>
      </div>
    </section>

    <!-- ═══ 错字本 ═══ -->
    <section v-else-if="tab === 'wrong'" class="anim-rise">
      <div class="card wrong">
        <h3 class="wrong__title">
          🇨🇳 汉字易错字 <span>{{ hanziWrong.length }}</span>
        </h3>
        <div v-if="hanziWrong.length" class="wrong__grid">
          <div v-for="w in hanziWrong" :key="w.id" class="wcard">
            <b class="wcard__c">{{ w.char }}</b>
            <span class="wcard__p">{{ w.pinyin }}</span>
            <span class="wcard__n">错 {{ w.record.wrong }} 次</span>
          </div>
        </div>
        <p v-else class="empty">还没有出错的汉字，太棒了！🎉</p>
        <button
          v-if="hanziWrong.length"
          class="btn btn--sm btn--pink wrong__cta"
          type="button"
          @click="router.push('/review/hanzi')"
        >
          💪 练习这 {{ Math.min(hanziWrong.length, 10) }} 个字
        </button>
      </div>

      <div class="card wrong" style="margin-top: 14px">
        <h3 class="wrong__title">
          🔤 英语易错词 <span>{{ enWrong.length }}</span>
        </h3>
        <div v-if="enWrong.length" class="wrong__grid">
          <div v-for="w in enWrong" :key="w.id" class="wcard">
            <b class="wcard__c wcard__c--en">{{ w.word }}</b>
            <span class="wcard__p">{{ w.zh }}</span>
            <span class="wcard__n">错 {{ w.record.wrong }} 次</span>
          </div>
        </div>
        <p v-else class="empty">还没有出错的单词，继续保持！🎉</p>
        <button
          v-if="enWrong.length"
          class="btn btn--sm btn--pink wrong__cta"
          type="button"
          @click="router.push('/review/english')"
        >
          💪 练习这 {{ Math.min(enWrong.length, 10) }} 个词
        </button>
      </div>

      <p class="wrong__note">
        答对 3 次会自动标记为「已掌握」，并从错字本里移出。
      </p>
    </section>

    <!-- ═══ 分级进度 ═══ -->
    <section v-else-if="tab === 'level'" class="anim-rise">
      <div class="card">
        <h3 class="sec-title">🇨🇳 汉字分级</h3>
        <div v-for="lv in HANZI_LEVELS" :key="lv.id" class="row">
          <span class="row__name">{{ lv.emoji }} {{ lv.name }}</span>
          <div class="bar row__bar">
            <div
              class="bar__fill"
              :style="{
                width: (store.learnedCountOf('hanzi', lv.id) / lv.items.length) * 100 + '%',
                background: lv.color
              }"
            />
          </div>
          <span class="row__num">{{ store.learnedCountOf('hanzi', lv.id) }}/{{ lv.items.length }}</span>
        </div>
      </div>

      <div class="card" style="margin-top: 14px">
        <h3 class="sec-title">🔤 英语分类</h3>
        <div v-for="c in EN_CATEGORIES" :key="c.id" class="row">
          <span class="row__name">{{ c.emoji }} {{ c.name }}</span>
          <div class="bar row__bar">
            <div
              class="bar__fill"
              :style="{
                width: (store.learnedCountOf('english', c.id) / c.items.length) * 100 + '%',
                background: c.color
              }"
            />
          </div>
          <span class="row__num">{{ store.learnedCountOf('english', c.id) }}/{{ c.items.length }}</span>
        </div>
      </div>
    </section>

    <!-- ═══ 设置 ═══ -->
    <section v-else class="anim-rise">
      <div class="card">
        <h3 class="sec-title">👶 孩子信息</h3>
        <label class="field">
          <span class="field__label">昵称（显示在首页问候语中）</span>
          <div class="field__row">
            <input v-model="nameInput" class="input" type="text" maxlength="12" placeholder="例如：小宝" />
            <button class="btn btn--sm" type="button" @click="saveName">保存</button>
          </div>
        </label>
      </div>

      <div class="card" style="margin-top: 14px">
        <h3 class="sec-title">🔊 朗读设置</h3>
        <label class="switch">
          <span>打开卡片时自动朗读</span>
          <input
            type="checkbox"
            :checked="store.settings.autoSpeak"
            @change="store.updateSettings({ autoSpeak: $event.target.checked })"
          />
        </label>
        <label class="field">
          <span class="field__label">语速：{{ rate.toFixed(2) }}x（越慢越适合初学者）</span>
          <input v-model.number="rate" class="range" type="range" min="0.5" max="1.2" step="0.05" @change="saveRate" />
        </label>
      </div>

      <div class="card" style="margin-top: 14px">
        <h3 class="sec-title">💾 数据管理</h3>
        <p class="note">学习记录保存在这台设备的浏览器里。换设备或清理浏览器数据前，建议先导出备份。</p>
        <div class="data-actions">
          <button class="btn btn--sm btn--blue" type="button" @click="exportData">⬇️ 导出备份</button>
          <button class="btn btn--sm btn--ghost" type="button" @click="fileInput.click()">⬆️ 导入备份</button>
          <input ref="fileInput" class="hidden-file" type="file" accept="application/json" @change="importData" />
        </div>
        <button class="btn btn--sm btn--ghost danger" type="button" @click="resetAll">🗑️ 清空全部记录</button>
      </div>

      <div class="card about" style="margin-top: 14px">
        <h3 class="sec-title">ℹ️ 关于</h3>
        <p>
          小小识字乐园 · 一个纯前端的开源儿童识字项目。汉字 {{ HANZI_ALL.length }} 字（4 级），
          英语 {{ EN_ALL.length }} 词（10 类），全部内容离线可用，无广告、无后端、不收集任何数据。
        </p>
        <button class="btn btn--sm btn--ghost" type="button" @click="router.push('/')">🏠 回到首页</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.tab {
  flex: none;
  border: 2px solid var(--line);
  background: #fff;
  border-radius: 999px;
  padding: 9px 16px;
  font-family: var(--font);
  font-size: 14px;
  font-weight: 800;
  color: var(--text-soft);
  cursor: pointer;
  white-space: nowrap;
}

.tab--on {
  background: var(--c-blue);
  border-color: var(--c-blue);
  color: #fff;
}

.grid4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  text-align: center;
  margin-bottom: 14px;
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.kpi strong {
  font-size: 24px;
  font-weight: 900;
  line-height: 1.1;
}

.kpi span {
  font-size: 12px;
  color: var(--text-soft);
  font-weight: 700;
}

.kpi i {
  font-style: normal;
  font-size: 11px;
  color: var(--text-mute);
}

.chart {
  margin-bottom: 14px;
}

.chart__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.chart__head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
}

.chart__body {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 6px;
  height: 150px;
}

.col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  gap: 4px;
}

.col__num {
  font-size: 11px;
  font-weight: 800;
  color: var(--text-mute);
  height: 14px;
}

.col__bar {
  width: 100%;
  max-width: 46px;
  border-radius: 10px 10px 4px 4px;
  background: linear-gradient(180deg, #74c0fc, #4dabf7);
  min-height: 6px;
  transition: height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.col__label {
  font-size: 11px;
  color: var(--text-mute);
  font-weight: 700;
}

.col__label--today {
  color: var(--c-orange);
  font-weight: 900;
}

.overall {
  margin-bottom: 14px;
}

.overall__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 800;
  margin-bottom: 8px;
}

.overall__row--sub {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-soft);
  margin: 10px 0 0;
}

.tips h3 {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 900;
}

.tips ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13.5px;
  color: var(--text-soft);
  font-weight: 600;
  line-height: 1.85;
}

.sec-title {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 900;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.row:last-child {
  margin-bottom: 0;
}

.row__name {
  width: 108px;
  flex: none;
  font-size: 13.5px;
  font-weight: 800;
}

.row__bar {
  flex: 1;
}

.row__num {
  width: 52px;
  flex: none;
  text-align: right;
  font-size: 12px;
  font-weight: 800;
  color: var(--text-mute);
}

.wrong__title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 8px;
}

.wrong__title span {
  font-size: 12px;
  background: #fff0f0;
  color: #c92a2a;
  border-radius: 999px;
  padding: 2px 9px;
}

.wrong__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 10px;
}

.wcard {
  border: 2px solid var(--line);
  border-radius: 14px;
  padding: 10px 6px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #fffafa;
}

.wcard__c {
  font-size: 28px;
  font-weight: 700;
  font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', var(--font);
  line-height: 1.2;
}

.wcard__c--en {
  font-family: var(--font);
  font-size: 15px;
  font-weight: 900;
  word-break: break-all;
}

.wcard__p {
  font-size: 11.5px;
  color: var(--text-soft);
  font-weight: 700;
}

.wcard__n {
  font-size: 10.5px;
  color: #e8590c;
  font-weight: 800;
}

.empty {
  margin: 0;
  font-size: 14px;
  color: var(--text-mute);
  font-weight: 700;
  text-align: center;
  padding: 14px 0;
}

.wrong__cta {
  width: 100%;
  margin-top: 14px;
}

.wrong__note {
  margin: 12px 4px 0;
  font-size: 12.5px;
  color: var(--text-mute);
  font-weight: 600;
  text-align: center;
}

.field {
  display: block;
  margin-bottom: 14px;
}

.field:last-child {
  margin-bottom: 0;
}

.field__label {
  display: block;
  font-size: 13px;
  font-weight: 800;
  color: var(--text-soft);
  margin-bottom: 7px;
}

.field__row {
  display: flex;
  gap: 8px;
}

.input {
  flex: 1;
  border: 2px solid var(--line);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 15px;
  font-family: var(--font);
  font-weight: 700;
  color: var(--text);
  outline: none;
}

.input:focus {
  border-color: var(--c-blue);
}

.range {
  width: 100%;
  accent-color: var(--c-blue);
}

.switch {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 800;
  padding: 8px 0 14px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 14px;
}

.switch input {
  width: 22px;
  height: 22px;
  accent-color: var(--c-blue);
}

.note {
  margin: 0 0 12px;
  font-size: 12.5px;
  color: var(--text-mute);
  font-weight: 600;
  line-height: 1.7;
}

.data-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.hidden-file {
  display: none;
}

.danger {
  color: #c92a2a;
  border-color: #ffc9c9;
}

.about p {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--text-soft);
  font-weight: 600;
  line-height: 1.8;
}

@media (max-width: 600px) {
  .grid4 {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px 0;
  }
  .row__name {
    width: 84px;
    font-size: 12.5px;
  }
  .wrong__grid {
    grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  }
}
</style>
