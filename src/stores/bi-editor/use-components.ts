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
    const maxZ = Math.max(...components.value.map((c) => c.zIndex), 0)
    setComponentZIndex(id, maxZ + 1)
  }

  function sendToBack(id: string) {
    const minZ = Math.min(...components.value.map((c) => c.zIndex), 0)
    setComponentZIndex(id, minZ - 1)
  }

  function moveUp(id: string) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      setComponentZIndex(id, comp.zIndex + 1)
    }
  }

  function moveDown(id: string) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      setComponentZIndex(id, comp.zIndex - 1)
    }
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
  }
}
