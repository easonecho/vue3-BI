import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartBaseSchema, baseSeriesStylesNoAxesColumns, buildSeriesLabelSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

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
    get name() {
      return t('editorMaterial.meta.heatmap')
    },
    category: 'chart',
    icon: 'DataLine',
    defaultWidth: 480,
    defaultHeight: 360,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartBaseSchema,
    {
      key: 'labelShow',
      get label() {
        return t('editorMaterial.ui.showDataLabels')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'visualMapShow',
      get label() {
        return t('editorMaterial.ui.showVisualMapping')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'visualMapOrient',
      get label() {
        return t('editorMaterial.ui.visualMappingDirection')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.horizontal')
          },
          value: 'horizontal',
        },
        {
          get label() {
            return t('editorMaterial.ui.vertical')
          },
          value: 'vertical',
        },
      ],
      default: 'horizontal',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'minColor',
      get label() {
        return t('editorMaterial.ui.minColor2')
      },
      type: 'colorpicker',
      default: '#e0ffff',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'maxColor',
      get label() {
        return t('editorMaterial.ui.maxColor2')
      },
      type: 'colorpicker',
      default: '#ff4500',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'seriesStyles',
      get label() {
        return t('editorMaterial.ui.seriesStyles')
      },
      type: 'table',
      default: [],
      get group() {
        return t('editorMaterial.ui.dataSeries')
      },
      get tip() {
        return t('editorMaterial.ui.heatmapsUsuallyDoNotNeedPerSeriesStylesThisTableIsReserved')
      },
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
    {
      key: 'xField',
      get label() {
        return t('editorMaterial.ui.xAxisField2')
      },
      type: 'category',
    },
    {
      key: 'yField',
      get label() {
        return t('editorMaterial.ui.yAxisField2')
      },
      type: 'category',
    },
    {
      key: 'valueField',
      get label() {
        return t('editorMaterial.ui.valueField')
      },
      type: 'value',
    },
  ],
}

export default definition
