import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { DashboardVersion } from '@/api/dashboard-version'
import DashboardVersionDialog from './DashboardVersionDialog.vue'

const { listMock, detailMock, createMock, restoreMock, deleteMock, messageMock, confirmMock } =
  vi.hoisted(() => ({
    listMock:
      vi.fn<
        (
          id: number,
          params: { page?: number; pageSize?: number; keyword?: string },
        ) => Promise<{ data: { list: DashboardVersion[]; total: number } }>
      >(),
    detailMock: vi.fn<(id: number, versionId: number) => Promise<{ data: DashboardVersion }>>(),
    createMock: vi.fn<(id: number, remark?: string) => Promise<unknown>>(),
    restoreMock: vi.fn<(id: number, versionId: number) => Promise<{ data: { backupVersionNo: number } }>>(),
    deleteMock: vi.fn<(id: number, versionId: number) => Promise<unknown>>(),
    messageMock: {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    },
    confirmMock: vi.fn<(message: string, title: string, options: unknown) => Promise<unknown>>(),
  }))

vi.mock('@/api/dashboard-version', () => ({
  getDashboardVersions: listMock,
  getDashboardVersion: detailMock,
  createDashboardVersion: createMock,
  restoreDashboardVersion: restoreMock,
  deleteDashboardVersion: deleteMock,
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
  ElMessageBox: { confirm: confirmMock },
}))

const version: DashboardVersion = {
  id: 5,
  dashboardId: 9,
  versionNo: 2,
  name: '销售看板',
  remark: '改版前',
  creatorId: 1,
  createdAt: '2024-01-02T03:04:05.000Z',
}

const DialogStub = defineComponent({
  name: 'ElDialog',
  props: ['modelValue', 'title'],
  emits: ['update:modelValue', 'closed'],
  template: '<div class="dialog-stub" :data-title="title"><slot /><slot name="footer" /></div>',
})

const TableStub = defineComponent({
  name: 'DashboardVersionTable',
  props: ['versions', 'loading', 'total', 'pageSize', 'page'],
  emits: ['view', 'restore', 'delete', 'refresh', 'update:page'],
  template: '<div class="table-stub" :data-count="versions.length" :data-total="total" />',
})

const SaveStub = defineComponent({
  name: 'DashboardVersionSaveDialog',
  props: ['modelValue', 'saving', 'remark'],
  emits: ['update:modelValue', 'update:remark', 'save'],
  template: '<div class="save-stub" :data-open="modelValue" />',
})

const DetailStub = defineComponent({
  name: 'DashboardVersionDetailDialog',
  props: ['modelValue', 'detail', 'loading'],
  emits: ['update:modelValue', 'restore'],
  template: '<div class="detail-stub" :data-open="modelValue" :data-detail-id="detail && detail.id" />',
})

const ElInputStub = defineComponent({
  name: 'ElInput',
  props: ['modelValue'],
  emits: ['update:modelValue', 'keyup', 'clear'],
  template: `<input class="input-stub" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" @keyup="$emit('keyup', $event)" />`,
})

const stubs = {
  'el-dialog': DialogStub,
  'el-button': {
    emits: ['click'],
    template: `<button class="btn-stub" @click="$emit('click')"><slot /></button>`,
  },
  'el-input': ElInputStub,
  'el-icon': { template: '<i class="icon-stub"><slot /></i>' },
  DashboardVersionTable: TableStub,
  DashboardVersionSaveDialog: SaveStub,
  DashboardVersionDetailDialog: DetailStub,
}

const directives = {
  loading: { mounted: () => {} },
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  vi.clearAllMocks()
  listMock.mockResolvedValue({ data: { list: [version], total: 1 } })
  detailMock.mockResolvedValue({ data: { ...version } })
  createMock.mockResolvedValue({})
  restoreMock.mockResolvedValue({ data: { backupVersionNo: 3 } })
  deleteMock.mockResolvedValue({})
  confirmMock.mockResolvedValue(undefined)
})

