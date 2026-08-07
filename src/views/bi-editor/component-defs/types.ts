import type { Component } from 'vue'
import type { ComponentCategory, ComponentType } from '@/views/bi-editor/types'

/**
 * 🔑 属性字段 Schema —— 每个组件自声明可配置字段，RightPanel 根据 Schema 自动生成表单。
 */
export type PropFieldType =
  | 'input' // 文本输入
  | 'textarea' // 多行文本
  | 'number' // 数字输入
  | 'slider' // 滑块
  | 'colorpicker' // 颜色选择
  | 'select' // 下拉选择
  | 'switch' // 开关
  | 'checkbox' // 复选框
  | 'table' // 表格（列配置）
  | 'json' // JSON 编辑器

/** 🔑 条件显隐：根据其他 props 字段的值决定当前字段是否显示 */
export interface VisibleWhen {
  /** 依赖的字段 key */
  field: string
  /** 当依赖字段值 === value 时显示（单个值） */
  equals?: any
  /** 当依赖字段值 ∈ values 时显示（多值任一匹配） */
  in?: any[]
  /** 当依赖字段值为 truthy 时显示 */
  truthy?: boolean
}

/** 下拉选项（select 的 label 显示中文，value 是真实值） */
export interface SelectOption {
  label: string
  value: string | number | boolean
}

/** 🔑 ECharts 标准调色板（9 色）—— 给每个 series 按 index 循环分配默认色 */
export const ECHARTS_DEFAULT_PALETTE: readonly string[] = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
  '#ea7ccc',
] as const

/** 🔑 有坐标轴图表（bar/line/scatter）seriesStyles 通用基础列：系列名称 + 颜色 + 显示标签 */
export const baseSeriesStylesWithAxesColumns: TableColumnSchema[] = [
  {
    key: 'seriesName',
    label: '系列名称',
    type: 'input',
    placeholder: 'series 的 name',
    width: 110,
  },
  { key: 'color', label: '颜色', type: 'colorpicker', width: 100 },
  { key: 'labelShow', label: '显示值标签', type: 'switch', width: 100 },
]

/** 🔑 无坐标轴图表（pie 等）seriesStyles 通用基础列：数据项 name + 颜色 + 显示标签 */
export const baseSeriesStylesNoAxesColumns: TableColumnSchema[] = [
  { key: 'name', label: '数据项名称', type: 'input', placeholder: 'data 的 name', width: 110 },
  { key: 'color', label: '颜色', type: 'colorpicker', width: 100 },
  { key: 'labelShow', label: '显示标签', type: 'switch', width: 100 },
]

/** table 类型字段的列定义（每一列的编辑方式） */
export interface TableColumnSchema {
  key: string
  label: string
  /** 单元格渲染类型 */
  type: 'input' | 'number' | 'colorpicker' | 'select' | 'switch'
  /** select 列的选项 */
  options?: SelectOption[]
  /** number 列的 min/max/step */
  min?: number
  max?: number
  step?: number
  /** 列宽 */
  width?: number
  /** 占位提示 */
  placeholder?: string
}

export interface PropField {
  /** 属性 key，对应 comp.props[key] */
  key: string
  /** 在面板中显示的标签 */
  label: string
  /** 控件类型，决定 RightPanel 渲染什么组件 */
  type: PropFieldType
  /** 默认值 — 🔑 唯一真相源，defaultProps 从此自动派生 */
  default: any
  /** 占位提示 */
  placeholder?: string
  /** 最小值 (number/slider) */
  min?: number
  /** 最大值 (number/slider) */
  max?: number
  /** 步长 (number/slider) */
  step?: number
  /** select 的选项列表（中文 label + 真实 value） */
  options?: SelectOption[]
  /** 分组标题（相同 group 的字段在同一个 section） */
  group?: string
  /** 是否只读 */
  readonly?: boolean
  /** 额外的提示文本 */
  tip?: string
  /** 🔑 条件显隐：满足条件时才渲染此字段 */
  visibleWhen?: VisibleWhen
  /** table 类型字段的列定义 */
  columns?: TableColumnSchema[]
}

