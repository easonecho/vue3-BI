import type { PropField } from '../props'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/**
 * 🔑 图表注释：在图上叠加文本注释或标记点。
 *
 *   - 文本注释：通过 graphic 定位到画布百分比位置，所有图表可用；
 *   - 标记点：markPoint 挂到第一个 bar/line/scatter 系列，用于标注峰值/目标值。
 */
export const chartAnnotationSchema: PropField[] = [
  {
    key: 'annotationShow',
    get label() {
      return t('editorMaterial.ui.showAnnotation')
    },
    type: 'switch',
    default: false,
    get group() {
      return t('editorMaterial.ui.annotation')
    },
    get tip() {
      return t('editorMaterial.ui.overlayTextAnnotationsOrDataMarkPointsOnTheChart')
    },
  },
  {
    key: 'annotationType',
    get label() {
      return t('editorMaterial.ui.annotationType')
    },
    type: 'select',
    default: 'markPoint',
    get group() {
      return t('editorMaterial.ui.annotation')
    },
    visibleWhen: { field: 'annotationShow', truthy: true },
    options: [
      {
        get label() {
          return t('editorMaterial.ui.markPoint')
        },
        value: 'markPoint',
      },
      {
        get label() {
          return t('editorMaterial.ui.textAnnotation')
        },
        value: 'text',
      },
    ],
  },
  {
    key: 'annotationText',
    get label() {
      return t('editorMaterial.ui.annotationText')
    },
    type: 'input',
    default: '',
    get placeholder() {
      return t('editorMaterial.ui.eGThisMonthPeak')
    },
    get group() {
      return t('editorMaterial.ui.annotation')
    },
    visibleWhen: { field: 'annotationShow', truthy: true },
  },
  {
    key: 'annotationValue',
    get label() {
      return t('editorMaterial.ui.markValueMarkPoint')
    },
    type: 'number',
    default: 0,
    step: 1,
    get group() {
      return t('editorMaterial.ui.annotation')
    },
    visibleWhen: { field: 'annotationShow', truthy: true },
    get tip() {
      return t('editorMaterial.ui.positionTheMarkPointAtThisYValue0MarksTheSeriesMaxAutomatically')
    },
  },
  {
    key: 'annotationLeft',
    get label() {
      return t('editorMaterial.ui.horizontalPositionText')
    },
    type: 'number',
    default: 70,
    min: 0,
    max: 100,
    step: 1,
    get group() {
      return t('editorMaterial.ui.annotation')
    },
    visibleWhen: { field: 'annotationShow', truthy: true },
  },
  {
    key: 'annotationTop',
    get label() {
      return t('editorMaterial.ui.verticalPositionText')
    },
    type: 'number',
    default: 12,
    min: 0,
    max: 100,
    step: 1,
    get group() {
      return t('editorMaterial.ui.annotation')
    },
    visibleWhen: { field: 'annotationShow', truthy: true },
  },
  {
    key: 'annotationColor',
    get label() {
      return t('editorMaterial.ui.annotationColor')
    },
    type: 'colorpicker',
    default: '#ef4444',
    get group() {
      return t('editorMaterial.ui.annotation')
    },
    visibleWhen: { field: 'annotationShow', truthy: true },
  },
  {
    key: 'annotationFontSize',
    get label() {
      return t('editorMaterial.ui.annotationFontSize')
    },
    type: 'number',
    default: 12,
    min: 8,
    max: 32,
    step: 1,
    get group() {
      return t('editorMaterial.ui.annotation')
    },
    visibleWhen: { field: 'annotationShow', truthy: true },
  },
]
