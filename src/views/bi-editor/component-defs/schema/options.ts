import type { SelectOption } from './props'

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

// ================= 文本样式公共 select 选项 =================
/** 字体家族选项（给每个可单独配文本样式的子分组复用） */
export const FONT_FAMILY_OPTIONS: readonly SelectOption[] = [
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
] as const

/** 字重选项（normal / bold / 100~900） */
export const FONT_WEIGHT_OPTIONS: readonly SelectOption[] = [
  { label: '极细 (100)', value: 100 },
  { label: '细 (300)', value: 300 },
  { label: '常规 (400 / normal)', value: 'normal' },
  { label: '中等 (500)', value: 500 },
  { label: '半粗 (600)', value: 600 },
  { label: '粗体 (700 / bold)', value: 'bold' },
  { label: '特粗 (900)', value: 900 },
] as const

/** 字体样式（常规 / 斜体） */
export const FONT_STYLE_OPTIONS: readonly SelectOption[] = [
  { label: '常规', value: 'normal' },
  { label: 'italic斜体', value: 'italic' },
  { label: 'oblique斜体（倾斜）', value: 'oblique' },
] as const

/** 字体家族默认值（与 FONT_FAMILY_OPTIONS[0].value 保持一致） */
export const DEFAULT_FONT_FAMILY: string =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

/** 🔑 聚合方式选项 (图表数据下推) */
export const AGGREGATE_OPTIONS: readonly SelectOption[] = [
  { label: '不聚合（原始行）', value: 'none' },
  { label: '求和', value: 'sum' },
  { label: '平均值', value: 'avg' },
  { label: '计数', value: 'count' },
  { label: '去重计数', value: 'countDistinct' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
] as const
