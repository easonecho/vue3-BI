import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ComponentInstance,
  ComponentMeta,
  ComponentType,
  CanvasState,
  GuideLine,
  HistorySnapshot,
} from '@/views/bi-editor/types'

/** 组件模板库 */
const COMPONENT_META: Record<ComponentType, ComponentMeta> = {
  text: {
    type: 'text',
    name: '文本',
    category: 'basic',
    icon: 'Document',
    defaultWidth: 120,
    defaultHeight: 40,
    defaultProps: { text: '文本内容', fontSize: 14, color: '#333333' },
    defaultStyle: {},
  },
  image: {
    type: 'image',
    name: '图片',
    category: 'basic',
    icon: 'Picture',
    defaultWidth: 160,
    defaultHeight: 120,
    defaultProps: { src: '', alt: '' },
    defaultStyle: {},
  },
  rect: {
    type: 'rect',
    name: '矩形',
    category: 'basic',
    icon: 'FullScreen',
    defaultWidth: 100,
    defaultHeight: 80,
    defaultProps: { borderRadius: 0 },
    defaultStyle: { backgroundColor: '#E5E7EB' },
  },
  line: {
    type: 'line',
    name: '直线',
    category: 'basic',
    icon: 'Minus',
    defaultWidth: 200,
    defaultHeight: 2,
    defaultProps: { direction: 'horizontal' },
    defaultStyle: { backgroundColor: '#999999' },
  },
  'bar-chart': {
    type: 'bar-chart',
    name: '柱状图',
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 400,
    defaultHeight: 300,
    defaultProps: { title: '柱状图', data: [] },
    defaultStyle: {},
  },
  'line-chart': {
    type: 'line-chart',
    name: '折线图',
    category: 'chart',
    icon: 'TrendCharts',
    defaultWidth: 400,
    defaultHeight: 300,
    defaultProps: { title: '折线图', data: [] },
    defaultStyle: {},
  },
  'pie-chart': {
    type: 'pie-chart',
    name: '饼图',
    category: 'chart',
    icon: 'PieChart',
    defaultWidth: 300,
    defaultHeight: 300,
    defaultProps: { title: '饼图', data: [] },
    defaultStyle: {},
  },
  'scatter-chart': {
    type: 'scatter-chart',
    name: '散点图',
    category: 'chart',
    icon: 'DataPoint',
    defaultWidth: 400,
    defaultHeight: 300,
    defaultProps: { title: '散点图', data: [] },
    defaultStyle: {},
  },
  table: {
    type: 'table',
    name: '表格',
    category: 'data',
    icon: 'Grid',
    defaultWidth: 500,
    defaultHeight: 200,
    defaultProps: { columns: [], data: [] },
    defaultStyle: {},
  },
  number: {
    type: 'number',
    name: '数字',
    category: 'info',
    icon: 'Odometer',
    defaultWidth: 100,
    defaultHeight: 60,
    defaultProps: { value: 0, prefix: '', suffix: '', fontSize: 24 },
    defaultStyle: {},
  },
  gauge: {
    type: 'gauge',
    name: '仪表盘',
    category: 'info',
    icon: 'Odometer',
    defaultWidth: 200,
    defaultHeight: 200,
    defaultProps: { value: 50, max: 100 },
    defaultStyle: {},
  },
  progress: {
    type: 'progress',
    name: '进度条',
    category: 'info',
    icon: 'Loading',
    defaultWidth: 300,
    defaultHeight: 20,
    defaultProps: { value: 0, max: 100 },
    defaultStyle: {},
  },
  indicator: {
    type: 'indicator',
    name: '指标卡',
    category: 'info',
    icon: 'Flag',
    defaultWidth: 200,
    defaultHeight: 100,
    defaultProps: { title: '指标', value: 0, unit: '' },
    defaultStyle: {},
  },
}

