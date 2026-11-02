import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { useHeaderDocumentActions } from './useHeaderDocumentActions'
import type { useBiEditorStore } from '@/stores/bi-editor'
import type { DashboardLayout } from '@/views/bi-editor/types'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

const { ElMessageMock, confirmMock } = vi.hoisted(() => ({
  ElMessageMock: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
  confirmMock: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: ElMessageMock,
  ElMessageBox: { confirm: confirmMock },
}))

interface StoreOptions {
  isTemplateMode?: boolean
  isDirty?: boolean
  currentDashboardId?: number | null
  currentTemplateId?: number | null
  dashboardName?: string
  saveDashboard?: () => Promise<void>
}

function makeStore(options: StoreOptions = {}) {
  const store = {
    isTemplateMode: options.isTemplateMode ?? false,
    isDirty: options.isDirty ?? false,
    currentDashboardId: options.currentDashboardId ?? null,
    currentTemplateId: options.currentTemplateId ?? null,
    dashboardName: options.dashboardName ?? '看板',
    components: [],
    saveDashboard: vi.fn(options.saveDashboard ?? (async () => {})),
    setDashboardId: vi.fn((id: number | null) => { store.currentDashboardId = id }),
    setDashboardName: vi.fn((name: string) => { store.dashboardName = name }),
    serializeLayout: vi.fn(() => ({
      version: '1.0',
      canvas: {},
      components: [],
      guides: [],
    })),
    applyLayout: vi.fn(),
  }
  return { store: store as unknown as BiEditorStore, raw: store }
}

function makeRouter() {
  return { replace: vi.fn(), push: vi.fn() } as unknown as Router
}

function makeRoute(id?: string) {
  return { params: id == null ? {} : { id } } as unknown as RouteLocationNormalizedLoaded
}

const openTemplateDialog = vi.fn()

