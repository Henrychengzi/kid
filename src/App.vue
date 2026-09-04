<script setup>
import { onMounted } from 'vue'
import TabBar from '@/components/TabBar.vue'

// 启动时恢复主题（默认浅色）
onMounted(() => {
  const saved = localStorage.getItem('kid-literacy-theme')
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <TabBar />
</template>