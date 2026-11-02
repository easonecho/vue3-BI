import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { DashboardGroup } from '@/api/types'
import DashboardFilterBar from './DashboardFilterBar.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const stubs = {
  'el-input': {
    name: 'ElInput',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="input-stub" />',
  },
  'el-select': {
    name: 'ElSelect',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="select-stub"><slot /></div>',
  },
  'el-option': {
    name: 'ElOption',
    props: ['label', 'value'],
    template: '<div class="option-stub" />',
  },
  'el-button': {
    name: 'ElButton',
    props: ['type'],
    template: '<button class="btn-stub"><slot /></button>',
  },
  'el-icon': { template: '<span><slot /></span>' },
}

const groups: DashboardGroup[] = [
  {
    id: 1,
    name: '默认分组',
    sort: 0,
    creatorId: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
]

function mountFilterBar(overrides: { onlyFavorites?: boolean } = {}) {
  return mount(DashboardFilterBar, {
    props: {
      keyword: '',
      status: undefined,
      isPublic: undefined,
      onlyFavorites: overrides.onlyFavorites ?? false,
      groupFilter: undefined,
      groups,
    },
    global: { stubs },
  })
}

describe('DashboardFilterBar 按钮事件', () => {
  it('查询/重置/收藏筛选/分组管理/新建分别抛事件', () => {
    const wrapper = mountFilterBar()
    const buttons = wrapper.findAll('.btn-stub')

    buttons[0].trigger('click')
    buttons[1].trigger('click')
    buttons[2].trigger('click')
    buttons[3].trigger('click')
    buttons[4].trigger('click')

    expect(wrapper.emitted('search')).toHaveLength(1)
    expect(wrapper.emitted('reset')).toHaveLength(1)
    expect(wrapper.emitted('toggle-favorites')).toHaveLength(1)
    expect(wrapper.emitted('group-manage')).toHaveLength(1)
    expect(wrapper.emitted('create')).toHaveLength(1)
  })
})

describe('DashboardFilterBar 双向绑定', () => {
  it('输入与下拉更新抛出对应的 v-model 事件', () => {
    const wrapper = mountFilterBar()
    const selects = wrapper.findAllComponents({ name: 'ElSelect' })

    wrapper.findComponent({ name: 'ElInput' }).vm.$emit('update:modelValue', '销售')
    selects[0].vm.$emit('update:modelValue', 1)
    selects[1].vm.$emit('update:modelValue', false)
    selects[2].vm.$emit('update:modelValue', 'ungrouped')

    expect(wrapper.emitted('update:keyword')?.[0]).toEqual(['销售'])
    expect(wrapper.emitted('update:status')?.[0]).toEqual([1])
    expect(wrapper.emitted('update:isPublic')?.[0]).toEqual([false])
    expect(wrapper.emitted('update:groupFilter')?.[0]).toEqual(['ungrouped'])
  })

  it('仅看收藏时按钮使用 warning 类型', () => {
    const wrapper = mountFilterBar({ onlyFavorites: true })
    const buttons = wrapper.findAllComponents({ name: 'ElButton' })

    expect(buttons[2].props('type')).toBe('warning')
    expect(mountFilterBar().findAllComponents({ name: 'ElButton' })[2].props('type')).toBe(
      'default',
    )
  })
})
