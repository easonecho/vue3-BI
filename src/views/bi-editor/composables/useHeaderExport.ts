import { ElMessage } from 'element-plus'
import type { useBiEditorStore } from '@/stores/bi-editor'
import i18n from '@/i18n'

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
  const t = i18n.global.t

  async function handleExportPng() {
    if (store.components.length === 0) {
      ElMessage.warning(t('editorUi.header.exportEmpty'))
      return
    }
    try {
      const ok = await store.exportCanvasAsPng()
      if (ok) {
        ElMessage.success(t('editorUi.header.pngSuccess'))
      } else {
        ElMessage.error(t('editorUi.header.pngFailedRetry'))
      }
    } catch (e) {
      console.error('[HeaderToolbar] export PNG failed', e)
      ElMessage.error(t('editorUi.header.pngFailed'))
    }
  }

  async function handleExportPdf() {
    if (store.components.length === 0) {
      ElMessage.warning(t('editorUi.header.exportEmpty'))
      return
    }
    try {
      const ok = await store.exportCanvasAsPdf()
      if (ok) {
        ElMessage.success(t('editorUi.header.pdfPrintHint'))
      } else {
        ElMessage.error(t('editorUi.header.pdfFailedRetry'))
      }
    } catch (e) {
      console.error('[HeaderToolbar] export PDF failed', e)
      ElMessage.error(t('editorUi.header.pdfFailed'))
    }
  }

  return { handleExportPng, handleExportPdf }
}
