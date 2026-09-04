<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/store/progress'
import { HANZI_ALL } from '@/data/hanzi'
import { EN_ALL } from '@/data/english'
import { speechSupported } from '@/utils/speech'

const router = useRouter()
const store = useProgressStore()

// 主题（响应式）
const theme = ref('light')
onMounted(() => {
  theme.value = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
})
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  if (theme.value === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
  else document.documentElement.removeAttribute('data-theme')
  localStorage.setItem('kid-literacy-theme', theme.value)
}

const hanziLearned = computed(() => store.learnedCountOf('hanzi'))
const enLearned = computed(() => store.learnedCountOf('english'))
const hanziPercent = computed(() => Math.round((hanziLearned.value / HANZI_ALL.length) * 100))
const enPercent = computed(() => Math.round((enLearned.value / EN_ALL.length) * 100))

const today = computed(() => store.todayStat)
const todayAccuracy = computed(() => {
  const t = today.value
  const total = t.correct + t.wrong
  return total ? Math.round((t.correct / total) * 100) : 0
})

const wrongHanzi = computed(() => store.wrongListOf('hanzi').length)
const wrongEn = computed(() => store.wrongListOf('english').length)
const wrongTotal = computed(() => wrongHanzi.value + wrongEn.value)

const greeting = computed(() => {
  const h = new Date().getHours()
  const name = store.settings.kidName ? `，${store.settings.kidName}` : ''
  if (h < 6) return `夜深啦${name}，早点休息哦`
  if (h < 11) return `早上好${name}！`
  if (h < 14) return `中午好${name}！`
  if (h < 18) return `下午好${name}！`
  return `晚上好${name}！`
})

const tips = [
  '每天认识 5 个字，一个月就能读小故事啦！',
  '大声跟着读出来，记得更牢哦～',
  '遇到不会的字，点一点喇叭听发音。',
  '闯关答对 3 次，这个字就变"已掌握"啦！'
]
const tip = tips[new Date().getDate() % tips.length]
</script>

<template>
  <main class="page">
    <!-- iOS 大标题 + 主题切换 -->
    <header class="hero">
      <div class="hero__row">
        <h1 class="hero__title">小小识字乐园</h1>
        <button class="theme-toggle" type="button" aria-label="切换主题" @click="toggleTheme">
          <svg v-if="theme === 'dark'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </div>
      <p class="hero__hi">{{ greeting }}</p>
      <p class="hero__sub">汉字 + 英语 · 给 4-10 岁小朋友的启蒙伙伴</p>
    </header>

    <!-- 今日数据：4 个 iOS 风格小卡 -->
    <section class="stats anim-rise">
      <div class="stat stat--orange">
        <span class="stat__num">{{ store.streak }}</span>
        <span class="stat__label">连续(天)</span>
      </div>
      <div class="stat stat--blue">
        <span class="stat__num">{{ today.cards }}</span>
        <span class="stat__label">翻卡</span>
      </div>
      <div class="stat stat--green">
        <span class="stat__num">{{ today.quiz }}</span>
        <span class="stat__label">答题</span>
      </div>
      <div class="stat stat--pink">
        <span class="stat__num">{{ todayAccuracy }}%</span>
        <span class="stat__label">正确率</span>
      </div>
    </section>

    <!-- 两个大模块 -->
    <section class="modules anim-rise delay-1">
      <button class="mod mod--hanzi" type="button" @click="router.push('/hanzi')">
        <div class="mod__face">
          <span class="mod__icon mod__icon--hanzi">字</span>
          <div class="mod__body">
            <h2 class="mod__title">汉字王国</h2>
            <p class="mod__sub">{{ hanziLearned }} / {{ HANZI_ALL.length }} 字 · 含拼音 / 部首 / 组词</p>
          </div>
          <span class="mod__chevron">›</span>
        </div>
        <div class="mod__progress">
          <div class="bar"><div class="bar__fill" :style="{ width: hanziPercent + '%' }" /></div>
          <span class="mod__num">{{ hanziPercent }}%</span>
        </div>
      </button>

      <button class="mod mod--en" type="button" @click="router.push('/english')">
        <div class="mod__face">
          <span class="mod__icon mod__icon--en">A</span>
          <div class="mod__body">
            <h2 class="mod__title">英语乐园</h2>
            <p class="mod__sub">{{ enLearned }} / {{ EN_ALL.length }} 词 · 含音标 / 真人口语发音</p>
          </div>
          <span class="mod__chevron">›</span>
        </div>
        <div class="mod__progress">
          <div class="bar"><div class="bar__fill bar__fill--mint" :style="{ width: enPercent + '%' }" /></div>
          <span class="mod__num">{{ enPercent }}%</span>
        </div>
      </button>
    </section>

    <!-- 错题复习 -->
    <transition name="fade">
      <button
        v-if="wrongTotal > 0"
        class="review anim-rise delay-2"
        type="button"
        @click="router.push(wrongHanzi >= wrongEn ? '/review/hanzi' : '/review/english')"
      >
        <span class="review__badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5V4.5A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </span>
        <span class="review__body">
          <b>错题复习</b>
          <i>还有 {{ wrongTotal }} 个{{ wrongTotal > 1 ? '内容' : '内容' }}等着攻克</i>
        </span>
        <span class="review__go">›</span>
      </button>
    </transition>

    <!-- 小贴士 -->
    <section class="tip anim-rise delay-3">
      <span class="tip__icon">💡</span>
      <span class="tip__text">{{ tip }}</span>
    </section>

    <!-- 语音兼容性提示 -->
    <p v-if="!speechSupported" class="warn">
      当前浏览器不支持语音朗读，识字卡片仍可正常使用。
    </p>
  </main>
