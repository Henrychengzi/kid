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

    <div class="summary card anim-rise">
      <div class="summary__item">
        <strong>{{ totalLearned() }}</strong>
        <span>已学汉字</span>
      </div>
      <div class="summary__item">
        <strong>{{ store.masteredCountOf('hanzi') }}</strong>
        <span>已掌握</span>
      </div>
      <div class="summary__item">
        <strong>{{ store.accuracyOf('hanzi') }}%</strong>
        <span>正确率</span>
      </div>
      <div class="summary__item">
        <strong>{{ HANZI_ALL.length }}</strong>
        <span>字库总量</span>
      </div>
    </div>

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
  color: var(--c-orange);
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
  .summary__item strong {
    font-size: 19px;
  }
}
</style>
