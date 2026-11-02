import { ElMessage } from 'element-plus'
import type { useBiEditorStore } from '@/stores/bi-editor'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

export interface HeaderExportApi {
  handleExportPng: () => Promise<void>
  handleExportPdf: () => Promise<void>
}

/**
 * 🔑 顶栏画布导出（PNG / PDF）。
 *
 * 空画布前置提示，导出失败统一提示；实际导出逻辑在 store 中。
 */
export function useHeaderExport(store: BiEditorStore): HeaderExportApi {
  async function handleExportPng() {
    if (store.components.length === 0) {
      ElMessage.warning('画布上还没有组件，无法导出')
      return
    }
    try {
      const ok = await store.exportCanvasAsPng()
      if (ok) {
        ElMessage.success('PNG 已开始下载 🎉')
      } else {
        ElMessage.error('导出 PNG 失败，请刷新后重试')
      }
    } catch (e) {
      console.error('[HeaderToolbar] export PNG failed', e)
      ElMessage.error('导出 PNG 失败')
    }
  }

  async function handleExportPdf() {
    if (store.components.length === 0) {
      ElMessage.warning('画布上还没有组件，无法导出')
      return
    }
    try {
      const ok = await store.exportCanvasAsPdf()
      if (ok) {
        ElMessage.success('已打开打印窗口，请选择「另存为 PDF」')
      } else {
        ElMessage.error('导出 PDF 失败（若浏览器拦截弹窗，请允许后重试）')
      }
    } catch (e) {
      console.error('[HeaderToolbar] export PDF failed', e)
      ElMessage.error('导出 PDF 失败')
    }
  }

  return { handleExportPng, handleExportPdf }
}
