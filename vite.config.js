import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// base 使用相对路径 './'，保证同一份产物既能跑在
// GitHub Pages 的 https://<user>.github.io/<repo>/ 下，
// 也能跑在 Gitee Pages 的 https://<user>.gitee.io/<repo>/ 下。
export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
    port: 5173
  }
})
