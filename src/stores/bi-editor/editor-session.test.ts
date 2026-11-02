import { nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CanvasState, ComponentInstance, GuideLine, DashboardLayout } from '@/views/bi-editor/types'
import { DEFAULT_ZOOM, DEFAULT_VIEWPORT_OFFSET } from '@/views/bi-editor/constants/canvas-constants'

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  ElMessageBox: { confirm: vi.fn() },
}))

vi.mock('@/api/dashboard', () => ({
  getDashboardDetail: vi.fn(),
  createDashboard: vi.fn(),
  updateDashboard: vi.fn(),
}))

vi.mock('@/api/dashboard-template', () => ({
  getDashboardTemplateDetail: vi.fn(),
  createDashboardTemplate: vi.fn(),
  updateDashboardTemplate: vi.fn(),
}))

import { ElMessage, ElMessageBox } from 'element-plus'
import { createDashboard, getDashboardDetail, updateDashboard } from '@/api/dashboard'
import type { Dashboard } from '@/api/types'
import {
  createDashboardTemplate,
  getDashboardTemplateDetail,
  updateDashboardTemplate,
  type DashboardTemplate,
} from '@/api/dashboard-template'
import { createEditorSession, type EditorDraft } from './editor-session'

function makeCanvas(overrides: Partial<CanvasState> = {}): CanvasState {
  return {
    width: 1920,
    height: 1080,
    zoom: DEFAULT_ZOOM,
    backgroundColor: '#FFFFFF',
    backgroundImage: '',
    showGrid: true,
    gridSize: 10,
    snapToGrid: true,
    showRuler: true,
    showGuides: true,
    scrollX: DEFAULT_VIEWPORT_OFFSET.x,
    scrollY: DEFAULT_VIEWPORT_OFFSET.y,
    ...overrides,
  }
}

function makeComponent(id: string, overrides: Partial<ComponentInstance> = {}): ComponentInstance {
  return {
    id,
    type: 'bar-chart',
    name: id,
    x: 0,
    y: 0,
    width: 100,
    height: 60,
    zIndex: 1,
    visible: true,
    locked: false,
    props: {},
    style: {},
    dataSource: { datasetId: null },
    dataConfig: {},
    ...overrides,
  }
}

function makeLayout(overrides: Partial<DashboardLayout> = {}): DashboardLayout {
  return {
    version: '1.0',
    canvas: makeCanvas(),
    components: [],
    guides: [],
    ...overrides,
  }
}

function api<T>(data: T) {
  return { code: 0, message: 'ok', data }
}

function makeDashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return { id: 1, name: '看板', status: 1, isPublic: false, ...overrides }
}

function makeTemplate(overrides: Partial<DashboardTemplate> = {}): DashboardTemplate {
  return {
    id: 1,
    name: '模板',
    isPublic: true,
    isSystem: false,
    creatorId: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function createHarness() {
  const canvas = ref<CanvasState>(makeCanvas())
  const components = ref<ComponentInstance[]>([])
  const guides = ref<GuideLine[]>([])
  const selectedId = ref<string | null>(null)
  const isLoading = ref(false)
  const isDirty = ref(false)
  const isSaving = ref(false)
  const currentDashboardId = ref<number | null>(null)
  const dashboardVersion = ref<number | null>(null)
  const dashboardName = ref('未命名报表')
  const isTemplateMode = ref(false)
  const currentTemplateId = ref<number | null>(null)
  const templateDescription = ref('')
  const templateCategory = ref<string | undefined>(undefined)
  const templateIsPublic = ref(true)
  const clearHistory = vi.fn()
  const resetViewport = vi.fn()
  const captureThumbnail = vi.fn(async () => null as string | null)

  const session = createEditorSession({
    canvas,
    components,
    guides,
    selectedId,
    isLoading,
    isDirty,
    isSaving,
    currentDashboardId,
    dashboardVersion,
    dashboardName,
    isTemplateMode,
    currentTemplateId,
    templateDescription,
    templateCategory,
    templateIsPublic,
    clearHistory,
    resetViewport,
    captureThumbnail,
  })

  return {
    session,
    canvas,
    components,
    guides,
    selectedId,
    isLoading,
    isDirty,
    isSaving,
    currentDashboardId,
    dashboardVersion,
    dashboardName,
    isTemplateMode,
    currentTemplateId,
    templateDescription,
    templateCategory,
    templateIsPublic,
    clearHistory,
    resetViewport,
    captureThumbnail,
  }
}

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
})

