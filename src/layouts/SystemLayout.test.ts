import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import SystemLayout from './SystemLayout.vue'
import type { MenuTreeNode } from '@/api/menu'

const { routeMock, routerMock, userStoreMock, menuStoreMock } = vi.hoisted(() => ({
  routeMock: { path: '/system/users' },
  routerMock: {
    push: vi.fn<(path: string) => unknown>(),
    replace: vi.fn<(path: string) => unknown>(),
  },
  userStoreMock: {
    userInfo: null as { nickname?: string | null; username?: string | null } | null,
    logout: vi.fn<() => Promise<void>>(),
  },
  menuStoreMock: {
    menuTree: [] as MenuTreeNode[],
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
  useRouter: () => routerMock,
}))

vi.mock('@/stores/user', () => ({
  useUserStore: () => userStoreMock,
}))

vi.mock('@/stores/menu', () => ({
  useMenuStore: () => menuStoreMock,
}))

const SidebarStub = defineComponent({
  name: 'SidebarMenu',
  props: ['menuTree', 'activeMenu', 'isMobile', 'asideVisible'],
  emits: ['select'],
  template: '<aside class="sidebar-stub" :data-open="asideVisible" />',
})

const HeaderStub = defineComponent({
  name: 'LayoutHeader',
  props: ['isMobile', 'asideVisible', 'breadcrumbs', 'clockText'],
  emits: ['toggle-aside', 'user-command'],
  template: '<header class="header-stub" />',
})

const stubs = {
  SidebarMenu: SidebarStub,
  LayoutHeader: HeaderStub,
  'router-view': { template: '<div class="router-view-stub" />' },
}

type MediaListener = (event: { matches: boolean }) => void

function stubMatchMedia(matches = true) {
  const listeners: MediaListener[] = []
  const media = {
    matches,
    addEventListener: vi.fn((type: string, cb: MediaListener) => {
      if (type === 'change') listeners.push(cb)
    }),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal('matchMedia', vi.fn(() => media as unknown as MediaQueryList))
  return { media, listeners }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

let media: ReturnType<typeof stubMatchMedia>['media']
let listeners: MediaListener[]

beforeEach(() => {
  vi.clearAllMocks()
  userStoreMock.logout.mockResolvedValue(undefined)
  menuStoreMock.menuTree = []
  const stub = stubMatchMedia(true)
  media = stub.media
  listeners = stub.listeners
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function mountLayout() {
  return mount(SystemLayout, { global: { stubs } })
}

describe('SystemLayout 组合', () => {
  it('向侧边栏与头部传递菜单树、当前路由与面包屑', async () => {
    menuStoreMock.menuTree = [{ id: 1, name: '用户管理', path: '/system/users' } as MenuTreeNode]
    const wrapper = mountLayout()
    await wrapper.vm.$nextTick()

    const sidebar = wrapper.findComponent(SidebarStub)
    const header = wrapper.findComponent(HeaderStub)

    expect(sidebar.props('menuTree')).toHaveLength(1)
    expect(sidebar.props('activeMenu')).toBe('/system/users')
    expect(header.props('isMobile')).toBe(true)
    expect(header.props('breadcrumbs')).toEqual([
      { title: '首页', path: '/dashboard' },
      { title: '用户管理', path: '/system/users' },
    ])
    expect(header.props('clockText')).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    wrapper.unmount()
  })

  it('移动端通过头部按钮开合抽屉遮罩', async () => {
    const wrapper = mountLayout()
    const header = wrapper.findComponent(HeaderStub)

    expect(wrapper.find('.layout-mask').exists()).toBe(false)

    header.vm.$emit('toggle-aside')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(SidebarStub).props('asideVisible')).toBe(true)
    expect(wrapper.find('.layout-mask').exists()).toBe(true)

    await wrapper.find('.layout-mask').trigger('click')
    expect(wrapper.findComponent(SidebarStub).props('asideVisible')).toBe(false)
    expect(wrapper.find('.layout-mask').exists()).toBe(false)
    wrapper.unmount()
  })

  it('选择菜单项后收起抽屉', async () => {
    const wrapper = mountLayout()
    const sidebar = wrapper.findComponent(SidebarStub)

    wrapper.findComponent(HeaderStub).vm.$emit('toggle-aside')
    await wrapper.vm.$nextTick()
    expect(sidebar.props('asideVisible')).toBe(true)

    sidebar.vm.$emit('select')
    await wrapper.vm.$nextTick()
    expect(sidebar.props('asideVisible')).toBe(false)
    wrapper.unmount()
  })

  it('退出移动端断点时同时收起抽屉', async () => {
    const wrapper = mountLayout()

    wrapper.findComponent(HeaderStub).vm.$emit('toggle-aside')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(SidebarStub).props('asideVisible')).toBe(true)

    listeners[0]({ matches: false })
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent(HeaderStub).props('isMobile')).toBe(false)
    expect(wrapper.findComponent(SidebarStub).props('asideVisible')).toBe(false)
    expect(wrapper.find('.layout-mask').exists()).toBe(false)
    wrapper.unmount()
  })

  it('卸载时移除媒体查询监听', () => {
    const wrapper = mountLayout()
    wrapper.unmount()
    expect(media.removeEventListener).toHaveBeenCalled()
  })
})

describe('SystemLayout 用户命令', () => {
  it('editor/screen 命令跳转对应页面', () => {
    const wrapper = mountLayout()
    const header = wrapper.findComponent(HeaderStub)

    header.vm.$emit('user-command', 'editor')
    header.vm.$emit('user-command', 'screen')

    expect(routerMock.push).toHaveBeenNthCalledWith(1, '/bi-editor')
    expect(routerMock.push).toHaveBeenNthCalledWith(2, '/screen/demo')
    wrapper.unmount()
  })

  it('logout 先退出登录再跳转登录页', async () => {
    const wrapper = mountLayout()

    wrapper.findComponent(HeaderStub).vm.$emit('user-command', 'logout')
    await flush()

    expect(userStoreMock.logout).toHaveBeenCalledTimes(1)
    expect(routerMock.replace).toHaveBeenCalledWith('/login')
    wrapper.unmount()
  })
})
