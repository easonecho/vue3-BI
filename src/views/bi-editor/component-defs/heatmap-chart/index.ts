import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import {
  chartBaseSchema,
  baseSeriesStylesNoAxesColumns,
  buildSeriesLabelSchema,
} from '../types'

/** 🔑 热力图默认真实数据 (小时 x 星期 矩阵) */
export const HEATMAP_DEFAULT_X = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
export const HEATMAP_DEFAULT_Y = ['0点', '4点', '8点', '12点', '16点', '20点']
export const HEATMAP_DEFAULT_DATA = (() => {
  const list: [number, number, number][] = []
  const matrix = [
    [0, 2, 5, 8, 12, 18, 22],
    [0, 1, 4, 6, 10, 14, 20],
    [3, 5, 9, 15, 22, 28, 30],
    [8, 12, 18, 25, 35, 40, 38],
    [5, 8, 14, 20, 28, 32, 30],
    [2, 4, 8, 12, 18, 22, 24],
  ]
  matrix.forEach((row, y) => row.forEach((val, x) => list.push([x, y, val])))
  return list
})()

const definition: ComponentDefinition = {
  type: 'heatmap-chart',
  meta: {
    name: '热力图',
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 480,
    defaultHeight: 360,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    { key: 'labelShow', label: '显示数据标签', type: 'switch', default: true, group: '样式' },
    { key: 'visualMapShow', label: '显示视觉映射', type: 'switch', default: true, group: '样式' },
    { key: 'visualMapOrient', label: '视觉映射方向', type: 'select', options: [
      { label: '水平', value: 'horizontal' },
      { label: '垂直', value: 'vertical' },
    ], default: 'horizontal', group: '样式' },
    { key: 'minColor', label: '最小值颜色', type: 'colorpicker', default: '#e0ffff', group: '样式' },
    { key: 'maxColor', label: '最大值颜色', type: 'colorpicker', default: '#ff4500', group: '样式' },
    {
      key: 'seriesStyles',
      label: '数据系列样式',
      type: 'table',
      default: [],
      group: '数据系列',
      tip: '热力图通常不需要按系列配置样式，此表预留',
      columns: [...baseSeriesStylesNoAxesColumns],
    },
    ...buildSeriesLabelSchema('top'),
  ],
  extraDefaults: {
    heatmapX: HEATMAP_DEFAULT_X,
    heatmapY: HEATMAP_DEFAULT_Y,
    heatmapData: HEATMAP_DEFAULT_DATA,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    { key: 'xField', label: 'X轴字段', type: 'category' },
    { key: 'yField', label: 'Y轴字段', type: 'category' },
    { key: 'valueField', label: '数值字段', type: 'value' },
  ],
}

export default definition