describe('serializeLayout / applyLayout', () => {
  it('序列化时不持久化视口状态，并剥离响应式引用', () => {
    const h = createHarness()
    h.components.value = [makeComponent('c1', { x: 10 })]
    h.guides.value = [{ id: 'g1', direction: 'vertical', position: 100 }]
    h.canvas.value = makeCanvas({ zoom: 2, scrollX: 300, scrollY: 400 })

    const layout = h.session.serializeLayout()
    expect(layout.canvas.zoom).toBe(DEFAULT_ZOOM)
    expect(layout.canvas.scrollX).toBe(DEFAULT_VIEWPORT_OFFSET.x)
    expect(layout.canvas.scrollY).toBe(DEFAULT_VIEWPORT_OFFSET.y)
    expect(layout.components[0]).not.toBe(h.components.value[0])
    expect(layout.components[0].x).toBe(10)

    layout.components[0].x = 99
    expect(h.components.value[0].x).toBe(10)
  })

  it('应用布局时为老组件补默认字段，并重置选中 / 历史 / 视口', async () => {
    const h = createHarness()
    const legacy = {
      id: 'old',
      type: 'bar-chart',
      name: '旧组件',
      x: 0,
      y: 0,
      width: 100,
      height: 60,
      zIndex: 1,
      props: {},
    } as unknown as ComponentInstance
    const layout = makeLayout({
      canvas: makeCanvas({ width: 1280, height: 720 }),
      components: [legacy],
      guides: [{ id: 'g', direction: 'horizontal', position: 10 }],
    })

    h.session.applyLayout(layout)
    expect(h.isLoading.value).toBe(true)
    expect(h.components.value[0].dataSource).toEqual({ datasetId: null })
    expect(h.components.value[0].dataConfig).toEqual({})
    expect(h.components.value[0].style).toEqual({})
    expect(h.components.value[0].visible).toBe(true)
    expect(h.canvas.value.width).toBe(1280)
    expect(h.canvas.value.height).toBe(720)
    expect(h.guides.value).toHaveLength(1)
    expect(h.selectedId.value).toBeNull()
    expect(h.clearHistory).toHaveBeenCalledTimes(1)
    expect(h.resetViewport).toHaveBeenCalledTimes(1)

    await nextTick()
    expect(h.isLoading.value).toBe(false)
    expect(h.isDirty.value).toBe(false)
  })
})

describe('本地草稿', () => {
  it('未改动或加载中时不写草稿', () => {
    const h = createHarness()
    expect(h.session.saveDraft()).toBe(false)

    h.isDirty.value = true
    h.isLoading.value = true
    expect(h.session.saveDraft()).toBe(false)
    expect(Object.keys(localStorage)).toHaveLength(0)
  })

  it('按看板/模板区分草稿 key，并可读取、清除', () => {
    const h = createHarness()
    h.isDirty.value = true
    h.dashboardName.value = '销售看板'
    h.dashboardVersion.value = 3
    expect(h.session.saveDraft()).toBe(true)

    const draft = h.session.loadDraft()
    expect(draft?.name).toBe('销售看板')
    expect(draft?.version).toBe(3)
    expect(draft?.layout.version).toBe('1.0')
    expect(localStorage.getItem('bi_editor_draft_dash_new')).toBeTruthy()

    h.session.clearDraft()
    expect(h.session.loadDraft()).toBeNull()

    // 模板模式使用独立 key，不与看板草稿互相覆盖
    h.isTemplateMode.value = true
    h.currentTemplateId.value = 7
    h.session.saveDraft()
    expect(localStorage.getItem('bi_editor_draft_tpl_7')).toBeTruthy()
    expect(h.session.loadDraft()).not.toBeNull()
  })

  it('恢复草稿时应用布局并重新标记未保存改动', async () => {
    const h = createHarness()
    const draft: EditorDraft = {
      savedAt: Date.now(),
      name: '草稿看板',
      version: 5,
      layout: makeLayout({ components: [makeComponent('draft-comp')] }),
    }
    h.session.restoreDraft(draft)

    expect(h.dashboardName.value).toBe('草稿看板')
    expect(h.dashboardVersion.value).toBe(5)
    expect(h.components.value[0].id).toBe('draft-comp')

    await nextTick()
    expect(h.isDirty.value).toBe(true)
  })
})

