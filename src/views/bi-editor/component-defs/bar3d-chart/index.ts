import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'
import { chartCommonSchema } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/**
 * 🔑 真3D柱状图（WebGL 渲染）默认数据
 *   二维网格：X 轴 = 时间类别（Q1-Q4），Y 轴 = 产品类别（A/B/C），Z 轴 = 数值
 */
export const BAR3D_DEFAULT_CATEGORIES = ['Q1', 'Q2', 'Q3', 'Q4']
export const BAR3D_DEFAULT_SERIES = [
  { name: t('editorMaterial.series.productA'), data: [320, 280, 360, 400] },
  { name: t('editorMaterial.series.productB'), data: [280, 240, 320, 360] },
  { name: t('editorMaterial.series.productC'), data: [200, 220, 260, 300] },
]

export const bar3dChartDefinition: ComponentDefinition = {
  type: 'bar3d-chart',
  meta: {
    get name() {
      return t('editorMaterial.meta.3dBarChart')
    },
    category: 'chart',
    icon: 'Histogram',
    defaultWidth: 480,
    defaultHeight: 380,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    ...chartCommonSchema,
    // 颜色
    {
      key: 'visualOn',
      get label() {
        return t('editorMaterial.ui.numericGradient')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.color')
      },
      get tip() {
        return t('editorMaterial.ui.colorBarsByZValueFromLowToHigh')
      },
    },
    {
      key: 'colorLow',
      get label() {
        return t('editorMaterial.ui.lowValueColor')
      },
      type: 'colorpicker',
      default: '#67e8f9',
      get group() {
        return t('editorMaterial.ui.color')
      },
      get tip() {
        return t('editorMaterial.ui.lowerValuesApproachThisColor')
      },
      visibleWhen: { field: 'visualOn', truthy: true },
    },
    {
      key: 'colorHigh',
      get label() {
        return t('editorMaterial.ui.highValueColor')
      },
      type: 'colorpicker',
      default: '#0e7490',
      get group() {
        return t('editorMaterial.ui.color')
      },
      get tip() {
        return t('editorMaterial.ui.higherValuesApproachThisColor')
      },
      visibleWhen: { field: 'visualOn', truthy: true },
    },
    {
      key: 'barColor',
      get label() {
        return t('editorMaterial.ui.barColor')
      },
      type: 'colorpicker',
      default: '#22d3ee',
      get group() {
        return t('editorMaterial.ui.color')
      },
      get tip() {
        return t('editorMaterial.ui.uniformBarColorWhenGradientIsOff')
      },
      visibleWhen: { field: 'visualOn', truthy: false },
    },
    // 视角
    {
      key: 'autoRotate',
      get label() {
        return t('editorMaterial.ui.autoRotate')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.viewAngle')
      },
      get tip() {
        return t('editorMaterial.ui.cameraAutoRotatesAroundTheScene')
      },
    },
    {
      key: 'rotateSpeed',
      get label() {
        return t('editorMaterial.ui.rotationSpeed')
      },
      type: 'slider',
      min: 0,
      max: 10,
      step: 0.5,
      default: 3,
      get group() {
        return t('editorMaterial.ui.viewAngle')
      },
      get tip() {
        return t('editorMaterial.ui.noEffectWhenAutorotateFalse')
      },
      visibleWhen: { field: 'autoRotate', truthy: true },
    },
    {
      key: 'viewDistance',
      get label() {
        return t('editorMaterial.ui.viewDistance')
      },
      type: 'slider',
      min: 100,
      max: 400,
      default: 220,
      get group() {
        return t('editorMaterial.ui.viewAngle')
      },
      get tip() {
        return t('editorMaterial.ui.cameraDistanceToScene')
      },
    },
    {
      key: 'elevation',
      get label() {
        return t('editorMaterial.ui.pitchAngle')
      },
      type: 'slider',
      min: 0,
      max: 90,
      default: 20,
      get group() {
        return t('editorMaterial.ui.viewAngle')
      },
      get tip() {
        return t('editorMaterial.ui.0LevelView90TopDown')
      },
    },
    // 场景
    {
      key: 'boxWidth',
      get label() {
        return t('editorMaterial.ui.sceneWidth')
      },
      type: 'slider',
      min: 60,
      max: 200,
      default: 120,
      get group() {
        return t('editorMaterial.ui.scene')
      },
      get tip() {
        return t('editorMaterial.ui.xSpan')
      },
    },
    {
      key: 'boxDepth',
      get label() {
        return t('editorMaterial.ui.sceneDepth')
      },
      type: 'slider',
      min: 40,
      max: 150,
      default: 80,
      get group() {
        return t('editorMaterial.ui.scene')
      },
      get tip() {
        return t('editorMaterial.ui.ySpan')
      },
    },
    // 着色
    {
      key: 'shading',
      get label() {
        return t('editorMaterial.ui.coloringMode')
      },
      type: 'select',
      options: [
        { label: 'Lambert', value: 'lambert' },
        {
          get label() {
            return t('editorMaterial.ui.solid')
          },
          value: 'color',
        },
        {
          get label() {
            return t('editorMaterial.ui.realistic')
          },
          value: 'realistic',
        },
      ],
      default: 'lambert',
      get group() {
        return t('editorMaterial.ui.coloring')
      },
      get tip() {
        return t('editorMaterial.ui.lambertDiffuseRealisticMetallicReflectionSolidNoShading')
      },
    },
    // 标签
    {
      key: 'showLabel',
      get label() {
        return t('editorMaterial.ui.showValue')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.label')
      },
    },
    {
      key: 'labelColor',
      get label() {
        return t('editorMaterial.ui.labelColor')
      },
      type: 'colorpicker',
      default: '#ffffff',
      get group() {
        return t('editorMaterial.ui.label')
      },
      visibleWhen: { field: 'showLabel', truthy: true },
    },
  ],
  extraDefaults: {
    categories: BAR3D_DEFAULT_CATEGORIES,
    series: BAR3D_DEFAULT_SERIES,
  },
  defaultStyle: {},
  supportsDataBinding: true,
  dataBindingSchema: [
    {
      key: 'categoryField',
      get label() {
        return t('editorMaterial.ui.xAxisCategoryField')
      },
      type: 'category',
    },
    {
      key: 'seriesField',
      get label() {
        return t('editorMaterial.ui.yAxisSeriesField')
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

export default bar3dChartDefinition