</template>

<style scoped>
.hero {
  margin-bottom: 22px;
}

.hero__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hero__title {
  margin: 0;
  font-size: var(--fs-large-title);
  font-weight: 800;
  letter-spacing: -0.025em;
  background: linear-gradient(120deg, #FF6B9D 0%, #C7CEEA 50%, #B5EAD7 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1.1;
}

html[data-theme="dark"] .hero__title {
  background: linear-gradient(120deg, #FF8FB5 0%, #C7CEEA 50%, #8DE0C0 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.hero__hi {
  margin: 8px 0 0;
  font-size: var(--fs-headline);
  font-weight: 600;
  color: var(--accent);
  letter-spacing: -0.01em;
}

.hero__sub {
  margin: 4px 0 0;
  font-size: var(--fs-footnote);
  color: var(--label-tertiary);
}

.theme-toggle {
  flex: none;
  width: var(--tap-min);
  height: var(--tap-min);
  border: none;
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 0.5px solid var(--glass-border);
  color: var(--label-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), color 160ms ease;
}

.theme-toggle svg { width: 20px; height: 20px; }

.theme-toggle:active { transform: scale(0.9); color: var(--accent); }

/* ── Stats 4 格 ─── */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: var(--bg-card);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 0.5px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 14px 6px;
  box-shadow: var(--shadow-xs);
}

.stat__num {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}

.stat__label {
  font-size: var(--fs-caption-1);
  font-weight: 500;
  color: var(--label-tertiary);
}

.stat--orange .stat__num { color: var(--apple-orange); }
.stat--blue   .stat__num { color: var(--apple-blue); }
.stat--green  .stat__num { color: var(--success); }
.stat--pink   .stat__num { color: var(--accent); }

/* ── Modules ─── */
.modules {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.mod {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  cursor: pointer;
  font-family: var(--font-system);
  background: var(--bg-card);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 0.5px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 18px;
  box-shadow: var(--shadow-xs);
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 220ms ease;
}

.mod:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-sm);
}

.mod__face {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.mod__icon {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.mod__icon--hanzi {
  background: linear-gradient(135deg, #FFE5EC, #FFD1DC);
  color: #C2255C;
}
.mod__icon--en {
  background: linear-gradient(135deg, #DCFAF5, #B5EAD7);
  color: #0E8B7E;
}

html[data-theme="dark"] .mod__icon--hanzi { color: #FF8FB5; }
html[data-theme="dark"] .mod__icon--en    { color: #5DD9D2; }

.mod__body { flex: 1; min-width: 0; }
.mod__title {
  margin: 0;
  font-size: var(--fs-title-2);
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--label-primary);
}
.mod__sub {
  margin: 3px 0 0;
  font-size: var(--fs-footnote);
  color: var(--label-tertiary);
  font-weight: 500;
}

.mod__chevron {
  font-size: 26px;
  color: var(--label-quaternary);
  line-height: 1;
}

.mod__progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mod__progress .bar { flex: 1; }

.bar__fill--mint {
  background: linear-gradient(90deg, #5DD9D2, #4ECDC4);
}

.mod__num {
  font-size: var(--fs-footnote);
  font-weight: 600;
  color: var(--label-secondary);
  font-variant-numeric: tabular-nums;
}

/* ── Review ─── */
.review {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  margin-bottom: var(--space-5);
  border: 0.5px solid var(--glass-border);
  background: var(--accent-soft);
  border-radius: var(--radius-card);
  padding: 14px 18px;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-system);
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.review:active { transform: scale(0.98); }

.review__badge {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--accent);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.review__badge svg { width: 18px; height: 18px; }

.review__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.review__body b {
  font-size: var(--fs-headline);
  font-weight: 700;
  color: var(--accent);
  letter-spacing: -0.01em;
}

.review__body i {
  font-style: normal;
  font-size: var(--fs-footnote);
  color: var(--label-secondary);
  font-weight: 500;
  margin-top: 2px;
}

.review__go {
  font-size: 24px;
  color: var(--accent);
  opacity: 0.6;
  line-height: 1;
}

/* ── Tip ─── */
.tip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-card);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 0.5px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 14px 16px;
  margin-bottom: var(--space-5);
}

.tip__icon {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #FFF1B5, #FFE08A);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.tip__text {
  font-size: var(--fs-subhead);
  color: var(--label-secondary);
  font-weight: 500;
  line-height: 1.5;
}

/* ── Warn ─── */
.warn {
  text-align: center;
  font-size: var(--fs-caption-1);
  color: var(--label-tertiary);
  margin: 0;
}

@media (max-width: 600px) {
  .stat__num { font-size: 20px; }
  .mod__title { font-size: var(--fs-title-3); }
  .hero__title { font-size: var(--fs-title-1); }
}
</style>