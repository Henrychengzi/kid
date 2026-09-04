<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useProgressStore } from '@/store/progress'
import { getHanziLevel } from '@/data/hanzi'
import { speak, stopSpeak, speechSupported } from '@/utils/speech'

const route = useRoute()
const router = useRouter()
const store = useProgressStore()

const level = computed(() => getHanziLevel(route.params.levelId))
const items = computed(() => level.value.items)

const ROUND = 12 // 每轮听写题数（不足则取全部）

const questions = ref([])
const qIndex = ref(0)
const filled = ref(null)
const locked = ref(false)
const wrongCount = ref(0)
const showHint = ref(false)
const correctTotal = ref(0)
const finished = ref(false)
const shakeKey = ref(0)
const feedback = ref('')

const current = computed(() => questions.value[qIndex.value] || null)

// 把例句在本字处挖空：before + 空 + after
const blanked = computed(() => {
  const q = current.value
  if (!q) return { before: '', after: '', has: false }
  const s = q.item.sentence
  const idx = s.indexOf(q.item.char)
  if (idx < 0) return { before: s, after: '', has: false }
  return { before: s.slice(0, idx), after: s.slice(idx + q.item.char.length), has: true }
})

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestions() {
  const pool = shuffle(items.value).slice(0, Math.min(items.value.length, ROUND))
  questions.value = pool.map((item) => {
    const distract = shuffle(items.value.filter((i) => i.char !== item.char))
      .slice(0, 3)
      .map((i) => i.char)
    return { item, candidates: shuffle([item.char, ...distract]) }
  })
}

function start() {
  buildQuestions()
  qIndex.value = 0
  correctTotal.value = 0
  finished.value = false
  resetQuestion()
  nextTick(() => playSentence())
}

function resetQuestion() {
  filled.value = null
  locked.value = false
  wrongCount.value = 0
  showHint.value = false
  feedback.value = ''
}

// 听写朗读：读出挖空处「前面 +（停顿）+ 后面」，本字不读，形成听写空缺
function playSentence() {
  if (!speechSupported || !current.value) return
  stopSpeak()
  const { before, after } = blanked.value
  const opts = { lang: 'zh-CN', rate: store.settings.rate }
  if (before) speak(before, opts)
  if (after) setTimeout(() => speak(after, opts), before ? 950 : 0)
}

function pick(c) {
  if (locked.value || !current.value) return
  if (c === current.value.item.char) {
    filled.value = c
    locked.value = true
    correctTotal.value++
    store.recordAnswer('hanzi', current.value.item.id, true)
    feedback.value = '答对啦！👏'
    speak(`${c}，答对啦！`, { lang: 'zh-CN', rate: store.settings.rate })
    setTimeout(next, 1100)
  } else {
    wrongCount.value++
    store.recordAnswer('hanzi', current.value.item.id, false)
    shakeKey.value++
    feedback.value = '再想想看～🤔'
    speak('再想想看', { lang: 'zh-CN', rate: store.settings.rate })
    if (wrongCount.value >= 2) showHint.value = true
  }
}

function next() {
  if (qIndex.value + 1 >= questions.value.length) {
    finished.value = true
    stopSpeak()
    return
  }
  qIndex.value++
  resetQuestion()
  nextTick(() => playSentence())
}

watch(current, () => {
  if (current.value) nextTick(() => playSentence())
})

onMounted(start)
onUnmounted(stopSpeak)
</script>

