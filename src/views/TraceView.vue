<script setup>
import { ref, shallowRef, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useProgressStore } from '@/store/progress'
import { getHanziLevel } from '@/data/hanzi'
import { speak, stopSpeak } from '@/utils/speech'
import HanziWriter from 'hanzi-writer'

const route = useRoute()
const router = useRouter()
const store = useProgressStore()

const level = computed(() => getHanziLevel(route.params.levelId))
const items = computed(() => level.value.items)

/** 画布逻辑分辨率固定 600×600，实际显示尺寸由 CSS 决定，绘制时按比例换算 */
const SIZE = 600

const index = ref(0)
const canvasEl = ref(null)
const showGhost = ref(true)
const color = ref('#2f3542')
// 笔迹数据量大且高频写入，用 shallowRef 避免深层响应式开销，另用 strokeCount 驱动 UI
const strokes = shallowRef([])
const strokeCount = ref(0)
const drawing = ref(false)

const current = computed(() => items.value[index.value])
const hasStroke = computed(() => strokeCount.value > 0)

const COLORS = [
  { v: '#2f3542', name: '墨黑' },
  { v: '#e8590c', name: '橘红' },
  { v: '#1971c2', name: '宝蓝' },
  { v: '#2f9e44', name: '草绿' }
]

let ctx = null

/* ── 笔顺动画（hanzi-writer，运行时从 CDN 拉取真实笔顺数据，渲染为 SVG）── */
const showStroke = ref(false)
const writerEl = ref(null)
const slow = ref(false)
const strokeState = ref('idle') // idle | loading | ready | error
let writer = null

function mountWriter() {
  if (!writerEl.value) return
  writerEl.value.innerHTML = ''
  writer = HanziWriter.create(writerEl.value, current.value.char, {
    width: 300,
    height: 300,
    padding: 14,
    showOutline: true,
    showCharacter: false,
    strokeColor: '#e8590c',
    radicalColor: '#1971c2',
    delayBetweenStrokes: 220,
    strokeAnimationSpeed: slow.value ? 0.45 : 1.2,
    renderer: 'svg'
  })
}

function playStroke() {
  if (!writerEl.value) return
  strokeState.value = 'loading'
  try {
    mountWriter()
    writer
      .animateCharacter()
      .then(() => (strokeState.value = 'ready'))
      .catch(() => (strokeState.value = 'error'))
  } catch (e) {
    strokeState.value = 'error'
  }
}

function loopStroke() {
  if (!writerEl.value) return
  mountWriter()
  strokeState.value = 'ready'
  try {
    writer
      .loopCharacterAnimation({ delayBetweenLoops: 500 })
      .catch(() => (strokeState.value = 'error'))
  } catch (e) {
    strokeState.value = 'error'
  }
}

function toggleStroke() {
  showStroke.value = !showStroke.value
  if (showStroke.value) nextTick(playStroke)
  else {
    writer = null
  }
}

/* ── 坐标换算 ── */
function toLocal(e) {
  const r = canvasEl.value.getBoundingClientRect()
  return {
    x: ((e.clientX - r.left) / r.width) * SIZE,
    y: ((e.clientY - r.top) / r.height) * SIZE
  }
}

/* ── 绘制 ── */
function redraw() {
  if (!ctx) return
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 20
  for (const stroke of strokes.value) {
    if (!stroke.points.length) continue
    ctx.strokeStyle = stroke.color
    ctx.beginPath()
    stroke.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    // 单点为「点」时画个圆点，避免什么都不显示
    if (stroke.points.length === 1) {
      ctx.arc(stroke.points[0].x, stroke.points[0].y, 10, 0, Math.PI * 2)
      ctx.fillStyle = stroke.color
      ctx.fill()
    }
    ctx.stroke()
  }
}

function onDown(e) {
  if (e.button != null && e.button !== 0) return
  drawing.value = true
  canvasEl.value.setPointerCapture?.(e.pointerId)
  strokes.value.push({ color: color.value, points: [toLocal(e)] })
  strokeCount.value = strokes.value.length
  redraw()
}

function onMove(e) {
  if (!drawing.value) return
  const p = toLocal(e)
  const last = strokes.value[strokes.value.length - 1]
  if (!last) return
  const prev = last.points[last.points.length - 1]
  // 抽稀：距离太近的点丢弃，笔迹更平滑、内存更省
  if (Math.hypot(p.x - prev.x, p.y - prev.y) < 4) return
  last.points.push(p)
  redraw()
}

function onUp(e) {
  if (!drawing.value) return
  drawing.value = false
  canvasEl.value.releasePointerCapture?.(e.pointerId)
}

function undo() {
  strokes.value.pop()
  strokeCount.value = strokes.value.length
  redraw()
}

function clear() {
  strokes.value = []
  strokeCount.value = 0
  redraw()
}

/* ── 朗读 ── */
function play() {
  speak(`${current.value.char}，${current.value.words[0]}`, { lang: 'zh-CN', rate: store.settings.rate })
}

