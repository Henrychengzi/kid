<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useProgressStore } from '@/store/progress'
import { getHanziLevel } from '@/data/hanzi'
import { getEnCategory } from '@/data/english'
import { speak, stopSpeak } from '@/utils/speech'

const props = defineProps({
  module: { type: String, required: true } // 'hanzi' | 'english'
})

const route = useRoute()
const router = useRouter()
const store = useProgressStore()

const isHanzi = computed(() => props.module === 'hanzi')
const scopeId = computed(() => route.params.levelId || route.params.catId)

/** 错题复习模式：题目只从错字本里出 */
const isReview = computed(() => route.name === 'review')

const REVIEW_SCOPE = { name: '错题复习', emoji: '📕', color: '#FF6B9D', age: '攻克易错点' }

const scope = computed(() => {
  if (isReview.value) return REVIEW_SCOPE
  return isHanzi.value ? getHanziLevel(scopeId.value) : getEnCategory(scopeId.value)
})

const pool = computed(() => {
  if (isReview.value) return store.wrongListOf(props.module)
  return scope.value.items
})

const homePath = computed(() => {
  if (isReview.value) return '/parent'
  return isHanzi.value ? '/hanzi' : '/english'
})

const QUESTION_COUNT = 10

/* ── 玩法定义 ── */
const MODES = computed(() => [
  { id: 'listen', emoji: '🎧', name: '听音辨字', desc: '听发音，选出正确的字' },
  {
    id: 'picture',
    emoji: '🖼️',
    name: '看图选词',
    desc: isHanzi.value ? '看插图，选出对应的汉字' : '看插图，选出对应的单词'
  },
  {
    id: 'meaning',
    emoji: '💬',
    name: isHanzi.value ? '组词选字' : '中文选词',
    desc: isHanzi.value ? '看词语，选出空缺的汉字' : '看中文，选出正确的英文单词'
  },
  ...(isHanzi.value
    ? []
    : [{ id: 'spell', emoji: '🔠', name: '字母拼写', desc: '把打乱的字母拼成单词' }])
])

/* ── 状态 ── */
const stage = ref('ready') // ready | playing | result
const mode = ref('listen')
const questions = ref([])
const qIndex = ref(0)
const picked = ref(null) // 已选中的选项 id
const answered = ref(false)
const lastCorrect = ref(false)
const correctCount = ref(0)
const wrongList = ref([])
const shakeKey = ref(0)

// 拼写模式专用
const slots = ref([])
const bank = ref([]) // [{ key, letter, used }]

const current = computed(() => questions.value[qIndex.value])
const total = computed(() => questions.value.length)
const progress = computed(() => Math.round((qIndex.value / total.value) * 100))
const stars = computed(() => {
  const r = correctCount.value / Math.max(1, total.value)
  if (r >= 0.9) return 3
  if (r >= 0.7) return 2
  if (r >= 0.5) return 1
  return 0
})

const PRAISE = ['太棒啦！', '答对了！', '真聪明！', '好厉害！', '完全正确！', '棒极了！']
const CHEER = ['没关系，再想想～', '差一点点，加油！', '看清楚正确答案哦～']

function lang() {
  return isHanzi.value ? 'zh-CN' : 'en-US'
}

function say(text, extra = {}) {
  speak(text, { lang: lang(), rate: isHanzi.value ? 0.9 : 0.75, ...extra })
}

function sayPraise() {
  say(PRAISE[Math.floor(Math.random() * PRAISE.length)])
}

/* ── 出题 ── */
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 题目显示什么：造句 / 图标 / 音频 */
function stemOf(item, m) {
  if (m === 'listen') return { type: 'audio', text: isHanzi.value ? item.char : item.word }
  if (m === 'picture') return { type: 'emoji', text: item.emoji }
  if (m === 'meaning')
    return {
      type: 'text',
      text: isHanzi.value ? item.words[0].replace(item.char, '（ ？ ）') : item.zh,
      hint: isHanzi.value ? `想一想：${item.words[0]}` : ''
    }
  return { type: 'text', text: isHanzi.value ? item.char : item.zh }
}

