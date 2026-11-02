import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import type { useBiEditorStore } from '@/stores/bi-editor'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

interface CanvasExportPngOptions {
  store: BiEditorStore
  /** 预览/发布模式不注册导出回调 */
  readonly: boolean
  /** 画布 sheet DOM（导出裁剪目标） */
  canvasSheetRef: Ref<HTMLElement | null>
  /** 右键菜单（导出前隐藏，避免出现在图片里） */
  contextMenuRef: Ref<{ hide: () => void } | null>
}

/**
 * 🔑 画布导出 PNG：注册回调给 store（配合 html-to-image）。
 *
 * 导出前：临时清除选中高亮、关闭右键菜单、隐藏 info-bar；
 * 导出后：恢复原有选中状态与 info-bar。
 * 从 CanvasArea 的自定义局部逻辑抽出，回调注册/注销随组件生命周期。
 */
export function useCanvasExportPng(options: CanvasExportPngOptions) {
  const { store, readonly, canvasSheetRef, contextMenuRef } = options

  let unregister: (() => void) | null = null

  onMounted(() => {
    if (readonly) return
    unregister = store.registerExportPng(async () => {
      const { toPng } = await import('html-to-image')
      const sheet = canvasSheetRef.value
      if (!sheet) return null
      // 1) 临时隐藏选中指示：多选高亮 / marquee / contextmenu / info-bar
      //    通过动态给 canvas-sheet 加 class + 父容器 style，避免影响 toPng 读取 DOM
      const priorInfoBar = document.querySelector<HTMLElement>('.canvas-info-bar')
      const priorSelectedIds = new Set<string>(store.selectedIds ?? [])
      const priorSelectedId = store.selectedId
      contextMenuRef.value?.hide?.()
      // 2) 临时清空选中态（保证导出图片没有蓝色选中框）
      store.clearSelection()
      if (priorInfoBar) priorInfoBar.style.display = 'none'
      try {
        // 使用 toPng，将 canvas-sheet 的尺寸作为像素尺寸
        return await toPng(sheet, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: store.canvas.backgroundColor || '#ffffff',
          // 过滤不必要的水印/右键菜单 DOM
          filter: (node) => {
            const cls = (node as HTMLElement).className
            if (typeof cls !== 'string') return true
            // 跳过右键菜单 overlay / marquee
            if (/bi-context-menu|marquee-rect|canvas-info-bar/.test(cls)) return false
            return true
          },
        })
      } catch (e) {
        console.error('[CanvasArea] export PNG failed', e)
        return null
      } finally {
        // 3) 恢复：选中态 + info-bar 显示
        if (priorSelectedIds.size > 0) {
          priorSelectedIds.forEach((id) => store.selectComponentAccum(id, false))
        } else if (priorSelectedId) {
          store.selectComponent(priorSelectedId)
        }
        if (priorInfoBar) priorInfoBar.style.display = ''
      }
    })
  })

  onBeforeUnmount(() => {
    unregister?.()
    unregister = null
  })
}
