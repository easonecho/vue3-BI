import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { DashboardTemplate, TemplateCategoryOption } from '@/api/dashboard-template'
import TemplateGrid from './TemplateGrid.vue'

const { t } = vi.hoisted(() => ({
  t: vi.fn((key: string) => {
    const dict: Record<string, string> = {
      'templateManage.category.sales': '销售',
      'templateManage.empty': '暂无模板',
      'templateManage.create': '新建模板',
    }
    return dict[key] ?? key
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t }),
}))

const cardStub = {
  name: 'TemplateCard',
  props: ['item', 'index', 'categoryText'],
  emits: ['apply', 'preview', 'edit', 'command'],
  template: '<div class="card-stub" />',
}

const stubs = {
  TemplateCard: cardStub,
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

function makeTemplate(overrides: Partial<DashboardTemplate> = {}): DashboardTemplate {
  return {
    id: 1,
    name: '模板 A',
    description: '描述 A',
    category: 'sales',
    isPublic: true,
    isSystem: false,
    creatorId: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  }
}

const categoryOptions: TemplateCategoryOption[] = [
  { value: 'sales', label: '销售', i18nKey: 'templateManage.category.sales' },
]

function mountGrid(props: {
  items?: DashboardTemplate[]
  loading?: boolean
  empty?: boolean
  categoryOptions?: TemplateCategoryOption[]
}) {
  return mount(TemplateGrid, {
    props: {
      items: props.items ?? [],
      loading: props.loading ?? false,
      empty: props.empty ?? false,
      categoryOptions: props.categoryOptions ?? categoryOptions,
    },
    global: { stubs, directives },
  })
}

describe('TemplateGrid 卡片渲染', () => {
  it('按 items 渲染卡片并传入序号与本地化分类文案', () => {
    const items = [
      makeTemplate({ id: 1, category: 'sales' }),
      makeTemplate({ id: 2, category: 'inventory' }),
    ]
    const wrapper = mountGrid({ items })
    const cards = wrapper.findAllComponents({ name: 'TemplateCard' })

    expect(cards).toHaveLength(2)
    expect(cards[0].props('index')).toBe(0)
    expect(cards[0].props('categoryText')).toBe('销售')
    expect(cards[1].props('index')).toBe(1)
    expect(cards[1].props('categoryText')).toBe('inventory')
  })

  it('透传卡片的 apply/preview/edit/command 事件', () => {
    const item = makeTemplate()
    const wrapper = mountGrid({ items: [item] })
    const card = wrapper.findComponent({ name: 'TemplateCard' })

    card.vm.$emit('apply', item)
    card.vm.$emit('preview', item)
    card.vm.$emit('edit', item)
    card.vm.$emit('command', 'copy', item)

    expect(wrapper.emitted('apply')?.[0]).toEqual([item])
    expect(wrapper.emitted('preview')?.[0]).toEqual([item])
    expect(wrapper.emitted('edit')?.[0]).toEqual([item])
    expect(wrapper.emitted('command')?.[0]).toEqual(['copy', item])
  })
})

describe('TemplateGrid 空状态', () => {
  it('非加载且列表为空时展示空状态并可触发新建', () => {
    const wrapper = mountGrid({ items: [], loading: false, empty: true })

    expect(wrapper.find('.empty-stub').exists()).toBe(true)
    expect(wrapper.find('.empty-stub').text()).toContain('暂无模板')

    wrapper.find('.create-btn').trigger('click')
    expect(wrapper.emitted('create')).toHaveLength(1)
  })

  it('加载中或列表非空时隐藏空状态', () => {
    const loadingWrapper = mountGrid({ items: [], loading: true, empty: true })
    expect(loadingWrapper.find('.empty-stub').exists()).toBe(false)

    const filledWrapper = mountGrid({ items: [makeTemplate()], empty: false })
    expect(filledWrapper.find('.empty-stub').exists()).toBe(false)
  })
})