/**
 * 🔑 组件定义 — 每个组件类型的单一真相源。
 *   新增组件只需：创建 definition + 创建 widget，然后在 index.ts 注册。
 */
export interface ComponentDefinition {
  /** 唯一类型标识 */
  type: ComponentType
  /** 元信息（名称、分类、图标、默认尺寸） */
  meta: {
    name: string
    category: ComponentCategory
    icon: string
    defaultWidth: number
    defaultHeight: number
  }
  /** 渲染组件 */
  widget: Component
  /** 属性面板 Schema — 声明后 RightPanel 自动生成表单 */
  propsSchema: PropField[]
  /** 🔑 默认 props 值 — 从 propsSchema[].default 自动派生，无需手写 */
  /** 额外的非 Schema 属性默认值（如 data 数组、columns 等不适合表单编辑的复杂数据） */
  extraDefaults?: Record<string, any>
  /** 默认 style 值 */
  defaultStyle?: Record<string, any>
  /** 是否支持数据绑定（数据面板） */
  supportsDataBinding?: boolean
}

/**
 * 🔑 从 propsSchema 自动派生 defaultProps。
 *   遍历 schema 中每个字段的 default 值，合并 extraDefaults。
 *   这样默认值只在 schema 的 field.default 中声明一次，消除重复。
 */
export function deriveDefaultProps(
  schema: PropField[],
  extra?: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const field of schema) {
    result[field.key] = field.default
  }
  return { ...result, ...extra }
}

/**
 * 🔑 从当前 props 中的真实数据（series / pieData）+ seriesStyles 的列定义，
 *   生成"每个数据项一行空样式"的初始 seriesStyles，保证 seriesStyles 与真实数据一一对应。
 *   规则：
 *     1) 如果 schema 中没有 seriesStyles 字段 → 返回 undefined
 *     2) 如果 props.seriesStyles 已经有内容（用户自己编辑过）→ 保留原内容不覆盖
 *     3) 如果 seriesStyles 列为空，根据图表类型取真实数据源：
 *        - 饼图 pie-chart：取 props.pieData 里的每个 name
 *        - 其他带轴图表：取 props.series 里的每个 name
 *     4) 每一行：第一列（通常是 seriesName / name）填真实 name；其余列按其 type 给合理默认空值
 */
export function buildInitialSeriesStyles(
  def: ComponentDefinition,
  props: Record<string, any>,
): any[] | undefined {
  const seriesField = def.propsSchema.find((f) => f.key === 'seriesStyles' && f.type === 'table')
  if (!seriesField || !seriesField.columns || seriesField.columns.length === 0) return undefined

  // 用户已经手动配置过（或旧数据保留）—— 直接用，不覆盖
  if (Array.isArray(props.seriesStyles) && props.seriesStyles.length > 0) {
    return props.seriesStyles
  }

  // 🔑 列元信息
  const columns = seriesField.columns
  const nameCol = columns[0]
  const valueCols = columns.slice(1)

  // 🔑 从 props 中拿到真实数据项列表（饼图走 pieData，其他走 series）
  let dataItems: { name?: string; value?: any; [k: string]: any }[] = []
  if (def.type === 'pie-chart') {
    dataItems = Array.isArray(props.pieData) ? props.pieData : []
  } else {
    dataItems = Array.isArray(props.series) ? props.series : []
  }

  // 🔑 为每个真实数据项生成一行空样式
  return dataItems.map((item, i) => {
    const row: Record<string, any> = {}
    // 名称列：取真实 name
    row[nameCol.key] = String(item?.name ?? '')
    // 其余列：按列类型填默认空值
    for (const col of valueCols) {
      switch (col.type) {
        case 'input':
          row[col.key] = ''
          break
        case 'number':
          row[col.key] = typeof col.min === 'number' ? col.min : 0
          break
        case 'colorpicker':
          // 🔑 颜色列默认值：按 index 从 ECharts 标准调色板循环取
          row[col.key] = ECHARTS_DEFAULT_PALETTE[i % ECHARTS_DEFAULT_PALETTE.length]
          break
        case 'switch':
          row[col.key] = false
          break
        case 'select':
          row[col.key] = col.options?.[0]?.value ?? ''
          break
        default:
          row[col.key] = ''
      }
    }
    return row
  })
}