/** 选项显示文本 */
function optionLabel(item) {
  return isHanzi.value ? item.char : item.word
}

function optionSub(item) {
  return isHanzi.value ? item.pinyin : item.zh
}

function buildQuestions(m) {
  // 优先练没掌握的，其次随机
  const sorted = shuffle(
    pool.value.slice().sort((a, b) => {
      const ra = store.itemOf(props.module, a.id).mastered ? 1 : 0
      const rb = store.itemOf(props.module, b.id).mastered ? 1 : 0
      return ra - rb
    })
  )
  const pickedItems = sorted.slice(0, Math.min(QUESTION_COUNT, pool.value.length))
  const need = Math.max(0, QUESTION_COUNT - pickedItems.length)
  if (need > 0) pickedItems.push(...shuffle(pool.value).slice(0, need))

  return shuffle(pickedItems).map((item) => {
    const others = shuffle(pool.value.filter((x) => x.id !== item.id)).slice(0, 3)
    return {
      key: `${item.id}-${Math.random().toString(36).slice(2, 7)}`,
      item,
      stem: stemOf(item, m),
      options: shuffle([item, ...others])
    }
  })
}

function setupSpell() {
  const word = current.value.item.word.replace(/\s+/g, '')
  const letters = word.split('')
  // 打乱时避免与原单词完全一致
  let mixed = shuffle(letters)
  if (mixed.join('') === word && letters.length > 2) mixed = shuffle(letters)
  slots.value = Array.from({ length: letters.length }, () => null)
  bank.value = mixed.map((letter, i) => ({ key: `l${i}`, letter, used: false }))
}

function startGame(m) {
  if (!pool.value.length) return // 错字本为空时兜底，避免出空题
  mode.value = m
  questions.value = buildQuestions(m)
  qIndex.value = 0
  correctCount.value = 0
  wrongList.value = []
  answered.value = false
  picked.value = null
  stage.value = 'playing'
  enterQuestion()
}

function enterQuestion() {
  answered.value = false
  picked.value = null
  lastCorrect.value = false
  if (mode.value === 'spell') setupSpell()
  if (mode.value === 'listen') {
    setTimeout(() => say(current.value.stem.text, { rate: isHanzi.value ? 0.75 : 0.6 }), 260)
  }
}

/* ── 作答 ── */
function answer(item) {
  if (answered.value) return
  answered.value = true
  picked.value = item.id
  const ok = item.id === current.value.item.id
  lastCorrect.value = ok
  store.recordAnswer(props.module, current.value.item.id, ok)
  if (ok) {
    correctCount.value += 1
    sayPraise()
  } else {
    shakeKey.value++
    wrongList.value.push(current.value.item)
    say(CHEER[Math.floor(Math.random() * CHEER.length)])
    setTimeout(() => say(isHanzi.value ? current.value.item.char : current.value.item.word), 700)
  }
}

function next() {
  if (qIndex.value + 1 >= total.value) {
    stage.value = 'result'
    const msg =
      stars.value === 3
        ? '太厉害啦，全部答对！'
        : `答对 ${correctCount.value} 题，继续加油！`
    say(isHanzi.value ? msg : (stars.value === 3 ? 'Perfect! Great job!' : `You got ${correctCount.value} right!`))
    return
  }
  qIndex.value += 1
  enterQuestion()
}

/* ── 拼写模式交互 ── */
function fillSlot(bankItem) {
  if (answered.value || bankItem.used) return
  const idx = slots.value.findIndex((s) => s === null)
  if (idx === -1) return
  bankItem.used = true
  slots.value[idx] = bankItem
  if (slots.value.every((s) => s)) checkSpell()
}

function clearSlot(idx) {
  if (answered.value || !slots.value[idx]) return
  slots.value[idx].used = false
  slots.value[idx] = null
}

