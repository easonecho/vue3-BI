import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import LayoutHeader from './LayoutHeader.vue'
import type { BreadcrumbItem } from '../layout-menu-utils'

const { userStoreMock } = vi.hoisted(() => ({
  userStoreMock: {
    userInfo: null as { nickname?: string | null; username?: string | null; avatar?: string | null } | null,
  },
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('@/stores/user', () => ({
  useUserStore: () => userStoreMock,
}))

// ThemeSwitcher/LangSwitcher 依赖 @/i18n（内部调用 createI18n），此处直接替换组件
vi.mock('@/components/ThemeSwitcher.vue', () => ({
  default: { template: '<i class="theme-stub" />' },
}))

vi.mock('@/components/LangSwitcher.vue', () => ({
  default: { template: '<i class="lang-stub" />' },
}))

const ElDropdownStub = defineComponent({
  name: 'ElDropdown',
  emits: ['command'],
  template: '<div class="dropdown-stub"><slot /><slot name="dropdown" /></div>',
})

const ElButtonStub = defineComponent({
  name: 'ElButton',
  emits: ['click'],
  template: `<button class="btn-stub" @click="$emit('click')"><slot /></button>`,
})

const ElBreadcrumbItemStub = defineComponent({
  props: ['to'],
  template: '<span class="crumb-stub" :data-to="to"><slot /></span>',
})

const stubs = {
  'el-button': ElButtonStub,
  'el-breadcrumb': { template: '<div class="breadcrumb-stub"><slot /></div>' },
  'el-breadcrumb-item': ElBreadcrumbItemStub,
  'el-dropdown': ElDropdownStub,
  'el-dropdown-menu': { template: '<div class="dropdown-menu-stub"><slot /></div>' },
  'el-dropdown-item': {
    props: ['command'],
    template: '<div class="dropdown-item-stub" :data-command="command"><slot /></div>',
  },
  'el-avatar': { template: '<span class="avatar-stub"><slot /></span>' },
  'el-icon': { template: '<span class="icon-stub"><slot /></span>' },
}

const crumbs: BreadcrumbItem[] = [
  { title: '首页', path: '/dashboard' },
  { title: '用户管理', path: '/system/users' },
]

function mountHeader(
  props: {
    isMobile?: boolean
    asideVisible?: boolean
    breadcrumbs?: BreadcrumbItem[]
    clockText?: string
  } = {},
) {
  return mount(LayoutHeader, {
    props: {
      isMobile: props.isMobile ?? false,
      asideVisible: props.asideVisible ?? false,
      breadcrumbs: props.breadcrumbs ?? crumbs,
      clockText: props.clockText ?? '12:34:56',
    },
    global: { stubs },
  })
}

beforeEach(() => {
  userStoreMock.userInfo = { nickname: '小明', username: 'ming', avatar: 'avatar.png' }
})

describe('LayoutHeader 用户信息与时钟', () => {
  it('桌面端展示时钟与用户昵称', () => {
    const wrapper = mountHeader()

    expect(wrapper.find('.clock-text').text()).toBe('12:34:56')
    expect(wrapper.find('.user-name').text()).toBe('小明')
    expect(wrapper.find('.avatar-stub').text()).toContain('小')
    expect(wrapper.find('.menu-toggle').exists()).toBe(false)
  })

  it('移动端隐藏时钟并展示菜单开关', () => {
    const wrapper = mountHeader({ isMobile: true, asideVisible: true })

    expect(wrapper.find('.clock-area').exists()).toBe(false)
    expect(wrapper.find('.btn-stub').exists()).toBe(true)
    expect(wrapper.find('.btn-stub').attributes('aria-label')).toBe('收起菜单')
  })

  it('无昵称时展示用户名，二者都为空时回退文案', () => {
    userStoreMock.userInfo = { username: 'ming' }
    const byName = mountHeader()
    expect(byName.find('.user-name').text()).toBe('ming')

    userStoreMock.userInfo = null
    const fallback = mountHeader()
    expect(fallback.find('.user-name').text()).toBe('layout.user')
    expect(fallback.find('.avatar-stub').text()).toContain('U')
  })
})

describe('LayoutHeader 面包屑与交互', () => {
  it('最后一级面包屑不添加跳转链接', () => {
    const wrapper = mountHeader()
    const items = wrapper.findAll('.crumb-stub')

    expect(items).toHaveLength(2)
    expect(items[0].attributes('data-to')).toBe('/dashboard')
    expect(items[1].attributes('data-to')).toBeUndefined()
    expect(items[1].text()).toBe('用户管理')
  })

  it('点击移动端菜单按钮抛出 toggle-aside', async () => {
    const wrapper = mountHeader({ isMobile: true })

    await wrapper.find('.btn-stub').trigger('click')
    expect(wrapper.emitted('toggle-aside')).toHaveLength(1)
  })

  it('用户下拉命令透传为 user-command', () => {
    const wrapper = mountHeader()

    wrapper.findComponent(ElDropdownStub).vm.$emit('command', 'logout')
    expect(wrapper.emitted('user-command')?.[0]).toEqual(['logout'])
  })

  it('下拉菜单包含进入编辑器/数据大屏/退出登录', () => {
    const wrapper = mountHeader()
    const commands = wrapper.findAll('.dropdown-item-stub').map((item) => item.attributes('data-command'))

    expect(commands).toEqual(['editor', 'screen', 'logout'])
  })
})
