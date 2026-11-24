import { ref } from 'vue'
import {
  Bottom,
  CopyDocument,
  Delete,
  Document,
  DocumentCopy,
  Hide,
  Lock,
  Promotion,
  Scissor,
  Setting,
  Top,
  Upload,
} from '@element-plus/icons-vue'
import type { useBiEditorStore } from '@/stores/bi-editor'
import type { GuideLine } from '@/views/bi-editor/types'
import ContextMenu from '@/views/bi-editor/components/canvas/ContextMenu.vue'
import type { ContextMenuGroups } from '@/views/bi-editor/components/canvas/ContextMenu.vue'
import i18n from '@/i18n'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

interface CanvasContextMenuOptions {
  store: BiEditorStore
  /** 辅助线命中测试（clientX/clientY → 命中的辅助线） */
  hitTestGuide: (sx: number, sy: number) => GuideLine | null
}

/**
 * 画布右键上下文菜单：组件菜单 / 画布空白菜单 / 辅助线菜单。
 * 从 CanvasArea 抽出，菜单项与动作保持不变。
 */
export function useCanvasContextMenu(options: CanvasContextMenuOptions) {
  const { store, hitTestGuide } = options
  const t = i18n.global.t

  const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)

  /** 🔑 删除多选（若有 groupId，会正常处理，因为删除的是 components） */
  function deleteSelection() {
    const ids =
      store.selectedIds.length > 0
        ? [...store.selectedIds]
        : store.selectedId
          ? [store.selectedId]
          : []
    ids.forEach((id) => store.removeComponent(id))
    store.clearSelection()
  }

  /** 组件右键：若该组件未在多选中，则自动选中它 */
  function onComponentContextMenu(e: MouseEvent, id: string) {
    if (!contextMenuRef.value) return
    if (!store.selectedIdSet.has(id)) {
      store.selectComponent(id)
    }
    const sc = store.selectedComponent
    const isLocked = !!sc?.locked
    const canDelete = store.selectedIds.length > 0 || !!store.selectedId
    const isGrouped = !!sc?.groupId
    const groups: ContextMenuGroups = [
      // —— 第一组：剪贴板操作
      [
        {
          label: t('editorUi.canvas.cut'),
          icon: Scissor,
          shortcut: 'Ctrl+X',
          // 🔑 剪切 = 复制 + 标记删除（粘贴时执行 remove）。此处保守实现为：先复制（剪切的实际删除延后由 paste 完成；目前暂实现为"复制并删除"，等价于剪切）
          action: () => {
            store.copyToClipboard()
            deleteSelection()
          },
        },
        {
          label: t('editorUi.canvas.copy'),
          icon: DocumentCopy,
          shortcut: 'Ctrl+C',
          disabled: !canDelete,
          action: () => store.copyToClipboard(),
        },
        {
          label: t('editorUi.canvas.paste'),
          icon: Document,
          shortcut: 'Ctrl+V',
          action: () => store.pasteFromClipboard(),
        },
        { divider: true },
        {
          label: t('editorUi.canvas.duplicateThis'),
          icon: CopyDocument,
          shortcut: 'Ctrl+D',
          disabled: !store.selectedId,
          action: () => store.duplicateComponent(store.selectedId!),
        },
        {
          label: t('editorUi.canvas.delete'),
          icon: Delete,
          shortcut: 'Delete',
          disabled: !canDelete || isLocked,
          danger: true,
          action: deleteSelection,
        },
      ],
      // —— 第二组：层级 / 分组
      [
        {
          label: t('editorUi.canvas.bringToFront'),
          icon: Top,
          shortcut: 'Ctrl+Shift+]',
          disabled: !store.selectedId || !store.canBringToFront,
          action: () => store.selectedId && store.bringToFront(store.selectedId),
        },
        {
          label: t('editorUi.canvas.moveUp'),
          icon: Promotion,
          shortcut: 'Ctrl+]',
          disabled: !store.selectedId || !store.canMoveUp,
          action: () => store.selectedId && store.moveUp(store.selectedId),
        },
        {
          label: t('editorUi.canvas.moveDown'),
          icon: Upload,
          shortcut: 'Ctrl+[',
          disabled: !store.selectedId || !store.canMoveDown,
          action: () => store.selectedId && store.moveDown(store.selectedId),
        },
        {
          label: t('editorUi.canvas.sendToBack'),
          icon: Bottom,
          shortcut: 'Ctrl+Shift+[',
          disabled: !store.selectedId || !store.canSendToBack,
          action: () => store.selectedId && store.sendToBack(store.selectedId),
        },
        { divider: true },
        {
          label: t('editorUi.canvas.group'),
          icon: Setting,
          disabled: !store.canGroup,
          action: () => store.groupSelection(),
        },
        {
          label: t('editorUi.canvas.ungroup'),
          icon: Setting,
          disabled: !isGrouped && !store.canUngroup,
          action: () => store.ungroupSelection(),
        },
      ],
      // —— 第三组：显示 / 锁定
      [
        {
          label: sc?.visible
            ? t('editorUi.canvas.hideComponent')
            : t('editorUi.canvas.showComponent'),
          icon: Hide,
          disabled: !store.selectedId,
          action: () => store.selectedId && store.toggleVisibility(store.selectedId),
        },
        {
          label: isLocked
            ? t('editorUi.canvas.unlockComponent')
            : t('editorUi.canvas.lockComponent'),
          icon: Lock,
          disabled: !store.selectedId,
          action: () => store.selectedId && store.toggleLock(store.selectedId),
        },
      ],
    ]
    contextMenuRef.value.show(e.clientX, e.clientY, groups)
  }

  /** 右键：若命中 guide，弹出"辅助线右键菜单"（带删除/清空） */
  function showGuideContextMenu(e: MouseEvent, g: GuideLine) {
    if (!contextMenuRef.value) return
    const groups: ContextMenuGroups = [
      [
        {
          label: t('editorUi.canvas.deleteGuide'),
          icon: Delete,
          shortcut: t('editorUi.canvas.deleteGuideShortcut'),
          danger: true,
          action: () => store.removeGuide(g.id),
        },
        { divider: true },
        {
          label: t('editorUi.canvas.clearAllGuides'),
          icon: Delete,
          disabled: store.guides.length === 0,
          danger: true,
          action: () => store.clearGuides(),
        },
      ],
    ]
    contextMenuRef.value.show(e.clientX, e.clientY, groups)
  }

  /** 画布空白右键 */
  function onCanvasContextMenu(e: MouseEvent) {
    if (!contextMenuRef.value) return
    // 🔑 若右键点在辅助线附近：优先显示"辅助线菜单"
    const g = hitTestGuide(e.clientX, e.clientY)
    if (g) {
      showGuideContextMenu(e, g)
      return
    }
    const groups: ContextMenuGroups = [
      [
        {
          label: t('editorUi.canvas.paste'),
          icon: Document,
          shortcut: 'Ctrl+V',
          action: () => store.pasteFromClipboard(),
        },
        { divider: true },
        {
          label: t('editorUi.canvas.selectAll'),
          icon: DocumentCopy,
          shortcut: 'Ctrl+A',
          disabled: store.components.length === 0,
          action: () => {
            const next = new Set<string>()
            store.components.forEach((c: any) => next.add(c.id))
            store.clearSelection()
            // 🔑 用 selectByRect 模拟 —— 直接塞 selectedIds（调用 store 的 API 才稳妥）
            const rect = {
              x: 0,
              y: 0,
              width: store.canvas.width,
              height: store.canvas.height,
            }
            store.selectByRect(rect, false)
          },
        },
        {
          label: t('editorUi.canvas.deselect'),
          disabled: !store.selectedId && store.selectedIds.length === 0,
          action: () => store.clearSelection(),
        },
      ],
      [
        {
          label: t('editorUi.canvas.undo'),
          shortcut: 'Ctrl+Z',
          disabled: !store.canUndo,
          action: () => store.undo(),
        },
        {
          label: t('editorUi.canvas.redo'),
          shortcut: 'Ctrl+Y',
          disabled: !store.canRedo,
          action: () => store.redo(),
        },
        { divider: true },
        {
          label: t('editorUi.canvas.zoom100'),
          shortcut: 'Ctrl+0',
          action: () => store.setZoom(1),
        },
        {
          label: t('editorUi.canvas.resetViewport'),
          action: () => store.resetViewport(),
        },
      ],
    ]
    contextMenuRef.value.show(e.clientX, e.clientY, groups)
  }

  return { contextMenuRef, onComponentContextMenu, onCanvasContextMenu }
}
