<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  emoji: { type: String, default: '' },
  backTo: { type: [String, Object], default: null },
  color: { type: String, default: '' }
})

const router = useRouter()

function goBack() {
  if (props.backTo) router.push(props.backTo)
  else if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <header class="hd">
    <button class="hd__back" type="button" aria-label="返回" @click="goBack">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden>
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div class="hd__title">
      <div class="hd__main">
        <span v-if="emoji" class="hd__emoji" aria-hidden>{{ emoji }}</span>
        <span class="hd__text" :style="{ color: color || undefined }">{{ title }}</span>
      </div>
      <span v-if="subtitle" class="hd__sub">{{ subtitle }}</span>
    </div>
    <div class="hd__right">
      <slot name="right" />
    </div>
  </header>
</template>

<style scoped>
.hd {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 4px 18px;
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--glass-nav);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 0.5px solid transparent;
}

.hd__back {
  flex: none;
  width: var(--tap-min);
  height: var(--tap-min);
  border: none;
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 0.5px solid var(--glass-border);
  color: var(--accent);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 160ms ease;
}

.hd__back svg {
  width: 20px;
  height: 20px;
}

.hd__back:active {
  transform: scale(0.9);
  background: var(--accent-soft);
}

@media (hover: hover) {
  .hd__back:hover {
    background: var(--accent-soft);
  }
}

.hd__title {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.hd__main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.hd__emoji {
  font-size: 24px;
  line-height: 1;
}

.hd__text {
  font-size: var(--fs-large-title);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--label-primary);
  line-height: var(--lh-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hd__sub {
  margin-top: 2px;
  font-size: var(--fs-subhead);
  font-weight: 500;
  color: var(--label-tertiary);
  letter-spacing: var(--tracking-normal);
}

.hd__right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 600px) {
  .hd__text {
    font-size: var(--fs-title-1);
  }
}
</style>