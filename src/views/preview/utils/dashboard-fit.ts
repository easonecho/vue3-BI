/**
 * 大屏画布自适应计算（预览 / 分享 / 嵌入 / 数据大屏共用）
 *
 * 宽屏按「完整显示」缩放，竖屏窄屏按「适配宽度」缩放，
 * 缩放后高度超出视口时由容器纵向滚动，避免画布被裁剪。
 */

/** 移动端断点，与布局/列表页媒体查询保持一致 */
export const MOBILE_VIEWPORT_BREAKPOINT = 768

export type DashboardFitMode = 'contain' | 'width'

export interface DashboardFitInput {
  viewportWidth: number
  viewportHeight: number
  designWidth: number
  designHeight: number
  /** 显式指定适配模式；缺省按视口宽高自动判断 */
  mode?: DashboardFitMode
}

/**
 * 自动判断适配模式：
 * - 竖屏窄屏（宽 < 768 且宽 < 高）按宽度适配，保证内容不被缩得过小
 * - 其余（桌面、横屏手机）完整缩放，保证整张画布可见
 */
export function resolveDashboardFitMode(
  viewportWidth: number,
  viewportHeight: number,
): DashboardFitMode {
  if (viewportWidth > 0 && viewportHeight > 0 && viewportWidth < MOBILE_VIEWPORT_BREAKPOINT) {
    return viewportHeight > viewportWidth ? 'width' : 'contain'
  }
  return 'contain'
}

/** 计算画布缩放比；尺寸非法时返回 1，避免 NaN / Infinity */
export function computeDashboardScale(input: DashboardFitInput): number {
  const { viewportWidth, viewportHeight, designWidth, designHeight } = input
  if (viewportWidth <= 0 || viewportHeight <= 0 || designWidth <= 0 || designHeight <= 0) {
    return 1
  }
  const widthScale = viewportWidth / designWidth
  const mode = input.mode ?? resolveDashboardFitMode(viewportWidth, viewportHeight)
  if (mode === 'width') return widthScale
  return Math.min(widthScale, viewportHeight / designHeight)
}

/** 缩放后的画布高度是否超出视口（需要纵向滚动） */
export function isDashboardVerticallyScrollable(
  designHeight: number,
  scale: number,
  viewportHeight: number,
): boolean {
  if (designHeight <= 0 || scale <= 0 || viewportHeight <= 0) return false
  // 1px 容差：避免四舍五入导致出现无意义的滚动条
  return designHeight * scale > viewportHeight + 1
}
