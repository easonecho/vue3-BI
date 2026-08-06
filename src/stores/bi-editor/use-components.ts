import { computed, type Ref } from 'vue'
import type { ComponentInstance, ComponentType } from '@/views/bi-editor/types'
import { getMeta } from './metadata'

/** 组件操作 API（用于类型约束与文档） */
export interface ComponentOperationsApi {
  selectedComponent: ReturnType<typeof computed<ComponentInstance | null>>
  layerList: ReturnType<typeof computed<ComponentInstance[]>>
  generateId: () => string
  createComponent: (type: ComponentType, x: number, y: number) => ComponentInstance
  addComponent: (type: ComponentType, x: number, y: number) => ComponentInstance
  updateComponent: (id: string, updates: Partial<ComponentInstance>) => void
  moveComponent: (id: string, x: number, y: number) => void
  resizeComponent: (id: string, width: number, height: number) => void
  setComponentZIndex: (id: string, zIndex: number) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  moveUp: (id: string) => void
  moveDown: (id: string) => void
  removeComponent: (id: string) => void
  duplicateComponent: (id: string) => void
  toggleVisibility: (id: string) => void
  toggleLock: (id: string) => void
  selectComponent: (id: string | null) => void
  canBringToFront: ReturnType<typeof computed<boolean>>
  canSendToBack: ReturnType<typeof computed<boolean>>
  canMoveUp: ReturnType<typeof computed<boolean>>
  canMoveDown: ReturnType<typeof computed<boolean>>
}

export function useComponentOperations(
  components: Ref<ComponentInstance[]>,
  selectedId: Ref<string | null>,
  pushHistory: () => void,
) {
  const selectedComponent = computed(
    () => components.value.find((c) => c.id === selectedId.value) ?? null,
  )

  const layerList = computed(() => [...components.value].sort((a, b) => b.zIndex - a.zIndex))

  // 🔑 层级操作禁用状态：
  //   - 只有一个组件时所有操作均禁用
  //   - 组件在最顶层时 canBringToFront/canMoveUp 禁用
  const maxZ = computed(() =>
    components.value.length > 0 ? Math.max(...components.value.map((c) => c.zIndex)) : 0,
  )
  const minZ = computed(() =>
    components.value.length > 0 ? Math.min(...components.value.map((c) => c.zIndex)) : 0,
  )
  const canBringToFront = computed(
    () =>
      !!selectedComponent.value &&
      components.value.length > 1 &&
      selectedComponent.value.zIndex < maxZ.value,
  )
  const canSendToBack = computed(
    () =>
      !!selectedComponent.value &&
      components.value.length > 1 &&
      selectedComponent.value.zIndex > minZ.value,
  )
  const canMoveUp = computed(() => canBringToFront.value)
  const canMoveDown = computed(() => canSendToBack.value)

  function generateId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  function createComponent(type: ComponentType, x: number, y: number): ComponentInstance {
    const meta = getMeta(type)
    return {
      id: generateId(),
      type,
      name: meta?.name ?? type,
      x,
      y,
      width: meta?.defaultWidth ?? 100,
      height: meta?.defaultHeight ?? 100,
      zIndex: components.value.length + 1,
      visible: true,
      locked: false,
      props: { ...meta?.defaultProps },
      style: { ...meta?.defaultStyle },
    }
  }

  function addComponent(type: ComponentType, x: number, y: number) {
    const instance = createComponent(type, x, y)
    components.value.push(instance)
    selectedId.value = instance.id
    pushHistory()
    return instance
  }

  function updateComponent(id: string, updates: Partial<ComponentInstance>) {
    const index = components.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      components.value[index] = { ...components.value[index], ...updates }
      pushHistory()
    }
  }

  function moveComponent(id: string, x: number, y: number) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.x = x
      comp.y = y
    }
  }

  function resizeComponent(id: string, width: number, height: number) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.width = width
      comp.height = height
    }
  }

  function setComponentZIndex(id: string, zIndex: number) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.zIndex = zIndex
      pushHistory()
    }
  }

  function bringToFront(id: string) {
    const comp = components.value.find((c) => c.id === id)
    if (!comp) return
    // 🔑 保持相对顺序：目标组件移到最顶层，其余组件整体下移一格。
    //   例：[1,2,3,4,5,6] 把 1 置顶 → [2,3,4,5,6,1]（而非 [6,2,3,4,5,1]）
    const others = components.value.filter((c) => c.id !== id).sort((a, b) => a.zIndex - b.zIndex)
    if (others.length === 0) return
    const maxOtherZ = others[others.length - 1].zIndex
    if (comp.zIndex > maxOtherZ) return // 已经在最顶层
    // 其余组件整体下移 1 格（保持相对顺序），目标组件占据原最高位
    others.forEach((c) => {
      c.zIndex -= 1
    })
    comp.zIndex = maxOtherZ
    pushHistory()
  }

  function sendToBack(id: string) {
    const comp = components.value.find((c) => c.id === id)
    if (!comp) return
    // 🔑 保持相对顺序：目标组件移到最底层，其余组件整体上移一格。
    //   例：[1,2,3,4,5,6] 把 6 置底 → [6,1,2,3,4,5]（而非 [6,2,3,4,5,1]）
    const others = components.value.filter((c) => c.id !== id).sort((a, b) => a.zIndex - b.zIndex)
    if (others.length === 0) return
    const minOtherZ = others[0].zIndex
    if (comp.zIndex < minOtherZ) return // 已经在最底层
    // 其余组件整体上移 1 格（保持相对顺序），目标组件占据原最低位
    others.forEach((c) => {
      c.zIndex += 1
    })
    comp.zIndex = minOtherZ
    pushHistory()
  }

  function moveUp(id: string) {
    const comp = components.value.find((c) => c.id === id)
    if (!comp) return
    // 🔑 找到 z-index 比当前组件大的最小组件（上一层），互换 zIndex
    const upperComps = components.value.filter((c) => c.zIndex > comp.zIndex)
    if (upperComps.length === 0) return
    const nextUpper = upperComps.reduce(
      (min, c) => (c.zIndex < min.zIndex ? c : min),
      upperComps[0],
    )
    const temp = comp.zIndex
    comp.zIndex = nextUpper.zIndex
    nextUpper.zIndex = temp
    pushHistory()
  }

  function moveDown(id: string) {
    const comp = components.value.find((c) => c.id === id)
    if (!comp) return
    // 🔑 找到 z-index 比当前组件小的最大组件（下一层），互换 zIndex
    const lowerComps = components.value.filter((c) => c.zIndex < comp.zIndex)
    if (lowerComps.length === 0) return
    const nextLower = lowerComps.reduce(
      (max, c) => (c.zIndex > max.zIndex ? c : max),
      lowerComps[0],
    )
    const temp = comp.zIndex
    comp.zIndex = nextLower.zIndex
    nextLower.zIndex = temp
    pushHistory()
  }

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

  function toggleVisibility(id: string) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.visible = !comp.visible
      pushHistory()
    }
  }

  function toggleLock(id: string) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.locked = !comp.locked
      pushHistory()
    }
  }

  function selectComponent(id: string | null) {
    selectedId.value = id
  }

  return {
    selectedComponent,
    layerList,
    generateId,
    createComponent,
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
    canBringToFront,
    canSendToBack,
    canMoveUp,
    canMoveDown,
  }
}
