import type { ComponentInstance, ComponentType } from '@/views/bi-editor/types'
import { getMeta } from '../metadata'
import type { ComponentIndexApi, OpsDeps } from './types'

/** 🔑 组件增删改（与分组冻结框的联动清理） */
export function createComponentCrud(deps: OpsDeps, index: ComponentIndexApi) {
  const { components, selectedId, pushHistory } = deps
  const { getComponent } = index

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
      // 🔑 数据绑定默认值:新建组件无数据集绑定,空 dataConfig
      dataSource: { datasetId: null },
      dataConfig: {},
    }
  }

  function addComponent(type: ComponentType, x: number, y: number) {
    const instance = createComponent(type, x, y)
    components.value.push(instance)
    selectedId.value = instance.id
    // 🔑 如果新组件被放入某个已有分组（如拖入分组后立即 add），清该组冻结，强制重算新框
    if (instance.groupId) {
      for (const c of components.value) {
        if (c.groupId === instance.groupId) c.fixedGroupBox = undefined
      }
    }
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

  function removeComponent(id: string) {
    const i = components.value.findIndex((c) => c.id === id)
    if (i !== -1) {
      const removedGid = components.value[i].groupId
      components.value.splice(i, 1)
      if (selectedId.value === id) {
        selectedId.value = null
      }
      // 🔑 删组员 → 组组成变化 → 清该组冻结，强制重算新框（反映实际成员范围）
      if (removedGid) {
        for (const c of components.value) {
          if (c.groupId === removedGid) c.fixedGroupBox = undefined
        }
      }
      pushHistory()
    }
  }

  function duplicateComponent(id: string) {
    const comp = getComponent(id)
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
    const comp = getComponent(id)
    if (comp) {
      comp.visible = !comp.visible
      pushHistory()
    }
  }

  function toggleLock(id: string) {
    const comp = getComponent(id)
    if (comp) {
      comp.locked = !comp.locked
      pushHistory()
    }
  }

  return {
    generateId,
    createComponent,
    addComponent,
    updateComponent,
    removeComponent,
    duplicateComponent,
    toggleVisibility,
    toggleLock,
  }
}