/**
 * 🔑 评估 visibleWhen 条件，决定字段是否应该显示。
 */
export function isFieldVisible(field: PropField, props: Record<string, any>): boolean {
  if (!field.visibleWhen) return true
  const { field: depKey, equals, in: inValues, truthy } = field.visibleWhen
  const depValue = props?.[depKey]
  if (equals !== undefined) return depValue === equals
  if (inValues !== undefined) return inValues.includes(depValue)
  if (truthy !== undefined) return !!depValue === truthy
  return true
}

/**
 * 🔑 图表组件的通用 props Schema。
 *   - chartCommonSchema: 所有图表通用（title / legend / tooltip / color / animation）
 *   - chartAxesSchema: 仅坐标轴类图表使用（xAxis / yAxis / dataZoom）—— 饼图、仪表盘等不用
 *   - chartBaseSchema: 原组合保留（通用 + 坐标轴），向后兼容
 *   字段命名：`模块 + 属性`（如 titleShow / legendPosition / xAxisLabelColor），
 *   在 echarts-options.ts 的 applyUserChartConfig 中会把这些扁平化字段映射成 EChartsOption 对象结构。
 */
export const chartCommonSchema: PropField[] = [
  // ============ 标题 ============
  { key: 'titleShow', label: '显示标题', type: 'switch', default: true, group: '标题' },
  {
    key: 'titleText',
    label: '标题文本',
    type: 'input',
    default: '',
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleLeft',
    label: '水平位置',
    type: 'select',
    options: [
      { label: '左对齐', value: 'left' },
      { label: '居中', value: 'center' },
      { label: '右对齐', value: 'right' },
    ],
    default: 'center',
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleTop',
    label: '垂直位置',
    type: 'select',
    options: [
      { label: '顶部', value: 'top' },
      { label: '居中', value: 'middle' },
      { label: '底部', value: 'bottom' },
    ],
    default: 'top',
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleFontSize',
    label: '字号',
    type: 'slider',
    min: 10,
    max: 48,
    default: 14,
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleFontWeight',
    label: '字重',
    type: 'select',
    options: [
      { label: '常规', value: 'normal' },
      { label: '粗体', value: 'bold' },
    ],
    default: 'normal',
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },
  {
    key: 'titleColor',
    label: '文字颜色',
    type: 'colorpicker',
    default: '#1f2937',
    group: '标题',
    visibleWhen: { field: 'titleShow', truthy: true },
  },

  // ============ 图例 ============
  { key: 'legendShow', label: '显示图例', type: 'switch', default: true, group: '图例' },
  {
    key: 'legendPosition',
    label: '图例位置',
    type: 'select',
    options: [
      { label: '顶部', value: 'top' },
      { label: '底部', value: 'bottom' },
      { label: '左侧', value: 'left' },
      { label: '右侧', value: 'right' },
    ],
    default: 'bottom',
    group: '图例',
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendItemGap',
    label: '图例间距',
    type: 'slider',
    min: 0,
    max: 60,
    default: 16,
    group: '图例',
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendFontSize',
    label: '字号',
    type: 'slider',
    min: 10,
    max: 24,
    default: 12,
    group: '图例',
    visibleWhen: { field: 'legendShow', truthy: true },
  },
  {
    key: 'legendColor',
    label: '文字颜色',
    type: 'colorpicker',
    default: '#6b7280',
    group: '图例',
    visibleWhen: { field: 'legendShow', truthy: true },
  },

  // ============ 提示框 Tooltip ============
  { key: 'tooltipShow', label: '启用提示框', type: 'switch', default: true, group: '提示框' },
  {
    key: 'tooltipTrigger',
    label: '触发类型',
    type: 'select',
    options: [
      { label: '数据项触发', value: 'item' },
      { label: '坐标轴触发', value: 'axis' },
      { label: '不触发', value: 'none' },
    ],
    default: 'item',
    group: '提示框',
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipBgColor',
    label: '背景颜色',
    type: 'colorpicker',
    default: '#ffffff',
    group: '提示框',
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipBorderColor',
    label: '边框颜色',
    type: 'colorpicker',
    default: '#e5e7eb',
    group: '提示框',
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipTextColor',
    label: '文字颜色',
    type: 'colorpicker',
    default: '#374151',
    group: '提示框',
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },
  {
    key: 'tooltipFontSize',
    label: '字号',
    type: 'slider',
    min: 10,
    max: 20,
    default: 12,
    group: '提示框',
    visibleWhen: { field: 'tooltipShow', truthy: true },
  },

  // ============ 动画 Animation ============
  { key: 'animationShow', label: '开启动画', type: 'switch', default: true, group: '动画' },
  {
    key: 'animationDuration',
    label: '动画时长 (ms)',
    type: 'slider',
    min: 0,
    max: 3000,
    step: 100,
    default: 600,
    group: '动画',
    visibleWhen: { field: 'animationShow', truthy: true },
  },
  {
    key: 'animationEasing',
    label: '缓动效果',
    type: 'select',
    options: [
      { label: '线性', value: 'linear' },
      { label: '二次方-渐入', value: 'quadraticIn' },
      { label: '二次方-渐出', value: 'quadraticOut' },
      { label: '二次方-渐入渐出', value: 'quadraticInOut' },
      { label: '三次方-渐入', value: 'cubicIn' },
      { label: '三次方-渐出', value: 'cubicOut' },
      { label: '三次方-渐入渐出', value: 'cubicInOut' },
      { label: '正弦-渐入', value: 'sinusoidalIn' },
      { label: '正弦-渐出', value: 'sinusoidalOut' },
      { label: '正弦-渐入渐出', value: 'sinusoidalInOut' },
      { label: '指数-渐入', value: 'exponentialIn' },
      { label: '指数-渐出', value: 'exponentialOut' },
      { label: '指数-渐入渐出', value: 'exponentialInOut' },
      { label: '圆形-渐入', value: 'circularIn' },
      { label: '圆形-渐出', value: 'circularOut' },
      { label: '圆形-渐入渐出', value: 'circularInOut' },
      { label: '弹性-渐入', value: 'elasticIn' },
      { label: '弹性-渐出', value: 'elasticOut' },
      { label: '弹性-渐入渐出', value: 'elasticInOut' },
      { label: '回弹-渐入', value: 'backIn' },
      { label: '回弹-渐出', value: 'backOut' },
      { label: '回弹-渐入渐出', value: 'backInOut' },
      { label: '弹跳-渐入', value: 'bounceIn' },
      { label: '弹跳-渐出', value: 'bounceOut' },
      { label: '弹跳-渐入渐出', value: 'bounceInOut' },
    ],
    default: 'cubicOut',
    group: '动画',
    visibleWhen: { field: 'animationShow', truthy: true },
  },

  // ============ 全局文本样式 textStyle ============
  {
    key: 'textFontFamily',
    label: '字体',
    type: 'select',
    options: [
      {
        label: '系统默认（苹方 / Segoe UI）',
        value:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      },
      { label: '微软雅黑 / 苹方', value: '"Microsoft YaHei", "PingFang SC", sans-serif' },
      { label: '宋体 / 华文宋体', value: '"SimSun", "Songti SC", serif' },
      { label: 'Arial（无衬线）', value: 'Arial, Helvetica, sans-serif' },
      { label: 'Times New Roman（衬线）', value: '"Times New Roman", Times, serif' },
      { label: 'Consolas（等宽）', value: 'Consolas, "Courier New", monospace' },
    ],
    default:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    group: '全局文本',
  },
  {
    key: 'textFontSize',
    label: '默认字号',
    type: 'slider',
    min: 10,
    max: 36,
    default: 12,
    group: '全局文本',
  },
  {
    key: 'textColor',
    label: '默认文字颜色',
    type: 'colorpicker',
    default: '#6b7280',
    group: '全局文本',
  },

  // ============ Grid 画布内边距 ============
  {
    key: 'gridLeft',
    label: '左边距',
    type: 'slider',
    min: 0,
    max: 120,
    default: 40,
    group: '画布内边距',
  },
  {
    key: 'gridRight',
    label: '右边距',
    type: 'slider',
    min: 0,
    max: 120,
    default: 20,
    group: '画布内边距',
  },
  {
    key: 'gridTop',
    label: '上边距',
    type: 'slider',
    min: 0,
    max: 120,
    default: 40,
    group: '画布内边距',
  },
  {
    key: 'gridBottom',
    label: '下边距',
    type: 'slider',
    min: 0,
    max: 120,
    default: 30,
    group: '画布内边距',
  },
  {
    key: 'gridContainLabel',
    label: '包含刻度标签',
    type: 'switch',
    default: true,
    group: '画布内边距',
  },
]

