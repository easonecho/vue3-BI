/**
 * 系统布局 - 菜单路径/图标/面包屑纯函数
 *
 * 从 SystemLayout.vue 抽出，便于单测覆盖三级菜单路径拼接等边界逻辑。
 */
import type { Component } from 'vue'
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
} from '@element-plus/icons-vue'

export interface BreadcrumbItem {
  title: string
  path?: string
}

/** 一级路由 -> 面包屑标题 */
export const MENU_TITLE: Record<string, string> = {
  '/dashboard': '看板管理',
  '/dashboard-templates': '模板库',
  '/system/users': '用户管理',
  '/system/roles': '角色管理',
  '/system/menus': '菜单管理',
  '/system/departments': '部门管理',
  '/system/datasources': '数据源管理',
  '/system/datasets': '数据集管理',
  '/system/dicts': '数据字典',
  '/system/logs': '操作日志',
  '/system/configs': '系统配置',
  '/system/positions': '岗位管理',
  '/system/scheduled-tasks': '定时任务',
  '/system/usage': '使用分析',
  '/system/monitor': '系统监控',
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
}

/** 菜单图标名 -> Element Plus 图标组件（未知名称回退到 DataBoard） */
export function iconComp(iconName?: string): Component {
  if (!iconName || iconName === '#') return DataBoard
  return ICON_MAP[iconName] || DataBoard
}

/** 根据当前路由生成面包屑（首页 + 一级路由标题） */
export function buildBreadcrumbs(path: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ title: '首页', path: '/dashboard' }]
  const title = MENU_TITLE[path]
  if (title && path !== '/dashboard') {
    crumbs.push({ title, path })
  }
  return crumbs
}
