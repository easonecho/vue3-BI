import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const clockDefinition: ComponentDefinition = {
  type: 'clock',
  meta: {
    get name() {
      return t('editorMaterial.meta.liveClock')
    },
    category: 'info',
    icon: 'Clock',
    defaultWidth: 200,
    defaultHeight: 80,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'showDate',
      get label() {
        return t('editorMaterial.ui.showDate')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.show')
      },
      get tip() {
        return t('editorMaterial.ui.showDate')
      },
    },
    {
      key: 'showWeek',
      get label() {
        return t('editorMaterial.ui.showWeekday')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.show')
      },
      get tip() {
        return t('editorMaterial.ui.showWeekday')
      },
    },
    {
      key: 'showSeconds',
      get label() {
        return t('editorMaterial.ui.showSeconds')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.show')
      },
      get tip() {
        return t('editorMaterial.ui.showSeconds')
      },
    },
    {
      key: 'format24',
      get label() {
        return t('editorMaterial.ui.24HourFormat')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.show')
      },
      get tip() {
        return t('editorMaterial.ui.24HourFormat')
      },
    },
    {
      key: 'fontSize',
      get label() {
        return t('editorMaterial.ui.timeFontSize')
      },
      type: 'slider',
      min: 14,
      max: 60,
      default: 32,
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'dateFontSize',
      get label() {
        return t('editorMaterial.ui.dateFontSize')
      },
      type: 'slider',
      min: 10,
      max: 24,
      default: 14,
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'color',
      get label() {
        return t('editorMaterial.ui.timeColor')
      },
      type: 'colorpicker',
      default: '#ffffff',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'weekColor',
      get label() {
        return t('editorMaterial.ui.weekdayColor')
      },
      type: 'colorpicker',
      default: '#94a3b8',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'fontWeight',
      get label() {
        return t('editorMaterial.ui.fontWeight')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.normal')
          },
          value: 'normal',
        },
        {
          get label() {
            return t('editorMaterial.ui.bold')
          },
          value: 'bold',
        },
        {
          get label() {
            return t('editorMaterial.ui.light')
          },
          value: 'lighter',
        },
      ],
      default: 'bold',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'fontFamily',
      get label() {
        return t('editorMaterial.ui.font')
      },
      type: 'select',
      options: [
        {
          get label() {
            return t('editorMaterial.ui.monospace')
          },
          value: 'Consolas, "Courier New", monospace',
        },
        {
          get label() {
            return t('editorMaterial.ui.default')
          },
          value: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      ],
      default: 'Consolas, "Courier New", monospace',
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
  ],
  defaultStyle: {},
}

export default clockDefinition