export const useBiEditorStore = defineStore('bi-editor', () => {
  // ========== 画布状态 ==========
  const canvas = ref<CanvasState>({
    width: 1920,
    height: 1080,
    zoom: 1,
    backgroundColor: '#FFFFFF',
    backgroundImage: '',
    showGrid: true,
    gridSize: 10,
    snapToGrid: true,
    showRuler: true,
    showGuides: true,
    scrollX: 0,
    scrollY: 0,
  })

  // ========== 组件列表 ==========
  const components = ref<ComponentInstance[]>([])

  // ========== 选中组件 ID ==========
  const selectedId = ref<string | null>(null)

  // ========== 辅助线 ==========
  const guides = ref<GuideLine[]>([])

  // ========== 历史记录 ==========
  const history = ref<HistorySnapshot[]>([])
  const historyIndex = ref(-1)
  const MAX_HISTORY = 100

  // ========== 计算属性 ==========
  const selectedComponent = computed(() =>
    components.value.find((c) => c.id === selectedId.value) ?? null,
  )

  const layerList = computed(() =>
    [...components.value].sort((a, b) => b.zIndex - a.zIndex),
  )

  // ========== 方法 ==========

  /** 生成唯一 ID */
  function generateId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  /** 获取组件元信息 */
  function getMeta(type: ComponentType): ComponentMeta | undefined {
    return COMPONENT_META[type]
  }

  /** 创建组件实例 */
  function createComponent(type: ComponentType, x: number, y: number): ComponentInstance {
    const meta = COMPONENT_META[type]
    return {
      id: generateId(),
      type,
      name: meta.name,
      x,
      y,
      width: meta.defaultWidth,
      height: meta.defaultHeight,
      zIndex: components.value.length + 1,
      visible: true,
      locked: false,
      props: { ...meta.defaultProps },
      style: { ...meta.defaultStyle },
    }
  }

  /** 添加组件到画布 */
  function addComponent(type: ComponentType, x: number, y: number) {
    const instance = createComponent(type, x, y)
    components.value.push(instance)
    selectedId.value = instance.id
    pushHistory()
    return instance
  }

  /** 更新组件属性 */
  function updateComponent(id: string, updates: Partial<ComponentInstance>) {
    const index = components.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      components.value[index] = { ...components.value[index], ...updates }
      pushHistory()
    }
  }

  /** 更新组件位置 */
  function moveComponent(id: string, x: number, y: number) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.x = x
      comp.y = y
    }
  }

  /** 更新组件大小 */
  function resizeComponent(id: string, width: number, height: number) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.width = width
      comp.height = height
    }
  }

  /** 更新组件 zIndex */
  function setComponentZIndex(id: string, zIndex: number) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.zIndex = zIndex
      pushHistory()
    }
  }

  /** 置顶 */
  function bringToFront(id: string) {
    const maxZ = Math.max(...components.value.map((c) => c.zIndex), 0)
    setComponentZIndex(id, maxZ + 1)
  }

  /** 置底 */
  function sendToBack(id: string) {
    const minZ = Math.min(...components.value.map((c) => c.zIndex), 0)
    setComponentZIndex(id, minZ - 1)
  }

  /** 上移一层 */
  function moveUp(id: string) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      setComponentZIndex(id, comp.zIndex + 1)
    }
  }

  /** 下移一层 */
  function moveDown(id: string) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      setComponentZIndex(id, comp.zIndex - 1)
    }
  }

  /** 删除组件 */
  function removeComponent(id: string) {
    const index = components.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      components.value.splice(index, 1)
      if (selectedId.value === id) {
        selectedId.value = null
      }
      pushHistory()
    }
  }

  /** 复制组件 */
  function duplicateComponent(id: string) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      const copy: ComponentInstance = {
        ...comp,
        id: generateId(),
        name: `${comp.name} (副本)`,
        x: comp.x + 20,
        y: comp.y + 20,
        zIndex: comp.zIndex + 1,
        props: { ...comp.props },
        style: { ...comp.style },
      }
      components.value.push(copy)
      selectedId.value = copy.id
      pushHistory()
    }
  }

  /** 切换可见性 */
  function toggleVisibility(id: string) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.visible = !comp.visible
      pushHistory()
    }
  }

  /** 切换锁定 */
  function toggleLock(id: string) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.locked = !comp.locked
      pushHistory()
    }
  }

  /** 设置选中组件 */
  function selectComponent(id: string | null) {
    selectedId.value = id
  }

  /** 更新画布属性 */
  function updateCanvas(updates: Partial<CanvasState>) {
    canvas.value = { ...canvas.value, ...updates }
    pushHistory()
  }

  /** 设置缩放 */
  function setZoom(zoom: number) {
    const clamped = Math.min(Math.max(zoom, 0.1), 5)
    canvas.value.zoom = Math.round(clamped * 100) / 100
  }

  /** 添加辅助线 */
  function addGuide(guide: Omit<GuideLine, 'id'>) {
    guides.value.push({ ...guide, id: `guide_${Date.now()}` })
  }

  /** 清除辅助线 */
  function clearGuides() {
    guides.value = []
  }

  // ========== 历史记录 ==========

  /** 创建快照 */
  function createSnapshot(): HistorySnapshot {
    return {
      components: JSON.parse(JSON.stringify(components.value)),
      canvas: JSON.parse(JSON.stringify(canvas.value)),
      selectedId: selectedId.value,
    }
  }

  /** 从快照恢复 */
  function restoreSnapshot(snapshot: HistorySnapshot) {
    components.value = JSON.parse(JSON.stringify(snapshot.components))
    canvas.value = JSON.parse(JSON.stringify(snapshot.canvas))
    selectedId.value = snapshot.selectedId
  }

  /** 推入历史记录 */
  function pushHistory() {
    // 如果在撤销后有新操作，清除 redo 历史
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    history.value.push(createSnapshot())
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    }
    historyIndex.value = history.value.length - 1
  }

  /** 撤销 */
  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--
      restoreSnapshot(history.value[historyIndex.value])
    }
  }

  /** 重做 */
  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      restoreSnapshot(history.value[historyIndex.value])
    }
  }

  /** 清空历史 */
  function clearHistory() {
    history.value = [createSnapshot()]
    historyIndex.value = 0
  }

  /** 是否可以撤销 */
  function canUndo(): boolean {
    return historyIndex.value > 0
  }

  /** 是否可以重做 */
  function canRedo(): boolean {
    return historyIndex.value < history.value.length - 1
  }

  return {
    // 状态
    canvas,
    components,
    selectedId,
    selectedComponent,
    layerList,
    guides,
    // 方法
    getMeta,
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
    updateCanvas,
    setZoom,
    addGuide,
    clearGuides,
    undo,
    redo,
    canUndo,
    canRedo,
    pushHistory,
    clearHistory,
  }
})
