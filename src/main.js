import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/global.css'

createApp(App).use(createPinia()).use(router).mount('#app')

// PWA：仅生产环境注册 Service Worker（开发模式避免干扰热更新）
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* 浏览器不支持或注册失败时静默降级，不影响使用 */
    })
  })
}
