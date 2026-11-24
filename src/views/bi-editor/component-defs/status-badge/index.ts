import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const statusBadgeDefinition: ComponentDefinition = {
  type: 'status-badge',
  meta: {
    get name() {
      return t('editorMaterial.meta.statusBadge')
    },
    category: 'info',
    icon: 'CircleCheck',
    defaultWidth: 120,
    defaultHeight: 32,
  },
  widget: Widget,
  propsSchema: [
    // ============ 内容 ============
    {
      key: 'text',
      get label() {
        return t('editorMaterial.ui.text')
      },
      type: 'input',
      default: t('editorMaterial.ui.running'),
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'status',
      get label() {
        return t('editorMaterial.ui.statusType')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.success')
          },
          value: 'success',
        },
        {
          get label() {
            return t('editorMaterial.ui.warning')
          },
          value: 'warning',
        },
        {
          get label() {
            return t('editorMaterial.ui.danger')
          },
          value: 'danger',
        },
        {
          get label() {
            return t('editorMaterial.ui.info')
          },
          value: 'info',
        },
        {
          get label() {
            return t('editorMaterial.ui.primary')
          },
          value: 'primary',
        },
      ],
      default: 'success',
      get group() {
        return t('editorMaterial.ui.content')
      },
    },
    {
      key: 'iconName',
      get label() {
        return t('editorMaterial.ui.iconName')
      },
      type: 'input',
      default: '',
      get group() {
        return t('editorMaterial.ui.content')
      },
      get tip() {
        return t('editorMaterial.ui.elementPlusIconNameLeaveEmptyToHideIcon')
      },
    },
    // ============ 样式 ============
    {
      key: 'showDot',
      get label() {
        return t('editorMaterial.ui.showDots')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'dotPulse',
      get label() {
        return t('editorMaterial.ui.blinkingDots')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'fontSize',
      get label() {
        return t('editorMaterial.ui.fontSize')
      },
      type: 'number',
      min: 12,
      max: 32,
      default: 14,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'successColor',
      get label() {
        return t('editorMaterial.ui.successColor')
      },
      type: 'colorpicker',
      default: '#2ec07e',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'warningColor',
      get label() {
        return t('editorMaterial.ui.warningColor')
      },
      type: 'colorpicker',
      default: '#fac858',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'dangerColor',
      get label() {
        return t('editorMaterial.ui.dangerColor')
      },
      type: 'colorpicker',
      default: '#ee6666',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'infoColor',
      get label() {
        return t('editorMaterial.ui.infoColor')
      },
      type: 'colorpicker',
      default: '#909399',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'primaryColor',
      get label() {
        return t('editorMaterial.ui.primaryColor')
      },
      type: 'colorpicker',
      default: '#5470c6',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'solid',
      get label() {
        return t('editorMaterial.ui.solidBackground')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.style')
      },
      get tip() {
        return t(
          'editorMaterial.ui.trueSolidBackgroundWithWhiteTextFalseLightBackgroundWithSameColorText',
        )
      },
    },
    {
      key: 'rounded',
      get label() {
        return t('editorMaterial.ui.cornerRadius')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
  ],
  defaultStyle: {},
  supportsDataBinding: false,
}

export default statusBadgeDefinition
