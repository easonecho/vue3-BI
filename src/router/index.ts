import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import { useUserStore } from '@/stores/user'

NProgress.configure({ showSpinner: false })

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录', public: true },
    },
    {
      path: '/bi-editor',
      name: 'BiEditor',
      component: () => import('@/views/bi-editor/index.vue'),
      meta: {
        title: 'BI 报表编辑器',
        requiresAuth: true,
      },
    },
    {
      path: '/api-demo',
      name: 'ApiDemo',
      component: () => import('@/views/api-demo/index.vue'),
      meta: { title: '接口调用演示', requiresAuth: true },
    },
    {
      path: '/403',
      name: 'Forbidden',
      component: () => import('@/views/error/403.vue'),
      meta: { title: '暂无权限', public: true },
    },
    {
      path: '/404',
      name: 'NotFound',
      component: () => import('@/views/error/404.vue'),
      meta: { title: '页面不存在', public: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'CatchAll',
      redirect: '/404',
    },
  ],
})

/**
 * 🔑 全局前置守卫：路由拦截
 *
 * 规则：
 * 1. 未登录访问需要认证的路由 → 重定向到 /login，并携带 redirect 参数
 * 2. 已登录访问 /login → 重定向到 /bi-editor（避免重复登录）
 * 3. 标记为 meta.public 的路由（如 /login）不做认证校验
 */
router.beforeEach((to) => {
  NProgress.start()
  // 🔑 在守卫回调内调用 store：此时 Pinia 已在 main.ts 中 app.use(createPinia()) 安装完毕
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn

  // 已登录访问登录页 → 直接进入主页
  if (to.path === '/login' && isLoggedIn) {
    return { path: '/bi-editor', replace: true }
  }

  // 未登录访问需要认证的路由 → 跳转登录页，并记录原始目标以便登录后回跳
  if (to.meta.requiresAuth && !isLoggedIn) {
    return {
      path: '/login',
      query: to.fullPath === '/' ? undefined : { redirect: to.fullPath },
      replace: true,
    }
  }

  // 其余情况放行
  return true
})

/**
 * 全局后置钩子：设置页面标题 + 结束进度条
 */
router.afterEach((to) => {
  NProgress.done()
  const baseTitle = import.meta.env.VITE_APP_TITLE || 'BI 低代码平台'
  const pageTitle = to.meta.title as string | undefined
  document.title = pageTitle ? `${pageTitle} - ${baseTitle}` : baseTitle
})

export default router
