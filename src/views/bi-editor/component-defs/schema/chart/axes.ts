import type { PropField } from '../props'
import { chartDataZoomSchema } from './data-zoom'
import { chartXAxisSchema } from './x-axis'
import { chartYAxisSchema } from './y-axis'

/** 🔑 数值参考线（仅坐标轴图表）：Y 轴水平虚线，用于对比目标值/阈值 */
export const chartReferenceLineSchema: PropField[] = [
  {
    key: 'referenceLineShow',
    label: '显示参考线',
    type: 'switch',
    default: false,
    group: '参考线',
    tip: '在 Y 轴指定数值处绘制水平虚线',
  },
  {
    key: 'referenceLineValue',
    label: '参考值',
    type: 'number',
    default: 0,
    step: 1,
    group: '参考线',
    tip: '参考线在 Y 轴上的数值位置',
    visibleWhen: { field: 'referenceLineShow', truthy: true },
  },
  {
    key: 'referenceLineLabel',
    label: '线条标签',
    type: 'input',
    default: '',
    placeholder: '留空则显示参考值',
    group: '参考线',
    visibleWhen: { field: 'referenceLineShow', truthy: true },
  },
  {
    key: 'referenceLineColor',
    label: '线条颜色',
    type: 'colorpicker',
    default: '#ef4444',
    group: '参考线',
    visibleWhen: { field: 'referenceLineShow', truthy: true },
  },
]

/** 🔑 坐标轴 / 数据缩放专属 Schema（仅柱/折线/散点等带 X/Y 轴的图表使用） */
export const chartAxesSchema: PropField[] = [
  ...chartXAxisSchema,
  ...chartYAxisSchema,
  ...chartDataZoomSchema,
  ...chartReferenceLineSchema,
]
