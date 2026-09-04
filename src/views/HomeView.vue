<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/store/progress'
import { HANZI_ALL } from '@/data/hanzi'
import { EN_ALL } from '@/data/english'
import { speechSupported } from '@/utils/speech'

const router = useRouter()
const store = useProgressStore()

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
    <!-- 顶部形象区 -->
    <section class="hero anim-pop">
      <div class="hero__mascot anim-float">🐣</div>
      <div class="hero__text">
        <h1 class="hero__title">小小识字乐园</h1>
        <p class="hero__sub">汉字 + 英语 · 给 4-10 岁小朋友的启蒙伙伴</p>
        <p class="hero__hi">{{ greeting }}</p>
      </div>
    </section>

    <!-- 今日数据 -->
    <section class="card stats anim-rise">
      <div class="stat">
        <span class="stat__num" style="color: var(--c-orange)">{{ store.streak }}</span>
        <span class="stat__label">连续学习(天)</span>
      </div>
      <div class="stat">
        <span class="stat__num" style="color: var(--c-blue)">{{ today.cards }}</span>
        <span class="stat__label">今日翻卡</span>
      </div>
      <div class="stat">
        <span class="stat__num" style="color: var(--c-green)">{{ today.quiz }}</span>
        <span class="stat__label">今日答题</span>
      </div>
      <div class="stat">
        <span class="stat__num" style="color: var(--c-purple)">{{ todayAccuracy }}%</span>
        <span class="stat__label">正确率</span>
      </div>
    </section>

    <!-- 两个大模块 -->
    <section class="modules">
      <button class="mod mod--hanzi" type="button" @click="router.push('/hanzi')">
        <div class="mod__top">
          <span class="mod__emoji">🇨🇳</span>
          <div class="mod__info">
            <h2>汉字王国</h2>
            <p>{{ hanziLearned }} / {{ HANZI_ALL.length }} 字 · 含拼音、部首、组词</p>
          </div>
          <span class="mod__arrow">›</span>
        </div>
        <div class="bar">
          <div class="bar__fill" :style="{ width: hanziPercent + '%' }" />
        </div>
      </button>

      <button class="mod mod--en" type="button" @click="router.push('/english')">
        <div class="mod__top">
          <span class="mod__emoji">🔤</span>
          <div class="mod__info">
            <h2>英语乐园</h2>
            <p>{{ enLearned }} / {{ EN_ALL.length }} 词 · 含音标、真人口语发音</p>
          </div>
          <span class="mod__arrow">›</span>
        </div>
        <div class="bar">
          <div
            class="bar__fill"
            :style="{ width: enPercent + '%', background: 'linear-gradient(90deg,#63E6BE,#4ECDC4)' }"
          />
        </div>
      </button>
    </section>

    <!-- 小贴士 -->
    <section class="tip anim-rise">
      <span class="tip__icon">💡</span>
      <span class="tip__text">{{ tip }}</span>
    </section>

    <!-- 底部入口 -->
    <section class="foot">
      <button class="btn btn--ghost btn--sm" type="button" @click="router.push('/parent')">
        👨‍👩‍👧 家长中心
      </button>
      <p v-if="!speechSupported" class="foot__warn">当前浏览器不支持语音朗读，识字卡片仍可正常使用。</p>
    </section>
  </main>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 4px 10px;
}

.hero__mascot {
  font-size: 58px;
  line-height: 1;
  filter: drop-shadow(0 6px 10px rgba(255, 138, 61, 0.28));
}

.hero__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #ff8a3d, #ff6b9d, #a78bfa);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero__sub {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--text-mute);
  font-weight: 600;
}

.hero__hi {
  margin: 8px 0 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--c-orange);
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 18px 12px;
  margin-bottom: 18px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat__num {
  font-size: 24px;
  font-weight: 900;
  line-height: 1.1;
}

.stat__label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-mute);
  text-align: center;
}

.modules {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mod {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  cursor: pointer;
  font-family: var(--font);
  background: #fff;
  border-radius: var(--radius-l);
  padding: 20px;
  box-shadow: var(--shadow-m);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.mod:active {
  transform: scale(0.985);
}

.mod--hanzi:hover {
  box-shadow: 0 14px 34px rgba(255, 138, 61, 0.26);
}
.mod--en:hover {
  box-shadow: 0 14px 34px rgba(78, 205, 196, 0.28);
}

.mod__top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.mod__emoji {
  font-size: 40px;
  line-height: 1;
}

.mod__info {
  flex: 1;
  min-width: 0;
}

.mod__info h2 {
  margin: 0;
  font-size: 21px;
  font-weight: 900;
}

.mod__info p {
  margin: 3px 0 0;
  font-size: 13px;
  color: var(--text-mute);
  font-weight: 600;
}

.mod__arrow {
  font-size: 28px;
  color: var(--text-mute);
  line-height: 1;
}

.tip {
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fffbe9;
  border: 2px dashed #ffe08a;
  border-radius: var(--radius-m);
  padding: 12px 16px;
}

.tip__icon {
  font-size: 20px;
}

.tip__text {
  font-size: 14px;
  font-weight: 700;
  color: #a06a00;
}

.foot {
  margin-top: 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.foot__warn {
  font-size: 12px;
  color: var(--text-mute);
  margin: 0;
  text-align: center;
}

@media (max-width: 600px) {
  .hero__title {
    font-size: 23px;
  }
  .hero__mascot {
    font-size: 46px;
  }
  .stat__num {
    font-size: 20px;
  }
  .mod__info h2 {
    font-size: 19px;
  }
}
</style>