function checkSpell() {
  const typed = slots.value.map((s) => s.letter).join('')
  const target = current.value.item.word.replace(/\s+/g, '')
  answered.value = true
  const ok = typed.toLowerCase() === target.toLowerCase()
  lastCorrect.value = ok
  store.recordAnswer(props.module, current.value.item.id, ok)
  if (ok) {
    correctCount.value += 1
    sayPraise()
    setTimeout(() => say(current.value.item.word), 600)
  } else {
    shakeKey.value++
    wrongList.value.push(current.value.item)
    say('差一点点，看一看正确的拼写吧')
    setTimeout(() => say(current.value.item.word), 700)
  }
}

/* ── 键盘（1-4 快速作答 / 回车下一题）── */
function onKey(e) {
  if (stage.value !== 'playing') return
  if (e.key === 'Enter') {
    if (answered.value || mode.value === 'spell') next()
    return
  }
  if (mode.value === 'spell') return
  const n = Number(e.key)
  if (n >= 1 && n <= 4) {
    const opt = current.value.options[n - 1]
    if (opt) answer(opt)
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  stopSpeak()
})
</script>

<template>
  <main class="page">
    <AppHeader
      :title="isReview ? (isHanzi ? '汉字错题复习' : '英语错题复习') : scope.name"
      :emoji="isReview ? '📕' : '🎮'"
      :subtitle="
        stage === 'playing'
          ? `第 ${qIndex + 1} / ${total} 题`
          : isReview
            ? '只练错过的，逐个攻克'
            : '闯关模式'
      "
      :back-to="homePath"
      :color="isReview ? 'var(--c-pink)' : 'var(--c-purple)'"
    />

    <!-- ═══ 选择玩法 ═══ -->
    <section v-if="stage === 'ready'" class="ready">
      <!-- 错字本为空 -->
      <div v-if="!pool.length" class="empty card anim-pop">
        <span class="empty__emoji">🎉</span>
        <h2>错字本是空的！</h2>
        <p>目前没有需要复习的{{ isHanzi ? '汉字' : '单词' }}，保持得很好～</p>
        <button class="btn" type="button" @click="router.push(homePath)">📚 继续学习</button>
      </div>

      <template v-else>
        <div class="ready__hero anim-pop">
          <span class="ready__emoji">{{ isReview ? '💪' : '🏅' }}</span>
          <h2>{{ isReview ? '攻克错题！' : '准备好了吗？' }}</h2>
          <p v-if="isReview">
            从错字本里抽 {{ Math.min(QUESTION_COUNT, pool.length) }} 道题，答对就能移出错字本
          </p>
          <p v-else>每关 {{ QUESTION_COUNT }} 道题，答对 3 次的{{ isHanzi ? '字' : '词' }}会自动标记为「已掌握」</p>
        </div>

        <div class="modes">
          <button
            v-for="(m, i) in MODES"
            :key="m.id"
            class="mode anim-rise"
            :style="{ animationDelay: i * 60 + 'ms' }"
            type="button"
            @click="startGame(m.id)"
          >
            <span class="mode__emoji">{{ m.emoji }}</span>
            <span class="mode__body">
              <b>{{ m.name }}</b>
              <i>{{ m.desc }}</i>
            </span>
            <span class="mode__go">›</span>
          </button>
        </div>
      </template>
    </section>

    <!-- ═══ 答题中 ═══ -->
    <section v-else-if="stage === 'playing'" class="play">
      <div class="bar">
        <div class="bar__fill" :style="{ width: progress + '%', background: 'var(--c-purple)' }" />
      </div>
      <div class="score">
        <span class="score__ok">✅ {{ correctCount }}</span>
        <span class="score__no">❌ {{ qIndex + (answered ? 1 : 0) - correctCount }}</span>
      </div>

      <!-- 题干 -->
      <div class="stem card anim-pop" :key="current.key">
        <template v-if="current.stem.type === 'audio'">
          <p class="stem__tip">点喇叭听一听，是哪一个？</p>
          <button class="stem__audio" type="button" @click="say(current.stem.text, { rate: isHanzi ? 0.75 : 0.6 })">
            🔊
          </button>
        </template>

        <template v-else-if="current.stem.type === 'emoji'">
          <p class="stem__tip">看一看，这是什么？</p>
          <div class="stem__emoji">{{ current.stem.text }}</div>
        </template>

        <template v-else-if="mode === 'spell'">
          <p class="stem__tip">把字母拼成单词：{{ current.item.zh }}</p>
          <div class="stem__emoji stem__emoji--sm">{{ current.item.emoji }}</div>
        </template>

        <template v-else>
          <p class="stem__tip">选出正确的{{ isHanzi ? '汉字' : '单词' }}</p>
          <div class="stem__text">{{ current.stem.text }}</div>
          <p v-if="current.stem.hint" class="stem__hint">{{ current.stem.hint }}</p>
        </template>
      </div>

      <!-- 选项式玩法 -->
      <div v-if="mode !== 'spell'" class="options" :key="'opt-' + current.key + '-' + shakeKey">
        <button
          v-for="(opt, i) in current.options"
          :key="opt.id"
          class="opt"
          :class="{
            'opt--hanzi': isHanzi,
            'opt--right': answered && opt.id === current.item.id,
            'opt--wrong': answered && picked === opt.id && opt.id !== current.item.id,
            'opt--dim': answered && opt.id !== current.item.id && picked !== opt.id
          }"
          type="button"
          @click="answer(opt)"
        >
          <span class="opt__key">{{ i + 1 }}</span>
          <span class="opt__main">{{ optionLabel(opt) }}</span>
          <span class="opt__sub">{{ optionSub(opt) }}</span>
        </button>
      </div>

      <!-- 拼写玩法 -->
      <div v-else class="spell" :key="'sp-' + current.key + '-' + shakeKey">
        <div class="spell__slots">
          <button
            v-for="(s, i) in slots"
            :key="'slot-' + i"
            class="slot"
            :class="{
              'slot--ok': answered && lastCorrect,
              'slot--bad': answered && !lastCorrect
            }"
            type="button"
            @click="clearSlot(i)"
          >
            {{ s ? s.letter : '' }}
          </button>
        </div>
        <div class="spell__bank">
          <button
            v-for="b in bank"
            :key="b.key"
            class="letter"
            :class="{ 'letter--used': b.used }"
            type="button"
            @click="fillSlot(b)"
          >
            {{ b.letter }}
          </button>
        </div>
        <p class="spell__hint">点字母填进去，点格子可以拿回来</p>
      </div>

      <!-- 反馈 -->
      <transition name="fade">
        <div v-if="answered" class="fb" :class="lastCorrect ? 'fb--ok' : 'fb--no'">
          <span class="fb__emoji">{{ lastCorrect ? '🎉' : '🤔' }}</span>
          <span class="fb__text">
            {{ lastCorrect ? '答对啦！' : `正确答案是：${isHanzi ? current.item.char : current.item.word}` }}
          </span>
          <button class="btn btn--sm" type="button" @click="next">
            {{ qIndex + 1 >= total ? '看结果 🏁' : '下一题 ›' }}
          </button>
        </div>
      </transition>
    </section>

    <!-- ═══ 结算 ═══ -->
    <section v-else class="result">
      <div class="card result__card anim-pop">
        <div class="result__stars">
          <span v-for="n in 3" :key="n" class="star" :class="{ 'star--on': n <= stars }">⭐</span>
        </div>
        <h2 class="result__title">
          {{ stars === 3 ? '完美通关！' : stars === 2 ? '表现很棒！' : stars === 1 ? '继续加油！' : '再来一次吧！' }}
        </h2>
        <p class="result__score">
          答对 <b>{{ correctCount }}</b> / {{ total }} 题 · 正确率
          <b>{{ Math.round((correctCount / total) * 100) }}%</b>
        </p>

        <div v-if="wrongList.length" class="result__wrong">
          <h3>需要再练一练</h3>
          <div class="chips">
            <button
              v-for="w in wrongList"
              :key="w.id"
              class="chip"
              type="button"
              @click="say(isHanzi ? w.char : w.word)"
            >
              {{ isHanzi ? w.char : w.word }}
              <span class="chip__spk">🔊</span>
            </button>
          </div>
        </div>
        <p v-else class="result__perfect">全部答对，一题都没错！👏</p>

        <div class="result__actions">
          <button class="btn btn--purple" type="button" @click="startGame(mode)">🔁 再来一关</button>
          <button class="btn btn--ghost" type="button" @click="stage = 'ready'">🎯 换个玩法</button>
          <button class="btn btn--ghost" type="button" @click="router.push(homePath)">📚 回去学习</button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* ── 选择玩法 ── */
