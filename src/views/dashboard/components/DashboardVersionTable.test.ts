import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { DashboardVersion } from '@/api/dashboard-version'
import DashboardVersionTable from './DashboardVersionTable.vue'

const fakeRow = {
  id: 9,
  versionNo: 2,
  name: '销售看板',
  remark: null,
  createdAt: '2024-01-02T03:04:05.000Z',
  creator: { nickname: '小明', username: 'ming' },
}

const ElTableColumnStub = defineComponent({
  name: 'ElTableColumn',
  props: ['label'],
  setup() {
    return { fakeRow }
  },
  template: '<div class="column-stub" :data-label="label"><slot :row="fakeRow" /></div>',
})

const ElPopconfirmStub = defineComponent({
  name: 'ElPopconfirm',
  emits: ['confirm'],
  template: `<div class="popconfirm-stub"><slot name="reference" /><button class="confirm-stub" @click="$emit('confirm')">确认</button></div>`,
})

const stubs = {
  'el-table': {
    name: 'ElTable',
    props: ['data'],
    template: '<div class="table-stub"><slot /></div>',
  },
  'el-table-column': ElTableColumnStub,
  'el-tag': { template: '<span class="tag-stub"><slot /></span>' },
  'el-button': {
    emits: ['click'],
    template: `<button class="btn-stub" @click="$emit('click')"><slot /></button>`,
  },
  'el-popconfirm': ElPopconfirmStub,
  'el-empty': {
    props: ['description'],
    template: '<div class="empty-stub">{{ description }}</div>',
  },
  'el-pagination': {
    props: ['currentPage', 'pageSize', 'total'],
    emits: ['update:current-page', 'current-change'],
    template: '<div class="pager-stub"><button class="page-next" @click="$emit(\'current-change\', 2)" /></div>',
  },
}

const directives = {
  loading: { mounted: () => {} },
}

function makeVersion(overrides: Partial<DashboardVersion> = {}): DashboardVersion {
  return {
    id: 9,
    dashboardId: 1,
    versionNo: 2,
    name: '销售看板',
    remark: null,
    creatorId: 1,
    createdAt: '2024-01-02T03:04:05.000Z',
    ...overrides,
  }
}

function mountTable(props: {
  versions?: DashboardVersion[]
  loading?: boolean
  total?: number
  pageSize?: number
} = {}) {
  return mount(DashboardVersionTable, {
    props: {
      versions: props.versions ?? [],
      loading: props.loading ?? false,
      total: props.total ?? 0,
      pageSize: props.pageSize ?? 10,
      page: 1,
    },
    global: { stubs, directives },
  })
}

describe('DashboardVersionTable 列表', () => {
  it('渲染表格数据（版本号/创建人/时间）', () => {
    const wrapper = mountTable({ versions: [makeVersion()] })
    const text = wrapper.text()

    expect(wrapper.findComponent({ name: 'el-table' }).props('data')).toHaveLength(1)
    expect(text).toContain('v2')
    expect(text).toContain('小明')
    expect(text).not.toContain('暂无版本快照')
  })

  it('无数据且非加载时展示空状态', () => {
    const wrapper = mountTable({ versions: [], loading: false })
    expect(wrapper.find('.empty-stub').text()).toContain('暂无版本快照')
  })

  it('加载中不展示空状态', () => {
    const wrapper = mountTable({ versions: [], loading: true })
    expect(wrapper.find('.empty-stub').exists()).toBe(false)
  })
})

describe('DashboardVersionTable 操作', () => {
  it('点击查看/恢复抛出对应事件', async () => {
    const wrapper = mountTable({ versions: [makeVersion()] })
    const buttons = wrapper.findAll('.btn-stub')
    const view = buttons.find((button) => button.text() === '查看')!
    const restore = buttons.find((button) => button.text() === '恢复')!

    await view.trigger('click')
    await restore.trigger('click')

    expect(wrapper.emitted('view')?.[0]?.[0]).toMatchObject({ id: 9, versionNo: 2 })
    expect(wrapper.emitted('restore')?.[0]?.[0]).toMatchObject({ id: 9 })
  })

  it('删除确认后抛出 delete 事件', async () => {
    const wrapper = mountTable({ versions: [makeVersion()] })

    await wrapper.find('.confirm-stub').trigger('click')

    expect(wrapper.emitted('delete')?.[0]?.[0]).toMatchObject({ id: 9 })
  })
})

describe('DashboardVersionTable 分页', () => {
  it('总数超过每页条数时展示分页并可刷新', async () => {
    const wrapper = mountTable({ versions: [makeVersion()], total: 25, pageSize: 10 })

    expect(wrapper.find('.pager-stub').exists()).toBe(true)
    await wrapper.find('.page-next').trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })

  it('总数不超过每页条数时隐藏分页', () => {
    const wrapper = mountTable({ versions: [makeVersion()], total: 10, pageSize: 10 })
    expect(wrapper.find('.pager-stub').exists()).toBe(false)
  })
})
