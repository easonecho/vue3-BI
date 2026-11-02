import { toJpeg } from 'html-to-image'
import { updateDashboardTemplate } from '@/api/dashboard-template'
import { resizeDataUrl } from './preview-utils'

/**
 * 🔑 模板预览打开后延迟截图并回写缩略图。
 *   截图失败不影响页面渲染，仅记录 warning。
 */
export async function generateTemplateThumbnail(templateId: number) {
  try {
    await new Promise((r) => setTimeout(r, 3000))
    const canvasEl = document.querySelector('.dashboard-canvas') as HTMLElement | null
    if (!canvasEl) return
    const dataUrl = await toJpeg(canvasEl, { quality: 0.7, backgroundColor: '#ffffff' })
    const thumbnail = await resizeDataUrl(dataUrl, 320)
    if (thumbnail) {
      await updateDashboardTemplate(templateId, { thumbnail })
      console.log('[Preview] 模板缩略图已更新:', templateId)
    }
  } catch (e) {
    console.warn('[Preview] 生成模板缩略图失败:', e)
  }
}
