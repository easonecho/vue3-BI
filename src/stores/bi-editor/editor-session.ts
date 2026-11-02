import { nextTick, type Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type {
  ComponentInstance,
  CanvasState,
  GuideLine,
  DashboardLayout,
} from '@/views/bi-editor/types'
import { DEFAULT_ZOOM, DEFAULT_VIEWPORT_OFFSET } from '@/views/bi-editor/constants/canvas-constants'
import { createDashboard, updateDashboard, getDashboardDetail } from '@/api/dashboard'
import {
  getDashboardTemplateDetail,
  createDashboardTemplate,
  updateDashboardTemplate,
  type DashboardTemplate,
} from '@/api/dashboard-template'

/** 🔑 本地草稿结构：只存 localStorage，用于意外关闭/崩溃后找回未保存内容 */
export interface EditorDraft {
  savedAt: number
  name: string
  layout: DashboardLayout
  version: number | null
}

/** 看板/模板会话所依赖的共享状态与回调（由 store 组合根注入） */
export interface EditorSessionDeps {
  canvas: Ref<CanvasState>
  components: Ref<ComponentInstance[]>
  guides: Ref<GuideLine[]>
  selectedId: Ref<string | null>
  isLoading: Ref<boolean>
  isDirty: Ref<boolean>
  isSaving: Ref<boolean>
  currentDashboardId: Ref<number | null>
  dashboardVersion: Ref<number | null>
  dashboardName: Ref<string>
  isTemplateMode: Ref<boolean>
  currentTemplateId: Ref<number | null>
  templateDescription: Ref<string>
  templateCategory: Ref<string | undefined>
  templateIsPublic: Ref<boolean>
  clearHistory: () => void
  resetViewport: () => void
  captureThumbnail: () => Promise<string | null>
}

export interface EditorSessionApi {
  setDashboardId: (id: number | null) => void
  setDashboardName: (name: string) => void
  serializeLayout: () => DashboardLayout
  applyLayout: (layout: DashboardLayout) => void
  loadDashboard: (id: number) => Promise<void>
  saveDashboard: () => Promise<void>
  saveDraft: () => boolean
  loadDraft: () => EditorDraft | null
  clearDraft: (key?: string) => void
  restoreDraft: (draft: EditorDraft) => void
  newDashboard: () => void
  newTemplate: () => void
  loadTemplate: (id: number) => Promise<void>
  saveTemplate: (input: {
    description?: string
    category?: string
    isPublic?: boolean
  }) => Promise<DashboardTemplate | null>
}

const DRAFT_PREFIX = 'bi_editor_draft_'

/**
 * 🔑 看板 / 模板会话组合根。
 *
 *   职责边界：
 *   - 序列化 / 反序列化画布布局（视口状态不持久化）
 *   - 看板的新建、加载、保存（含乐观锁冲突覆盖确认）
 *   - 模板的新建、加载、保存
 *   - 本地草稿的保存 / 读取 / 清除 / 恢复
 *
 *   ⚠️ 所有状态均由外部注入，本模块不创建 store；返回的函数名需与 store 公共 API 保持一致。
 */
export function createEditorSession(deps: EditorSessionDeps): EditorSessionApi {
  const {
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
  } = deps

  /** 🔑 另存为/导入后，重设看板 id（下次 saveDashboard 会新建一条后端记录） */
  function setDashboardId(id: number | null) {
    currentDashboardId.value = id
  }

  function setDashboardName(name: string) {
    dashboardName.value = name || '未命名报表'
  }

  /**
   * 序列化当前编辑器状态为可持久化的 DashboardLayout。
   * 视口状态(zoom/scrollX/scrollY)不持久化,加载时由 resetViewport 还原。
   * 使用 JSON.parse(JSON.stringify(...)) 剥离 Vue 响应式 Proxy(与 history.ts 思路一致)。
   */
  function serializeLayout(): DashboardLayout {
    return {
      version: '1.0',
      canvas: {
        ...canvas.value,
        // 视口状态不持久化,用默认值占位,加载时 resetViewport 会覆盖
        zoom: DEFAULT_ZOOM,
        scrollX: DEFAULT_VIEWPORT_OFFSET.x,
        scrollY: DEFAULT_VIEWPORT_OFFSET.y,
      },
      components: JSON.parse(JSON.stringify(components.value)),
      guides: JSON.parse(JSON.stringify(guides.value)),
    }
  }

  /**
   * 将 DashboardLayout 应用到当前编辑器状态。
   * 通过 isLoading 标志拦截脏状态检测 watch,避免恢复过程被误判为用户改动。
   * 🔑 迁移逻辑:老看板的 ComponentInstance 没有 dataSource/dataConfig 字段,统一补默认值。
   */
  function applyLayout(layout: DashboardLayout) {
    isLoading.value = true
    // 迁移组件:给老组件补 dataSource/dataConfig 默认值(向后兼容)
    components.value = (layout.components ?? []).map((c) => ({
      ...c,
      dataSource: c.dataSource ?? { datasetId: null },
      dataConfig: c.dataConfig ?? {},
      style: c.style ?? {},
      visible: c.visible ?? true,
    }))
    canvas.value = { ...canvas.value, ...layout.canvas }
    guides.value = layout.guides ?? []
    selectedId.value = null
    clearHistory()
    resetViewport()
    // nextTick 后重置标志:确保 watch 的 deep 回调(微任务)先跑完再放开
    nextTick(() => {
      isLoading.value = false
      isDirty.value = false
    })
  }

  /** 加载已有看板 */
  async function loadDashboard(id: number) {
    try {
      const res = await getDashboardDetail(id)
      currentDashboardId.value = id
      dashboardVersion.value = res.data.version ?? 1
      isTemplateMode.value = false
      currentTemplateId.value = null
      dashboardName.value = res.data.name
      const layout = (res.data.layout ?? {
        version: '1.0',
        components: [],
        canvas: canvas.value,
        guides: [],
      }) as unknown as DashboardLayout
      applyLayout(layout)
    } catch (e) {
      // applyLayout 未执行时手动重置 isLoading,避免标志卡死
      isLoading.value = false
      throw e
    }
  }

  /** 🔑 判断是否为乐观锁冲突（后端返回 HTTP 409 + 业务码 50007） */
  function isVersionConflict(e: unknown) {
    const err = e as { response?: { status?: number; data?: { code?: number } } }
    return err?.response?.status === 409 && err?.response?.data?.code === 50007
  }

  /**
   * 保存看板：新建调 create，已有调 update（带乐观锁）。
   * 版本冲突时询问用户是否覆盖；覆盖保存不携带 version，直接以当前内容为准。
   */
  async function saveDashboard() {
    if (isSaving.value) return
    isSaving.value = true
    // 🔑 新建保存成功后 currentDashboardId 会变，草稿 key 也会变，先记下原 key
    const draftKey = draftStorageKey()
    try {
      // 🔑 保存前截取画布快照作为缩略图（失败不阻断保存）
      let thumbnail: string | undefined
      try {
        thumbnail = (await captureThumbnail()) ?? undefined
      } catch (e) {
        console.warn('[bi-editor] captureThumbnail failed, save without thumbnail', e)
      }
      const buildPayload = (withVersion: boolean) => {
        const layout = serializeLayout() as unknown as Record<string, unknown>
        return {
          name: dashboardName.value,
          layout,
          thumbnail,
          ...(withVersion && dashboardVersion.value !== null
            ? { version: dashboardVersion.value }
            : {}),
        }
      }
      const submit = async (withVersion: boolean) => {
        if (currentDashboardId.value === null) {
          const res = await createDashboard(buildPayload(false))
          currentDashboardId.value = res.data.id
          dashboardVersion.value = res.data.version ?? 1
        } else {
          const res = await updateDashboard(currentDashboardId.value, buildPayload(withVersion))
          if (typeof res.data.version === 'number') dashboardVersion.value = res.data.version
        }
      }

      try {
        await submit(true)
      } catch (e) {
        if (!isVersionConflict(e) || currentDashboardId.value === null) throw e
        const overwrite = await ElMessageBox.confirm(
          '该看板刚刚被其他人修改过，覆盖保存会丢失对方的改动。是否覆盖？',
          '保存冲突',
          {
            type: 'warning',
            confirmButtonText: '覆盖保存',
            cancelButtonText: '取消',
          },
        )
          .then(() => true)
          .catch(() => false)
        if (!overwrite) return
        await submit(false)
      }
      isDirty.value = false
      clearDraft(draftKey)
      ElMessage.success('保存成功')
    } finally {
      isSaving.value = false
    }
  }

  /** 草稿 key 按「看板/模板 + id（新建为 new）」区分，避免不同看板互相覆盖 */
  function draftStorageKey(): string {
    const mode = isTemplateMode.value ? 'tpl' : 'dash'
    const id = isTemplateMode.value ? currentTemplateId.value : currentDashboardId.value
    return `${DRAFT_PREFIX}${mode}_${id ?? 'new'}`
  }

  /** 保存草稿：无改动或正在加载时跳过 */
  function saveDraft(): boolean {
    if (!isDirty.value || isLoading.value) return false
    try {
      const draft: EditorDraft = {
        savedAt: Date.now(),
        name: dashboardName.value,
        layout: serializeLayout(),
        version: dashboardVersion.value,
      }
      localStorage.setItem(draftStorageKey(), JSON.stringify(draft))
      return true
    } catch (e) {
      console.warn('[bi-editor] saveDraft failed', e)
      return false
    }
  }

  /** 读取当前会话对应的草稿，不存在或格式非法返回 null */
  function loadDraft(): EditorDraft | null {
    try {
      const raw = localStorage.getItem(draftStorageKey())
      if (!raw) return null
      const draft = JSON.parse(raw) as EditorDraft
      if (!draft || typeof draft.savedAt !== 'number' || !draft.layout) return null
      return draft
    } catch {
      return null
    }
  }

  /** 清除草稿；默认清除当前会话草稿，也可指定保存前的 key（新建成功后 id 会变） */
  function clearDraft(key: string = draftStorageKey()): void {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }

  /** 恢复草稿内容到编辑器，并标记为未保存改动 */
  function restoreDraft(draft: EditorDraft) {
    dashboardName.value = draft.name || dashboardName.value
    if (typeof draft.version === 'number') dashboardVersion.value = draft.version
    applyLayout(draft.layout)
    // applyLayout 会在 nextTick 里把 isDirty 复位，这里再标记一次
    nextTick(() => {
      isDirty.value = true
    })
  }

  /** 新建空白看板 */
  function newDashboard() {
    isLoading.value = true
    currentDashboardId.value = null
    dashboardVersion.value = null
    isTemplateMode.value = false
    currentTemplateId.value = null
    dashboardName.value = '未命名报表'
    components.value = []
    guides.value = []
    selectedId.value = null
    clearHistory()
    resetViewport()
    nextTick(() => {
      isLoading.value = false
      isDirty.value = false
    })
  }

  /** 🔑 进入「新建模板」模式：清空画布并标记为模板模式 */
  function newTemplate() {
    isLoading.value = true
    isTemplateMode.value = true
    currentTemplateId.value = null
    currentDashboardId.value = null
    dashboardVersion.value = null
    dashboardName.value = '未命名模板'
    templateDescription.value = ''
    templateCategory.value = undefined
    templateIsPublic.value = true
    components.value = []
    guides.value = []
    selectedId.value = null
    clearHistory()
    resetViewport()
    nextTick(() => {
      isLoading.value = false
      isDirty.value = false
    })
  }

  /** 🔑 加载模板到画布（模板编辑模式）：用于「编辑模板」入口 */
  async function loadTemplate(id: number) {
    isTemplateMode.value = true
    currentTemplateId.value = id
    currentDashboardId.value = null
    dashboardVersion.value = null
    try {
      const res = await getDashboardTemplateDetail(id)
      dashboardName.value = res.data.name
      templateDescription.value = res.data.description ?? ''
      templateCategory.value = res.data.category ?? undefined
      templateIsPublic.value = res.data.isPublic ?? true
      const layout = (res.data.layout ?? {
        version: '1.0',
        components: [],
        canvas: canvas.value,
        guides: [],
      }) as unknown as DashboardLayout
      applyLayout(layout)
    } catch (e) {
      isLoading.value = false
      throw e
    }
  }

  /** 🔑 保存模板（模板编辑模式）：新建调 createDashboardTemplate，已有调 updateDashboardTemplate */
  async function saveTemplate(input: {
    description?: string
    category?: string
    isPublic?: boolean
  }): Promise<DashboardTemplate | null> {
    if (isSaving.value) return null
    isSaving.value = true
    // 🔑 新建成功后会写入 currentTemplateId，草稿 key 随之变化，先记下原 key
    const draftKey = draftStorageKey()
    try {
      templateDescription.value = input.description ?? ''
      templateCategory.value = input.category
      templateIsPublic.value = input.isPublic ?? true
      let thumbnail: string | undefined
      try {
        thumbnail = (await captureThumbnail()) ?? undefined
      } catch (e) {
        console.warn('[bi-editor] captureThumbnail failed', e)
      }
      const layout = serializeLayout() as unknown as Record<string, unknown>
      const name = dashboardName.value
      if (currentTemplateId.value === null) {
        const res = await createDashboardTemplate({
          name,
          layout,
          thumbnail,
          description: input.description,
          category: input.category,
          isPublic: input.isPublic,
          isSystem: false,
        })
        currentTemplateId.value = res.data.id
        isDirty.value = false
        clearDraft(draftKey)
        ElMessage.success('模板保存成功')
        return res.data
      } else {
        const res = await updateDashboardTemplate(currentTemplateId.value, {
          name,
          layout,
          thumbnail,
          description: input.description,
          category: input.category,
          isPublic: input.isPublic,
        })
        isDirty.value = false
        clearDraft(draftKey)
        ElMessage.success('模板保存成功')
        return res.data
      }
    } finally {
      isSaving.value = false
    }
  }

  return {
    setDashboardId,
    setDashboardName,
    serializeLayout,
    applyLayout,
    loadDashboard,
    saveDashboard,
    saveDraft,
    loadDraft,
    clearDraft,
    restoreDraft,
    newDashboard,
    newTemplate,
    loadTemplate,
    saveTemplate,
  }
}
