<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useProgressStore } from '@/store/progress'
import { getHanziLevel } from '@/data/hanzi'
import { speak, stopSpeak } from '@/utils/speech'

const route = useRoute()
const router = useRouter()
const store = useProgressStore()

const level = computed(() => getHanziLevel(route.params.levelId))
const items = computed(() => level.value.items)

const index = ref(0)
const flipped = ref(false)
const bounce = ref(false)

const current = computed(() => items.value[index.value])
const record = computed(() => store.itemOf('hanzi', current.value.id))
const progress = computed(() => Math.round(((index.value + 1) / items.value.length) * 100))
const isMastered = computed(() => record.value.mastered)

function speakText(text, extra = {}) {
  speak(text, { lang: 'zh-CN', rate: store.settings.rate, ...extra })
}

function playChar(times = 1) {
  const text = times > 1 ? `${current.value.char}，${current.value.char}` : current.value.char
  speakText(text)
}

function playWord(word) {
  speakText(word)
}

function playSentence() {
  speakText(current.value.sentence)
}

function go(delta) {
  const next = index.value + delta
  if (next < 0) return
  if (next >= items.value.length) {
    // 学完一级，弹出鼓励并回到列表
    speakText('太棒啦，这一级全部学完啦！')
    alert(`🎉 太棒啦！「${level.value.name}」的字全部看完了！\n\n下一步可以去「去闯关」检验一下学习成果哦。`)
    router.push('/hanzi')
    return
  }
  index.value = next
  flipped.value = false
}

function jumpTo(i) {
  index.value = i
  flipped.value = false
}

function toggleMastered() {
  store.toggleMastered('hanzi', current.value.id)
  if (store.itemOf('hanzi', current.value.id).mastered) {
    bounce.value = true
    speakText(`${current.value.char}，我学会啦！`)
    setTimeout(() => (bounce.value = false), 600)
  }
}

// 切换卡片时：记录学习 + 自动朗读
watch(
  current,
  (val) => {
    if (!val) return
    store.markSeen('hanzi', val.id)
    if (store.settings.autoSpeak) setTimeout(() => playChar(2), 120)
  },
  { immediate: true }
)

function onKey(e) {
  if (e.key === 'ArrowLeft') go(-1)
  else if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault()
    go(1)
  } else if (e.key === 'Enter') playChar(2)
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
      :title="level.name"
      :emoji="level.emoji"
      :subtitle="`第 ${index + 1} / ${items.length} 个字 · ${level.age}`"
      :back-to="'/hanzi'"
      :color="level.color"
    >
      <template #right>
        <button class="hd-sound" type="button" @click="store.updateSettings({ autoSpeak: !store.settings.autoSpeak })">
          {{ store.settings.autoSpeak ? '🔊' : '🔇' }}
        </button>
      </template>
    </AppHeader>

    <div class="bar bar--top">
      <div class="bar__fill" :style="{ width: progress + '%', background: level.color }" />
    </div>

    <!-- 大字卡片 -->
    <section class="stage anim-rise">
      <div class="tian-wrap" :class="{ 'is-bounce': bounce }">
        <button class="tian" type="button" @click="playChar(2)">
          <span class="tian__char">{{ current.char }}</span>
          <i class="tian__line tian__line--h" />
          <i class="tian__line tian__line--v" />
        </button>
        <span class="tian__emoji">{{ current.emoji }}</span>
      </div>

      <p class="pinyin">{{ current.pinyin }}</p>

      <div class="row-btns">
        <button class="btn btn--sm" type="button" @click="playChar(2)">🔊 跟我读</button>
        <button class="btn btn--sm btn--ghost" type="button" @click="flipped = !flipped">
          {{ flipped ? '🙈 藏起来' : '👀 看意思' }}
        </button>
      </div>
    </section>

    <!-- 字义信息 -->
    <transition name="fade">
      <section v-if="flipped" class="card info anim-pop">
        <div class="info__meta">
          <span class="tag">部首 {{ current.radical }}</span>
          <span class="tag">共 {{ current.strokes }} 画</span>
          <span class="tag">《{{ level.name }}》</span>
        </div>

        <h3 class="info__label">组词</h3>
        <div class="chips">
          <button v-for="w in current.words" :key="w" class="chip" type="button" @click="playWord(w)">
            {{ w }} <span class="chip__spk">🔊</span>
          </button>
        </div>

        <h3 class="info__label">例句</h3>
        <button class="sentence" type="button" @click="playSentence()">
          <span class="sentence__text">{{ current.sentence }}</span>
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

    <!-- 本级别字表 -->
    <section class="card list">
      <h3 class="list__title">本级别字表 <span>{{ store.learnedCountOf('hanzi', level.id) }} / {{ items.length }}</span></h3>
      <div class="list__grid">
        <button
          v-for="(it, i) in items"
          :key="it.id"
          class="cell"
          :class="{
            'cell--now': i === index,
            'cell--mastered': store.itemOf('hanzi', it.id).mastered,
            'cell--seen': store.itemOf('hanzi', it.id).seen > 0
          }"
          type="button"
          @click="jumpTo(i)"
        >
          {{ it.char }}
        </button>
      </div>
    </section>

    <div class="to-game">
      <button class="btn btn--purple btn--block" type="button" @click="router.push(`/hanzi/game/${level.id}`)">
        🎮 学完啦，去闯关！
      </button>
      <button class="btn btn--ghost btn--block" type="button" @click="router.push(`/hanzi/trace/${level.id}`)">
        ✍️ 描红写字
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
  gap: 4px;
  padding: 6px 0 4px;
}

