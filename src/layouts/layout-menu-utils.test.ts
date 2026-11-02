import { describe, it, expect } from 'vitest'
import { DataBoard, User, Grid } from '@element-plus/icons-vue'
import { MENU_TITLE, buildBreadcrumbs, iconComp, resolvePath } from './layout-menu-utils'

describe('resolvePath 单段路径', () => {
  it('child 为空时回退到父路径或根路径', () => {
    expect(resolvePath('/system', undefined)).toBe('/system')
    expect(resolvePath(undefined, null)).toBe('/')
    expect(resolvePath(null, '')).toBe('/')
  })

  it('child 为绝对路径时折叠多余斜杠', () => {
    expect(resolvePath('/system', '//users///list')).toBe('/users/list')
  })

  it('child 为相对路径时忽略父路径（保留原有行为）', () => {
    expect(resolvePath('/system', 'users')).toBe('/users')
    expect(resolvePath('/system', '/users')).toBe('/users')
  })
})

describe('resolvePath 多段路径', () => {
  it('父路径与子路径逐段拼接', () => {
    expect(resolvePath('/system', 'users', 'list')).toBe('/system/users/list')
  })

  it('自动裁剪首尾斜杠并跳过空值', () => {
    expect(resolvePath('/system/', null, '/menus/', '')).toBe('/system/menus')
  })

  it('没有任何路径段时返回根路径', () => {
    expect(resolvePath(undefined)).toBe('/')
    expect(resolvePath(undefined, null, '')).toBe('/')
  })
})

describe('iconComp 图标映射', () => {
  it('未配置或占位符回退到 DataBoard', () => {
    expect(iconComp()).toBe(DataBoard)
    expect(iconComp('#')).toBe(DataBoard)
  })

  it('已知图标返回对应组件', () => {
    expect(iconComp('User')).toBe(User)
    expect(iconComp('Grid')).toBe(Grid)
  })

  it('未知图标回退到 DataBoard', () => {
    expect(iconComp('NotExists')).toBe(DataBoard)
  })
})

describe('buildBreadcrumbs 面包屑', () => {
  it('首页只展示首页一级', () => {
    expect(buildBreadcrumbs('/dashboard')).toEqual([{ title: '首页', path: '/dashboard' }])
  })

  it('已知一级路由追加标题', () => {
    expect(buildBreadcrumbs('/system/users')).toEqual([
      { title: '首页', path: '/dashboard' },
      { title: '用户管理', path: '/system/users' },
    ])
  })

  it('未知路由仅展示首页', () => {
    expect(buildBreadcrumbs('/unknown')).toEqual([{ title: '首页', path: '/dashboard' }])
  })

  it('MENU_TITLE 覆盖全部静态菜单入口', () => {
    expect(MENU_TITLE['/system/monitor']).toBe('系统监控')
    expect(Object.keys(MENU_TITLE)).toHaveLength(15)
  })
})