function setup(options: StoreOptions = {}, routeId?: string) {
  const { store, raw } = makeStore(options)
  const router = makeRouter()
  const api = useHeaderDocumentActions({
    store,
    route: makeRoute(routeId),
    router,
    openTemplateDialog,
  })
  return { api, raw, router }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useHeaderDocumentActions 保存', () => {
  it('模板模式打开元数据对话框，不直接保存', async () => {
    const { api, raw } = setup({ isTemplateMode: true })
    await api.handleSave()
    expect(openTemplateDialog).toHaveBeenCalledTimes(1)
    expect(raw.saveDashboard).not.toHaveBeenCalled()
  })

  it('新建看板保存后用 replace 补上 URL id', async () => {
    const { api, raw, router } = setup({
      currentDashboardId: null,
      saveDashboard: async () => { raw.currentDashboardId = 5 },
    })
    await api.handleSave()
    expect(raw.saveDashboard).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/bi-editor/5')
  })

  it('已有 id 路由保存后不重复 replace', async () => {
    const { api, raw, router } = setup(
      { currentDashboardId: 3, saveDashboard: async () => { raw.currentDashboardId = 3 } },
      '3',
    )
    await api.handleSave()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('保存失败时吞掉异常，不打断交互', async () => {
    const { api, router } = setup({
      saveDashboard: async () => { throw new Error('boom') },
    })
    await expect(api.handleSave()).resolves.toBeUndefined()
    expect(router.replace).not.toHaveBeenCalled()
  })
})

describe('useHeaderDocumentActions 另存为', () => {
  it('重置 id、追加副本名，保存后跳转新看板', async () => {
    const { api, raw, router } = setup({
      currentDashboardId: 3,
      dashboardName: '销售看板',
      saveDashboard: async () => { raw.currentDashboardId = 9 },
    })
    await api.handleSaveAs()
    expect(raw.setDashboardId).toHaveBeenCalledWith(null)
    expect(raw.setDashboardName).toHaveBeenCalledWith('销售看板 的副本')
    expect(router.replace).toHaveBeenCalledWith('/bi-editor/9')
    expect(ElMessageMock.success).toHaveBeenCalled()
  })

  it('模板模式直接忽略', async () => {
    const { api, raw, router } = setup({ isTemplateMode: true })
    await api.handleSaveAs()
    expect(raw.setDashboardId).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('未命名看板使用默认副本名', async () => {
    const { api, raw } = setup({
      dashboardName: '',
      saveDashboard: async () => { raw.currentDashboardId = 10 },
    })
    await api.handleSaveAs()
    expect(raw.setDashboardName).toHaveBeenCalledWith('未命名看板 的副本')
  })
})

describe('useHeaderDocumentActions 预览', () => {
  it('未保存时提示先保存，不跳转', () => {
    const { api, router } = setup({ currentDashboardId: null })
    api.handlePreview()
    expect(ElMessageMock.warning).toHaveBeenCalledWith('请先保存看板后再预览')
    expect(router.push).not.toHaveBeenCalled()
  })

  it('有未保存改动时提示但允许预览', () => {
    const { api, router } = setup({ currentDashboardId: 7, isDirty: true })
    api.handlePreview()
    expect(ElMessageMock.info).toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith('/preview/7')
  })

  it('无改动时直接预览', () => {
    const { api, router } = setup({ currentDashboardId: 7 })
    api.handlePreview()
    expect(ElMessageMock.info).not.toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith('/preview/7')
  })
})

describe('useHeaderDocumentActions 布局 JSON 导入', () => {
  function fileEvent(content: string, name = 'layout.json') {
    const input = { value: 'C:\\fakepath\\layout.json', files: [{ name, text: async () => content }] }
    return { target: input } as unknown as Event
  }

  it('确认后导入合法布局，并重置为未保存的新看板', async () => {
    confirmMock.mockResolvedValue('confirm')
    const { api, raw } = setup({ dashboardName: '看板' })
    await api.onImportJsonFile(fileEvent(JSON.stringify({
      version: '1.0',
      canvas: { width: 1920 },
      components: [],
      guides: [],
    })))
    expect(raw.applyLayout).toHaveBeenCalled()
    expect(raw.setDashboardId).toHaveBeenCalledWith(null)
    expect(raw.setDashboardName).toHaveBeenCalledWith('看板（已导入）')
    expect(ElMessageMock.success).toHaveBeenCalled()
  })

  it('取消导入时不做任何修改', async () => {
    confirmMock.mockRejectedValue('cancel')
    const { api, raw } = setup()
    await api.onImportJsonFile(fileEvent('{}'))
    expect(raw.applyLayout).not.toHaveBeenCalled()
  })

  it('非法结构提示导入失败', async () => {
    confirmMock.mockResolvedValue('confirm')
    const { api, raw } = setup()
    await api.onImportJsonFile(fileEvent(JSON.stringify({ foo: 'bar' })))
    expect(raw.applyLayout).not.toHaveBeenCalled()
    expect(ElMessageMock.error).toHaveBeenCalledWith('导入失败：JSON 结构非法')
  })

  it('JSON 解析错误提示解析失败', async () => {
    confirmMock.mockResolvedValue('confirm')
    const { api, raw } = setup()
    await api.onImportJsonFile(fileEvent('{bad json'))
    expect(raw.applyLayout).not.toHaveBeenCalled()
    expect(ElMessageMock.error).toHaveBeenCalled()
  })
})

describe('useHeaderDocumentActions 布局 JSON 导出', () => {
  it('下载 JSON 文件并提示成功', () => {
    const createObjectURL = vi.fn(() => 'blob:mock')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const { api, raw } = setup({ dashboardName: '销售/看板' })
    api.handleExportJson()
    expect(raw.serializeLayout).toHaveBeenCalled()
    expect(createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalled()
    const layout = raw.serializeLayout.mock.results[0].value as DashboardLayout
    expect(layout.version).toBe('1.0')
    expect(ElMessageMock.success).toHaveBeenCalled()
  })
})
