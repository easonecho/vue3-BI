import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { DashboardVersion } from '@/api/dashboard-version'
import DashboardVersionDetailDialog from './DashboardVersionDetailDialog.vue'

const ElDialogStub = defineComponent({
  name: 'ElDialog',
  props: ['modelValue', 'title'],
  emits: ['update:modelValue'],
  template: '<div class="dialog-stub" :data-title="title"><slot /><slot name="footer" /></div>',
})

const ElDescriptionsItemStub = defineComponent({
  props: ['label', 'span'],
  template: '<div class="desc-item-stub" :data-label="label"><slot /></div>',
})

const stubs = {
  'el-dialog': ElDialogStub,
  'el-descriptions': { template: '<div class="descriptions-stub"><slot /></div>' },
  'el-descriptions-item': ElDescriptionsItemStub,
  'el-icon': { template: '<span class="icon-stub"><slot /></span>' },
  'el-button': {
    emits: ['click'],
    template: `<button class="btn-stub" @click="$emit('click')"><slot /></button>`,
  },
}

const directives = {
  loading: { mounted: () => {} },
}

function makeVersion(overrides: Partial<DashboardVersion> = {}): DashboardVersion {
  return {
    id: 5,
    dashboardId: 9,
    versionNo: 3,
    name: '销售看板',
    remark: '季度改版',
    creatorId: 1,
    createdAt: '2024-01-02T03:04:05.000Z',
    snapshot: {
      name: '销售看板',
      description: null,
      layout: {
        components: [{ id: 1 }, { id: 2 }],
        canvas: { width: 800, height: 600 },
      },
      thumbnail: 'data:image/png;base64,abc',
      status: 1,
      isPublic: false,
      groupId: null,
      chartCount: 3,
      capturedAt: '2024-01-02T03:04:05.000Z',
    },
    ...overrides,
  }
}

function mountDialog(detail: DashboardVersion | null) {
  return mount(DashboardVersionDetailDialog, {
    props: { detail, loading: false, modelValue: true },
    global: { stubs, directives },
  })
}

describe('DashboardVersionDetailDialog 元信息', () => {
  it('展示版本号、名称、组件/图表数与画布尺寸', () => {
    const wrapper = mountDialog(makeVersion())
    const text = wrapper.text()

    expect(text).toContain('v3')
    expect(text).toContain('销售看板')
    expect(text).toContain('季度改版')
    expect(text).toContain('800 × 600')
    expect(wrapper.findAll('.desc-item-stub')).toHaveLength(7)
  })

  it('有 data URI 缩略图时渲染图片', () => {
    const wrapper = mountDialog(makeVersion())
    expect(wrapper.find('.detail-thumb img').exists()).toBe(true)
    expect(wrapper.find('.detail-thumb__empty').exists()).toBe(false)
  })

  it('无缩略图时展示占位', () => {
    const wrapper = mountDialog(
      makeVersion({
        snapshot: { ...makeVersion().snapshot!, thumbnail: null },
      }),
    )
    expect(wrapper.find('.detail-thumb__empty').text()).toContain('该版本无缩略图')
  })

  it('无详情时不渲染元信息与恢复按钮', () => {
    const wrapper = mountDialog(null)

    expect(wrapper.find('.descriptions-stub').exists()).toBe(false)
    expect(wrapper.findAll('.btn-stub').map((button) => button.text())).toEqual(['关闭'])
  })
})

describe('DashboardVersionDetailDialog 操作', () => {
  it('点击恢复此版本抛出 restore 事件', async () => {
    const wrapper = mountDialog(makeVersion())
    const restore = wrapper.findAll('.btn-stub').find((button) => button.text() === '恢复此版本')!

    await restore.trigger('click')
    expect(wrapper.emitted('restore')?.[0]?.[0]).toMatchObject({ id: 5, versionNo: 3 })
  })

  it('点击关闭关闭弹窗', async () => {
    const wrapper = mountDialog(makeVersion())

    await wrapper.findAll('.btn-stub')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})
