import type { ECOption } from './echarts-config'
import { chartCommonSchema, chartAxesSchema, deriveDefaultProps } from '../types'

// ================= 公共默认配置 =================

/**
 * 🔑 基础兜底 option —— 原来的 textStyle 和 grid 已经改成 Schema 可配置项，
 *     这里不再写任何默认值（全部从 p.textFontFamily / p.gridLeft 等字段生成）。
 *   ⚠️  所有可配置字段（textStyle / grid / title / legend / xAxis / yAxis / tooltip / color / animation / dataZoom）
 *       只允许在 `types.ts` 中 `PropField.default` 处声明一次默认值。
 */
export function getBaseOption(): ECOption {
  return {}
}

// ================= 工具函数：真正的深度合并（数组整体替换，对象递归） =================

function isPlainObject(v: any): boolean {
  return Object.prototype.toString.call(v) === '[object Object]'
}

/**
 * 🔑 深度合并 ECharts option。
 *   - 对象：递归合并（specific 覆盖 base，保留未被覆盖的字段）
 *   - 数组：specific 直接替换 base
 *   - 其他类型（string/number/boolean）：specific 覆盖 base
 */
export function deepMerge<T extends Record<string, any>>(base: T, specific: Partial<T>): T {
  if (!specific) return base
  if (!base) return specific as T
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base }
  for (const key of Object.keys(specific)) {
    const bv = (out as any)[key]
    const sv = (specific as any)[key]
    if (sv === undefined) continue
    if (sv === null) {
      ;(out as any)[key] = null
    } else if (Array.isArray(sv)) {
      ;(out as any)[key] = sv
    } else if (isPlainObject(sv) && isPlainObject(bv)) {
      ;(out as any)[key] = deepMerge(bv, sv)
    } else {
      ;(out as any)[key] = sv
    }
  }
  return out as T
}

/** 🔑 兼容旧接口名：mergeOptions → deepMerge */
export function mergeOptions(base: ECOption, specific: ECOption): ECOption {
  return deepMerge(base, specific)
}

// ================= 默认值真源：直接从 types.ts 的 Schema 派生（唯一来源） =================

/** 🔑 所有图表通用字段的默认值（title / legend / tooltip / color / animation）
 *  —— 直接从 chartCommonSchema.default 派生，禁止在此文件里再写一份。 */
const commonSchemaDefaults: Record<string, any> = deriveDefaultProps(chartCommonSchema)
/** 🔑 坐标轴类图表字段默认值（xAxis / yAxis / dataZoom）
 *  —— 直接从 chartAxesSchema.default 派生，禁止在此文件里再写一份。 */
const axesSchemaDefaults: Record<string, any> = deriveDefaultProps(chartAxesSchema)
/** 🔑 全量 Schema 默认值（通用 + 坐标轴）—— 合并一次，供补全旧数据用。 */
const fullSchemaDefaults: Record<string, any> = { ...commonSchemaDefaults, ...axesSchemaDefaults }

/**
 * 🔑 把 Schema 默认值"打进"实际 props，保证缺失字段（旧数据、新增字段）也有默认值。
 *   合并顺序：schemaDefaults → actualProps（用户实际设置优先级更高）。
 *   ⚠️ 这是保证「面板开关状态」与「图表实际渲染」100% 同步的关键一步。
 */
function fillDefaults(actualProps: Record<string, any> | undefined, hasAxes: boolean) {
  const schemaDefaults = hasAxes ? fullSchemaDefaults : commonSchemaDefaults
  return { ...schemaDefaults, ...actualProps }
}

// ================= 用户配置（扁平化 Schema 字段） → EChartsOption 转换 =================

export interface ChartConfigContext {
  /** 是否是带 X/Y 坐标轴的图表（柱状/折线/散点）。饼图、仪表盘等为 false。 */
  hasAxes?: boolean
  /** X 轴 data（categories 数组），hasAxes=true 时传入 */
  xAxisData?: any[]
  /** 图表回退标题（组件名），当用户没填 titleText 时使用 */
  fallbackTitle?: string
}

