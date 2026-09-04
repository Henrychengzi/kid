<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  emoji: { type: String, default: '' },
  backTo: { type: [String, Object], default: null },
  color: { type: String, default: 'var(--c-orange)' }
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
    <button class="hd__back" type="button" aria-label="返回" @click="goBack">‹</button>
    <div class="hd__title">
      <div class="hd__main">
        <span v-if="emoji" class="hd__emoji">{{ emoji }}</span>
        <span class="hd__text" :style="{ color }">{{ title }}</span>
      </div>
      <span v-if="subtitle" class="hd__sub">{{ subtitle }}</span>
    </div>
    <slot name="right" />
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
  background: linear-gradient(180deg, rgba(255, 248, 240, 0.96) 60%, rgba(255, 248, 240, 0));
  backdrop-filter: blur(6px);
}

.hd__back {
  flex: none;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: #fff;
  color: var(--text);
  font-size: 32px;
  line-height: 1;
  padding: 0 0 4px;
  cursor: pointer;
  box-shadow: var(--shadow-s);
  transition: transform 0.12s ease;
}

.hd__back:active {
  transform: scale(0.9);
}

.hd__title {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.hd__main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.hd__emoji {
  font-size: 24px;
  line-height: 1;
}

.hd__text {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 1px;
}

.hd__sub {
  font-size: 13px;
  color: var(--text-mute);
  font-weight: 600;
}

@media (max-width: 600px) {
  .hd__text {
    font-size: 19px;
  }
}
</style>
