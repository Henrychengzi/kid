<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  emoji: { type: String, default: '' },
  desc: { type: String, default: '' },
  age: { type: String, default: '' },
  color: { type: String, default: '#FF6B9D' },
  learned: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  unit: { type: String, default: '字' }
})

const emit = defineEmits(['learn', 'game'])

const percent = computed(() => (props.total ? Math.round((props.learned / props.total) * 100) : 0))
</script>

<template>
  <article class="grp anim-rise" :style="{ '--accent': color, '--accent-soft': color + '1F' }">
    <div class="grp__head">
      <div class="grp__icon" aria-hidden>{{ emoji }}</div>
      <div class="grp__meta">
        <h3 class="grp__title">
          {{ title }}
          <span v-if="age" class="grp__age">{{ age }}</span>
        </h3>
        <p class="grp__desc">{{ desc }}</p>
      </div>
    </div>

    <div class="grp__progress">
      <div class="bar"><div class="bar__fill" :style="{ width: percent + '%', background: color }" /></div>
      <span class="grp__num">{{ learned }} / {{ total }} {{ unit }}</span>
    </div>

    <div class="grp__actions">
      <button class="btn btn--tinted grp__btn" type="button" @click="emit('learn')">📖 去学习</button>
      <button class="btn btn--gray grp__btn" type="button" @click="emit('game')">🎮 去闯关</button>
    </div>
  </article>
</template>

<style scoped>
.grp {
  background: var(--bg-card);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border: 0.5px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 18px;
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 220ms ease;
}

.grp:active {
  transform: scale(0.99);
  box-shadow: var(--shadow-md);
}

.grp__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.grp__icon {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  background: var(--accent-soft, rgba(255, 107, 157, 0.12));
}

.grp__meta { min-width: 0; }

.grp__title {
  margin: 0 0 2px;
  font-size: var(--fs-title-3);
  font-weight: 700;
  letter-spacing: -0.015em;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--label-primary);
}

.grp__age {
  font-size: var(--fs-caption-1);
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  border-radius: var(--radius-pill);
  padding: 2px 10px;
  letter-spacing: 0;
}

.grp__desc {
  margin: 0;
  font-size: var(--fs-footnote);
  color: var(--label-tertiary);
  font-weight: 500;
}

.grp__progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.grp__progress .bar { flex: 1; }

.grp__num {
  font-size: var(--fs-caption-1);
  font-weight: 600;
  color: var(--label-secondary);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.grp__actions {
  display: flex;
  gap: 10px;
}

.grp__btn {
  flex: 1;
  min-height: 40px;
  font-size: var(--fs-subhead);
}

.grp__btn:first-of-type { color: var(--accent); }
</style>