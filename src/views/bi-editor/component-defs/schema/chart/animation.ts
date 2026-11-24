import type { PropField } from '../props'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 图表动画配置 Schema（chartCommonSchema 的「动画」分组） */
export const chartAnimationSchema: PropField[] = [
  // ============ 动画 Animation ============
  {
    key: 'animationShow',
    get label() {
      return t('editorMaterial.ui.enableAnimation')
    },
    type: 'switch',
    default: true,
    get group() {
      return t('editorMaterial.ui.animation')
    },
  },
  {
    key: 'animationDuration',
    get label() {
      return t('editorMaterial.ui.animationDurationMs')
    },
    type: 'slider',
    min: 0,
    max: 3000,
    step: 100,
    default: 600,
    get group() {
      return t('editorMaterial.ui.animation')
    },
    visibleWhen: { field: 'animationShow', truthy: true },
  },
  {
    key: 'animationEasing',
    get label() {
      return t('editorMaterial.ui.easing')
    },
    type: 'select',
    options: [
      {
        get label() {
          return t('editorMaterial.ui.linear')
        },
        value: 'linear',
      },
      {
        get label() {
          return t('editorMaterial.ui.quadraticin')
        },
        value: 'quadraticIn',
      },
      {
        get label() {
          return t('editorMaterial.ui.quadraticout')
        },
        value: 'quadraticOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.quadraticinout')
        },
        value: 'quadraticInOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.cubicin')
        },
        value: 'cubicIn',
      },
      {
        get label() {
          return t('editorMaterial.ui.cubicout')
        },
        value: 'cubicOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.cubicinout')
        },
        value: 'cubicInOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.sinusoidalin')
        },
        value: 'sinusoidalIn',
      },
      {
        get label() {
          return t('editorMaterial.ui.sinusoidalout')
        },
        value: 'sinusoidalOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.sinusoidalinout')
        },
        value: 'sinusoidalInOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.exponentialin')
        },
        value: 'exponentialIn',
      },
      {
        get label() {
          return t('editorMaterial.ui.exponentialout')
        },
        value: 'exponentialOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.exponentialinout')
        },
        value: 'exponentialInOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.circularin')
        },
        value: 'circularIn',
      },
      {
        get label() {
          return t('editorMaterial.ui.circularout')
        },
        value: 'circularOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.circularinout')
        },
        value: 'circularInOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.elasticin')
        },
        value: 'elasticIn',
      },
      {
        get label() {
          return t('editorMaterial.ui.elasticout')
        },
        value: 'elasticOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.elasticinout')
        },
        value: 'elasticInOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.backin')
        },
        value: 'backIn',
      },
      {
        get label() {
          return t('editorMaterial.ui.backout')
        },
        value: 'backOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.backinout')
        },
        value: 'backInOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.bouncein')
        },
        value: 'bounceIn',
      },
      {
        get label() {
          return t('editorMaterial.ui.bounceout')
        },
        value: 'bounceOut',
      },
      {
        get label() {
          return t('editorMaterial.ui.bounceinout')
        },
        value: 'bounceInOut',
      },
    ],
    default: 'cubicOut',
    get group() {
      return t('editorMaterial.ui.animation')
    },
    visibleWhen: { field: 'animationShow', truthy: true },
  },
]
