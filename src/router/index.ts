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
    // ========== 主布局 (看板管理 + 各项一级管理菜单) ==========
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
          path: 'dashboard-templates',
          name: 'DashboardTemplates',
          component: () => import('@/views/dashboard-templates/index.vue'),
          meta: { title: '模板库', requiresAuth: true },
        },
        {
          path: 'system/users',
          name: 'SystemUsers',
          component: () => import('@/views/system/users.vue'),
          meta: {
            title: '用户管理',
            requiresAuth: true,
            permissions: [
              'system:user:view',
              'system:user:list',
              'system:user:add',
              'system:user:edit',
              'system:user:remove',
            ],
          },
        },
        {
          path: 'system/roles',
          name: 'SystemRoles',
          component: () => import('@/views/system/roles.vue'),
          meta: {
            title: '角色管理',
            requiresAuth: true,
            permissions: [
              'system:role:view',
              'system:role:list',
              'system:role:add',
              'system:role:edit',
              'system:role:remove',
              'system:role:menu',
            ],
          },
        },
        {
          path: 'system/departments',
          name: 'SystemDepts',
          component: () => import('@/views/system/departments.vue'),
          meta: {
            title: '部门管理',
            requiresAuth: true,
            permissions: [
              'system:dept:view',
              'system:dept:list',
              'system:dept:add',
              'system:dept:edit',
              'system:dept:remove',
            ],
          },
        },
        {
          path: 'system/datasources',
          name: 'SystemDatasources',
          component: () => import('@/views/system/datasources.vue'),
          meta: {
            title: '数据源管理',
            requiresAuth: true,
            permissions: [
              'system:datasource:view',
              'system:datasource:list',
              'system:datasource:add',
              'system:datasource:edit',
              'system:datasource:remove',
            ],
          },
        },
        {
          path: 'system/datasets',
          name: 'SystemDatasets',
          component: () => import('@/views/system/datasets.vue'),
          meta: {
            title: '数据集管理',
            requiresAuth: true,
            permissions: [
              'system:dataset:view',
              'system:dataset:list',
              'system:dataset:add',
              'system:dataset:edit',
              'system:dataset:remove',
            ],
          },
        },
        {
          path: 'system/menus',
          name: 'SystemMenus',
          component: () => import('@/views/system/menus.vue'),
          meta: {
            title: '菜单管理',
            requiresAuth: true,
            permissions: ['system:menu:view', 'system:menu:add', 'system:menu:edit', 'system:menu:remove'],
          },
        },
        {
          path: 'system/logs',
          name: 'SystemLogs',
          component: () => import('@/views/system/logs.vue'),
          meta: {
            title: '操作日志',
            requiresAuth: true,
            permissions: ['system:log:view', 'system:log:list', 'system:log:clean'],
          },
        },
        {
          path: 'system/dicts',
          name: 'SystemDicts',
          component: () => import('@/views/system/dicts.vue'),
          meta: {
            title: '数据字典',
            requiresAuth: true,
            permissions: [
              'system:dict:view',
              'system:dict:list',
              'system:dict:add',
              'system:dict:edit',
              'system:dict:remove',
            ],
          },
        },
        {
          path: 'system/configs',
          name: 'SystemConfigs',
          component: () => import('@/views/system/configs.vue'),
          meta: {
            title: '系统配置',
            requiresAuth: true,
            permissions: [
              'system:config:view',
              'system:config:add',
              'system:config:edit',
              'system:config:remove',
            ],
          },
        },
        {
          path: 'system/positions',
          name: 'SystemPositions',
          component: () => import('@/views/system/positions.vue'),
          meta: {
            title: '岗位管理',
            requiresAuth: true,
            permissions: [
              'system:position:view',
              'system:position:add',
              'system:position:edit',
              'system:position:remove',
            ],
          },
        },
        {
          path: 'system/scheduled-tasks',
          name: 'SystemScheduledTasks',
          component: () => import('@/views/system/scheduled-tasks.vue'),
          meta: {
            title: '定时任务',
            requiresAuth: true,
            permissions: [
              'system:task:view',
              'system:task:add',
              'system:task:run',
              'system:task:edit',
              'system:task:remove',
            ],
          },
        },
        {
          path: 'system/monitor',
          name: 'SystemMonitor',
          component: () => import('@/views/system/monitor.vue'),
          meta: {
            title: '系统监控',
            requiresAuth: true,
            permissions: ['system:monitor:view', 'monitor:view', 'monitor:kick'],
          },
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
      // 🔑 模板编辑模式:无 id 新建模板,有 id 编辑指定模板。复用 bi-editor 组件,通过 route.name 区分模式
      path: '/bi-editor-template/:id?',
      name: 'BiEditorTemplate',
      component: () => import('@/views/bi-editor/index.vue'),
      meta: {
        title: '模板编辑器',
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
      path: '/preview-template/:id',
      name: 'PreviewTemplate',
      component: () => import('@/views/preview/index.vue'),
      meta: { title: '模板预览', requiresAuth: true },
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
 * 1. 未登录跳登录页
 * 2. 已登录但权限不足跳 403
 */
router.beforeEach(async (to, from) => {
  NProgress.start()
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn

  if (to.path === '/login' && isLoggedIn) {
    return { path: '/dashboard', replace: true }
  }

  // 首次进入时初始化菜单 store（拉取菜单树 + 权限码）
  if (isLoggedIn && to.path !== '/login') {
    const menuStore = useMenuStore()
    if (!menuStore.loaded) {
      try {
        await menuStore.init()
      } catch (e) {
        console.warn('[router] menu init failed', e)
      }
    }
  }

  if (to.meta.requiresAuth && !isLoggedIn) {
    return {
      path: '/login',
      query: to.fullPath === '/' ? undefined : { redirect: to.fullPath },
      replace: true,
    }
  }

  // 🔑 路由级权限校验：meta.permissions 配置的权限码任一命中即放行
  // 命中规则见 stores/menu.ts 的 hasAnyPerms（含 '*' 通配，超管放行）
  // 仅在权限码已加载时校验，加载失败时放行由后端兜底，避免误锁
  if (to.meta.permissions && to.meta.permissions.length > 0 && isLoggedIn) {
    const menuStore = useMenuStore()
    if (menuStore.loaded && !menuStore.hasAnyPerms(to.meta.permissions)) {
      return { path: '/403', replace: true }
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
