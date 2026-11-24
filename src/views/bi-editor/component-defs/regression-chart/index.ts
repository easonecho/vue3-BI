import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

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
    get name() {
      return t('editorMaterial.meta.regressionChart')
    },
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 480,
    defaultHeight: 320,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'showRegression',
      get label() {
        return t('editorMaterial.ui.showRegressionLine')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.regression')
      },
    },
    {
      key: 'showConfidence',
      get label() {
        return t('editorMaterial.ui.showConfidenceInterval')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.regression')
      },
    },
    {
      key: 'confidenceLevel',
      get label() {
        return t('editorMaterial.ui.confidenceLevel')
      },
      type: 'select',
      options: [
        { label: '90%', value: '90' },
        { label: '95%', value: '95' },
        { label: '99%', value: '99' },
      ],
      default: '95',
      get group() {
        return t('editorMaterial.ui.regression')
      },
      visibleWhen: { field: 'showConfidence', truthy: true },
    },
    {
      key: 'scatterColor',
      get label() {
        return t('editorMaterial.ui.pointColor')
      },
      type: 'colorpicker',
      default: REGRESSION_DEFAULT_SCATTER_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
    },
    {
      key: 'lineColor',
      get label() {
        return t('editorMaterial.ui.regressionLineColor')
      },
      type: 'colorpicker',
      default: REGRESSION_DEFAULT_LINE_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
      visibleWhen: { field: 'showRegression', truthy: true },
    },
    {
      key: 'confidenceColor',
      get label() {
        return t('editorMaterial.ui.confidenceIntervalColor')
      },
      type: 'colorpicker',
      default: REGRESSION_DEFAULT_CONFIDENCE_COLOR,
      get group() {
        return t('editorMaterial.ui.color')
      },
      visibleWhen: { field: 'showConfidence', truthy: true },
    },
    {
      key: 'symbolSize',
      get label() {
        return t('editorMaterial.ui.pointSize')
      },
      type: 'slider',
      min: 5,
      max: 20,
      default: 8,
      get group() {
        return t('editorMaterial.ui.style')
      },
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
    {
      key: 'xField',
      get label() {
        return t('editorMaterial.ui.xField')
      },
      type: 'value',
    },
    {
      key: 'yField',
      get label() {
        return t('editorMaterial.ui.yField')
      },
      type: 'value',
    },
  ],
}

export default regressionChartDefinition
