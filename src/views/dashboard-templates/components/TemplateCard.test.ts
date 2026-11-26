import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TemplateCard from './TemplateCard.vue'
import type { DashboardTemplate } from '@/api/dashboard-template'

const item: DashboardTemplate = {
  id: 1,
  name: '销售模板',
  description: '示例模板',
  layout: null,
  thumbnail: null,
  category: 'sales',
  isPublic: true,
  isSystem: false,
  creatorId: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function mountCard() {
  return mount(TemplateCard, {
    props: { item, index: 0, categoryText: '销售' },
    global: {
      stubs: {
        'el-dropdown': true,
        'el-tag': true,
        'el-icon': true,
        'el-button': true,
      },
    },
  })
}

describe('TemplateCard 缩略图无障碍', () => {
  it('缩略图可聚焦并带按钮语义', () => {
    const thumb = mountCard().find('.tpl-thumb')

    expect(thumb.attributes('role')).toBe('button')
    expect(thumb.attributes('tabindex')).toBe('0')
    expect(thumb.attributes('aria-label')).toBe('预览')
  })

  it('点击、Enter、Space 均可触发预览', async () => {
    const wrapper = mountCard()
    const thumb = wrapper.find('.tpl-thumb')

    await thumb.trigger('click')
    await thumb.trigger('keydown', { key: 'Enter' })
    await thumb.trigger('keydown', { key: ' ' })

    expect(wrapper.emitted('preview')).toHaveLength(3)
  })
})
