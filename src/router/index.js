import { createRouter, createWebHashHistory } from 'vue-router'

// 使用 hash 模式：GitHub Pages / Gitee Pages 静态托管均无服务端重写规则，
// history 模式在刷新子页面时会 404，hash 模式可保证任意页面直接刷新都能打开。
const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/hanzi', name: 'hanzi', component: () => import('@/views/HanziHomeView.vue') },
  { path: '/hanzi/learn/:levelId', name: 'hanzi-learn', component: () => import('@/views/HanziLearnView.vue') },
  { path: '/hanzi/trace/:levelId', name: 'hanzi-trace', component: () => import('@/views/TraceView.vue') },
  { path: '/hanzi/game/:levelId', name: 'hanzi-game', component: () => import('@/views/GameView.vue'), props: { module: 'hanzi' } },
  { path: '/english', name: 'english', component: () => import('@/views/EnHomeView.vue') },
  { path: '/english/learn/:catId', name: 'en-learn', component: () => import('@/views/EnLearnView.vue') },
  { path: '/english/game/:catId', name: 'en-game', component: () => import('@/views/GameView.vue'), props: { module: 'english' } },
  {
    path: '/review/:module',
    name: 'review',
    component: () => import('@/views/GameView.vue'),
    props: true,
    // 只允许 hanzi / english 两个模块，其余回首页
    beforeEnter: (to) => (['hanzi', 'english'].includes(to.params.module) ? true : { path: '/' })
  },
  { path: '/parent', name: 'parent', component: () => import('@/views/ParentView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})
