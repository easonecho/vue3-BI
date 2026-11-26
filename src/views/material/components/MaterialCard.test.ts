import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MaterialCard from './MaterialCard.vue'
import type { Material } from '@/api/material'

const material: Material = {
  id: 1,
  name: '背景图',
  type: 'image',
  fileName: 'bg.png',
  originalName: 'bg.png',
  mimeType: 'image/png',
  size: 1024,
  url: '/materials/bg.png',
  thumbnail: null,
  width: 1920,
  height: 1080,
  description: null,
  creatorId: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function mountCard() {
  return mount(MaterialCard, {
    props: { material },
    global: {
      stubs: {
        'el-icon': true,
        'el-tag': true,
        'el-button': true,
        'el-popconfirm': true,
      },
    },
  })
}

describe('MaterialCard 缩略图无障碍', () => {
  it('缩略图使用按钮元素并带无障碍名称', () => {
    const thumb = mountCard().find('.card-thumb')

    expect(thumb.element.tagName).toBe('BUTTON')
    expect(thumb.attributes('type')).toBe('button')
    expect(thumb.attributes('aria-label')).toBe('预览')
  })

  it('点击缩略图触发预览', async () => {
    const wrapper = mountCard()
    await wrapper.find('.card-thumb').trigger('click')

    expect(wrapper.emitted('preview')?.[0]).toEqual([material])
  })
})
