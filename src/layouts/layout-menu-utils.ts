/**
 * 系统布局 - 菜单路径/图标/面包屑纯函数
 *
 * 从 SystemLayout.vue 抽出，便于单测覆盖三级菜单路径拼接等边界逻辑。
 */
import type { Component } from 'vue'
import i18n from '@/i18n'
import {
  DataBoard,
  Setting,
  User,
  UserFilled,
  OfficeBuilding,
  Coin,
  Link,
  Grid,
  Menu,
  Monitor,
  Edit,
  Histogram,
  Files,
  TrendCharts,
  Postcard,
  Timer,
  Cpu,
} from '@element-plus/icons-vue'

export interface BreadcrumbItem {
  title: string
  path?: string
}

/** 一级路由 -> 面包屑标题 */
export const MENU_TITLE: Record<string, string> = {
  get '/dashboard'() {
    return i18n.global.t('menu.dashboard')
  },
  get '/dashboard-templates'() {
    return i18n.global.t('menu.dashboardTemplates')
  },
  get '/system/users'() {
    return i18n.global.t('menu.users')
  },
  get '/system/roles'() {
    return i18n.global.t('menu.roles')
  },
  get '/system/menus'() {
    return i18n.global.t('menu.menus')
  },
  get '/system/departments'() {
    return i18n.global.t('menu.departments')
  },
  get '/system/datasources'() {
    return i18n.global.t('menu.datasources')
  },
  get '/system/datasets'() {
    return i18n.global.t('menu.datasets')
  },
  get '/system/dicts'() {
    return i18n.global.t('menu.dicts')
  },
  get '/system/logs'() {
    return i18n.global.t('menu.logs')
  },
  get '/system/configs'() {
    return i18n.global.t('menu.configs')
  },
  get '/system/positions'() {
    return i18n.global.t('menu.positions')
  },
  get '/system/scheduled-tasks'() {
    return i18n.global.t('menu.scheduledTasks')
  },
  get '/system/usage'() {
    return i18n.global.t('menu.usage')
  },
  get '/system/monitor'() {
    return i18n.global.t('menu.monitor')
  },
}

/**
 * 后端菜单默认中文名 -> i18n key
 *
 * 仅当菜单名与内置默认名完全一致时才翻译；管理员在「菜单管理」中
 * 自定义的名称保持原样，避免覆盖业务自定义。
 */
const MENU_NAME_KEYS: Record<string, string> = {
  看板管理: 'menu.dashboard',
  模板管理: 'menu.manageTemplates',
  BI编辑器: 'menu.editor',
  数据大屏: 'menu.screen',
  素材管理: 'menu.material',
  用户管理: 'menu.users',
  角色管理: 'menu.roles',
  菜单管理: 'menu.menus',
  部门管理: 'menu.departments',
  数据源管理: 'menu.datasources',
  数据集管理: 'menu.datasets',
  数据字典: 'menu.dicts',
  操作日志: 'menu.logs',
  系统配置: 'menu.configs',
  岗位管理: 'menu.positions',
  定时任务: 'menu.scheduledTasks',
  系统监控: 'menu.monitor',
  使用分析: 'menu.usage',
  租户管理: 'menu.tenants',
  系统管理: 'menu.system',
}

/** 动态菜单名按当前语言显示（未命中的自定义名称原样返回） */
export function menuDisplayName(name: string): string {
  const key = MENU_NAME_KEYS[name]
  return key ? i18n.global.t(key) : name
}

/**
 * 拼接菜单路由
 *
 * 兼容两种调用方式:
 *   - 单 child: 该 child 本身就是绝对/相对路径（忽略 parentPath）
 *   - 多 child: parent + 各级 child 逐段拼接
 */
export function resolvePath(
  parentPath?: string | null,
  ...childPaths: (string | null | undefined)[]
): string {
  if (childPaths.length === 1) {
    const p = childPaths[0]
    if (!p) return parentPath || '/'
    if (p.startsWith('/')) return p.replace(/\/+/g, '/')
    return `/${p.replace(/^\/+/, '')}`
  }
  const parts: string[] = []
  if (parentPath) parts.push(parentPath.replace(/^\/+|\/+$/g, ''))
  for (const p of childPaths) {
    if (!p) continue
    parts.push(p.replace(/^\/+|\/+$/g, ''))
  }
  const r = parts.join('/')
  return r.startsWith('/') ? r : `/${r}`
}

const ICON_MAP: Record<string, Component> = {
  DataBoard,
  Setting,
  User,
  UserFilled,
  OfficeBuilding,
  Coin,
  Link,
  Grid,
  Menu,
  Monitor,
  Edit,
  Histogram,
  Files,
  TrendCharts,
  Postcard,
  Timer,
  Cpu,
}

/** 菜单图标名 -> Element Plus 图标组件（未知名称回退到 DataBoard） */
export function iconComp(iconName?: string): Component {
  if (!iconName || iconName === '#') return DataBoard
  return ICON_MAP[iconName] || DataBoard
}

/** 根据当前路由生成面包屑（首页 + 一级路由标题） */
export function buildBreadcrumbs(path: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ title: i18n.global.t('layout.home'), path: '/dashboard' }]
  const title = MENU_TITLE[path]
  if (title && path !== '/dashboard') {
    crumbs.push({ title, path })
  }
  return crumbs
}
