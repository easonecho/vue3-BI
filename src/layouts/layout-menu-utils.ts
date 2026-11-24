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
