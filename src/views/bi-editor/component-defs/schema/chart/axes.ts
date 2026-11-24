import type { PropField } from '../props'
import { chartDataZoomSchema } from './data-zoom'
import { chartXAxisSchema } from './x-axis'
import { chartYAxisSchema } from './y-axis'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 分析指标（占比 / 同环比）：仅坐标轴图表，在 tooltip 中展示，不改变原始数据 */
export const chartAnalysisSchema: PropField[] = [
  {
    key: 'sharePercentShow',
    get label() {
      return t('editorMaterial.ui.showPercentage')
    },
    type: 'switch',
    default: false,
    get group() {
      return t('editorMaterial.ui.dataComparison')
    },
    get tip() {
      return t('editorMaterial.ui.showTheCurrentValueAsAPercentageOfTheSeriesTotalInTheTooltip')
    },
  },
  {
    key: 'compareShow',
    get label() {
      return t('editorMaterial.ui.showMomYoy')
    },
    type: 'switch',
    default: false,
    get group() {
      return t('editorMaterial.ui.dataComparison')
    },
    get tip() {
      return t(
        'editorMaterial.ui.momComparesThePreviousCategoryYoyComparesNCategoriesBackXAxisOrder',
      )
    },
  },
  {
    key: 'compareYoyLag',
    get label() {
      return t('editorMaterial.ui.yoyLag')
    },
    type: 'number',
    default: 12,
    min: 1,
    max: 60,
    step: 1,
    get group() {
      return t('editorMaterial.ui.dataComparison')
    },
    get tip() {
      return t('editorMaterial.ui.yoyComparesNCategoriesBackUse12ForMonthlyAnd4ForQuarterlyData')
    },
    visibleWhen: { field: 'compareShow', truthy: true },
  },
]

/** 🔑 数值参考线（仅坐标轴图表）：Y 轴水平虚线，用于对比目标值/阈值 */
export const chartReferenceLineSchema: PropField[] = [
  {
    key: 'referenceLineShow',
    get label() {
      return t('editorMaterial.ui.showReferenceLine')
    },
    type: 'switch',
    default: false,
    get group() {
      return t('editorMaterial.ui.referenceLine')
    },
    get tip() {
      return t('editorMaterial.ui.drawAHorizontalDashedLineAtTheGivenYValue')
    },
  },
  {
    key: 'referenceLineValue',
    get label() {
      return t('editorMaterial.ui.referenceValue')
    },
    type: 'number',
    default: 0,
    step: 1,
    get group() {
      return t('editorMaterial.ui.referenceLine')
    },
    get tip() {
      return t('editorMaterial.ui.referenceLineValueOnTheYAxis')
    },
    visibleWhen: { field: 'referenceLineShow', truthy: true },
  },
  {
    key: 'referenceLineLabel',
    get label() {
      return t('editorMaterial.ui.lineLabel')
    },
    type: 'input',
    default: '',
    get placeholder() {
      return t('editorMaterial.ui.leaveEmptyToShowTheReferenceValue')
    },
    get group() {
      return t('editorMaterial.ui.referenceLine')
    },
    visibleWhen: { field: 'referenceLineShow', truthy: true },
  },
  {
    key: 'referenceLineColor',
    get label() {
      return t('editorMaterial.ui.lineColor')
    },
    type: 'colorpicker',
    default: '#ef4444',
    get group() {
      return t('editorMaterial.ui.referenceLine')
    },
    visibleWhen: { field: 'referenceLineShow', truthy: true },
  },
]

/** 🔑 坐标轴 / 数据缩放专属 Schema（仅柱/折线/散点等带 X/Y 轴的图表使用） */
export const chartAxesSchema: PropField[] = [
  ...chartXAxisSchema,
  ...chartYAxisSchema,
  ...chartDataZoomSchema,
  ...chartAnalysisSchema,
  ...chartReferenceLineSchema,
]