/* ── 切换 ── */
function go(delta) {
  const next = index.value + delta
  if (next < 0) return
  if (next >= items.value.length) {
    speak('这一级都写完了，真棒！', { lang: 'zh-CN' })
    alert(`✍️ 太厉害啦！「${level.value.name}」的字全部描完了！`)
    router.push('/hanzi')
    return
  }
  index.value = next
}

function jumpTo(i) {
  index.value = i
}

/** 写完一个字：记录学习 + 鼓励 */
function finish() {
  store.markSeen('hanzi', current.value.id)
  speak(`${current.value.char}，写得真好看！`, { lang: 'zh-CN', rate: store.settings.rate })
  setTimeout(() => {
    if (index.value + 1 < items.value.length) go(1)
  }, 700)
}

/* ── 保存作品为 PNG ── */
function savePng() {
  const out = document.createElement('canvas')
  out.width = SIZE
  out.height = SIZE
  const o = out.getContext('2d')
  // 白底
  o.fillStyle = '#ffffff'
  o.fillRect(0, 0, SIZE, SIZE)

  // 田字格线
  o.strokeStyle = '#ffd0bb'
  o.lineWidth = 3
  o.setLineDash([14, 12])
  o.beginPath()
  o.moveTo(30, SIZE / 2)
  o.lineTo(SIZE - 30, SIZE / 2)
  o.moveTo(SIZE / 2, 30)
  o.lineTo(SIZE / 2, SIZE - 30)
  o.stroke()
  o.setLineDash([])
  o.strokeStyle = '#ffbb99'
  o.strokeRect(30, 30, SIZE - 60, SIZE - 60)

  // 底稿字（浅灰）
  o.fillStyle = '#e3e6ea'
  o.font = `bold 430px "Kaiti SC","STKaiti","KaiTi",serif`
  o.textAlign = 'center'
  o.textBaseline = 'middle'
  o.fillText(current.value.char, SIZE / 2, SIZE / 2 + 14)

  // 孩子写的笔迹
  if (canvasEl.value) o.drawImage(canvasEl.value, 0, 0, SIZE, SIZE)

  // 落款
  o.fillStyle = '#adb5bd'
  o.font = '600 22px "PingFang SC","Microsoft YaHei",sans-serif'
  o.textAlign = 'right'
  o.fillText(`${current.value.char} · ${current.value.pinyin}`, SIZE - 40, SIZE - 40)

  const a = document.createElement('a')
  a.href = out.toDataURL('image/png')
  a.download = `描红-${current.value.char}-${new Date().toISOString().slice(0, 10)}.png`
  a.click()
}

watch(current, () => {
  strokes.value = []
  strokeCount.value = 0
  redraw()
  if (showStroke.value) nextTick(playStroke)
})

watch(slow, () => {
  if (showStroke.value) nextTick(playStroke)
})

function onKey(e) {
  if (e.target.tagName === 'INPUT') return
  if (e.key === 'ArrowLeft') go(-1)
  else if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'Enter') play()
}

onMounted(() => {
  const c = canvasEl.value
  c.width = SIZE
  c.height = SIZE
  ctx = c.getContext('2d')
  redraw()
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  stopSpeak()
  writer = null
})
</script>

