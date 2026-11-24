import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { watch } from 'vue'
import { ElMessage } from 'element-plus'
import { doneProgress, resetProgress, startProgress } from '@/utils/progress'
import i18n from '@/i18n'
import { useUserStore } from '@/stores/user'
import { useMenuStore } from '@/stores/menu'

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
      meta: { title: '登录', titleKey: 'routerTitles.login', public: true },
    },
    {
      path: '/share/:token',
      name: 'PublicShare',
      component: () => import('@/views/share/index.vue'),
      meta: { title: '看板分享', titleKey: 'routerTitles.share', public: true },
    },
    {
      // 🔑 嵌入模式: 由第三方系统 iframe 引用, 无登录态, 隐藏标题栏
      path: '/embed/:token',
      name: 'PublicEmbed',
      component: () => import('@/views/share/index.vue'),
      meta: { title: '看板嵌入', titleKey: 'routerTitles.embed', public: true, embed: true },
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
          meta: { title: '看板管理', titleKey: 'routerTitles.dashboard', requiresAuth: true },
        },
        {
          path: 'dashboard-templates',
          name: 'DashboardTemplates',
          component: () => import('@/views/dashboard-templates/index.vue'),
          meta: {
            title: '模板库',
            titleKey: 'routerTitles.dashboardTemplates',
            requiresAuth: true,
          },
        },
        {
          path: 'material',
          name: 'Material',
          component: () => import('@/views/material/index.vue'),
          meta: {
            title: '素材管理',
            titleKey: 'routerTitles.material',
            requiresAuth: true,
            permissions: ['material:view', 'material:upload', 'material:delete'],
          },
        },
        {
          path: 'system/users',
          name: 'SystemUsers',
          component: () => import('@/views/system/users/index.vue'),
          meta: {
            title: '用户管理',
            titleKey: 'routerTitles.users',
            requiresAuth: true,
            permissions: [
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
            titleKey: 'routerTitles.roles',
            requiresAuth: true,
            permissions: [
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
            titleKey: 'routerTitles.departments',
            requiresAuth: true,
            permissions: [
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
            titleKey: 'routerTitles.datasources',
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
          component: () => import('@/views/system/datasets/index.vue'),
          meta: {
            title: '数据集管理',
            titleKey: 'routerTitles.datasets',
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
            titleKey: 'routerTitles.menus',
            requiresAuth: true,
            permissions: [
              'system:menu:list',
              'system:menu:add',
              'system:menu:edit',
              'system:menu:remove',
            ],
          },
        },
        {
          path: 'system/logs',
          name: 'SystemLogs',
          component: () => import('@/views/system/logs.vue'),
          meta: {
            title: '操作日志',
            titleKey: 'routerTitles.logs',
            requiresAuth: true,
            permissions: ['system:log:list', 'system:log:remove', 'system:log:clean'],
          },
        },
        {
          path: 'system/dicts',
          name: 'SystemDicts',
          component: () => import('@/views/system/dicts.vue'),
          meta: {
            title: '数据字典',
            titleKey: 'routerTitles.dicts',
            requiresAuth: true,
            permissions: [
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
            titleKey: 'routerTitles.configs',
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
          path: 'system/tenants',
          name: 'SystemTenants',
          component: () => import('@/views/system/tenants.vue'),
          meta: {
            title: '租户管理',
            titleKey: 'routerTitles.tenants',
            requiresAuth: true,
            permissions: [
              'system:tenant:view',
              'system:tenant:list',
              'system:tenant:add',
              'system:tenant:edit',
            ],
          },
        },
        {
          path: 'system/positions',
          name: 'SystemPositions',
          component: () => import('@/views/system/positions.vue'),
          meta: {
            title: '岗位管理',
            titleKey: 'routerTitles.positions',
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
            titleKey: 'routerTitles.scheduledTasks',
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
            titleKey: 'routerTitles.monitor',
            requiresAuth: true,
            permissions: ['system:monitor:view', 'monitor:view', 'monitor:kick'],
          },
        },
        {
          path: 'system/usage',
          name: 'SystemUsage',
          component: () => import('@/views/system/usage.vue'),
          meta: {
            title: '使用分析',
            titleKey: 'routerTitles.usage',
            requiresAuth: true,
            permissions: ['system:usage:view'],
          },
        },
      ],
    },
    {
      path: '/screen/:id?',
      name: 'Screen',
      component: () => import('@/views/screen/index.vue'),
      meta: { title: '数据大屏', titleKey: 'routerTitles.screen', requiresAuth: true },
    },
    {
      // 🔑 :id? 可选参数:无 id 进入新建空白看板,有 id 加载已有看板
      path: '/bi-editor/:id?',
      name: 'BiEditor',
      component: () => import('@/views/bi-editor/index.vue'),
      meta: {
        title: 'BI 报表编辑器',
        titleKey: 'routerTitles.biEditor',
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
        titleKey: 'routerTitles.templateEditor',
        requiresAuth: true,
      },
    },
    {
      path: '/preview/:id',
      name: 'Preview',
      component: () => import('@/views/preview/index.vue'),
      meta: { title: '看板预览', titleKey: 'routerTitles.preview', requiresAuth: true },
    },
    {
      path: '/preview-template/:id',
      name: 'PreviewTemplate',
      component: () => import('@/views/preview/index.vue'),
      meta: { title: '模板预览', titleKey: 'routerTitles.templatePreview', requiresAuth: true },
    },
    {
      path: '/api-demo',
      name: 'ApiDemo',
      component: () => import('@/views/api-demo/index.vue'),
      meta: { title: '接口调用演示', titleKey: 'routerTitles.apiDemo', requiresAuth: true },
    },
    {
      path: '/403',
      name: 'Forbidden',
      component: () => import('@/views/error/403.vue'),
      meta: { title: '暂无权限', titleKey: 'routerTitles.forbidden', public: true },
    },
    {
      path: '/404',
      name: 'NotFound',
      component: () => import('@/views/error/404.vue'),
      meta: { title: '页面不存在', titleKey: 'routerTitles.notFound', public: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'CatchAll',
      redirect: '/404',
    },
  ],
})

/**
 * 🔑 路由错误恢复：发版后旧页面的 chunk 文件已被新构建产物替换，
 * 触发懒加载路由时会报 "Failed to fetch dynamically imported module" / "Loading chunk failed" 等错误，
 * 表现为点击菜单白屏。此处捕获该错误，自动刷新一次以加载最新资源。
 * 使用 sessionStorage 记录刷新时间做 60 秒限频，避免资源持续 404 时无限刷新。
 */
const CHUNK_RELOAD_KEY = 'bi_chunk_reload_at'
router.onError((error) => {
  // 路由异常时 afterEach 可能不会触发，兜底收尾避免进度条卡住
  resetProgress()
  const message = error instanceof Error ? error.message : String(error)
  const isChunkError =
    /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed|Unable to preload CSS|error loading dynamically imported module/i.test(
      message,
    )
  if (isChunkError) {
    const lastReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
    if (Date.now() - lastReloadAt > 60_000) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
      ElMessage.warning(i18n.global.t('appMessages.versionUpdated'))
      window.location.reload()
      return
    }
  }
  console.error('[Router Error]', error)
})

/**
 * 🔑 全局前置守卫：路由拦截
 * 1. 未登录跳登录页
 * 2. 已登录但权限不足跳 403
 * 返回 true 放行，返回路由地址则重定向
 */
async function resolveNavigation(to: RouteLocationNormalized): Promise<true | RouteLocationRaw> {
  const userStore = useUserStore()
  // 🔑 access token 仅存内存: 页面刷新后先用 HttpOnly refresh Cookie 静默恢复会话
  await userStore.ensureSession()
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
}

router.beforeEach(async (to) => {
  startProgress()
  const result = await resolveNavigation(to)
  // 🔑 守卫返回重定向时 Vue Router 不会再触发本次导航的 afterEach，主动收尾；
  // 重定向后的新导航会重新开始计数
  if (result !== true) doneProgress()
  return result
})

router.afterEach((to) => {
  doneProgress()
  applyPageTitle(to)
})

/** 根据路由 meta.titleKey 生成页面标题, 语言切换后也能同步刷新 */
function applyPageTitle(to: RouteLocationNormalized): void {
  const baseTitle = import.meta.env.VITE_APP_TITLE || i18n.global.t('auth.appTitle')
  const titleKey = to.meta.titleKey as string | undefined
  const pageTitle = titleKey ? i18n.global.t(titleKey) : (to.meta.title as string | undefined)
  document.title = pageTitle ? `${pageTitle} - ${baseTitle}` : baseTitle
}

watch(
  () => i18n.global.locale.value,
  () => applyPageTitle(router.currentRoute.value),
)

export default router