/** 🔑 坐标轴/数据缩放专属 Schema（仅柱/折线/散点等带 X/Y 轴的图表使用） */
export const chartAxesSchema: PropField[] = [
  // ============ X 轴 ============
  { key: 'xAxisShow', label: '显示 X 轴', type: 'switch', default: true, group: 'X 轴' },
  {
    key: 'xAxisType',
    label: 'X 轴类型',
    type: 'select',
    options: [
      { label: '类目轴（离散分类）', value: 'category' },
      { label: '数值轴（连续数值）', value: 'value' },
      { label: '时间轴', value: 'time' },
      { label: '对数轴', value: 'log' },
    ],
    default: 'category',
    group: 'X 轴',
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisLabelShow',
    label: '显示刻度标签',
    type: 'switch',
    default: true,
    group: 'X 轴',
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisLabelColor',
    label: '刻度颜色',
    type: 'colorpicker',
    default: '#6b7280',
    group: 'X 轴',
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisLabelFontSize',
    label: '刻度字号',
    type: 'slider',
    min: 10,
    max: 24,
    default: 12,
    group: 'X 轴',
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisAxisLineShow',
    label: '显示轴线',
    type: 'switch',
    default: true,
    group: 'X 轴',
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisAxisLineColor',
    label: '轴线颜色',
    type: 'colorpicker',
    default: '#e5e7eb',
    group: 'X 轴',
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisSplitLineShow',
    label: '显示网格线',
    type: 'switch',
    default: false,
    group: 'X 轴',
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisSplitLineColor',
    label: '网格线颜色',
    type: 'colorpicker',
    default: '#f3f4f6',
    group: 'X 轴',
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },
  {
    key: 'xAxisInverse',
    label: '反向坐标轴',
    type: 'switch',
    default: false,
    group: 'X 轴',
    visibleWhen: { field: 'xAxisShow', truthy: true },
  },

  // ============ Y 轴 ============
  { key: 'yAxisShow', label: '显示 Y 轴', type: 'switch', default: true, group: 'Y 轴' },
  {
    key: 'yAxisType',
    label: 'Y 轴类型',
    type: 'select',
    options: [
      { label: '数值轴（连续数值）', value: 'value' },
      { label: '类目轴（离散分类）', value: 'category' },
      { label: '时间轴', value: 'time' },
      { label: '对数轴', value: 'log' },
    ],
    default: 'value',
    group: 'Y 轴',
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisLabelShow',
    label: '显示刻度标签',
    type: 'switch',
    default: true,
    group: 'Y 轴',
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisLabelColor',
    label: '刻度颜色',
    type: 'colorpicker',
    default: '#6b7280',
    group: 'Y 轴',
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisLabelFontSize',
    label: '刻度字号',
    type: 'slider',
    min: 10,
    max: 24,
    default: 12,
    group: 'Y 轴',
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisAxisLineShow',
    label: '显示轴线',
    type: 'switch',
    default: false,
    group: 'Y 轴',
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisAxisLineColor',
    label: '轴线颜色',
    type: 'colorpicker',
    default: '#e5e7eb',
    group: 'Y 轴',
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisSplitLineShow',
    label: '显示网格线',
    type: 'switch',
    default: true,
    group: 'Y 轴',
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisSplitLineColor',
    label: '网格线颜色',
    type: 'colorpicker',
    default: '#f3f4f6',
    group: 'Y 轴',
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },
  {
    key: 'yAxisInverse',
    label: '反向坐标轴',
    type: 'switch',
    default: false,
    group: 'Y 轴',
    visibleWhen: { field: 'yAxisShow', truthy: true },
  },

  // ============ 数据区域缩放 DataZoom ============
  { key: 'dataZoomShow', label: '启用数据缩放', type: 'switch', default: false, group: '数据缩放' },
  {
    key: 'dataZoomType',
    label: '缩放类型',
    type: 'select',
    options: [
      { label: '内置（鼠标滚轮/手势）', value: 'inside' },
      { label: '滑动条组件', value: 'slider' },
    ],
    default: 'inside',
    group: '数据缩放',
    visibleWhen: { field: 'dataZoomShow', truthy: true },
  },
  {
    key: 'dataZoomOrient',
    label: '方向',
    type: 'select',
    options: [
      { label: '水平', value: 'horizontal' },
      { label: '垂直', value: 'vertical' },
    ],
    default: 'horizontal',
    group: '数据缩放',
    visibleWhen: { field: 'dataZoomShow', truthy: true },
  },
  {
    key: 'dataZoomStart',
    label: '起始百分比',
    type: 'slider',
    min: 0,
    max: 100,
    default: 0,
    group: '数据缩放',
    visibleWhen: { field: 'dataZoomShow', truthy: true },
  },
  {
    key: 'dataZoomEnd',
    label: '结束百分比',
    type: 'slider',
    min: 0,
    max: 100,
    default: 100,
    group: '数据缩放',
    visibleWhen: { field: 'dataZoomShow', truthy: true },
  },
]

