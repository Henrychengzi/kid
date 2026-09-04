<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useProgressStore } from '@/store/progress'
import { getEnCategory } from '@/data/english'
import { speak, stopSpeak } from '@/utils/speech'

const route = useRoute()
const router = useRouter()
const store = useProgressStore()

const cat = computed(() => getEnCategory(route.params.catId))
const items = computed(() => cat.value.items)

const index = ref(0)
const revealed = ref(false)
const bounce = ref(false)

const current = computed(() => items.value[index.value])
const record = computed(() => store.itemOf('english', current.value.id))
const progress = computed(() => Math.round(((index.value + 1) / items.value.length) * 100))
const isMastered = computed(() => record.value.mastered)

function speakEn(text, extra = {}) {
  speak(text, { lang: 'en-US', rate: Math.max(0.6, store.settings.rate - 0.15), ...extra })
}

function playWord(times = 1) {
  const t = times > 1 ? `${current.value.word}, ${current.value.word}` : current.value.word
  speakEn(t)
}

function playSentence() {
  speakEn(current.value.sentence)
}

function go(delta) {
  const next = index.value + delta
  if (next < 0) return
  if (next >= items.value.length) {
    speakEn('Great job! You finished this group!')
    alert(`🎉 Great job! 「${cat.value.name}」的单词全部看完啦！\n\n下一步去「去闯关」检验一下吧～`)
    router.push('/english')
    return
  }
  index.value = next
  revealed.value = false
}

function jumpTo(i) {
  index.value = i
  revealed.value = false
}

function toggleMastered() {
  store.toggleMastered('english', current.value.id)
  if (store.itemOf('english', current.value.id).mastered) {
    bounce.value = true
    speakEn(`I know ${current.value.word}!`)
    setTimeout(() => (bounce.value = false), 600)
  }
}

watch(
  current,
  (val) => {
    if (!val) return
    store.markSeen('english', val.id)
    if (store.settings.autoSpeak) setTimeout(() => playWord(2), 120)
  },
  { immediate: true }
)

function onKey(e) {
  if (e.key === 'ArrowLeft') go(-1)
  else if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault()
    go(1)
  } else if (e.key === 'Enter') playWord(2)
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
      :title="cat.name"
      :emoji="cat.emoji"
      :subtitle="`第 ${index + 1} / ${items.length} 个词 · ${cat.age}`"
      :back-to="'/english'"
      :color="cat.color"
    >
      <template #right>
        <button class="hd-sound" type="button" @click="store.updateSettings({ autoSpeak: !store.settings.autoSpeak })">
          {{ store.settings.autoSpeak ? '🔊' : '🔇' }}
        </button>
      </template>
    </AppHeader>

    <div class="bar bar--top">
      <div class="bar__fill" :style="{ width: progress + '%', background: cat.color }" />
    </div>

    <!-- 单词大卡 -->
    <section class="stage anim-rise">
      <div class="wcard-wrap" :class="{ 'is-bounce': bounce }">
        <button class="wcard" type="button" @click="playWord(2)">
          <span class="wcard__emoji">{{ current.emoji }}</span>
          <span class="wcard__word">{{ current.word }}</span>
          <span class="wcard__ipa">{{ current.ipa }}</span>
        </button>
      </div>

      <div class="row-btns">
        <button class="btn btn--teal btn--sm" type="button" @click="playWord(2)">🔊 听发音</button>
        <button class="btn btn--sm btn--ghost" type="button" @click="revealed = !revealed">
          {{ revealed ? '🙈 藏起来' : '👀 看意思' }}
        </button>
      </div>
    </section>

    <!-- 释义 -->
    <transition name="fade">
      <section v-if="revealed" class="card info anim-pop">
        <p class="zh">{{ current.zh }}</p>

        <h3 class="info__label">例句</h3>
        <button class="sentence" type="button" @click="playSentence()">
          <span class="sentence__col">
            <b>{{ current.sentence }}</b>
            <i>{{ current.sentenceZh }}</i>
          </span>
          <span class="sentence__spk">🔊</span>
        </button>
      </section>
    </transition>

    <!-- 操作栏 -->
    <section class="actions">
      <button class="btn btn--ghost navbtn" type="button" :disabled="index === 0" @click="go(-1)">‹ 上一个</button>
      <button
        class="btn navbtn"
        :class="isMastered ? 'btn--green' : ''"
        type="button"
        @click="toggleMastered"
      >
        {{ isMastered ? '⭐ 已学会' : '○ 我学会了' }}
      </button>
      <button class="btn btn--blue navbtn" type="button" @click="go(1)">下一个 ›</button>
    </section>

    <p class="kbd-hint">电脑上可以用 ← → 方向键翻页，回车键听发音</p>

    <!-- 本类词表 -->
    <section class="card list">
      <h3 class="list__title">
        本类词表 <span>{{ store.learnedCountOf('english', cat.id) }} / {{ items.length }}</span>
      </h3>
      <div class="list__grid">
        <button
          v-for="(it, i) in items"
          :key="it.id"
          class="cell"
          :class="{
            'cell--now': i === index,
            'cell--mastered': store.itemOf('english', it.id).mastered,
            'cell--seen': store.itemOf('english', it.id).seen > 0
          }"
          type="button"
          @click="jumpTo(i)"
        >
          {{ it.emoji }}
          <em>{{ it.word }}</em>
        </button>
      </div>
    </section>

    <div class="to-game">
      <button class="btn btn--purple btn--block" type="button" @click="router.push(`/english/game/${cat.id}`)">
        🎮 学完啦，去闯关！
      </button>
    </div>
  </main>
