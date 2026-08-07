import type { EChartsOption } from 'echarts'
import { chartCommonSchema, chartAxesSchema, deriveDefaultProps } from '../types'

// ================= 公共默认配置 =================

/**
 * 🔑 基础兜底 option —— 原来的 textStyle 和 grid 已经改成 Schema 可配置项，
 *     这里不再写任何默认值（全部从 p.textFontFamily / p.gridLeft 等字段生成）。
 *   ⚠️  所有可配置字段（textStyle / grid / title / legend / xAxis / yAxis / tooltip / color / animation / dataZoom）
 *       只允许在 `types.ts` 中 `PropField.default` 处声明一次默认值。
 */
export function getBaseOption(): EChartsOption {
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
export function mergeOptions(base: EChartsOption, specific: EChartsOption): EChartsOption {
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
  baseOption: EChartsOption,
  props: Record<string, any> | undefined,
  widgetOption: EChartsOption,
  ctx: ChartConfigContext = {},
): EChartsOption {
  const { hasAxes = true, xAxisData, fallbackTitle } = ctx
  // 🔑 关键一步：用 Schema 默认值补全旧数据缺失字段 —— 之后 p 中每个字段必有值
  const p = fillDefaults(props, hasAxes)
  // 🔑 对比用的 Schema 默认值表（判断「子配置是否被用户改过」）
  const schemaDefaults = hasAxes ? fullSchemaDefaults : commonSchemaDefaults

  /** 🔑 全局文本基底：从「全局文本」分组配置读取 —— fontFamily / fontSize / color */
  const globalText = {
    fontFamily: String(p.textFontFamily),
    fontSize: Number(p.textFontSize),
    color: String(p.textColor),
  }

  /**
   * 🔑 子文本字号选择：
   *   - 如果用户从未修改过子配置（p[key] 仍等于 Schema 默认值），
   *     则按「默认字号 / 默认全局字号」的比例跟随全局字号变化
   *   - 如果用户显式改过子配置，保持用户设置不动
   */
  const pickFontSize = (key: string) => {
    const baseRatio = Number(schemaDefaults[key]) / Number(schemaDefaults.textFontSize || 12)
    return p[key] === schemaDefaults[key]
      ? Math.round(globalText.fontSize * baseRatio)
      : Number(p[key])
  }
  /** 🔑 子文本颜色选择：没改过子配置跟随全局颜色，改过就用用户显式色 */
  const pickColor = (key: string) => {
    return p[key] === schemaDefaults[key] ? globalText.color : String(p[key])
  }

  // ============ 1. Title —— 直接读 p.xxx，不再写任何 fallback ============
  const titleOption: EChartsOption['title'] = {
    show: Boolean(p.titleShow),
    text: String(p.titleText),
    left: p.titleLeft,
    top: titleTopStyle(String(p.titleTop)),
    textStyle: {
      fontFamily: globalText.fontFamily,
      fontSize: pickFontSize('titleFontSize'),
      fontWeight: p.titleFontWeight as any,
      color: pickColor('titleColor'),
    },
  }
  // 标题为空时兜底显示图表类型名（这个不是默认值，是 UI 友好提示）
  if (!titleOption.text && typeof fallbackTitle === 'string') {
    titleOption.text = fallbackTitle
  }

  // ============ 2. Legend ============
  const legendPos = legendPositionStyle(String(p.legendPosition))
  const legendOption: EChartsOption['legend'] = {
    show: Boolean(p.legendShow),
    ...legendPos,
    textStyle: {
      fontFamily: globalText.fontFamily,
      fontSize: pickFontSize('legendFontSize'),
      color: pickColor('legendColor'),
    },
    itemGap: Number(p.legendItemGap),
    itemWidth: 14,
    itemHeight: 8,
  }

  // ============ 3. Tooltip ============
  const tooltipOption: EChartsOption['tooltip'] = {
    show: Boolean(p.tooltipShow),
    trigger: p.tooltipTrigger as any,
    backgroundColor: hexToRgba(String(p.tooltipBgColor), 0.95),
    borderColor: String(p.tooltipBorderColor),
    borderWidth: 1,
    textStyle: {
      fontFamily: globalText.fontFamily,
      color: pickColor('tooltipTextColor'),
      fontSize: pickFontSize('tooltipFontSize'),
    },
    extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 4px;',
  }

  // ============ 5. Animation ============
  const animationOption: EChartsOption = {
    animation: Boolean(p.animationShow),
    animationDuration: p.animationShow ? Number(p.animationDuration) : 0,
    animationEasing: p.animationEasing as any,
  }

  // ============ 6. 全局文本样式 textStyle（从 Schema 读取，唯一真源）============
  const textStyleOption: EChartsOption['textStyle'] = {
    fontFamily: String(p.textFontFamily),
    fontSize: Number(p.textFontSize),
    color: String(p.textColor),
  }

  // ============ 7. Grid 画布内边距（从 Schema 读取，唯一真源）============
  const gridOption: EChartsOption['grid'] = {
    left: Number(p.gridLeft),
    right: Number(p.gridRight),
    top: Number(p.gridTop),
    bottom: Number(p.gridBottom),
    containLabel: Boolean(p.gridContainLabel),
  }

  // ============ 8. X / Y 轴（hasAxes 为 true 时才生成）============
  const axesOption: EChartsOption = {}
  if (hasAxes) {
    axesOption.xAxis = {
      show: Boolean(p.xAxisShow),
      type: p.xAxisType as any,
      data: xAxisData,
      inverse: Boolean(p.xAxisInverse),
      axisLabel: {
        show: Boolean(p.xAxisLabelShow),
        fontFamily: globalText.fontFamily,
        color: pickColor('xAxisLabelColor'),
        fontSize: pickFontSize('xAxisLabelFontSize'),
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
        fontFamily: globalText.fontFamily,
        color: pickColor('yAxisLabelColor'),
        fontSize: pickFontSize('yAxisLabelFontSize'),
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

  // ============ 9. DataZoom（hasAxes 为 true 时才生成）============
  if (hasAxes && Boolean(p.dataZoomShow)) {
    const orient = String(p.dataZoomOrient)
    const isHorizontal = orient === 'horizontal'
    axesOption.dataZoom = [
      {
        type: p.dataZoomType as any,
        orient: orient as any,
        xAxisIndex: isHorizontal ? 0 : undefined,
        yAxisIndex: isHorizontal ? undefined : 0,
        start: Number(p.dataZoomStart),
        end: Number(p.dataZoomEnd),
      },
    ]
  }

  // ============ 最终合并：base → 用户配置 → widget 特有（优先级最高）============
  const userConfig: EChartsOption = {
    textStyle: textStyleOption,
    grid: gridOption,
    title: titleOption,
    legend: legendOption,
    tooltip: tooltipOption,
    ...animationOption,
    ...axesOption,
  }

  return deepMerge(deepMerge(baseOption, userConfig), widgetOption)
}