/** 🔑 原全量 Schema 保留（通用 + 坐标轴），向后兼容 */
export const chartBaseSchema: PropField[] = [...chartCommonSchema, ...chartAxesSchema]

/** 基础文本 Schema（可被其他文本类组件复用） */
export const textBaseSchema: PropField[] = [
  { key: 'text', label: '文本内容', type: 'textarea', default: '文本内容' },
  { key: 'fontSize', label: '字号', type: 'slider', min: 10, max: 72, default: 14, group: '字体' },
  {
    key: 'fontWeight',
    label: '字重',
    type: 'select',
    options: [
      { label: '常规', value: 'normal' },
      { label: '粗体', value: 'bold' },
    ],
    default: 'normal',
    group: '字体',
  },
  { key: 'color', label: '颜色', type: 'colorpicker', default: '#333333', group: '字体' },
  {
    key: 'textAlign',
    label: '对齐',
    type: 'select',
    options: [
      { label: '左对齐', value: 'left' },
      { label: '居中', value: 'center' },
      { label: '右对齐', value: 'right' },
    ],
    default: 'left',
    group: '字体',
  },
  {
    key: 'lineHeight',
    label: '行高',
    type: 'slider',
    min: 1,
    max: 3,
    step: 0.1,
    default: 1.5,
    group: '字体',
  },
]