</template>

<style scoped>
.bar--top {
  margin: 0 4px 18px;
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.wcard-wrap.is-bounce {
  animation: pop-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.wcard {
  width: 100%;
  max-width: 340px;
  min-height: 230px;
  border: 3px dashed #a5e9e2;
  border-radius: 26px;
  background: #fff;
  box-shadow: var(--shadow-m);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  transition: transform 0.14s ease;
}

.wcard:active {
  transform: scale(0.97);
}

.wcard__emoji {
  font-size: 62px;
  line-height: 1;
}

.wcard__word {
  font-size: 42px;
  font-weight: 900;
  color: var(--text);
  letter-spacing: 1px;
  word-break: break-word;
  text-align: center;
}

.wcard__ipa {
  font-size: 17px;
  color: var(--c-teal);
  font-weight: 700;
}

.row-btns {
  display: flex;
  gap: 10px;
}

.info {
  margin-top: 18px;
}

.zh {
  margin: 0 0 16px;
  font-size: 26px;
  font-weight: 900;
  color: var(--c-teal);
  text-align: center;
}

.info__label {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 900;
  color: var(--text-soft);
}

.sentence {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  border: none;
  background: #f7f9fb;
  border-radius: var(--radius-m);
  padding: 14px 16px;
  font-family: var(--font);
  cursor: pointer;
}

.sentence__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sentence__col b {
  font-size: 17px;
  font-weight: 800;
  color: var(--text);
}

.sentence__col i {
  font-style: normal;
  font-size: 13px;
  color: var(--text-mute);
  font-weight: 600;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1.1fr 1fr;
  gap: 10px;
  margin: 22px 0 8px;
}

.navbtn {
  padding: 14px 8px;
  font-size: 16px;
}

.kbd-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-mute);
  margin: 0 0 20px;
}

.list__title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 900;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.list__title span {
  font-size: 13px;
  color: var(--text-mute);
}

.list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 8px;
}

.cell {
  border: 2px solid var(--line);
  background: #fff;
  border-radius: 12px;
  padding: 8px 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-family: var(--font);
  color: var(--text-mute);
  transition: transform 0.12s ease, border-color 0.12s ease;
}

.cell:active {
  transform: scale(0.93);
}

.cell em {
  font-style: normal;
  font-size: 12px;
  font-weight: 800;
  word-break: break-all;
  text-align: center;
  line-height: 1.2;
}

.cell--seen {
  color: var(--text);
  border-color: #b8ece7;
  background: #f3fffe;
}

.cell--mastered {
  border-color: var(--c-green);
  background: var(--c-green-soft);
}

.cell--now {
  border-color: var(--c-teal);
  background: var(--c-teal);
  color: #fff;
  transform: scale(1.05);
}

.to-game {
  margin-top: 18px;
}

.hd-sound {
  margin-left: auto;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #fff;
  font-size: 19px;
  cursor: pointer;
  box-shadow: var(--shadow-s);
}

@media (max-width: 600px) {
  .wcard__word {
    font-size: 34px;
  }
  .wcard__emoji {
    font-size: 52px;
  }
  .actions {
    grid-template-columns: 1fr;
  }
  .list__grid {
    grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
  }
}
</style>