.tian-wrap {
  position: relative;
  display: grid;
  place-items: center;
}

.tian-wrap.is-bounce {
  animation: pop-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tian {
  position: relative;
  width: 210px;
  height: 210px;
  border: 3px dashed #ffbb99;
  border-radius: 22px;
  background: #fff;
  box-shadow: var(--shadow-m);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.14s ease;
  padding: 0;
}

.tian:active {
  transform: scale(0.96);
}

.tian__char {
  font-size: 118px;
  font-weight: 700;
  line-height: 1;
  color: var(--text);
  font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'PingFang SC', var(--font);
  user-select: none;
}

.tian__line {
  position: absolute;
  background: repeating-linear-gradient(
    to right,
    #ffd0bb 0,
    #ffd0bb 6px,
    transparent 6px,
    transparent 12px
  );
}

.tian__line--h {
  left: 8px;
  right: 8px;
  height: 2px;
  top: 50%;
  transform: translateY(-1px);
}

.tian__line--v {
  top: 8px;
  bottom: 8px;
  width: 2px;
  left: 50%;
  transform: translateX(-1px);
  background: repeating-linear-gradient(
    to bottom,
    #ffd0bb 0,
    #ffd0bb 6px,
    transparent 6px,
    transparent 12px
  );
}

.tian__emoji {
  position: absolute;
  right: -14px;
  bottom: -6px;
  font-size: 40px;
  background: #fff;
  border-radius: 50%;
  padding: 4px;
  box-shadow: var(--shadow-s);
}

.pinyin {
  margin: 14px 0 0;
  font-size: 30px;
  font-weight: 800;
  color: var(--c-orange);
  letter-spacing: 2px;
}

.row-btns {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.info {
  margin-top: 18px;
}

.info__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.info__label {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 900;
  color: var(--text-soft);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.chip {
  border: 2px solid var(--c-orange);
  background: var(--c-orange-soft);
  color: #b3540f;
  font-family: var(--font);
  font-weight: 800;
  font-size: 16px;
  border-radius: 999px;
  padding: 8px 16px;
  cursor: pointer;
  transition: transform 0.12s ease;
}

.chip:active {
  transform: scale(0.94);
}

.chip__spk {
  font-size: 13px;
  opacity: 0.75;
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
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  cursor: pointer;
}

.sentence:active {
  background: #eef2f6;
}

.sentence__text {
  flex: 1;
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

.list {
  margin-top: 6px;
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
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 8px;
}

.cell {
  aspect-ratio: 1;
  border: 2px solid var(--line);
  background: #fff;
  border-radius: 12px;
  font-size: 22px;
  font-weight: 700;
  font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', var(--font);
  cursor: pointer;
  color: var(--text-mute);
  transition: transform 0.12s ease, border-color 0.12s ease;
  padding: 0;
}

.cell:active {
  transform: scale(0.92);
}

.cell--seen {
  color: var(--text);
  border-color: #ffd8bf;
  background: #fff7f2;
}

.cell--mastered {
  border-color: var(--c-green);
  background: var(--c-green-soft);
  color: #2f7a48;
}

.cell--now {
  border-color: var(--c-orange);
  background: var(--c-orange);
  color: #fff;
  transform: scale(1.06);
}

.to-game {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  .tian {
    width: 168px;
    height: 168px;
  }
  .tian__char {
    font-size: 92px;
  }
  .pinyin {
    font-size: 26px;
  }
  .actions {
    grid-template-columns: 1fr;
  }
  .list__grid {
    grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
  }
}
</style>