<template>
  <main class="page">
    <AppHeader
      :title="`${level.name} · 听写`"
      emoji="🎧"
      :subtitle="finished ? '完成啦！' : `第 ${qIndex + 1} / ${questions.length} 题`"
      :back-to="`/hanzi/learn/${level.id}`"
      :color="level.color"
    >
      <template #right>
        <span class="score">✅ {{ correctTotal }}</span>
      </template>
    </AppHeader>

    <div v-if="!finished && current" class="bar bar--top">
      <div class="bar__fill" :style="{ width: ((qIndex) / questions.length) * 100 + '%', background: level.color }" />
    </div>

    <!-- 完成页 -->
    <section v-if="finished" class="card result anim-pop">
      <div class="result__emoji">🏆</div>
      <h2 class="result__title">听写完成！</h2>
      <p class="result__score">答对 <b>{{ correctTotal }}</b> / {{ questions.length }} 题</p>
      <div class="result__btns">
        <button class="btn btn--green btn--block" type="button" @click="start">🔁 再玩一次</button>
        <button class="btn btn--ghost btn--block" type="button" @click="router.push(`/hanzi/learn/${level.id}`)">
          返回本级
        </button>
      </div>
    </section>

    <!-- 听写题 -->
    <template v-else-if="current">
      <section class="card quiz anim-rise">
        <p class="quiz__tip">🔊 听一听，把句子里空出来的字补上吧：</p>

        <p class="dict-sentence">
          {{ blanked.before }}<span class="dict-blank" :class="{ filled: filled }">{{ filled || '＿＿' }}</span>{{ blanked.after }}
        </p>

        <p v-if="showHint" class="dict-hint">💡 提示：这个字的拼音是 <b>{{ current.item.pinyin }}</b></p>

        <div class="quiz__audio">
          <button class="btn btn--sm btn--blue" type="button" @click="playSentence">🔊 听一听</button>
          <button
            class="btn btn--sm btn--ghost"
            type="button"
            @click="showHint = true"
          >
            💡 提示
          </button>
        </div>

        <p class="quiz__feedback" :class="{ ok: locked, no: !locked && wrongCount > 0 }">{{ feedback }}</p>
      </section>

      <section class="choices">
        <button
          v-for="c in current.candidates"
          :key="c"
          class="choice"
          :class="{ 'choice--ok': locked && c === current.item.char, 'choice--no': !locked && filled === c && c !== current.item.char }"
          type="button"
          :disabled="locked"
          @click="pick(c)"
        >
          {{ c }}
        </button>
      </section>
    </template>

    <p class="kbd-hint">听到句子里停顿的地方，想一想缺了哪个字，点下面的字补上～</p>
  </main>
</template>

<style scoped>
.bar--top {
  margin: 0 4px 18px;
}

.score {
  margin-left: auto;
  font-weight: 900;
  color: var(--c-green);
  background: #fff;
  padding: 4px 12px;
  border-radius: 999px;
  box-shadow: var(--shadow-s);
  font-size: 14px;
}

.quiz {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.quiz__tip {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--text-soft);
}

.dict-sentence {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.7;
  color: var(--text);
  font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', var(--font);
  text-align: center;
  word-break: break-all;
}

.dict-blank {
  display: inline-block;
  min-width: 1.4em;
  padding: 0 6px;
  margin: 0 2px;
  border-bottom: 4px solid var(--c-orange);
  color: var(--c-orange);
  font-weight: 900;
}

.dict-blank.filled {
  border-bottom-color: var(--c-green);
  color: var(--c-green);
}

.dict-hint {
  margin: 0;
  font-size: 15px;
  color: var(--text-soft);
  text-align: center;
}

.quiz__audio {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.quiz__feedback {
  margin: 0;
  text-align: center;
  font-size: 17px;
  font-weight: 800;
  min-height: 22px;
  color: var(--text-mute);
}

.quiz__feedback.ok {
  color: var(--c-green);
}

.quiz__feedback.no {
  color: #e8590c;
}

.choices {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.choice {
  aspect-ratio: 1;
  border: 3px solid var(--line);
  background: #fff;
  border-radius: 18px;
  font-size: 40px;
  font-weight: 800;
  font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', var(--font);
  color: var(--text);
  cursor: pointer;
  box-shadow: var(--shadow-s);
  transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease;
  padding: 0;
}

.choice:active {
  transform: scale(0.93);
}

.choice--ok {
  border-color: var(--c-green);
  background: var(--c-green-soft);
  color: #2f7a48;
  animation: pop-in 0.4s ease;
}

.choice--no {
  border-color: #ffa08a;
  background: #fff0ec;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-7px); }
  40%, 80% { transform: translateX(7px); }
}

@keyframes pop-in {
  0% { transform: scale(0.8); }
  60% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

.kbd-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-mute);
  margin: 22px 0 0;
}

/* 完成页 */
.result {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.result__emoji {
  font-size: 64px;
}

.result__title {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
}

.result__score {
  margin: 0;
  font-size: 18px;
  color: var(--text-soft);
}

.result__score b {
  color: var(--c-green);
  font-size: 22px;
}

.result__btns {
  width: 100%;
  max-width: 280px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 600px) {
  .dict-sentence {
    font-size: 22px;
  }
  .choice {
    font-size: 32px;
    border-radius: 14px;
  }
}
</style>