function mountDialog(modelValue = false) {
  return mount(DashboardVersionDialog, {
    props: {
      modelValue,
      dashboard: { id: 9, name: '销售看板' },
    },
    global: { stubs, directives },
  })
}

function findButton(wrapper: ReturnType<typeof mountDialog>, text: string) {
  return wrapper.findAll('.btn-stub').find((button) => button.text().includes(text))
}

describe('DashboardVersionDialog 打开与列表', () => {
  it('打开弹窗时加载版本列表并传递表格数据', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()

    expect(listMock).toHaveBeenCalledWith(9, { page: 1, pageSize: 10, keyword: undefined })
    expect(wrapper.findComponent(TableStub).props('versions')).toEqual([version])
    expect(wrapper.find('.dialog-stub').attributes('data-title')).toBe('版本管理 - 销售看板')
  })

  it('表格刷新事件重新加载列表', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()
    listMock.mockClear()

    wrapper.findComponent(TableStub).vm.$emit('refresh')
    await flush()

    expect(listMock).toHaveBeenCalledTimes(1)
  })

  it('搜索关键字回到第一页并按关键字请求', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()
    listMock.mockClear()

    wrapper.findComponent(ElInputStub).vm.$emit('update:modelValue', '  改版  ')
    await wrapper.vm.$nextTick()
    wrapper.findComponent(ElInputStub).vm.$emit('keyup', { key: 'Enter' })
    await flush()

    expect(listMock).toHaveBeenCalledWith(9, { page: 1, pageSize: 10, keyword: '改版' })
  })

  it('关闭时清空列表与子弹窗状态', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()

    wrapper.findComponent(DialogStub).vm.$emit('closed')
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent(TableStub).props('versions')).toEqual([])
    expect(wrapper.findComponent(SaveStub).props('modelValue')).toBe(false)
    expect(wrapper.findComponent(DetailStub).props('modelValue')).toBe(false)
  })
})

describe('DashboardVersionDialog 保存与详情', () => {
  it('点击保存当前版本打开保存弹窗并提交备注', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()

    await findButton(wrapper, '保存当前版本')!.trigger('click')
    const save = wrapper.findComponent(SaveStub)
    expect(save.props('modelValue')).toBe(true)

    save.vm.$emit('update:remark', '  改版前  ')
    await wrapper.vm.$nextTick()
    save.vm.$emit('save')
    await flush()

    expect(createMock).toHaveBeenCalledWith(9, '改版前')
    expect(messageMock.success).toHaveBeenCalledWith('版本已保存')
    expect(wrapper.findComponent(SaveStub).props('modelValue')).toBe(false)
  })

  it('查看版本时加载详情并打开详情弹窗', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()

    wrapper.findComponent(TableStub).vm.$emit('view', version)
    await flush()

    expect(detailMock).toHaveBeenCalledWith(9, 5)
    expect(wrapper.findComponent(DetailStub).props('detail')).toEqual(version)
    expect(wrapper.findComponent(DetailStub).props('modelValue')).toBe(true)
  })
})

describe('DashboardVersionDialog 恢复与删除', () => {
  it('详情弹窗恢复成功后关闭并抛出 restored', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()

    wrapper.findComponent(TableStub).vm.$emit('restore', { ...version, versionNo: 2 })
    await flush()

    expect(confirmMock).toHaveBeenCalled()
    expect(restoreMock).toHaveBeenCalledWith(9, 5)
    expect(wrapper.emitted('restored')).toHaveLength(1)
    expect(wrapper.findComponent(DetailStub).props('modelValue')).toBe(false)
  })

  it('删除事件调用删除接口并刷新列表', async () => {
    const wrapper = mountDialog(false)
    await wrapper.setProps({ modelValue: true })
    await flush()
    listMock.mockClear()

    wrapper.findComponent(TableStub).vm.$emit('delete', version)
    await flush()

    expect(deleteMock).toHaveBeenCalledWith(9, 5)
    expect(listMock).toHaveBeenCalledTimes(1)
  })
})
