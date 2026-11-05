/**
 * ============================================================================
 * 看板导出（PNG / PDF）— 预览页 / 公开分享页查看者共用
 * ============================================================================
 * 复用 html-to-image 对已渲染画布截图，动态 import 避免增大首屏包体。
 * 导出目标兼容：
 *   - 预览页 DashboardScreen: .dashboard-canvas
 *   - 分享页 CanvasArea(readonly): .canvas-sheet
 * ============================================================================
 */

/** 导出目标选择器：按优先级匹配预览页 / 分享页画布 */
export const EXPORT_TARGET_SELECTOR = '.dashboard-canvas, .canvas-sheet'

/** 查找当前页面可导出的画布 DOM */
export function resolveExportTarget(): HTMLElement | null {
  return document.querySelector<HTMLElement>(EXPORT_TARGET_SELECTOR)
}

/** 文件名安全化：去掉 Windows/Unix 非法字符，空名称回退为「看板」 */
export function sanitizeExportName(name: string): string {
  const safe = (name || '看板').replace(/[\\/:*?"<>|]/g, '_').trim()
  return safe || '看板'
}

/** 导出时间戳：YYYYMMDD_HHmmss */
export function formatExportStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

/** 转义 HTML 特殊字符（PDF 标题） */
function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }
  return s.replace(/[&<>"]/g, (c) => map[c] ?? c)
}

/**
 * 构造打印用 HTML：整张画布图片铺满页面，打印对话框中选择「另存为 PDF」。
 * 不引入服务端 PDF 依赖，保持与编辑器导出能力一致。
 */
export function buildPdfHtml(dataUrl: string, title: string): string {
  const safeTitle = escapeHtml(title || '看板')
  return `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
    <style>
      @page { size: auto; margin: 0; }
      html, body { margin: 0; padding: 0; background: #fff; }
      img { display: block; width: 100%; height: auto; }
    </style></head>
    <body><img src="${dataUrl}" alt="${safeTitle}"
      onload="setTimeout(function(){ window.focus(); window.print(); }, 200)" /></body></html>`
}

/** 触发浏览器下载 */
function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * 截取画布为 PNG data URL。
 * 画布在页面上可能被 transform: scale 缩放，但节点自身宽高仍是设计稿尺寸，
 * 显式传入 width/height 保证导出原尺寸清晰度。
 */
export async function captureDashboardPng(
  target?: HTMLElement | null,
): Promise<string | null> {
  const el = target ?? resolveExportTarget()
  if (!el) return null
  try {
    const { toPng } = await import('html-to-image')
    return await toPng(el, {
      cacheBust: true,
      pixelRatio: 2,
      width: el.offsetWidth || undefined,
      height: el.offsetHeight || undefined,
      backgroundColor: getComputedStyle(el).backgroundColor || '#ffffff',
    })
  } catch (e) {
    console.error('[dashboard-export] 截图失败', e)
    return null
  }
}

/** 导出 PNG 并触发下载 */
export async function exportDashboardPng(
  name: string,
  target?: HTMLElement | null,
): Promise<boolean> {
  const dataUrl = await captureDashboardPng(target)
  if (!dataUrl) return false
  triggerDownload(
    dataUrl,
    `${sanitizeExportName(name)}_${formatExportStamp(new Date())}.png`,
  )
  return true
}

/**
 * 导出 PDF：先同步打开窗口（避免被浏览器弹窗拦截），截图后写入并调起打印。
 */
export async function exportDashboardPdf(
  name: string,
  target?: HTMLElement | null,
): Promise<boolean> {
  const win = window.open('', '_blank')
  if (!win) return false
  const dataUrl = await captureDashboardPng(target)
  if (!dataUrl) {
    win.close()
    return false
  }
  win.document.write(buildPdfHtml(dataUrl, name))
  win.document.close()
  return true
}