.ready__hero {
  text-align: center;
  padding: 12px 0 22px;
}

.ready__emoji {
  font-size: 54px;
  display: block;
  animation: float-y 2.6s ease-in-out infinite;
}

.ready__hero h2 {
  margin: 6px 0 4px;
  font-size: 24px;
  font-weight: 900;
}

.ready__hero p {
  margin: 0;
  font-size: 13px;
  color: var(--text-mute);
  font-weight: 600;
}

.modes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty {
  text-align: center;
  padding: 34px 22px;
}

.empty__emoji {
  font-size: 52px;
  display: block;
  margin-bottom: 6px;
}

.empty h2 {
  margin: 0 0 6px;
  font-size: 21px;
  font-weight: 900;
}

.empty p {
  margin: 0 0 18px;
  font-size: 14px;
  color: var(--text-mute);
  font-weight: 600;
}

.mode {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  border: 2px solid var(--line);
  background: #fff;
  border-radius: var(--radius-m);
  padding: 16px 18px;
  cursor: pointer;
  text-align: left;
  font-family: var(--font);
  box-shadow: var(--shadow-s);
  transition: transform 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
}

.mode:hover {
  transform: translateY(-2px);
  border-color: var(--c-purple);
  box-shadow: var(--shadow-m);
}

.mode__emoji {
  font-size: 32px;
  line-height: 1;
}