describe('看板会话', () => {
  it('新建看板重置所有会话状态', async () => {
    const h = createHarness()
    h.currentDashboardId.value = 9
    h.dashboardVersion.value = 2
    h.isTemplateMode.value = true
    h.currentTemplateId.value = 4
    h.components.value = [makeComponent('c1')]

    h.session.newDashboard()
    expect(h.isLoading.value).toBe(true)
    expect(h.currentDashboardId.value).toBeNull()
    expect(h.dashboardVersion.value).toBeNull()
    expect(h.isTemplateMode.value).toBe(false)
    expect(h.currentTemplateId.value).toBeNull()
    expect(h.dashboardName.value).toBe('未命名报表')
    expect(h.components.value).toEqual([])
    expect(h.clearHistory).toHaveBeenCalled()
    expect(h.resetViewport).toHaveBeenCalled()

    await nextTick()
    expect(h.isLoading.value).toBe(false)
    expect(h.isDirty.value).toBe(false)
  })

  it('新建模板进入模板模式并重置模板元数据', async () => {
    const h = createHarness()
    h.templateDescription.value = '旧描述'
    h.templateCategory.value = 'finance'
    h.templateIsPublic.value = false

    h.session.newTemplate()
    expect(h.isTemplateMode.value).toBe(true)
    expect(h.dashboardName.value).toBe('未命名模板')
    expect(h.templateDescription.value).toBe('')
    expect(h.templateCategory.value).toBeUndefined()
    expect(h.templateIsPublic.value).toBe(true)
    expect(h.currentDashboardId.value).toBeNull()

    await nextTick()
    expect(h.isLoading.value).toBe(false)
  })

  it('加载看板写入 id / 版本 / 名称并应用布局', async () => {
    const h = createHarness()
    vi.mocked(getDashboardDetail).mockResolvedValueOnce(
      api(
        makeDashboard({
          id: 7,
          name: '销售看板',
          version: 3,
          layout: makeLayout({ components: [makeComponent('c1')] }) as unknown as Record<
            string,
            unknown
          >,
        }),
      ),
    )

    await h.session.loadDashboard(7)
    expect(h.currentDashboardId.value).toBe(7)
    expect(h.dashboardVersion.value).toBe(3)
    expect(h.dashboardName.value).toBe('销售看板')
    expect(h.isTemplateMode.value).toBe(false)
    expect(h.currentTemplateId.value).toBeNull()
    expect(h.components.value[0].id).toBe('c1')
  })

  it('加载看板失败时复位 isLoading 并抛出', async () => {
    const h = createHarness()
    vi.mocked(getDashboardDetail).mockRejectedValueOnce(new Error('network'))

    await expect(h.session.loadDashboard(8)).rejects.toThrow('network')
    expect(h.isLoading.value).toBe(false)
  })

  it('新建看板保存时不带 version，成功后更新 id / 版本并清除草稿', async () => {
    const h = createHarness()
    h.isDirty.value = true
    h.dashboardName.value = '新看板'
    h.components.value = [makeComponent('c1')]
    h.session.saveDraft()
    const draftKey = 'bi_editor_draft_dash_new'

    vi.mocked(createDashboard).mockResolvedValueOnce(
      api(makeDashboard({ id: 11, name: '新看板', version: 2 })),
    )

    await h.session.saveDashboard()

    expect(createDashboard).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(createDashboard).mock.calls[0][0]
    expect(payload.name).toBe('新看板')
    expect(payload).not.toHaveProperty('version')
    expect(h.currentDashboardId.value).toBe(11)
    expect(h.dashboardVersion.value).toBe(2)
    expect(h.isDirty.value).toBe(false)
    expect(h.isSaving.value).toBe(false)
    expect(localStorage.getItem(draftKey)).toBeNull()
    expect(ElMessage.success).toHaveBeenCalledWith('保存成功')
  })

  it('已有看板保存时携带 version，并接受后端新版本', async () => {
    const h = createHarness()
    h.currentDashboardId.value = 11
    h.dashboardVersion.value = 3
    h.dashboardName.value = '看板'
    vi.mocked(updateDashboard).mockResolvedValueOnce(
      api(makeDashboard({ id: 11, name: '看板', version: 4 })),
    )

    await h.session.saveDashboard()

    expect(updateDashboard).toHaveBeenCalledTimes(1)
    expect(vi.mocked(updateDashboard).mock.calls[0][0]).toBe(11)
    expect(vi.mocked(updateDashboard).mock.calls[0][1]).toMatchObject({ version: 3 })
    expect(h.dashboardVersion.value).toBe(4)
    expect(h.isDirty.value).toBe(false)
  })

  it('乐观锁冲突且用户确认覆盖时，第二次保存不带 version', async () => {
    const h = createHarness()
    h.currentDashboardId.value = 11
    h.dashboardVersion.value = 3
    const conflict = { response: { status: 409, data: { code: 50007 } } }
    vi.mocked(updateDashboard)
      .mockRejectedValueOnce(conflict)
      .mockResolvedValueOnce(api(makeDashboard({ id: 11, version: 5 })))
    vi.mocked(ElMessageBox.confirm).mockResolvedValueOnce('confirm' as never)

    await h.session.saveDashboard()

    expect(updateDashboard).toHaveBeenCalledTimes(2)
    expect(vi.mocked(updateDashboard).mock.calls[1][1]).not.toHaveProperty('version')
    expect(h.dashboardVersion.value).toBe(5)
    expect(h.isDirty.value).toBe(false)
  })

  it('乐观锁冲突且用户取消时不再覆盖，并保留未保存状态', async () => {
    const h = createHarness()
    h.currentDashboardId.value = 11
    h.dashboardVersion.value = 3
    h.isDirty.value = true
    vi.mocked(updateDashboard).mockRejectedValueOnce({
      response: { status: 409, data: { code: 50007 } },
    })
    vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce(new Error('cancel'))

    await h.session.saveDashboard()

    expect(updateDashboard).toHaveBeenCalledTimes(1)
    expect(h.isDirty.value).toBe(true)
    expect(h.isSaving.value).toBe(false)
  })

  it('非版本冲突错误直接抛出并复位 isSaving', async () => {
    const h = createHarness()
    h.currentDashboardId.value = 11
    vi.mocked(updateDashboard).mockRejectedValueOnce(new Error('server error'))

    await expect(h.session.saveDashboard()).rejects.toThrow('server error')
    expect(h.isSaving.value).toBe(false)
  })
})

