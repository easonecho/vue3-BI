import type { Ref } from 'vue'

export interface CanvasExportDeps {
  dashboardName: Ref<string>
  isExportingPng: Ref<boolean>
}

export interface CanvasExportApi {
  registerExportPng: (fn: () => Promise<string | null>) => () => void
  exportCanvasAsPng: () => Promise<boolean>
  exportCanvasAsPdf: () => Promise<boolean>
  captureThumbnail: () => Promise<string | null>
}

/**
 * 🔑 画布导出（PNG / PDF）与缩略图。
 *
 *   CanvasArea 在 onMounted 里通过 registerExportPng 注册实际的 toPng 回调，
 *   避免 store 跨组件直接持有 ref；本模块只负责调用回调、下载与缩略。
 */
export function createCanvasExport(deps: CanvasExportDeps): CanvasExportApi {
  const { dashboardName, isExportingPng } = deps

  /** 由 CanvasArea 在 onMounted 里注册一个导出 PNG 的回调，避免跨组件 ref 穿透 */
  let exportPngCallback: (() => Promise<string | null>) | null = null

  function registerExportPng(fn: () => Promise<string | null>) {
    exportPngCallback = fn
    return () => {
      if (exportPngCallback === fn) exportPngCallback = null
    }
  }

  function triggerDownload(dataUrl: string, filename: string) {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async function exportCanvasAsPng() {
    if (!exportPngCallback) {
      console.warn('[bi-editor] 导出 PNG：CanvasArea 未注册导出回调')
      return false
    }
    isExportingPng.value = true
    try {
      const dataUrl = await exportPngCallback()
      if (!dataUrl) return false
      const safeName = (dashboardName.value || '看板').replace(/[\\/:*?"<>|]/g, '_')
      const ts = new Date()
      const pad = (n: number) => n.toString().padStart(2, '0')
      const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(
        ts.getHours(),
      )}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`
      triggerDownload(dataUrl, `${safeName}_${stamp}.png`)
      return true
    } finally {
      isExportingPng.value = false
    }
  }

  /**
   * 🔑 导出 PDF：复用 PNG 回调拿到整张画布图片，写入新窗口后用浏览器打印
   *    （用户在打印对话框选择「另存为 PDF」，不引入服务端 PDF 重依赖）。
   *    注意: 必须在 await 之前同步打开窗口，否则会被浏览器弹窗拦截。
   */
  async function exportCanvasAsPdf() {
    if (!exportPngCallback) {
      console.warn('[bi-editor] 导出 PDF：CanvasArea 未注册导出回调')
      return false
    }
    const win = window.open('', '_blank')
    if (!win) return false

    isExportingPng.value = true
    try {
      const dataUrl = await exportPngCallback()
      if (!dataUrl) {
        win.close()
        return false
      }
      const escapeHtml = (s: string) =>
        s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
      const title = escapeHtml(dashboardName.value || '看板')
      win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
        <style>
          @page { size: auto; margin: 0; }
          html, body { margin: 0; padding: 0; background: #fff; }
          img { display: block; width: 100%; height: auto; }
        </style></head>
        <body><img src="${dataUrl}" alt="${title}"
          onload="setTimeout(function(){ window.focus(); window.print(); }, 200)" /></body></html>`)
      win.document.close()
      return true
    } catch (e) {
      console.error('[bi-editor] export PDF failed', e)
      win.close()
      return false
    } finally {
      isExportingPng.value = false
    }
  }

  /**
   * 🔑 截取画布缩略图：复用 CanvasArea 注册的 toPng 回调生成完整 PNG，
   *    再缩放到 320px 宽的 JPEG data URL（大幅缩小体积，适合列表展示与存储）。
   *    无画布/无回调时返回 null（不阻断保存流程）。
   */
  async function captureThumbnail(): Promise<string | null> {
    if (!exportPngCallback) return null
    const fullDataUrl = await exportPngCallback()
    if (!fullDataUrl) return null
    return new Promise<string | null>((resolve) => {
      const img = new Image()
      img.onload = () => {
        const maxW = 320
        const scale = img.width > 0 ? Math.min(1, maxW / img.width) : 1
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const cv = document.createElement('canvas')
        cv.width = w
        cv.height = h
        const ctx = cv.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        try {
          resolve(cv.toDataURL('image/jpeg', 0.7))
        } catch {
          resolve(null)
        }
      }
      img.onerror = () => resolve(null)
      img.src = fullDataUrl
    })
  }

  return {
    registerExportPng,
    exportCanvasAsPng,
    exportCanvasAsPdf,
    captureThumbnail,
  }
}