<template>
  <main class="page">
    <AppHeader
      :title="`${level.name} · 描红`"
      emoji="✍️"
      :subtitle="`第 ${index + 1} / ${items.length} 个字`"
      :back-to="`/hanzi/learn/${level.id}`"
      :color="level.color"
    />

    <!-- 画板 -->
    <section class="stage anim-rise">
      <div class="pad">
        <div class="pad__ghost" :class="{ 'pad__ghost--hide': !showGhost }">{{ current.char }}</div>
        <div class="pad__grid">
          <i class="pad__line pad__line--h" />
          <i class="pad__line pad__line--v" />
        </div>
        <canvas
          ref="canvasEl"
          class="pad__canvas"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
          @pointerleave="onUp"
        />
      </div>

      <p class="pinyin">{{ current.pinyin }} · {{ current.strokes }} 画</p>
    </section>

    <!-- 笔顺动画 -->
    <section v-if="showStroke" class="stroke card anim-rise">
      <h3 class="stroke__title">👀 看笔顺：{{ current.char }} 怎么写</h3>
      <div ref="writerEl" class="stroke__canvas" />
      <p v-if="strokeState === 'loading'" class="stroke__hint">正在加载笔顺动画…</p>
      <p v-else-if="strokeState === 'error'" class="stroke__hint stroke__hint--err">
        笔顺动画需要联网加载，请检查网络后重试 🙏
      </p>
      <div class="stroke__ctrls">
        <button class="btn btn--sm btn--ghost" type="button" @click="playStroke">▶ 播放笔顺</button>
        <button class="btn btn--sm btn--ghost" type="button" @click="loopStroke">🔁 循环播放</button>
        <button
          class="btn btn--sm"
          :class="slow ? 'btn--on' : 'btn--ghost'"
          type="button"
          @click="slow = !slow"
        >
          {{ slow ? '🐢 慢动作中' : '🐇 正常速度' }}
        </button>
      </div>
    </section>

    <!-- 工具条 -->
    <section class="tools card">
      <div class="tools__row">
        <span class="tools__label">颜色</span>
        <div class="swatches">
          <button
            v-for="c in COLORS"
            :key="c.v"
            class="swatch"
            :class="{ 'swatch--on': color === c.v }"
            :style="{ background: c.v }"
            :title="c.name"
            type="button"
            @click="color = c.v"
          />
        </div>
      </div>

      <div class="tools__row">
        <button class="btn btn--sm btn--ghost" type="button" :disabled="!hasStroke" @click="undo">↩︎ 撤销</button>
        <button class="btn btn--sm btn--ghost" type="button" :disabled="!hasStroke" @click="clear">🧹 擦掉</button>
        <button class="btn btn--sm btn--ghost" type="button" @click="showGhost = !showGhost">
          {{ showGhost ? '👻 藏起底稿' : '👀 显示底稿' }}
        </button>
        <button class="btn btn--sm btn--ghost" type="button" @click="toggleStroke">
          {{ showStroke ? '✖ 关闭笔顺' : '🎬 看笔顺' }}
        </button>
        <button class="btn btn--sm btn--ghost" type="button" @click="play">🔊 读一读</button>
      </div>
    </section>

    <!-- 操作 -->
    <section class="actions">
      <button class="btn btn--ghost navbtn" type="button" :disabled="index === 0" @click="go(-1)">‹ 上一个</button>
      <button class="btn navbtn" :class="{ 'btn--green': hasStroke }" type="button" :disabled="!hasStroke" @click="finish">
        ✅ 我写好了
      </button>
      <button class="btn btn--blue navbtn" type="button" @click="go(1)">下一个 ›</button>
    </section>

    <div class="save">
      <button class="btn btn--sm btn--ghost" type="button" :disabled="!hasStroke" @click="savePng">
        💾 保存成图片
      </button>
    </div>

    <p class="kbhint">电脑上可以用 ← → 翻页，回车听读音；平板和手机直接用手写</p>

    <!-- 字表 -->
    <section class="card list">
      <h3 class="list__title">本级别字表</h3>
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
  </main>
</template>

<style scoped>
.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pad {
  position: relative;
  width: 100%;
  max-width: 330px;
  aspect-ratio: 1;
  background: #fff;
  border: 3px dashed #ffbb99;
  border-radius: 22px;
  box-shadow: var(--shadow-m);
  overflow: hidden;
  touch-action: none; /* 关键：防止手指书写时页面跟着滚 */
  user-select: none;
}

.pad__ghost {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 240px;
  font-weight: 700;
  color: #e6e9ed;
  font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', serif;
  line-height: 1;
  transition: opacity 0.2s ease;
  z-index: 1;
  pointer-events: none;
}

.pad__ghost--hide {
  opacity: 0;
}

.pad__grid {
  position: absolute;
  inset: 24px;
  z-index: 2;
  pointer-events: none;
}

.pad__line {
  position: absolute;
  background: repeating-linear-gradient(to right, #ffd0bb 0, #ffd0bb 8px, transparent 8px, transparent 16px);
}

.pad__line--h {
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  transform: translateY(-1px);
}

.pad__line--v {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-1px);
  background: repeating-linear-gradient(to bottom, #ffd0bb 0, #ffd0bb 8px, transparent 8px, transparent 16px);
}

.pad__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  cursor: crosshair;
}

.pinyin {
  margin: 14px 0 0;
  font-size: 24px;
  font-weight: 800;
  color: var(--c-orange);
  letter-spacing: 1px;
}

/* ── 笔顺动画 ── */
.stroke {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.stroke__title {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
}

.stroke__canvas {
  width: 300px;
  height: 300px;
  max-width: 100%;
  background: #fff;
  border: 3px dashed #ffd0bb;
  border-radius: 20px;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.stroke__hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-mute);
}

.stroke__hint--err {
  color: #e8590c;
}

.stroke__ctrls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.stroke__ctrls .btn {
  min-width: 92px;
}

.tools {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tools__row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tools__label {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-soft);
  margin-right: 2px;
}

.swatches {
  display: flex;
  gap: 8px;
}

.swatch {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px var(--line);
  cursor: pointer;
  padding: 0;
  transition: transform 0.12s ease;
}

.swatch--on {
  box-shadow: 0 0 0 3px var(--c-orange);
  transform: scale(1.12);
}

.tools__row .btn {
  flex: 1;
  min-width: 96px;
}

.btn--on {
  background: var(--c-orange);
  color: #fff;
  border-color: var(--c-orange);
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 10px;
  margin: 18px 0 10px;
}

.navbtn {
  padding: 14px 8px;
  font-size: 16px;
}

.save {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.kbhint {
  text-align: center;
  font-size: 12px;
  color: var(--text-mute);
  margin: 0 0 18px;
}

.list__title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 900;
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

@media (max-width: 600px) {
  .pad {
    max-width: 280px;
  }
  .pad__ghost {
    font-size: 200px;
  }
  .actions {
    grid-template-columns: 1fr;
  }
  .pinyin {
    font-size: 21px;
  }
}
</style>