/** position 字段 → echarts 位置样式映射 */
function legendPositionStyle(pos: string) {
  switch (pos) {
    case 'top':
      return {
        top: 0,
        left: 'center',
        orient: 'horizontal' as const,
        bottom: undefined,
        right: undefined,
      }
    case 'bottom':
      return {
        bottom: 0,
        left: 'center',
        orient: 'horizontal' as const,
        top: undefined,
        right: undefined,
      }
    case 'left':
      return {
        left: 0,
        top: 'middle',
        orient: 'vertical' as const,
        bottom: undefined,
        right: undefined,
      }
    case 'right':
      return {
        right: 0,
        top: 'middle',
        orient: 'vertical' as const,
        bottom: undefined,
        left: undefined,
      }
    default:
      return { bottom: 0, left: 'center', orient: 'horizontal' as const }
  }
}

function titleTopStyle(top: string): string | number {
  if (top === 'top') return 4
  if (top === 'middle') return 'middle'
  if (top === 'bottom') return 'bottom'
  return top as any
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = String(hex || '').replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const r = parseInt(full.substring(0, 2), 16)
  const g = parseInt(full.substring(2, 4), 16)
  const b = parseInt(full.substring(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return hex
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 🔑 把用户扁平字段映射为 EChartsOption 对象。
 *
 *   ⚠️  此处严格遵循「唯一真源」原则：
 *       1) 先通过 fillDefaults() 把 types.ts 中 Schema.default 合并进 props（保证字段完整）
 *       2) 之后所有 `p.xxx` 直接读取，**禁止写 `??` / `!== false` / `|| defaultValue`** 等 fallback
 *       3) 新增任何默认值，只需在 `types.ts` 的对应 PropField.default 里改一处即可
 *       这样「面板显示的开关状态」与「图表实际渲染结果」100% 一致，不会再出现
 *       「legend 没显示但面板开关是开启状态」的不一致问题。
 */
