import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { MenuTreeNode } from '@/api/menu'
import SidebarMenu from './SidebarMenu.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const ElMenuStub = defineComponent({
  name: 'ElMenu',
  props: ['defaultActive'],
  emits: ['select'],
  template: '<nav class="menu-stub" :data-active="defaultActive"><slot /></nav>',
})

const ElSubMenuStub = defineComponent({
  name: 'ElSubMenu',
  props: ['index'],
  template:
    '<div class="submenu-stub" :data-index="index"><slot name="title" /><slot /></div>',
})

const ElMenuItemStub = defineComponent({
  name: 'ElMenuItem',
  props: ['index'],
  template: '<div class="menuitem-stub" :data-index="index"><slot /></div>',
})

const stubs = {
  'el-menu': ElMenuStub,
  'el-sub-menu': ElSubMenuStub,
  'el-menu-item': ElMenuItemStub,
  'el-icon': { template: '<span class="icon-stub"><slot /></span>' },
}

function makeNode(overrides: Partial<MenuTreeNode> = {}): MenuTreeNode {
  return {
    id: 1,
    name: '菜单',
    parentId: 0,
    orderNum: 1,
    path: '/menu',
    isFrame: false,
    isCache: false,
    menuType: 'M',
    visible: true,
    status: 1,
    icon: 'DataBoard',
    ...overrides,
  }
}

function mountMenu(props: {
  menuTree?: MenuTreeNode[]
  activeMenu?: string
  isMobile?: boolean
  asideVisible?: boolean
} = {}) {
  return mount(SidebarMenu, {
    props: {
      menuTree: props.menuTree ?? [],
      activeMenu: props.activeMenu ?? '/dashboard',
      isMobile: props.isMobile ?? false,
      asideVisible: props.asideVisible ?? false,
    },
    global: { stubs },
  })
}

describe('SidebarMenu 静态菜单', () => {
  it('菜单树为空时渲染 15 个静态入口', () => {
    const wrapper = mountMenu()

    expect(wrapper.findAll('.menuitem-stub')).toHaveLength(15)
    expect(wrapper.find('[data-index="/dashboard"]').text()).toContain('menu.dashboard')
    expect(wrapper.find('[data-index="/system/datasets"]').text()).toContain('menu.datasets')
    expect(wrapper.findComponent(ElMenuStub).props('defaultActive')).toBe('/dashboard')
  })
})

describe('SidebarMenu 动态菜单', () => {
  const tree: MenuTreeNode[] = [
    makeNode({
      id: 1,
      name: '系统管理',
      path: '/system',
      icon: 'Setting',
      children: [
        makeNode({ id: 2, name: '用户管理', path: 'users', icon: 'User' }),
        makeNode({
          id: 3,
          name: '权限管理',
          path: '/roles',
          icon: 'UserFilled',
          children: [makeNode({ id: 4, name: '角色列表', path: 'list', icon: 'Grid' })],
        }),
      ],
    }),
    makeNode({ id: 5, name: '看板管理', path: '/dashboard', icon: 'DataBoard' }),
  ]

  it('按菜单树渲染三级菜单并正确拼接路径', () => {
    const wrapper = mountMenu({ menuTree: tree })

    expect(wrapper.findAll('.submenu-stub')).toHaveLength(2)
    expect(wrapper.find('[data-index="/system"]').exists()).toBe(true)
    expect(wrapper.find('[data-index="/roles"]').exists()).toBe(true)
    // 二级单段路径沿用 resolvePath 的根路径行为
    expect(wrapper.find('[data-index="/users"]').text()).toContain('用户管理')
    expect(wrapper.find('[data-index="/system/roles/list"]').text()).toContain('角色列表')
    expect(wrapper.find('[data-index="/dashboard"]').text()).toContain('看板管理')
  })

  it('图标名称未知时仍能渲染（回退 DataBoard）', () => {
    const wrapper = mountMenu({
      menuTree: [makeNode({ name: '未知图标', path: '/x', icon: 'NotExists' })],
    })
    expect(wrapper.find('[data-index="/x"]').text()).toContain('未知图标')
  })
})

describe('SidebarMenu 交互与抽屉状态', () => {
  it('选择菜单时抛出 select 事件', () => {
    const wrapper = mountMenu()

    wrapper.findComponent(ElMenuStub).vm.$emit('select', '/dashboard')

    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('移动端展开时附加 is-mobile/is-open 类', () => {
    const wrapper = mountMenu({ isMobile: true, asideVisible: true })

    expect(wrapper.find('.layout-aside').classes()).toContain('is-mobile')
    expect(wrapper.find('.layout-aside').classes()).toContain('is-open')
  })

  it('桌面端不附加抽屉类', () => {
    const wrapper = mountMenu({ isMobile: false, asideVisible: false })

    expect(wrapper.find('.layout-aside').classes()).not.toContain('is-open')
  })
})
