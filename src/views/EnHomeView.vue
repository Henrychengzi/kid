<script setup>
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import GroupCard from '@/components/GroupCard.vue'
import { useProgressStore } from '@/store/progress'
import { EN_CATEGORIES, EN_ALL } from '@/data/english'

const router = useRouter()
const store = useProgressStore()

const totalLearned = () => store.learnedCountOf('english')
</script>

<template>
  <main class="page">
    <AppHeader
      title="英语乐园"
      emoji="🔤"
      subtitle="按生活主题分类，边看图边记单词"
      back-to="/"
      color="var(--accent-2)"
    />

    <section class="stats anim-rise">
      <div class="stat stat--mint">
        <span class="stat__num">{{ totalLearned() }}</span>
        <span class="stat__label">已学</span>
      </div>
      <div class="stat stat--orange">
        <span class="stat__num">{{ store.masteredCountOf('english') }}</span>
        <span class="stat__label">已掌握</span>
      </div>
      <div class="stat stat--green">
        <span class="stat__num">{{ store.accuracyOf('english') }}%</span>
        <span class="stat__label">正确率</span>
      </div>
      <div class="stat stat--blue">
        <span class="stat__num">{{ EN_ALL.length }}</span>
        <span class="stat__label">词库</span>
      </div>
    </section>

    <p class="hint">建议从「动物朋友」「颜色形状」开始，宝宝最容易有成就感 👇</p>

    <div class="grid">
      <GroupCard
        v-for="(cat, i) in EN_CATEGORIES"
        :key="cat.id"
        :title="cat.name"
        :emoji="cat.emoji"
        :desc="cat.desc"
        :age="cat.age"
        :color="cat.color"
        :learned="store.learnedCountOf('english', cat.id)"
        :total="cat.items.length"
        unit="词"
        :style="{ animationDelay: i * 45 + 'ms' }"
        @learn="router.push(`/english/learn/${cat.id}`)"
        @game="router.push(`/english/game/${cat.id}`)"
      />
    </div>
  </main>
</template>

<style scoped>
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

.stat--mint   .stat__num { color: var(--accent-2); }
.stat--orange .stat__num { color: var(--apple-orange); }
.stat--green  .stat__num { color: var(--success); }
.stat--blue   .stat__num { color: var(--apple-blue); }

.hint {
  margin: 0 4px var(--space-4);
  font-size: var(--fs-subhead);
  color: var(--label-secondary);
  font-weight: 500;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-3);
}

@media (max-width: 600px) {
  .grid { grid-template-columns: 1fr; }
  .stat__num { font-size: 20px; }
}
</style>