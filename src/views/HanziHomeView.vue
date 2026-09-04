<script setup>
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import GroupCard from '@/components/GroupCard.vue'
import { useProgressStore } from '@/store/progress'
import { HANZI_LEVELS, HANZI_ALL } from '@/data/hanzi'

const router = useRouter()
const store = useProgressStore()

const totalLearned = () => store.learnedCountOf('hanzi')
</script>

<template>
  <main class="page">
    <AppHeader title="汉字王国" emoji="🇨🇳" subtitle="按年龄分级，从象形字开始" back-to="/" />

    <section class="stats anim-rise">
      <div class="stat stat--pink">
        <span class="stat__num">{{ totalLearned() }}</span>
        <span class="stat__label">已学</span>
      </div>
      <div class="stat stat--orange">
        <span class="stat__num">{{ store.masteredCountOf('hanzi') }}</span>
        <span class="stat__label">已掌握</span>
      </div>
      <div class="stat stat--green">
        <span class="stat__num">{{ store.accuracyOf('hanzi') }}%</span>
        <span class="stat__label">正确率</span>
      </div>
      <div class="stat stat--blue">
        <span class="stat__num">{{ HANZI_ALL.length }}</span>
        <span class="stat__label">字库</span>
      </div>
    </section>

    <p class="hint">选择适合宝宝年龄的一级，一次学 5-10 个字效果最好 👇</p>

    <div class="grid">
      <GroupCard
        v-for="(lv, i) in HANZI_LEVELS"
        :key="lv.id"
        :title="lv.name"
        :emoji="lv.emoji"
        :desc="lv.desc"
        :age="lv.age"
        :color="lv.color"
        :learned="store.learnedCountOf('hanzi', lv.id)"
        :total="lv.items.length"
        :style="{ animationDelay: i * 60 + 'ms' }"
        @learn="router.push(`/hanzi/learn/${lv.id}`)"
        @game="router.push(`/hanzi/game/${lv.id}`)"
      />
    </div>
  </main>
</template>

<style scoped>
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
}
</style>