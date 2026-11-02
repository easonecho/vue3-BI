import {
  Bottom,
  CopyDocument,
  Delete,
  DocumentCopy,
  Edit,
  Hide as HideIcon,
  Lock as LockIcon,
  Promotion,
  Scissor,
  Setting,
  Top,
  Upload,
} from '@element-plus/icons-vue'
import type { ComponentInstance } from '@/views/bi-editor/types'
import type { useBiEditorStore } from '@/stores/bi-editor'
import type { ContextMenuGroups } from '../ContextMenu.vue'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

/**
 * 🔑 计算缩略图内层 wrapper 的居中缩放样式：
 *   - 外层 position: relative + overflow: hidden + 固定尺寸视口
 *   - 内层 position: absolute; left:50%; top:50%;
 *   - transform: translate(-50%,-50%) scale(x) —— 先按自身尺寸平移居中，再从中心整体缩放
 *   - transform-origin: center center —— 无论 scale 多少，视觉中心都落在视口中心
 */
export function previewScaleStyle(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number,
): Record<string, string> {
  const w = Math.max(1, srcW || 1)
  const h = Math.max(1, srcH || 1)
  const scale = Math.min(maxW / w, maxH / h, 1)
  return {
    width: `${w}px`,
    height: `${h}px`,
    transform: `translate(-50%, -50%) scale(${scale})`,
    transformOrigin: 'center center',
  }
}

/**
 * 🔑 图层右键菜单：与画布组件右键保持一致。
 *   若右键目标不在当前选中集合内，则先单选目标组件。
 */
export function buildLayerContextMenu(
  store: BiEditorStore,
  layer: ComponentInstance,
  startRename: (layer: ComponentInstance) => void,
): ContextMenuGroups {
  if (!store.selectedIdSet.has(layer.id)) {
    store.selectComponent(layer.id)
  }
  const comp = store.selectedComponent
  return [
    [
      {
        label: '重命名',
        icon: Edit,
        shortcut: '双击图层',
        disabled: !store.selectedId,
        action: () => comp && startRename(comp),
      },
      { divider: true },
      {
        label: '剪切',
        icon: Scissor,
        shortcut: 'Ctrl+X',
        action: () => {
          store.copyToClipboard()
          if (store.selectedId) {
            store.removeComponent(store.selectedId)
            store.clearSelection()
          }
        },
      },
      {
        label: '复制',
        icon: DocumentCopy,
        shortcut: 'Ctrl+C',
        action: () => store.copyToClipboard(),
      },
      {
        label: '复制此组件',
        icon: CopyDocument,
        shortcut: 'Ctrl+D',
        disabled: !store.selectedId,
        action: () => store.selectedId && store.duplicateComponent(store.selectedId),
      },
      {
        label: '删除',
        icon: Delete,
        shortcut: 'Delete',
        danger: true,
        disabled: !store.selectedId,
        action: () => {
          const ids =
            store.selectedIds.length > 0
              ? [...store.selectedIds]
              : store.selectedId
                ? [store.selectedId]
                : []
          ids.forEach((id) => store.removeComponent(id))
          store.clearSelection()
        },
      },
    ],
    [
      {
        label: '图层置顶',
        icon: Top,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.bringToFront(store.selectedId),
      },
      {
        label: '图层上移',
        icon: Promotion,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.moveUp(store.selectedId),
      },
      {
        label: '图层下移',
        icon: Upload,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.moveDown(store.selectedId),
      },
      {
        label: '图层置底',
        icon: Bottom,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.sendToBack(store.selectedId),
      },
      { divider: true },
      {
        label: '组合',
        icon: Setting,
        disabled: !store.canGroup,
        action: () => store.groupSelection(),
      },
      {
        label: '取消组合',
        icon: Setting,
        disabled: !store.canUngroup,
        action: () => store.ungroupSelection(),
      },
    ],
    [
      {
        label: comp?.visible ? '隐藏组件' : '显示组件',
        icon: HideIcon,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.toggleVisibility(store.selectedId),
      },
      {
        label: comp?.locked ? '解锁组件' : '锁定组件',
        icon: LockIcon,
        disabled: !store.selectedId,
        action: () => store.selectedId && store.toggleLock(store.selectedId),
      },
    ],
  ]
}
