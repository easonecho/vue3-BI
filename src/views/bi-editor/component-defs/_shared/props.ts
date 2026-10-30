/**
 * ============================================================================
 * 组件 props / dataConfig 的类型安全读取工具
 * ============================================================================
 * 背景：`ComponentInstance.dataConfig` 的类型是 `Record<string, unknown>`，
 *      合并后的 props 也来自 Schema 默认值（未知类型）。各图表 Widget 里大量使用
 *      `(props.comp.dataConfig as any)?.categoryField` / `mergedProps.x as any`
 *      来读取与断言，字段名拼错、类型不符都不会被编译器发现。
 *
 * 这里统一提供「窄化读取」函数：输入 unknown，输出确定的类型。
 * 相比 `as any`，拼错字段名仍是 unknown 并走 fallback，不会把错误类型静默传下去。
 * ============================================================================
 */

/** 任意 props 包（Schema 默认值 / dataConfig / 用户配置都能用） */
export type PropBag = Record<string, unknown>

/** 读取字符串字段；非字符串返回 fallback */
export function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

/** 读取数字字段；非有限数字返回 fallback */
export function num(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** 读取布尔字段；只有 true / 'true' 视为真 */
export function bool(value: unknown): boolean {
  return value === true || value === 'true'
}

/** 读取字符串数组；过滤非字符串与空串 */
export function strArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string' && v !== '')
    : []
}

/** 读取数字数组；过滤非数字 */
export function numArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    : []
}

/** 读取字符串；空串视为未设置，返回 undefined（适合"字段映射未配置"场景） */
export function optionalStr(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

/** 读取字符串数组；非数组/全空时返回 undefined */
export function optionalStrArray(value: unknown): string[] | undefined {
  const arr = strArray(value)
  return arr.length > 0 ? arr : undefined
}

/** 读取普通对象；非对象返回空对象 */
export function record(value: unknown): PropBag {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as PropBag) : {}
}

// ======================= ECharts 枚举窄化 =======================

export type FontWeight = 'normal' | 'bold' | 'bolder' | 'lighter' | number
export type FontStyle = 'normal' | 'italic' | 'oblique'

/** 字重：非法值回退 normal（ECharts 默认值） */
export function fontWeightOf(value: unknown): FontWeight {
  if (value === 'bold' || value === 'bolder' || value === 'lighter') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return 'normal'
}

/** 字体样式：非法值回退 normal */
export function fontStyleOf(value: unknown): FontStyle {
  return value === 'italic' || value === 'oblique' ? value : 'normal'
}

export type TooltipTrigger = 'item' | 'axis' | 'none'
export function tooltipTriggerOf(value: unknown): TooltipTrigger {
  return value === 'axis' || value === 'none' ? value : 'item'
}

export type AxisType = 'value' | 'category' | 'time' | 'log'
export function axisTypeOf(value: unknown, fallback: AxisType = 'category'): AxisType {
  return value === 'value' || value === 'category' || value === 'time' || value === 'log'
    ? value
    : fallback
}

export type DataZoomType = 'slider' | 'inside'
export function dataZoomTypeOf(value: unknown): DataZoomType {
  return value === 'inside' ? 'inside' : 'slider'
}

export type DataZoomOrient = 'horizontal' | 'vertical'
export function dataZoomOrientOf(value: unknown): DataZoomOrient {
  return value === 'vertical' ? 'vertical' : 'horizontal'
}

/**
 * ECharts 系列标签位置（label.position）的合法取值。
 * 🔑 严格对齐 echarts 6 的 `BuiltinTextPosition`：'center' / 'middle' 不在该联合内
 *    （仅饼图等个别系列自身另有扩展），收录它们会把非法值传进 series.label.position。
 */
export type LabelPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'inside'
  | 'insideTop'
  | 'insideBottom'
  | 'insideLeft'
  | 'insideRight'
  | 'insideTopLeft'
  | 'insideTopRight'
  | 'insideBottomLeft'
  | 'insideBottomRight'

const LABEL_POSITIONS: readonly string[] = [
  'top',
  'bottom',
  'left',
  'right',
  'inside',
  'insideTop',
  'insideBottom',
  'insideLeft',
  'insideRight',
  'insideTopLeft',
  'insideTopRight',
  'insideBottomLeft',
  'insideBottomRight',
]

/** 标签位置：非法值回退 fallback */
export function labelPositionOf(value: unknown, fallback: LabelPosition = 'top'): LabelPosition {
  return typeof value === 'string' && LABEL_POSITIONS.includes(value)
    ? (value as LabelPosition)
    : fallback
}

/** ECharts animationEasing 的合法取值 */
export type AnimationEasing =
  | 'linear'
  | 'quadraticIn'
  | 'quadraticOut'
  | 'quadraticInOut'
  | 'cubicIn'
  | 'cubicOut'
  | 'cubicInOut'
  | 'quarticIn'
  | 'quarticOut'
  | 'quarticInOut'
  | 'sinusoidalIn'
  | 'sinusoidalOut'
  | 'sinusoidalInOut'
  | 'exponentialIn'
  | 'exponentialOut'
  | 'exponentialInOut'
  | 'elasticIn'
  | 'elasticOut'
  | 'elasticInOut'
  | 'backIn'
  | 'backOut'
  | 'backInOut'
  | 'bounceIn'
  | 'bounceOut'
  | 'bounceInOut'
  | 'circularIn'
  | 'circularOut'
  | 'circularInOut'

const ANIMATION_EASINGS: readonly string[] = [
  'linear',
  'quadraticIn',
  'quadraticOut',
  'quadraticInOut',
  'cubicIn',
  'cubicOut',
  'cubicInOut',
  'quarticIn',
  'quarticOut',
  'quarticInOut',
  'sinusoidalIn',
  'sinusoidalOut',
  'sinusoidalInOut',
  'exponentialIn',
  'exponentialOut',
  'exponentialInOut',
  'elasticIn',
  'elasticOut',
  'elasticInOut',
  'backIn',
  'backOut',
  'backInOut',
  'bounceIn',
  'bounceOut',
  'bounceInOut',
  'circularIn',
  'circularOut',
  'circularInOut',
]

/** 缓动函数：非法值回退 linear */
export function animationEasingOf(value: unknown): AnimationEasing {
  return typeof value === 'string' && ANIMATION_EASINGS.includes(value)
    ? (value as AnimationEasing)
    : 'linear'
}
