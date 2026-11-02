import { computed, nextTick, ref } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import { useBiEditorStore } from '@/stores/bi-editor'
import ContextMenu from '../canvas/ContextMenu.vue'
import { buildLayerContextMenu, previewScaleStyle } from './layer-list-utils'

/**
 * 🔑 图层列表交互逻辑：搜索过滤、点击选中（含 Shift/Ctrl 多选）、双击重命名、右键菜单。
 *   模板与样式保留在 LayerListTab.vue，本文件不依赖任何 UI 组件（ContextMenu 除外）。
 */
export function useLayerList() {
  const store = useBiEditorStore()

  /** 图层搜索：按名称模糊过滤（不区分大小写），关键词为空时与 store.layerList 一致 */
  const layerKeyword = ref('')
  const filteredLayerList = computed(() => {
    const kw = layerKeyword.value.trim().toLowerCase()
    if (!kw) return store.layerList
    return store.layerList.filter((l) => l.name.toLowerCase().includes(kw))
  })

  /** 图层右键菜单（ContextMenu 实例） */
  const layerCtxRef = ref<InstanceType<typeof ContextMenu> | null>(null)

  /** 图层点击：支持 Shift+Click（范围选中）、Ctrl/Cmd+Click（切换选择） */
  function onLayerClick(e: MouseEvent, layer: ComponentInstance) {
    const isMultiModifier = e.shiftKey || e.ctrlKey || e.metaKey
    if (!isMultiModifier) {
      store.selectComponent(layer.id)
      return
    }
    // Ctrl: 切换单个；Shift: 范围选中（从最后主选中项到当前项中间全部选中）
    if (e.ctrlKey || e.metaKey) {
      store.selectComponentAccum(layer.id, true)
      return
    }
    // Shift+Click：按 store.layerList 的顺序，将 selectedId (主选) 与 layer.id 之间的所有组件一并选中
    if (e.shiftKey) {
      const order = store.layerList.map((l) => l.id)
      const fromIdx = order.indexOf(store.selectedId || layer.id)
      const toIdx = order.indexOf(layer.id)
      const [a, b] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx]
      store.clearSelection()
      for (let i = a; i <= b; i++) {
        store.selectComponentAccum(order[i], false)
      }
      store.selectComponentAccum(layer.id, false)
    }
  }

  /** 双击重命名 */
  const renamingId = ref<string | null>(null)
  const renameDraft = ref('')
  const renameInputRef = ref<{ focus?: () => void; select?: () => void } | null>(null)

  function startRename(layer: ComponentInstance) {
    renamingId.value = layer.id
    renameDraft.value = layer.name
    nextTick(() => {
      renameInputRef.value?.focus?.()
      renameInputRef.value?.select?.()
    })
  }

  function commitRename(layer: ComponentInstance) {
    if (renamingId.value !== layer.id) return
    const newName = renameDraft.value.trim()
    if (newName && newName !== layer.name) {
      store.updateComponent(layer.id, { name: newName })
    }
    renamingId.value = null
  }

  function cancelRename() {
    renamingId.value = null
  }

  /** 图层右键菜单：与画布组件右键一致 */
  function onLayerContextMenu(e: MouseEvent, layer: ComponentInstance) {
    if (!layerCtxRef.value) return
    const groups = buildLayerContextMenu(store, layer, startRename)
    layerCtxRef.value.show(e.clientX, e.clientY, groups)
  }

  return {
    store,
    layerKeyword,
    filteredLayerList,
    layerCtxRef,
    onLayerClick,
    renamingId,
    renameDraft,
    renameInputRef,
    startRename,
    commitRename,
    cancelRename,
    onLayerContextMenu,
    previewScaleStyle,
  }
}
