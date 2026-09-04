<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  emoji: { type: String, default: '📘' },
  desc: { type: String, default: '' },
  age: { type: String, default: '' },
  color: { type: String, default: '#FF8A3D' },
  learned: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  unit: { type: String, default: '字' }
})

const emit = defineEmits(['learn', 'game'])

const percent = computed(() => (props.total ? Math.round((props.learned / props.total) * 100) : 0))
</script>

<template>
  <article class="grp anim-rise" :style="{ '--accent': color }">
    <div class="grp__head">
      <div class="grp__icon">{{ emoji }}</div>
      <div class="grp__meta">
        <h3 class="grp__title">
          {{ title }}
          <span v-if="age" class="grp__age">{{ age }}</span>
        </h3>
        <p class="grp__desc">{{ desc }}</p>
      </div>
    </div>

    <div class="grp__progress">
      <div class="bar">
        <div class="bar__fill" :style="{ width: percent + '%', background: color }" />
      </div>
      <span class="grp__num">{{ learned }} / {{ total }} {{ unit }}</span>
    </div>

    <div class="grp__actions">
      <button class="btn btn--sm grp__btn" type="button" @click="emit('learn')">📖 去学习</button>
      <button class="btn btn--sm btn--ghost grp__btn" type="button" @click="emit('game')">🎮 去闯关</button>
    </div>
  </article>
</template>

<style scoped>
.grp {
  background: #fff;
  border-radius: var(--radius-l);
  padding: 18px;
  box-shadow: var(--shadow-s);
  border: 2px solid var(--line);
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.grp:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-m);
  border-color: var(--accent);
}

.grp__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.grp__icon {
  flex: none;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 28px;
  background: #fff4ec; /* 不支持 color-mix 的浏览器回退 */
  background: color-mix(in srgb, var(--accent) 16%, #fff);
}

.grp__meta {
  min-width: 0;
}

.grp__title {
  margin: 0 0 2px;
  font-size: 18px;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.grp__age {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: var(--accent);
  border-radius: 999px;
  padding: 2px 9px;
}

.grp__desc {
  margin: 0;
  font-size: 13px;
  color: var(--text-mute);
  font-weight: 600;
}

.grp__progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.grp__progress .bar {
  flex: 1;
}

.grp__num {
  font-size: 12px;
  font-weight: 800;
  color: var(--text-soft);
  white-space: nowrap;
}

.grp__actions {
  display: flex;
  gap: 10px;
}

.grp__btn {
  flex: 1;
}
</style>
