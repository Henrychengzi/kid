/**
 * 小小识字乐园 — Service Worker
 *
 * 策略：
 *  - 页面导航（hash 路由）→ 「网络优先」，失败回退缓存的 index.html，保证离线可打开
 *  - 静态资源（JS/CSS/字体/图标）→ 「缓存优先 + 后台更新」，首次访问后即可离线使用
 *  - 仅缓存同源 GET 请求，第三方 CDN（字体 / 图片）交给浏览器默认处理
 *
 * 注意：Vite 以 base: './' 构建，构建产物位于 dist/ 根目录，sw.js 作用域覆盖整个应用。
 */
const CACHE = 'kid-literacy-v1'
const SHELL = ['./', './index.html', './manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // 只处理同源，跨域交给浏览器默认策略
  if (url.origin !== self.location.origin) return

  // 页面导航 → 网络优先，回退壳缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy))
          return response
        })
        .catch(() => caches.match('./index.html'))
    )
    return
  }

  // 静态资源 → 缓存优先，后台更新
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchAndCache = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
      return cached || fetchAndCache
    })
  )
})