.mode__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.mode__body b {
  font-size: 17px;
  font-weight: 900;
}

.mode__body i {
  font-style: normal;
  font-size: 12.5px;
  color: var(--text-mute);
  font-weight: 600;
}

.mode__go {
  font-size: 26px;
  color: var(--text-mute);
}

/* ── 答题 ── */
.play {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.score {
  display: flex;
  justify-content: center;
  gap: 18px;
  font-size: 15px;
  font-weight: 900;
  margin-top: -6px;
}

.score__ok {
  color: #2f9e5c;
}
.score__no {
  color: #e8590c;
}

.stem {
  text-align: center;
  padding: 22px;
}

.stem__tip {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 800;
  color: var(--text-soft);
}

.stem__audio {
  width: 108px;
  height: 108px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #ffb37a, #ff8a3d);
  color: #fff;
  font-size: 40px;
  cursor: pointer;
  box-shadow: var(--shadow-m);
  display: grid;
  place-items: center;
  margin: 0 auto;
  transition: transform 0.14s ease;
}

.stem__audio:active {
  transform: scale(0.93);
}

.stem__emoji {
  font-size: 88px;
  line-height: 1;
}

.stem__emoji--sm {
  font-size: 56px;
}

.stem__text {
  font-size: 34px;
  font-weight: 900;
  line-height: 1.4;
}

.stem__hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--text-mute);
  font-weight: 700;
}

.options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.opt {
  position: relative;
  border: 3px solid var(--line);
  background: #fff;
  border-radius: var(--radius-m);
  padding: 18px 12px 14px;
  cursor: pointer;
  font-family: var(--font);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  box-shadow: var(--shadow-s);
  transition: transform 0.12s ease, border-color 0.12s ease, background 0.2s ease;
  min-height: 108px;
  justify-content: center;
}

.opt:active {
  transform: scale(0.96);
}

.opt__key {
  position: absolute;
  top: 6px;
  left: 10px;
  font-size: 12px;
  font-weight: 800;
  color: var(--text-mute);
}

.opt__main {
  font-size: 40px;
  font-weight: 800;
  line-height: 1.15;
  word-break: break-all;
  text-align: center;
}

/* 汉字用楷体，更贴近课本；英文单词用默认无衬线体 */
.opt--hanzi .opt__main {
  font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', var(--font);
}

