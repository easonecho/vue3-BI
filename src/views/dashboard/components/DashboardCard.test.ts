import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Dashboard } from '@/api/types'
import DashboardCard from './DashboardCard.vue'

const stubs = {
  'el-icon': { template: '<span class="icon-stub"><slot /></span>' },
  'el-button': { props: ['size', 'type'], template: '<button><slot /></button>' },
  'el-tooltip': { template: '<span><slot /></span>' },
  'el-dropdown': { template: '<div><slot /></div>' },
  'el-dropdown-menu': { template: '<div><slot /></div>' },
  'el-dropdown-item': { template: '<div><slot /></div>' },
  'el-tag': { template: '<span><slot /></span>' },
}

const item = {
  id: 7,
  name: '销售看板',
  description: '季度销售概览',
  isPublic: true,
  status: 1,
  thumbnail: '',
  _count: { charts: 3 },
} as unknown as Dashboard

function mountCard(overrides: { favorited?: boolean } = {}) {
  return mount(DashboardCard, {
    props: {
      item,
      index: 0,
      favorited: overrides.favorited ?? false,
    },
    global: { stubs },
  })
}

describe('DashboardCard 可访问性', () => {
  it('缩略图区域可通过键盘触发预览', async () => {
    const wrapper = mountCard()
    const thumb = wrapper.find('.card-thumb')

    expect(thumb.attributes('role')).toBe('button')
    expect(thumb.attributes('tabindex')).toBe('0')
    expect(thumb.attributes('aria-label')).toBe('预览看板 销售看板')

    await thumb.trigger('keydown', { key: 'Enter' })
    await thumb.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('preview')).toEqual([[7], [7]])
  })

  it('收藏按钮为原生按钮并暴露选中状态', async () => {
    const wrapper = mountCard({ favorited: false })
    const favorite = wrapper.find('.favorite-btn')

    expect(favorite.element.tagName).toBe('BUTTON')
    expect(favorite.attributes('aria-label')).toBe('收藏')
    expect(favorite.attributes('aria-pressed')).toBe('false')

    await favorite.trigger('click')
    expect(wrapper.emitted('toggle-favorite')?.[0]?.[0]).toEqual(item)
  })

  it('已收藏时按钮名称与 aria-pressed 同步', () => {
    const wrapper = mountCard({ favorited: true })
    const favorite = wrapper.find('.favorite-btn')

    expect(favorite.attributes('aria-label')).toBe('取消收藏')
    expect(favorite.attributes('aria-pressed')).toBe('true')
  })

  it('更多操作按钮提供可访问名称', () => {
    const wrapper = mountCard()
    const more = wrapper.find('.more-btn')

    expect(more.element.tagName).toBe('BUTTON')
    expect(more.attributes('aria-label')).toBe('更多操作')
    expect(more.attributes('aria-haspopup')).toBe('menu')
  })
})
