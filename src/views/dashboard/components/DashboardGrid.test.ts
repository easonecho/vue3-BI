import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Dashboard } from '@/api/types'
import DashboardGrid from './DashboardGrid.vue'

const cardStub = {
  name: 'DashboardCard',
  props: ['item', 'index', 'favorited'],
  emits: ['preview', 'edit', 'toggle-favorite', 'command'],
  template: '<div class="card-stub" />',
}

const stubs = {
  DashboardCard: cardStub,
  'el-row': { template: '<div class="row-stub"><slot /></div>' },
  'el-col': { template: '<div class="col-stub"><slot /></div>' },
  'el-empty': {
    props: ['description'],
    template: '<div class="empty-stub">{{ description }}<slot /></div>',
  },
  'el-button': { template: '<button class="create-btn"><slot /></button>' },
}

const directives = {
  loading: { mounted: () => {} },
}

function makeDashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    id: 1,
    name: '销售看板',
    status: 1,
    isPublic: true,
    favorites: null,
    ...overrides,
  }
}

function mountGrid(props: { items?: Dashboard[]; loading?: boolean }) {
  return mount(DashboardGrid, {
    props: {
      items: props.items ?? [],
      loading: props.loading ?? false,
    },
    global: { stubs, directives },
  })
}

describe('DashboardGrid 卡片渲染', () => {
  it('按 items 渲染卡片并传入序号与收藏状态', () => {
    const wrapper = mountGrid({
      items: [
        makeDashboard({ id: 1, favorites: [{ id: -1 }] }),
        makeDashboard({ id: 2, favorites: null }),
      ],
    })
    const cards = wrapper.findAllComponents({ name: 'DashboardCard' })

    expect(cards).toHaveLength(2)
    expect(cards[0].props('index')).toBe(0)
    expect(cards[0].props('favorited')).toBe(true)
    expect(cards[1].props('index')).toBe(1)
    expect(cards[1].props('favorited')).toBe(false)
  })

  it('透传卡片的 preview/edit/toggle-favorite/command 事件', () => {
    const item = makeDashboard()
    const wrapper = mountGrid({ items: [item] })
    const card = wrapper.findComponent({ name: 'DashboardCard' })

    card.vm.$emit('preview', item.id)
    card.vm.$emit('edit', item.id)
    card.vm.$emit('toggle-favorite', item)
    card.vm.$emit('command', 'share', item)

    expect(wrapper.emitted('preview')?.[0]).toEqual([item.id])
    expect(wrapper.emitted('edit')?.[0]).toEqual([item.id])
    expect(wrapper.emitted('toggle-favorite')?.[0]).toEqual([item])
    expect(wrapper.emitted('command')?.[0]).toEqual(['share', item])
  })
})

describe('DashboardGrid 空状态', () => {
  it('非加载且列表为空时展示空状态并可触发新建', () => {
    const wrapper = mountGrid({ items: [], loading: false })

    expect(wrapper.find('.empty-stub').exists()).toBe(true)
    expect(wrapper.find('.empty-stub').text()).toContain('暂无看板')

    wrapper.find('.create-btn').trigger('click')
    expect(wrapper.emitted('create')).toHaveLength(1)
  })

  it('加载中或列表非空时隐藏空状态', () => {
    const loadingWrapper = mountGrid({ items: [], loading: true })
    expect(loadingWrapper.find('.empty-stub').exists()).toBe(false)

    const filledWrapper = mountGrid({ items: [makeDashboard()] })
    expect(filledWrapper.find('.empty-stub').exists()).toBe(false)
  })
})
