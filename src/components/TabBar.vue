<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 仅在主导航类路由展示底部 TabBar
const showTabBar = computed(() => {
  const p = route.path
  return p === '/' || p === '/hanzi' || p === '/english' || p === '/parent'
})

const tabs = [
  { name: 'home',    path: '/',        label: '首页',   icon: 'home' },
  { name: 'hanzi',   path: '/hanzi',   label: '汉字',   icon: 'book' },
  { name: 'english', path: '/english', label: '英语',   icon: 'abc' },
  { name: 'parent',  path: '/parent',  label: '家长',   icon: 'people' }
]

const activeName = computed(() => {
  const p = route.path
  if (p === '/') return 'home'
  if (p.startsWith('/hanzi')) return 'hanzi'
  if (p.startsWith('/english')) return 'english'
  if (p.startsWith('/parent')) return 'parent'
  return 'home'
})

function go(t) {
  if (t.path !== route.path) router.push(t.path)
}
</script>

<template>
  <nav v-if="showTabBar" class="tab-bar" aria-label="主导航">
    <button
      v-for="t in tabs"
      :key="t.name"
      class="tab"
      :class="{ 'tab--active': activeName === t.name }"
      type="button"
      :aria-label="t.label"
      :aria-current="activeName === t.name ? 'page' : undefined"
      @click="go(t)"
    >
      <span class="tab__icon">
        <!-- home -->
        <svg v-if="t.icon === 'home'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V11z"/>
        </svg>
        <!-- book (汉字) -->
        <svg v-else-if="t.icon === 'book'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5V4.5z"/>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        </svg>
        <!-- abc / english -->
        <svg v-else-if="t.icon === 'abc'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 17l4-10 4 10"/>
          <path d="M4 14h6"/>
          <path d="M14 10v7"/>
          <path d="M14 13.5c0-1 .8-1.5 2-1.5s2 .5 2 1.5v3.5h-2"/>
          <path d="M18 12v5"/>
        </svg>
        <!-- people / 家长 -->
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="8" r="3"/>
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
          <circle cx="17" cy="9" r="2.5"/>
          <path d="M16 14h1c2 0 4 1.5 4 4"/>
        </svg>
      </span>
      <span class="tab__label">{{ t.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 64px;
  padding-bottom: env(safe-area-inset-bottom, 0);
  background: var(--glass-tab);
  -webkit-backdrop-filter: saturate(180%) blur(28px);
  backdrop-filter: saturate(180%) blur(28px);
  border-top: 0.5px solid var(--glass-border);
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: var(--tap-min);
  padding: 4px 4px 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--label-tertiary);
  font-family: var(--font-system);
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    color 180ms ease;
}

.tab:active {
  transform: scale(0.92);
}

.tab--active {
  color: var(--accent);
}

.tab__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 30px;
  border-radius: var(--radius-pill);
  font-size: 0;
  transition: background-color 200ms ease;
}

.tab__icon svg {
  width: 24px;
  height: 24px;
}

.tab--active .tab__icon {
  background: var(--accent-soft);
}

.tab__label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
}

@media (hover: hover) {
  .tab:hover {
    color: var(--label-secondary);
  }
  .tab--active:hover {
    color: var(--accent);
  }
}

@media (min-width: 720px) {
  .tab-bar {
    max-width: 720px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
}
</style>