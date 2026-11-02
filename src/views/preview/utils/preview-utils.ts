/** HH:mm:ss 时间格式化（预览工具栏刷新时间） */
export function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 将 dataURL 图片按最大宽度等比缩放，返回 JPEG dataURL */
export function resizeDataUrl(dataUrl: string, maxW: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
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
      resolve(cv.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}