.opt__sub {
  font-size: 13px;
  color: var(--text-mute);
  font-weight: 700;
}

.opt--right {
  border-color: var(--c-green);
  background: var(--c-green-soft);
  animation: pop-in 0.3s ease;
}

.opt--wrong {
  border-color: #ff8787;
  background: #fff0f0;
  animation: shake-x 0.4s ease;
}

.opt--dim {
  opacity: 0.45;
}

/* ── 拼写 ── */
.spell {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
}

.spell__slots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.slot {
  width: 46px;
  height: 54px;
  border: 3px dashed #c5b6ff;
  border-radius: 12px;
  background: #fff;
  font-size: 24px;
  font-weight: 900;
  color: var(--c-purple);
  cursor: pointer;
  text-transform: uppercase;
  font-family: var(--font);
}

.slot--ok {
  border-color: var(--c-green);
  border-style: solid;
  color: #2f9e5c;
  background: var(--c-green-soft);
}

.slot--bad {
  border-color: #ff8787;
  border-style: solid;
  background: #fff0f0;
  color: #c92a2a;
}

.spell__bank {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.letter {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 12px;
  background: var(--c-purple);
  color: #fff;
  font-size: 22px;
  font-weight: 900;
  cursor: pointer;
  text-transform: uppercase;
  box-shadow: 0 4px 0 #7c5cf0;
  transition: transform 0.1s ease;
  font-family: var(--font);
}

.letter:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #7c5cf0;
}

.letter--used {
  background: #e3dcf7;
  color: #b9aef0;
  box-shadow: none;
  cursor: default;
}

.spell__hint {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-mute);
  font-weight: 600;
}

/* ── 反馈条 ── */
.fb {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: var(--radius-m);
  padding: 12px 16px;
  font-weight: 800;
  font-size: 15px;
}

.fb--ok {
  background: var(--c-green-soft);
  color: #2f7a48;
}

.fb--no {
  background: #fff0f0;
  color: #c92a2a;
}

.fb__emoji {
  font-size: 24px;
}

.fb__text {
  flex: 1;
}

/* ── 结算 ── */
.result__card {
  text-align: center;
  padding: 30px 22px;
}

.result__stars {
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 42px;
  margin-bottom: 6px;
}

.star {
  filter: grayscale(1);
  opacity: 0.35;
}

.star--on {
  filter: none;
  opacity: 1;
  animation: pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.star--on:nth-child(2) {
  animation-delay: 0.14s;
}
.star--on:nth-child(3) {
  animation-delay: 0.28s;
}

.result__title {
  margin: 0 0 6px;
  font-size: 25px;
  font-weight: 900;
}

.result__score {
  margin: 0 0 18px;
  font-size: 15px;
  color: var(--text-soft);
  font-weight: 700;
}

.result__score b {
  color: var(--c-purple);
  font-size: 19px;
}

.result__wrong {
  background: #fff8f0;
  border-radius: var(--radius-m);
  padding: 14px;
  margin-bottom: 16px;
  text-align: left;
}

.result__wrong h3 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 900;
  color: #b3540f;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border: 2px solid var(--c-orange);
  background: #fff;
  color: #b3540f;
  font-family: var(--font);
  font-weight: 800;
  font-size: 16px;
  border-radius: 999px;
  padding: 7px 15px;
  cursor: pointer;
}

.chip__spk {
  font-size: 12px;
  opacity: 0.7;
}

.result__perfect {
  font-size: 15px;
  font-weight: 800;
  color: #2f7a48;
  background: var(--c-green-soft);
  border-radius: var(--radius-m);
  padding: 12px;
  margin: 0 0 16px;
}

.result__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 600px) {
  .opt__main {
    font-size: 32px;
  }
  .stem__emoji {
    font-size: 68px;
  }
  .stem__text {
    font-size: 26px;
  }
  .options {
    gap: 10px;
  }
  .slot,
  .letter {
    width: 40px;
  }
  .slot {
    height: 48px;
  }
}
</style>
