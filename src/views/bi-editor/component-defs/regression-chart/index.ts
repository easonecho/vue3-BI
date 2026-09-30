import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, buildSeriesLabelSchema } from '../types'

/** 🔑 回归分析图默认数据：30 个散点,正相关性 y ≈ 2x + 1 + 噪声 */
function buildRegressionDefaults(): {
  scatterData: number[][]
  regressionLine: { slope: number; intercept: number }
} {
  const scatterData: number[][] = []
  // 🔑 固定种子伪随机,保证每次加载结果一致
  let seed = 42
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  // 🔑 真实线性关系:y = 2x + 1 + noise
  const trueSlope = 2
  const trueIntercept = 1
  for (let i = 0; i < 30; i++) {
    const x = +(rand() * 10).toFixed(2)
    const noise = +((rand() - 0.5) * 4).toFixed(2)
    const y = +(trueSlope * x + trueIntercept + noise).toFixed(2)
    scatterData.push([x, y])
  }
  // 🔑 用最小二乘法计算回归方程系数（与 Widget 内算法一致,保证默认数据与默认渲染匹配）
  const n = scatterData.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  for (const [x, y] of scatterData) {
    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
  }
  const slope = +((n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)).toFixed(4)
  const intercept = +((sumY - slope * sumX) / n).toFixed(4)
  return { scatterData, regressionLine: { slope, intercept } }
}

const regressionDefaults = buildRegressionDefaults()

export const REGRESSION_DEFAULT_SCATTER_DATA = regressionDefaults.scatterData
export const REGRESSION_DEFAULT_LINE = regressionDefaults.regressionLine

export const REGRESSION_DEFAULT_SCATTER_COLOR = '#5470c6'
export const REGRESSION_DEFAULT_LINE_COLOR = '#ee6666'
export const REGRESSION_DEFAULT_CONFIDENCE_COLOR = 'rgba(84,112,198,0.2)'

export const regressionChartDefinition: ComponentDefinition = {
  type: 'regression-chart',
  meta: {
    name: '回归分析图',
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 480,
    defaultHeight: 320,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    { key: 'showRegression', label: '显示回归线', type: 'switch', default: true, group: '回归' },
    {
      key: 'showConfidence',
      label: '显示置信区间',
      type: 'switch',
      default: true,
      group: '回归',
    },
    {
      key: 'confidenceLevel',
      label: '置信度',
      type: 'select',
      options: [
        { label: '90%', value: '90' },
        { label: '95%', value: '95' },
        { label: '99%', value: '99' },
      ],
      default: '95',
      group: '回归',
      visibleWhen: { field: 'showConfidence', truthy: true },
    },
    {
      key: 'scatterColor',
      label: '散点颜色',
      type: 'colorpicker',
      default: REGRESSION_DEFAULT_SCATTER_COLOR,
      group: '颜色',
    },
    {
      key: 'lineColor',
      label: '回归线颜色',
      type: 'colorpicker',
      default: REGRESSION_DEFAULT_LINE_COLOR,
      group: '颜色',
      visibleWhen: { field: 'showRegression', truthy: true },
    },
    {
      key: 'confidenceColor',
      label: '置信区间颜色',
      type: 'colorpicker',
      default: REGRESSION_DEFAULT_CONFIDENCE_COLOR,
      group: '颜色',
      visibleWhen: { field: 'showConfidence', truthy: true },
    },
    {
      key: 'symbolSize',
      label: '点大小',
      type: 'slider',
      min: 5,
      max: 20,
      default: 8,
      group: '样式',
    },
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    scatterData: REGRESSION_DEFAULT_SCATTER_DATA,
    regressionLine: REGRESSION_DEFAULT_LINE,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'xField', label: 'X字段', type: 'value' },
    { key: 'yField', label: 'Y字段', type: 'value' },
  ],
}

export default regressionChartDefinition