describe('模板会话', () => {
  it('加载模板写入元数据并进入模板模式', async () => {
    const h = createHarness()
    vi.mocked(getDashboardTemplateDetail).mockResolvedValueOnce(
      api(
        makeTemplate({
          id: 3,
          name: '营销模板',
          description: '模板描述',
          category: 'marketing',
          isPublic: false,
          layout: makeLayout({ components: [makeComponent('t1')] }) as unknown as Record<
            string,
            unknown
          >,
        }),
      ),
    )

    await h.session.loadTemplate(3)
    expect(h.isTemplateMode.value).toBe(true)
    expect(h.currentTemplateId.value).toBe(3)
    expect(h.currentDashboardId.value).toBeNull()
    expect(h.dashboardVersion.value).toBeNull()
    expect(h.dashboardName.value).toBe('营销模板')
    expect(h.templateDescription.value).toBe('模板描述')
    expect(h.templateCategory.value).toBe('marketing')
    expect(h.templateIsPublic.value).toBe(false)
    expect(h.components.value[0].id).toBe('t1')
  })

  it('加载模板失败时复位 isLoading 并抛出', async () => {
    const h = createHarness()
    vi.mocked(getDashboardTemplateDetail).mockRejectedValueOnce(new Error('404'))

    await expect(h.session.loadTemplate(3)).rejects.toThrow('404')
    expect(h.isLoading.value).toBe(false)
  })

  it('新建模板保存后写入 currentTemplateId 并清除草稿', async () => {
    const h = createHarness()
    h.isTemplateMode.value = true
    h.isDirty.value = true
    h.dashboardName.value = '新模板'
    h.session.saveDraft()
    h.captureThumbnail.mockResolvedValueOnce('data:image/jpeg;base64,thumb')
    vi.mocked(createDashboardTemplate).mockResolvedValueOnce(
      api(makeTemplate({ id: 9, name: '新模板' })),
    )

    const res = await h.session.saveTemplate({
      description: '说明',
      category: 'finance',
      isPublic: true,
    })

    expect(createDashboardTemplate).toHaveBeenCalledTimes(1)
    expect(vi.mocked(createDashboardTemplate).mock.calls[0][0]).toMatchObject({
      name: '新模板',
      thumbnail: 'data:image/jpeg;base64,thumb',
      description: '说明',
      category: 'finance',
      isPublic: true,
      isSystem: false,
    })
    expect(h.currentTemplateId.value).toBe(9)
    expect(h.currentDashboardId.value).toBeNull()
    expect(h.isDirty.value).toBe(false)
    expect(h.isSaving.value).toBe(false)
    expect(localStorage.getItem('bi_editor_draft_tpl_new')).toBeNull()
    expect(ElMessage.success).toHaveBeenCalledWith('模板保存成功')
    expect(res?.id).toBe(9)
  })

  it('已有模板保存时走更新接口并回写元数据', async () => {
    const h = createHarness()
    h.isTemplateMode.value = true
    h.currentTemplateId.value = 5
    h.dashboardName.value = '模板 A'
    vi.mocked(updateDashboardTemplate).mockResolvedValueOnce(
      api(makeTemplate({ id: 5, name: '模板 A', description: '新说明' })),
    )

    const res = await h.session.saveTemplate({
      description: '新说明',
      category: 'finance',
      isPublic: false,
    })

    expect(updateDashboardTemplate).toHaveBeenCalledTimes(1)
    expect(vi.mocked(updateDashboardTemplate).mock.calls[0][0]).toBe(5)
    expect(h.templateDescription.value).toBe('新说明')
    expect(h.templateCategory.value).toBe('finance')
    expect(h.templateIsPublic.value).toBe(false)
    expect(h.isDirty.value).toBe(false)
    expect(res?.description).toBe('新说明')
  })

  it('正在保存时直接忽略重复保存', async () => {
    const h = createHarness()
    h.isSaving.value = true

    expect(await h.session.saveTemplate({})).toBeNull()
    await h.session.saveDashboard()
    expect(createDashboardTemplate).not.toHaveBeenCalled()
    expect(updateDashboard).not.toHaveBeenCalled()
    expect(createDashboard).not.toHaveBeenCalled()
  })
})

describe('看板元信息设置', () => {
  it('setDashboardName 空值时回退到默认名称', () => {
    const h = createHarness()
    h.session.setDashboardName('')
    expect(h.dashboardName.value).toBe('未命名报表')
    h.session.setDashboardName('销售')
    expect(h.dashboardName.value).toBe('销售')
  })

  it('setDashboardId 用于另存为后重置 id', () => {
    const h = createHarness()
    h.session.setDashboardId(12)
    expect(h.currentDashboardId.value).toBe(12)
    h.session.setDashboardId(null)
    expect(h.currentDashboardId.value).toBeNull()
  })
})
