import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import { useUserStore } from '@/stores/user'
import { useMenuStore } from '@/stores/menu'

NProgress.configure({ showSpinner: false })

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录', public: true },
    },
    {
      path: '/share/:token',
      name: 'PublicShare',
      component: () => import('@/views/share/index.vue'),
      meta: { title: '看板分享', public: true },
    },
    // ========== 系统管理布局 (含看板管理、用户/角色/部门/数据源/数据集) ==========
    {
      path: '/',
      component: () => import('@/layouts/SystemLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '看板管理', requiresAuth: true },
        },
        {
          path: 'system/users',
          name: 'SystemUsers',
          component: () => import('@/views/system/users.vue'),
          meta: { title: '用户管理', requiresAuth: true },
        },
        {
          path: 'system/roles',
          name: 'SystemRoles',
          component: () => import('@/views/system/roles.vue'),
          meta: { title: '角色管理', requiresAuth: true },
        },
        {
          path: 'system/departments',
          name: 'SystemDepts',
          component: () => import('@/views/system/departments.vue'),
          meta: { title: '部门管理', requiresAuth: true },
        },
        {
          path: 'system/datasources',
          name: 'SystemDatasources',
          component: () => import('@/views/system/datasources.vue'),
          meta: { title: '数据源管理', requiresAuth: true },
        },
        {
          path: 'system/datasets',
          name: 'SystemDatasets',
          component: () => import('@/views/system/datasets.vue'),
          meta: { title: '数据集管理', requiresAuth: true },
        },
        {
          path: 'system/menus',
          name: 'SystemMenus',
          component: () => import('@/views/system/menus.vue'),
          meta: { title: '菜单管理', requiresAuth: true },
        },
        {
          path: 'system/logs',
          name: 'SystemLogs',
          component: () => import('@/views/system/logs.vue'),
          meta: { title: '操作日志', requiresAuth: true },
        },
        {
          path: 'system/dicts',
          name: 'SystemDicts',
          component: () => import('@/views/system/dicts.vue'),
          meta: { title: '数据字典', requiresAuth: true },
        },
        {
          path: 'system/configs',
          name: 'SystemConfigs',
          component: () => import('@/views/system/configs.vue'),
          meta: { title: '系统配置', requiresAuth: true },
        },
        {
          path: 'system/positions',
          name: 'SystemPositions',
          component: () => import('@/views/system/positions.vue'),
          meta: { title: '岗位管理', requiresAuth: true },
        },
        {
          path: 'system/scheduled-tasks',
          name: 'SystemScheduledTasks',
          component: () => import('@/views/system/scheduled-tasks.vue'),
          meta: { title: '定时任务', requiresAuth: true },
        },
        {
          path: 'system/monitor',
          name: 'SystemMonitor',
          component: () => import('@/views/system/monitor.vue'),
          meta: { title: '系统监控', requiresAuth: true },
        },
      ],
    },
    {
      path: '/screen/:id?',
      name: 'Screen',
      component: () => import('@/views/screen/index.vue'),
      meta: { title: '数据大屏', requiresAuth: true },
    },
    {
      // 🔑 :id? 可选参数:无 id 进入新建空白看板,有 id 加载已有看板
      path: '/bi-editor/:id?',
      name: 'BiEditor',
      component: () => import('@/views/bi-editor/index.vue'),
      meta: {
        title: 'BI 报表编辑器',
        requiresAuth: true,
      },
    },
    {
      path: '/preview/:id',
      name: 'Preview',
      component: () => import('@/views/preview/index.vue'),
      meta: { title: '看板预览', requiresAuth: true },
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
 */
router.beforeEach(async (to, from) => {
  NProgress.start()
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn

  if (to.path === '/login' && isLoggedIn) {
    return { path: '/dashboard', replace: true }
  }

  // 首次进入时初始化菜单 store
  if (isLoggedIn && to.path !== '/login') {
    const menuStore = useMenuStore()
    if (!menuStore.loaded) {
      try { await menuStore.init() } catch (e) { console.warn('[index] ignored error', e) }
    }
  }
  if (to.meta.requiresAuth && !isLoggedIn) {
    return {
      path: '/login',
      query: to.fullPath === '/' ? undefined : { redirect: to.fullPath },
      replace: true,
    }
  }

  return true
})

router.afterEach((to) => {
  NProgress.done()
  const baseTitle = import.meta.env.VITE_APP_TITLE || 'BI 低代码平台'
  const pageTitle = to.meta.title as string | undefined
  document.title = pageTitle ? `${pageTitle} - ${baseTitle}` : baseTitle
})

export default router
