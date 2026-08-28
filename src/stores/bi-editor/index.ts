import { defineStore } from 'pinia'
import { nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { ComponentInstance, CanvasState, GuideLine, DashboardLayout } from '@/views/bi-editor/types'
import { getMeta, CATEGORY_GROUPS, CATEGORY_LABELS } from './metadata'
import { useHistory } from './history'
import { useComponentOperations } from './use-components'
import { useCanvasOperations } from './use-canvas'
import { DEFAULT_ZOOM, DEFAULT_VIEWPORT_OFFSET } from '@/views/bi-editor/constants/canvas-constants'
import { createDashboard, updateDashboard, getDashboardDetail } from '@/api/dashboard'
import {
  getDashboardTemplateDetail,
  createDashboardTemplate,
  updateDashboardTemplate,
} from '@/api/dashboard-template'

export const useBiEditorStore = defineStore('bi-editor', () => {
  // ========== 共享状态 ==========
  const canvas = ref<CanvasState>({
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
  })

  const components = ref<ComponentInstance[]>([])
  const selectedId = ref<string | null>(null)
  // 🔑 多选状态：选中 ID 的集合。selectedId 是「主选中」（最后被选中的组件，用于右键菜单、Delete 删除目标）
  //   使用数组而非 Set：Vue 3 对 ref<Set> 的 .has() 在 Pinia setup store 中的响应式追踪不够可靠，
  //   数组的 .includes() 在模板中能被正确追踪。
  const selectedIds = ref<string[]>([])
  const guides = ref<GuideLine[]>([])

  // ========== 历史记录 ==========
  const {
    pushHistory: rawPushHistory,
    undo: rawUndo,
    redo: rawRedo,
    canUndo,
    canRedo,
    clearHistory,
    isRestoringNow,
  } = useHistory(components, canvas, guides, selectedId, selectedIds)

  /**
   * 🔑 标记未保存改动（替代旧版 deep watch）。
   * 旧版用 watch([components, canvas, guides], cb, { deep: true }) 检测改动，
   * deep watch 每次属性变更都要遍历整个 components 数组的所有属性，开销大。
   * 现在改为在所有 mutation 函数中手动调用 markDirty()，只做一次布尔赋值。
   */
  function markDirty() {
    if (!isLoading.value) isDirty.value = true
  }

  // 🔑 包装 pushHistory：同时标记 dirty（所有调用 pushHistory 的操作都是用户改动）
  function pushHistory() {
    rawPushHistory()
    markDirty()
  }

  // 🔑 包装 undo/redo：撤销/重做也算未保存改动
  function undo() {
    rawUndo()
    markDirty()
  }
  function redo() {
    rawRedo()
    markDirty()
  }

  // ========== 组件操作 ==========
  const componentOps = useComponentOperations(components, selectedId, pushHistory, markDirty, selectedIds)
  const {
    selectedComponent,
    selectedComponents,
    selectedIdSet,
    layerList,
    // 🔑 分组包围盒 & 命中测试（统一 GroupBox 边框 + 空白区整体拖拽）
    selectedGroupBounds,
    isInSelectedGroup,
    hitTestSelectedGroupBlank,
    isCommittingGroupDragNow,
    addComponent,
    updateComponent,
    moveComponent,
    resizeComponent,
    setComponentZIndex,
    bringToFront,
    sendToBack,
    moveUp,
    moveDown,
    removeComponent,
    duplicateComponent,
    toggleVisibility,
    toggleLock,
    selectComponent,
    selectComponentAccum,
    selectByRect,
    clearSelection,
    // 🔑 O(1) 组件查找（Map 索引）
    getComponent,
    // 🔑 分组拖拽预览
    groupDragPreview,
    activeDragGroupId,
    activeDragId,
    setDragPreview,
    commitGroupDrag,
    abortGroupDrag,
    canBringToFront,
    canSendToBack,
    canMoveUp,
    canMoveDown,
    // 分组
    canGroup,
    canUngroup,
    groupSelection,
    ungroupSelection,
  } = componentOps

  // ========== 对齐 / 分布（补全画布尺寸信息） ==========
  // use-component-operations 无法访问 canvas，这里包装对齐 API：
  //   - 多选：按组件集合的包围盒对齐（使用默认实现）
  //   - 单选：按画布尺寸对齐
  const _alignHCenter = componentOps.alignHCenter
  function alignHCenter() {
    const multiCount = selectedIds.value.length
    if (multiCount <= 1 && selectedId.value) {
      const comp = components.value.find((c) => c.id === selectedId.value)
      if (comp && !comp.locked) {
        comp.x = (canvas.value.width - comp.width) / 2
        pushHistory()
        return
      }
    }
    _alignHCenter()
  }
  const _alignRight = componentOps.alignRight
  function alignRight() {
    const multiCount = selectedIds.value.length
    if (multiCount <= 1 && selectedId.value) {
      const comp = components.value.find((c) => c.id === selectedId.value)
      if (comp && !comp.locked) {
        comp.x = canvas.value.width - comp.width
        pushHistory()
        return
      }
    }
    _alignRight()
  }
  const _alignVCenter = componentOps.alignVCenter
  function alignVCenter() {
    const multiCount = selectedIds.value.length
    if (multiCount <= 1 && selectedId.value) {
      const comp = components.value.find((c) => c.id === selectedId.value)
      if (comp && !comp.locked) {
        comp.y = (canvas.value.height - comp.height) / 2
        pushHistory()
        return
      }
    }
    _alignVCenter()
  }
  const _alignBottom = componentOps.alignBottom
  function alignBottom() {
    const multiCount = selectedIds.value.length
    if (multiCount <= 1 && selectedId.value) {
      const comp = components.value.find((c) => c.id === selectedId.value)
      if (comp && !comp.locked) {
        comp.y = canvas.value.height - comp.height
        pushHistory()
        return
      }
    }
    _alignBottom()
  }
  // 单选/多选无特殊处理 → 直接沿用
  const alignLeft = componentOps.alignLeft
  const alignTop = componentOps.alignTop
  const distributeHorizontal = componentOps.distributeHorizontal
  const distributeVertical = componentOps.distributeVertical

  // ========== 画布操作 ==========
  const {
    updateCanvas,
    setZoom,
    addGuide,
    removeGuide,
    setGuides,
    setGuidesSilent,
    clearGuides,
    resetViewport,
  } = useCanvasOperations(canvas, guides, pushHistory, markDirty)

  // ========== 看板会话状态 ==========
  const currentDashboardId = ref<number | null>(null) // null = 新建未保存
  const dashboardName = ref('未命名报表')
  const isDirty = ref(false) // 是否有未保存的改动
  const isSaving = ref(false)
  const isLoading = ref(false)
  /** 🔑 模板编辑模式：保存时走模板接口而非看板接口 */
  const isTemplateMode = ref(false)
  const currentTemplateId = ref<number | null>(null) // null = 新建模板未保存
  /** 🔑 模板元数据（编辑模式预填、保存时回写，保持 dialog 预填一致） */
  const templateDescription = ref('')
  const templateCategory = ref<string | undefined>(undefined)
  const templateIsPublic = ref(true)
  /** 🔑 另存为/导入后，重设看板 id（下次 saveDashboard 会新建一条后端记录） */
  function setDashboardId(id: number | null) {
    currentDashboardId.value = id
  }
  function setDashboardName(name: string) {
    dashboardName.value = name || '未命名报表'
  }

  // ========== 剪贴板（复制/粘贴） ==========
  // 🔑 模块级剪贴板：存储序列化后的组件快照，用于 Ctrl+C / Ctrl+V。
  //   同时尝试写入系统剪贴板（JSON 格式），以便跨编辑器实例或跨页面粘贴。
  const BI_CLIPBOARD_MIME = 'application/x-vue3-bi-component'
  let clipboardData: ComponentInstance[] | null = null

  /**
   * 复制选中组件到剪贴板。
   *   - 优先复制所有 selectedIds（多选）
   *   - 回退到 selectedId（单选）
   *   - 纯模块内：存储序列化后快照（完全剥离 Proxy/响应式引用）
   *   - 系统剪贴板：写入自定义 MIME 类型，支持跨实例粘贴
   */
  async function copyToClipboard() {
    const ids =
      selectedIds.value.length > 0
        ? [...selectedIds.value]
        : selectedId.value
          ? [selectedId.value]
          : []
    if (ids.length === 0) return false
    const serialized = JSON.stringify(
      ids
        .map((id) => components.value.find((c) => c.id === id))
        .filter(Boolean)
        .map((c) => ({ ...c })),
    )
    const parsed = JSON.parse(serialized) as ComponentInstance[]
    clipboardData = parsed

    // 🔑 尝试写入系统剪贴板（需要 https 或 localhost；失败静默忽略）
    try {
      if (navigator.clipboard && ClipboardItem) {
        const blob = new Blob([serialized], { type: BI_CLIPBOARD_MIME })
        const textBlob = new Blob([serialized], { type: 'text/plain' })
        await navigator.clipboard.write([
          new ClipboardItem({
            [BI_CLIPBOARD_MIME]: blob,
            'text/plain': textBlob,
          }),
        ])
      }
    } catch {
      /* 用户未授权或 http 环境，模块内剪贴板已可用 */
    }
    return true
  }

  /**
   * 从剪贴板粘贴组件。
   *   - 优先从系统剪贴板读取自定义 MIME
   *   - 回退到模块内剪贴板
   *   - 回退到读取 text/plain 并尝试 JSON 解析
   */
  async function pasteFromClipboard() {
    let sources: ComponentInstance[] | null = null

    // 1. 尝试从系统剪贴板读取
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read()
        for (const item of items) {
          if (item.types.includes(BI_CLIPBOARD_MIME)) {
            const blob = (await item.getType(BI_CLIPBOARD_MIME)) as Blob
            const text = await blob.text()
            sources = JSON.parse(text) as ComponentInstance[]
            break
          }
          if (item.types.includes('text/plain') && !sources) {
            const blob = (await item.getType('text/plain')) as Blob
            const text = await blob.text()
            try {
              const parsed = JSON.parse(text)
              if (Array.isArray(parsed) && parsed.length && parsed[0]?.id && parsed[0]?.type) {
                sources = parsed as ComponentInstance[]
              }
            } catch {
              /* 非 JSON 文本，不是组件数据 */
            }
          }
        }
      }
    } catch {
      /* 用户未授权或 API 不可用 */
    }

    // 2. 回退模块内剪贴板
    if (!sources) sources = clipboardData
    if (!sources || sources.length === 0) return

    // 🔑 粘贴：生成新 ID，位置偏移 20px，重设 zIndex（在现有最大 zIndex 之上依次递增）
    const maxZ =
      components.value.length > 0 ? Math.max(...components.value.map((c) => c.zIndex)) : 0
    sources.forEach((src, idx) => {
      const copy: ComponentInstance = {
        ...src,
        id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: `${src.name} (副本)`,
        x: src.x + 20 + idx * 10,
        y: src.y + 20 + idx * 10,
        zIndex: maxZ + 1 + idx,
        props: { ...src.props },
        style: { ...src.style },
      }
      components.value.push(copy)
      selectedId.value = copy.id
    })
    pushHistory()
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

  /** 保存看板:新建调 create,已有调 update */
  async function saveDashboard() {
    if (isSaving.value) return
    isSaving.value = true
    try {
      // 🔑 保存前截取画布快照作为缩略图（失败不阻断保存）
      let thumbnail: string | undefined
      try {
        thumbnail = (await captureThumbnail()) ?? undefined
      } catch (e) {
        console.warn('[bi-editor] captureThumbnail failed, save without thumbnail', e)
      }
      const payload = {
        name: dashboardName.value,
        layout: serializeLayout() as unknown as Record<string, unknown>,
        thumbnail,
      }
      if (currentDashboardId.value === null) {
        const res = await createDashboard(payload)
        currentDashboardId.value = res.data.id
      } else {
        await updateDashboard(currentDashboardId.value, payload)
      }
      isDirty.value = false
      ElMessage.success('保存成功')
    } finally {
      isSaving.value = false
    }
  }

  /** 新建空白看板 */
  function newDashboard() {
    isLoading.value = true
    currentDashboardId.value = null
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

  /**
   * 🔑 刷新所有图表数据 (预览/分享页场景):
   * 1. 清除 useDatasetBinding 模块级缓存
   * 2. 递增 refreshSignal → 所有 useDatasetBinding 实例自动重新取数
   *    （替代旧的 refreshKey + v-for key 强制重挂载，避免 ECharts/VDR/ResizeObserver 全部重新初始化）
   * 延迟 import 避免循环依赖。
   */
  async function refreshAllData() {
    const { clearAllDatasetCache, triggerDatasetRefresh } = await import('@/views/bi-editor/composables/useDatasetBinding')
    clearAllDatasetCache()
    triggerDatasetRefresh()
  }

  // ========== 🔑 画布导出 PNG ==========
  /** 由 CanvasArea 在 onMounted 里注册一个导出 PNG 的回调，避免跨组件 ref 穿透 */
  let exportPngCallback: (() => Promise<string | null>) | null = null
  const isExportingPng = ref(false)

  function registerExportPng(fn: () => Promise<string | null>) {
    exportPngCallback = fn
    return () => {
      if (exportPngCallback === fn) exportPngCallback = null
    }
  }

  function triggerDownload(dataUrl: string, filename: string) {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async function exportCanvasAsPng() {
    if (!exportPngCallback) {
      console.warn('[bi-editor] 导出 PNG：CanvasArea 未注册导出回调')
      return false
    }
    isExportingPng.value = true
    try {
      const dataUrl = await exportPngCallback()
      if (!dataUrl) return false
      const safeName = (dashboardName.value || '看板').replace(/[\\/:*?"<>|]/g, '_')
      const ts = new Date()
      const pad = (n: number) => n.toString().padStart(2, '0')
      const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(
        ts.getHours(),
      )}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`
      triggerDownload(dataUrl, `${safeName}_${stamp}.png`)
      return true
    } finally {
      isExportingPng.value = false
    }
  }

  /**
   * 🔑 截取画布缩略图：复用 CanvasArea 注册的 toPng 回调生成完整 PNG，
   *    再缩放到 320px 宽的 JPEG data URL（大幅缩小体积，适合列表展示与存储）。
   *    无画布/无回调时返回 null（不阻断保存流程）。
   */
  async function captureThumbnail(): Promise<string | null> {
    if (!exportPngCallback) return null
    const fullDataUrl = await exportPngCallback()
    if (!fullDataUrl) return null
    return new Promise<string | null>((resolve) => {
      const img = new Image()
      img.onload = () => {
        const maxW = 320
        const scale = img.width > 0 ? Math.min(1, maxW / img.width) : 1
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const cv = document.createElement('canvas')
        cv.width = w
        cv.height = h
        const ctx = cv.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        try {
          resolve(cv.toDataURL('image/jpeg', 0.7))
        } catch {
          resolve(null)
        }
      }
      img.onerror = () => resolve(null)
      img.src = fullDataUrl
    })
  }

  /** 🔑 进入「新建模板」模式：清空画布并标记为模板模式 */
  function newTemplate() {
    isLoading.value = true
    isTemplateMode.value = true
    currentTemplateId.value = null
    currentDashboardId.value = null
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
  }) {
    if (isSaving.value) return null
    isSaving.value = true
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
        ElMessage.success('模板保存成功')
        return res.data
      }
    } finally {
      isSaving.value = false
    }
  }

  // ========== 导出 ==========
  return {
    // 状态
    canvas,
    components,
    selectedId,
    selectedIds,
    selectedComponent,
    selectedComponents,
    selectedIdSet,
    layerList,
    guides,
    // 元数据
    getMeta,
    CATEGORY_GROUPS,
    CATEGORY_LABELS,
    // 组件方法
    addComponent,
    updateComponent,
    moveComponent,
    resizeComponent,
    setComponentZIndex,
    bringToFront,
    sendToBack,
    moveUp,
    moveDown,
    removeComponent,
    duplicateComponent,
    toggleVisibility,
    toggleLock,
    selectComponent,
    selectComponentAccum,
    selectByRect,
    clearSelection,
    // 🔑 O(1) 组件查找（Map 索引）
    getComponent,
    // 🔑 分组包围盒 & 命中测试（统一 GroupBox 边框 + 空白区整体拖拽）
    selectedGroupBounds,
    isInSelectedGroup,
    hitTestSelectedGroupBlank,
    isCommittingGroupDragNow,
    // 🔑 分组拖拽预览（必须暴露给画布层使用：store.groupDragPreview 喂给 CanvasComponentItem，
    //   store.commitGroupDrag 在 dragstop 提交，store.abortGroupDrag 在纯点击/拉伸/恢复时清空）
    groupDragPreview,
    activeDragGroupId,
    activeDragId,
    setDragPreview,
    commitGroupDrag,
    abortGroupDrag,
    // 对齐 / 分布
    alignLeft,
    alignHCenter,
    alignRight,
    alignTop,
    alignVCenter,
    alignBottom,
    distributeHorizontal,
    distributeVertical,
    // 分组 / 取消分组
    canGroup,
    canUngroup,
    groupSelection,
    ungroupSelection,
    // 层级操作状态
    canBringToFront,
    canSendToBack,
    canMoveUp,
    canMoveDown,
    // 画布方法
    updateCanvas,
    setZoom,
    resetViewport,
    // 辅助线方法
    addGuide,
    removeGuide,
    setGuides,
    setGuidesSilent,
    clearGuides,
    // 历史方法
    undo,
    redo,
    canUndo,
    canRedo,
    pushHistory,
    clearHistory,
    isRestoringNow,
    // 剪贴板方法
    copyToClipboard,
    pasteFromClipboard,
    // 看板会话状态
    currentDashboardId,
    setDashboardId,
    dashboardName,
    setDashboardName,
    isDirty,
    markDirty,
    isSaving,
    isLoading,
    // 看板持久化方法
    serializeLayout,
    applyLayout,
    loadDashboard,
    saveDashboard,
    newDashboard,
    newTemplate,
    loadTemplate,
    saveTemplate,
    isTemplateMode,
    currentTemplateId,
    templateDescription,
    templateCategory,
    templateIsPublic,
    captureThumbnail,
    refreshAllData,
    // 画布导出 PNG
    isExportingPng,
    registerExportPng,
    exportCanvasAsPng,
  }
})
