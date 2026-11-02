import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { DashboardTemplate } from '@/api/types'
import DashboardCreateTemplatePicker from './DashboardCreateTemplatePicker.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const stubs = {
  'el-tabs': { template: '<div class="tabs-stub"><slot /></div>' },
  'el-tab-pane': { template: '<div class="tab-pane-stub"><slot /></div>' },
  'el-row': { template: '<div class="row-stub"><slot /></div>' },
  'el-col': { template: '<div class="col-stub"><slot /></div>' },
  'el-icon': { template: '<span class="icon-stub"><slot /></span>' },
  'el-tag': { template: '<span class="tag-stub"><slot /></span>' },
  'el-empty': {
    props: ['description'],
    template: '<div class="empty-stub">{{ description }}<slot /></div>',
  },
  'el-button': { template: '<button class="btn-stub"><slot /></button>' },
}

const directives = {
  loading: { mounted: () => {} },
}

function makeTemplate(overrides: Partial<DashboardTemplate> = {}): DashboardTemplate {
  return {
    id: 1,
    name: '销售模板',
    description: '模板描述',
    category: 'sales',
    isPublic: true,
    isSystem: false,
    creatorId: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  }
}

function mountPicker(props: {
  templates?: DashboardTemplate[]
  loading?: boolean
  selectedId?: number | null
} = {}) {
  return mount(DashboardCreateTemplatePicker, {
    props: {
      templates: props.templates ?? [],
      loading: props.loading ?? false,
      selectedId: props.selectedId ?? null,
    },
    global: { stubs, directives },
  })
}

describe('DashboardCreateTemplatePicker 卡片', () => {
  it('按模板列表渲染卡片并展示名称/描述/分类', () => {
    const wrapper = mountPicker({
      templates: [
        makeTemplate({ id: 1, name: '销售模板', category: 'sales' }),
        makeTemplate({ id: 2, name: '空白模板', category: null }),
      ],
    })

    const cards = wrapper.findAll('.tpl-picker-card')
    expect(cards).toHaveLength(2)
    expect(cards[0].find('.tpl-picker-name').text()).toBe('销售模板')
    expect(cards[0].find('.tpl-picker-desc').text()).toBe('模板描述')
    expect(cards[0].find('.tag-stub').text()).toBe('sales')
  })

  it('选中模板时添加 active 类与选中徽标', () => {
    const wrapper = mountPicker({ templates: [makeTemplate({ id: 3 })], selectedId: 3 })

    expect(wrapper.find('.tpl-picker-card').classes()).toContain('active')
    expect(wrapper.find('.selected-badge').exists()).toBe(true)
  })

  it('点击卡片抛出 select 事件', async () => {
    const wrapper = mountPicker({ templates: [makeTemplate({ id: 3 }), makeTemplate({ id: 4 })] })

    await wrapper.findAll('.tpl-picker-card')[1].trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([4])
  })

  it('data URI 缩略图使用 img 渲染，其余显示占位', () => {
    const wrapper = mountPicker({
      templates: [
        makeTemplate({ id: 1, thumbnail: 'data:image/png;base64,abc' }),
        makeTemplate({ id: 2, thumbnail: '📊' }),
      ],
    })

    expect(wrapper.find('.thumb-img').exists()).toBe(true)
    expect(wrapper.findAll('.thumb-placeholder')).toHaveLength(1)
    expect(wrapper.find('.thumb-placeholder').text()).toContain('📊')
  })
})

describe('DashboardCreateTemplatePicker 空状态', () => {
  it('非加载且列表为空时展示空状态并可跳转模板库', async () => {
    const wrapper = mountPicker({ templates: [], loading: false })

    expect(wrapper.find('.empty-stub').text()).toContain('dashboard.noUserTemplates')
    await wrapper.find('.btn-stub').trigger('click')
    expect(wrapper.emitted('go-template-manage')).toHaveLength(1)
  })

  it('加载中不展示空状态', () => {
    const wrapper = mountPicker({ templates: [], loading: true })
    expect(wrapper.find('.empty-stub').exists()).toBe(false)
  })
})
