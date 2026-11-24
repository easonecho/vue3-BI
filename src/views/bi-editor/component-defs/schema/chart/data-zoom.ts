import type { PropField } from '../props'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 数据区域缩放配置 Schema（chartAxesSchema 的「数据缩放」分组） */
export const chartDataZoomSchema: PropField[] = [
  // ============ 数据区域缩放 DataZoom ============
  {
    key: 'dataZoomShow',
    get label() {
      return t('editorMaterial.ui.enableDataZoom')
    },
    type: 'switch',
    default: false,
    get group() {
      return t('editorMaterial.ui.dataZoom')
    },
  },
  {
    key: 'dataZoomType',
    get label() {
      return t('editorMaterial.ui.zoomType')
    },
    type: 'select',
    options: [
      {
        get label() {
          return t('editorMaterial.ui.builtInWheelGesture')
        },
        value: 'inside',
      },
      {
        get label() {
          return t('editorMaterial.ui.sliderComponent')
        },
        value: 'slider',
      },
    ],
    default: 'inside',
    get group() {
      return t('editorMaterial.ui.dataZoom')
    },
    visibleWhen: { field: 'dataZoomShow', truthy: true },
  },
  {
    key: 'dataZoomOrient',
    get label() {
      return t('editorMaterial.ui.direction')
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
      return t('editorMaterial.ui.dataZoom')
    },
    visibleWhen: { field: 'dataZoomShow', truthy: true },
  },
  {
    key: 'dataZoomStart',
    get label() {
      return t('editorMaterial.ui.startPercent')
    },
    type: 'slider',
    min: 0,
    max: 100,
    default: 0,
    get group() {
      return t('editorMaterial.ui.dataZoom')
    },
    visibleWhen: { field: 'dataZoomShow', truthy: true },
  },
  {
    key: 'dataZoomEnd',
    get label() {
      return t('editorMaterial.ui.endPercent')
    },
    type: 'slider',
    min: 0,
    max: 100,
    default: 100,
    get group() {
      return t('editorMaterial.ui.dataZoom')
    },
    visibleWhen: { field: 'dataZoomShow', truthy: true },
  },
]