export function applyUserChartConfig(
  baseOption: ECOption,
  props: Record<string, any> | undefined,
  widgetOption: ECOption,
  ctx: ChartConfigContext = {},
): ECOption {
  const { hasAxes = true, xAxisData, fallbackTitle } = ctx
  // 🔑 关键一步：用 Schema 默认值补全旧数据缺失字段 —— 之后 p 中每个字段必有值
  const p = fillDefaults(props, hasAxes)

  // ============ 1. Title —— 每个文本字段独立 5 项配置（无全局跟随，用户可单独控制每处） ============
  const titleOption: any = {
    show: Boolean(p.titleShow),
    text: String(p.titleText),
    left: p.titleLeft,
    top: titleTopStyle(String(p.titleTop)),
    textStyle: {
      fontFamily: String(p.titleFontFamily),
      fontSize: Number(p.titleFontSize),
      fontWeight: p.titleFontWeight as any,
      fontStyle: p.titleFontStyle as any,
      color: String(p.titleColor),
    },
  }
  // 标题为空时兜底显示图表类型名（这个不是默认值，是 UI 友好提示）
  if (!titleOption.text && typeof fallbackTitle === 'string') {
    titleOption.text = fallbackTitle
  }

  // ============ 2. Legend ============
  const legendPos = legendPositionStyle(String(p.legendPosition))
  const legendOption: any = {
    show: Boolean(p.legendShow),
    ...legendPos,
    textStyle: {
      fontFamily: String(p.legendFontFamily),
      fontSize: Number(p.legendFontSize),
      fontWeight: p.legendFontWeight as any,
      fontStyle: p.legendFontStyle as any,
      color: String(p.legendColor),
    },
    itemGap: Number(p.legendItemGap),
    itemWidth: 14,
    itemHeight: 8,
  }

  // ============ 3. Tooltip ============
  const tooltipOption: any = {
    show: Boolean(p.tooltipShow),
    trigger: p.tooltipTrigger as any,
    backgroundColor: hexToRgba(String(p.tooltipBgColor), 0.95),
    borderColor: String(p.tooltipBorderColor),
    borderWidth: 1,
    textStyle: {
      fontFamily: String(p.tooltipTextFontFamily),
      color: String(p.tooltipTextColor),
      fontSize: Number(p.tooltipTextFontSize),
      fontWeight: p.tooltipTextFontWeight as any,
      fontStyle: p.tooltipTextFontStyle as any,
    },
    extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 4px;',
  }

  // ============ 5. Animation ============
  const animationOption: ECOption = {
    animation: Boolean(p.animationShow),
    animationDuration: p.animationShow ? Number(p.animationDuration) : 0,
    animationEasing: p.animationEasing as any,
  }

  // ============ 6. Grid 画布内边距（从 Schema 读取，唯一真源）============
  const gridOption: any = {
    left: Number(p.gridLeft),
    right: Number(p.gridRight),
    top: Number(p.gridTop),
    bottom: Number(p.gridBottom),
    containLabel: Boolean(p.gridContainLabel),
  }

  // ============ 7. X / Y 轴（hasAxes 为 true 时才生成）============
  const axesOption: ECOption = {}
  if (hasAxes) {
    axesOption.xAxis = {
      show: Boolean(p.xAxisShow),
      type: p.xAxisType as any,
      data: xAxisData,
      inverse: Boolean(p.xAxisInverse),
      axisLabel: {
        show: Boolean(p.xAxisLabelShow),
        fontFamily: String(p.xAxisLabelFontFamily),
        color: String(p.xAxisLabelColor),
        fontSize: Number(p.xAxisLabelFontSize),
        fontWeight: p.xAxisLabelFontWeight as any,
        fontStyle: p.xAxisLabelFontStyle as any,
      },
      axisLine: {
        show: Boolean(p.xAxisAxisLineShow),
        lineStyle: { color: String(p.xAxisAxisLineColor) },
      },
      axisTick: { show: false },
      splitLine: {
        show: Boolean(p.xAxisSplitLineShow),
        lineStyle: { color: String(p.xAxisSplitLineColor), type: 'dashed' },
      },
    }
    axesOption.yAxis = {
      show: Boolean(p.yAxisShow),
      type: p.yAxisType as any,
      inverse: Boolean(p.yAxisInverse),
      axisLabel: {
        show: Boolean(p.yAxisLabelShow),
        fontFamily: String(p.yAxisLabelFontFamily),
        color: String(p.yAxisLabelColor),
        fontSize: Number(p.yAxisLabelFontSize),
        fontWeight: p.yAxisLabelFontWeight as any,
        fontStyle: p.yAxisLabelFontStyle as any,
      },
      axisLine: {
        show: Boolean(p.yAxisAxisLineShow),
        lineStyle: { color: String(p.yAxisAxisLineColor) },
      },
      splitLine: {
        show: Boolean(p.yAxisSplitLineShow),
        lineStyle: { color: String(p.yAxisSplitLineColor), type: 'dashed' },
      },
    }
  }

  // ============ 8. DataZoom（hasAxes 为 true 时才生成）============
  // 🔑 必须显式赋值（包括关闭时的空数组），避免 ECharts setOption merge 模式下
  //   旧 dataZoom 残留，导致「开关关闭后缩放条仍存在、inside 滚轮仍生效」。
  // 🔑 xAxisIndex / yAxisIndex 使用数组形式（ECharts 内部更统一接受数组），
  //   避免单值在某些场景下被忽略。inside 型补充 zoomOnMouseWheel/moveOnMouseWheel
  //   等显式开关，防止因浏览器滚轮行为差异导致"看起来不生效"。
  // 🔑 slider 型必须对齐 grid.left/right/top/bottom：否则滑块条横跨整个容器，
  //   会比轴线（在 grid 内部）长一大截，出现"超出轴线长度"的视觉问题。
  if (hasAxes && Boolean(p.dataZoomShow)) {
    const orient = String(p.dataZoomOrient)
    const isHorizontal = orient === 'horizontal'
    const type = String(p.dataZoomType)
    const baseDz: Record<string, any> = {
      type: type as any,
      orient: orient as any,
      xAxisIndex: isHorizontal ? [0] : undefined,
      yAxisIndex: isHorizontal ? undefined : [0],
      start: Number(p.dataZoomStart),
      end: Number(p.dataZoomEnd),
      filterMode: 'filter',
    }
    if (type === 'inside') {
      // inside 型：显式启用滚轮缩放 + 拖拽平移，禁止 ECharts 内部 preventDefault
      // （外层 CanvasArea 已经统一处理 preventDefault，这里 true 可能会覆盖外层逻辑）
      baseDz.zoomOnMouseWheel = true
      baseDz.moveOnMouseWheel = true
      baseDz.moveOnMouseMove = true
      baseDz.preventDefaultMouseMove = false
      baseDz.lock = false
      baseDz.zoomLock = false
    } else {
      // slider 型：显式 show，附带到指定坐标轴，left/right/top/bottom 与 grid 对齐
      baseDz.show = true
      baseDz.realtime = true
      baseDz.height = isHorizontal ? 16 : undefined
      baseDz.width = isHorizontal ? undefined : 16
      // handleSize 稍微缩小一点，避免左右/上下手柄比条还大一圈显得不协调
      baseDz.handleSize = '100%'
      baseDz.showDetail = true
      baseDz.showDataShadow = 'auto'
      if (isHorizontal) {
        // 底部水平条：左右边界与 grid.left/right 对齐，保证滑块条长度=轴线长度
        baseDz.left = Number(gridOption.left)
        baseDz.right = Number(gridOption.right)
        // 底部距离：14px 固定留白（足够放滑块 + 数值提示，不遮挡 x 轴标签）
        baseDz.bottom = 14
      } else {
        // 右侧垂直条：上下边界与 grid.top/bottom 对齐，保证滑块条高度=轴线高度
        baseDz.top = Number(gridOption.top)
        baseDz.bottom = Number(gridOption.bottom)
        // 右侧距离：14px 固定留白（足够放滑块 + 数值提示，不遮挡 y 轴标签）
        baseDz.right = 14
      }
    }
    axesOption.dataZoom = [baseDz]
  } else if (hasAxes) {
    // 🔑 坐标轴类图表但关闭 dataZoom 时：显式空数组覆盖旧配置
    axesOption.dataZoom = []
  }

  // ============ 最终合并：base → 用户配置 → widget 特有（优先级最高）============
  // 🔑 已移除「全局 textStyle」配置（所有子配置都自己独立 5 项，不再走全局继承）
  const userConfig: ECOption = {
    grid: gridOption,
    title: titleOption,
    legend: legendOption,
    tooltip: tooltipOption,
    ...animationOption,
    ...axesOption,
  }

  const merged = deepMerge(deepMerge(baseOption, userConfig), widgetOption)
  // 🔑 大数据集分块渲染：数据量超过阈值时 ECharts 自动分块，避免一次性渲染所有数据点
  applyProgressive(merged)
  return merged
}

/**
 * 🔑 Progressive Rendering：大数据集优化。
 *   - progressive: 每块渲染的数据点数（1000），避免一次性渲染所有点
 *   - progressiveThreshold: 数据量超过 3000 才启用分块
 *   只对 bar/line/scatter 有效（ECharts 限制），pie/funnel 等不支持
 */
function applyProgressive(option: ECOption) {
  if (!option.series) return
  const seriesList = Array.isArray(option.series) ? option.series : [option.series]
  for (const s of seriesList) {
    if (s && typeof s === 'object' && 'type' in s) {
      const t = (s as any).type
      if (t === 'bar' || t === 'line' || t === 'scatter') {
        ;(s as any).progressive = 1000
        ;(s as any).progressiveThreshold = 3000
      }
    }
  }
}
