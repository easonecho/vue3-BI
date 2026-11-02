import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import DashboardCreateDialog from './DashboardCreateDialog.vue'
import type { DashboardTemplate } from '@/api/types'

const { pushMock, createMock, applyMock, moveGroupMock, listMock, messageMock } = vi.hoisted(() => ({
  pushMock: vi.fn<(path: string) => unknown>(),
  createMock: vi.fn<(data: Record<string, unknown>) => Promise<{ data: { id: number } }>>(),
  applyMock: vi.fn<(id: number, data: Record<string, unknown>) => Promise<{ data: { id: number } }>>(),
  moveGroupMock: vi.fn<(id: number, groupId: number) => Promise<unknown>>(),
  listMock: vi.fn<() => Promise<{ data: DashboardTemplate[] }>>(),
  messageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('@/api/dashboard', () => ({
  createDashboard: createMock,
  moveDashboardToGroup: moveGroupMock,
}))

vi.mock('@/api/dashboard-template', () => ({
  getDashboardTemplateList: listMock,
  applyTemplate: applyMock,
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMock,
}))

const DialogStub = defineComponent({
  name: 'ElDialog',
  props: ['modelValue', 'title'],
  emits: ['update:modelValue', 'open'],
  template: '<div class="dialog-stub" :data-title="title"><slot /><slot name="footer" /></div>',
})

const PickerStub = defineComponent({
  name: 'DashboardCreateTemplatePicker',
  props: ['templates', 'loading', 'selectedId'],
  emits: ['select', 'go-template-manage'],
  template: '<div class="picker-stub" :data-count="templates.length" />',
})

const FormStub = defineComponent({
  name: 'DashboardCreateInfoForm',
  props: ['name', 'description', 'groupId', 'isPublic', 'groups'],
  emits: ['submit', 'update:name', 'update:description', 'update:groupId', 'update:isPublic'],
  template: '<div class="form-stub" :data-name="name" />',
})

const stubs = {
  'el-dialog': DialogStub,
  'el-button': {
    name: 'ElButton',
    emits: ['click'],
    template: `<button class="btn-stub" @click="$emit('click')"><slot /></button>`,
  },
  DashboardCreateTemplatePicker: PickerStub,
  DashboardCreateInfoForm: FormStub,
}

const templates: DashboardTemplate[] = [
  {
    id: 3,
    name: '销售模板',
    description: '描述',
    category: 'sales',
    isPublic: true,
    isSystem: false,
    creatorId: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
]

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  vi.clearAllMocks()
  listMock.mockResolvedValue({ data: templates })
  createMock.mockResolvedValue({ data: { id: 7 } })
  applyMock.mockResolvedValue({ data: { id: 8 } })
  moveGroupMock.mockResolvedValue(undefined)
})

function mountDialog() {
  return mount(DashboardCreateDialog, {
    props: { modelValue: true, groups: [] },
    global: { stubs },
  })
}

function findButton(wrapper: ReturnType<typeof mountDialog>, text: string) {
  return wrapper.findAll('.btn-stub').find((button) => button.text() === text)
}

describe('DashboardCreateDialog 步骤切换', () => {
  it('打开时加载模板，选中模板后进入步骤 2 并预填名称', async () => {
    const wrapper = mountDialog()
    const dialog = wrapper.findComponent(DialogStub)

    expect(wrapper.find('.picker-stub').exists()).toBe(true)
    expect(dialog.attributes('data-title')).toBe('dashboard.createTitle')

    dialog.vm.$emit('open')
    await flush()
    expect(listMock).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(PickerStub).props('templates')).toEqual(templates)

    wrapper.findComponent(PickerStub).vm.$emit('select', 3)
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(PickerStub).props('selectedId')).toBe(3)

    await findButton(wrapper, 'common.next')!.trigger('click')
    expect(wrapper.find('.form-stub').exists()).toBe(true)
    expect(wrapper.findComponent(FormStub).props('name')).toBe('销售模板_dashboard.title')

    await findButton(wrapper, 'common.back')!.trigger('click')
    expect(wrapper.find('.picker-stub').exists()).toBe(true)
  })

  it('步骤 1 取消时关闭对话框', async () => {
    const wrapper = mountDialog()

    await findButton(wrapper, 'common.cancel')!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('跳转模板库通过选择器的 go-template-manage 透传', async () => {
    const wrapper = mountDialog()

    wrapper.findComponent(PickerStub).vm.$emit('go-template-manage')
    expect(pushMock).toHaveBeenCalledWith('/dashboard-templates')
  })
})

describe('DashboardCreateDialog 创建', () => {
  it('未选模板时创建空白看板并跳转编辑器', async () => {
    const wrapper = mountDialog()
    wrapper.findComponent(DialogStub).vm.$emit('open')
    await flush()
    await findButton(wrapper, 'common.next')!.trigger('click')

    const form = wrapper.findComponent(FormStub)
    form.vm.$emit('update:name', '新看板')
    form.vm.$emit('update:description', '看板描述')
    await wrapper.vm.$nextTick()

    await findButton(wrapper, 'dashboard.createAndEdit')!.trigger('click')
    await flush()

    expect(createMock).toHaveBeenCalledWith({
      name: '新看板',
      description: '看板描述',
      isPublic: false,
      groupId: undefined,
    })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(pushMock).toHaveBeenCalledWith('/bi-editor/7')
  })

  it('选中模板时调用 applyTemplate 创建', async () => {
    const wrapper = mountDialog()
    wrapper.findComponent(DialogStub).vm.$emit('open')
    await flush()

    wrapper.findComponent(PickerStub).vm.$emit('select', 3)
    await wrapper.vm.$nextTick()
    await findButton(wrapper, 'common.next')!.trigger('click')
    await findButton(wrapper, 'dashboard.createAndEdit')!.trigger('click')
    await flush()

    expect(applyMock).toHaveBeenCalledWith(3, {
      name: '销售模板_dashboard.title',
      description: undefined,
      isPublic: false,
    })
    expect(createMock).not.toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/bi-editor/8')
  })

  it('名称为空时提示且不创建', async () => {
    const wrapper = mountDialog()
    wrapper.findComponent(DialogStub).vm.$emit('open')
    await flush()
    await findButton(wrapper, 'common.next')!.trigger('click')

    wrapper.findComponent(FormStub).vm.$emit('update:name', '   ')
    await wrapper.vm.$nextTick()
    await findButton(wrapper, 'dashboard.createAndEdit')!.trigger('click')

    expect(messageMock.warning).toHaveBeenCalledWith('dashboard.nameRequired')
    expect(createMock).not.toHaveBeenCalled()
    expect(applyMock).not.toHaveBeenCalled()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
