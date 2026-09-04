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
      color="var(--c-teal)"
    />

    <div class="summary card anim-rise">
      <div class="summary__item">
        <strong>{{ totalLearned() }}</strong>
        <span>已学单词</span>
      </div>
      <div class="summary__item">
        <strong>{{ store.masteredCountOf('english') }}</strong>
        <span>已掌握</span>
      </div>
      <div class="summary__item">
        <strong>{{ store.accuracyOf('english') }}%</strong>
        <span>正确率</span>
      </div>
      <div class="summary__item">
        <strong>{{ EN_ALL.length }}</strong>
        <span>词库总量</span>
      </div>
    </div>

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
.summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  text-align: center;
  margin-bottom: 18px;
}

.summary__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary__item strong {
  font-size: 22px;
  font-weight: 900;
  color: var(--c-teal);
}

.summary__item span {
  font-size: 12px;
  color: var(--text-mute);
  font-weight: 700;
}

.hint {
  margin: 0 4px 14px;
  font-size: 13px;
  color: var(--text-soft);
  font-weight: 700;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
