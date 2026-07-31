import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/bi-editor',
    },
    {
      path: '/bi-editor',
      name: 'BiEditor',
      component: () => import('@/views/bi-editor/index.vue'),
      meta: {
        title: 'BI 报表编辑器',
      },
    },
  ],
})

export default router
