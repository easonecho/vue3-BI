/**
 * 看板导出交互封装：预览页 / 公开分享页共用
 * - 统一 loading 状态，避免重复点击
 * - 失败时给出可操作的提示
 */
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import i18n from '@/i18n'
import { exportDashboardPdf, exportDashboardPng } from '@/utils/dashboard-export'

export function useDashboardExport(getName: () => string) {
  const exportingType = ref<'png' | 'pdf' | null>(null)
  const exporting = computed(() => exportingType.value !== null)

  async function exportPng() {
    if (exportingType.value) return
    exportingType.value = 'png'
    try {
      const ok = await exportDashboardPng(getName())
      if (!ok) ElMessage.warning(i18n.global.t('previewPage.exportPngFailed'))
    } finally {
      exportingType.value = null
    }
  }

  async function exportPdf() {
    if (exportingType.value) return
    exportingType.value = 'pdf'
    try {
      const ok = await exportDashboardPdf(getName())
      if (!ok) {
        ElMessage.warning(i18n.global.t('previewPage.exportPdfFailed'))
      }
    } finally {
      exportingType.value = null
    }
  }

  return { exporting, exportingType, exportPng, exportPdf }
}
