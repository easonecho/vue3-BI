import type { PropField } from './props'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 基础文本 Schema（可被其他文本类组件复用） */
export const textBaseSchema: PropField[] = [
  {
    key: 'text',
    get label() {
      return t('editorMaterial.ui.textContent')
    },
    type: 'textarea',
    default: t('editorMaterial.ui.textContent'),
  },
  {
    key: 'fontSize',
    get label() {
      return t('editorMaterial.ui.fontSize')
    },
    type: 'slider',
    min: 10,
    max: 72,
    default: 14,
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
    ],
    default: 'normal',
    get group() {
      return t('editorMaterial.ui.font')
    },
  },
  {
    key: 'color',
    get label() {
      return t('editorMaterial.ui.color')
    },
    type: 'colorpicker',
    default: '#333333',
    get group() {
      return t('editorMaterial.ui.font')
    },
  },
  {
    key: 'textAlign',
    get label() {
      return t('editorMaterial.ui.align')
    },
    type: 'select',
    options: [
      {
        get label() {
          return t('editorMaterial.ui.leftAlign')
        },
        value: 'left',
      },
      {
        get label() {
          return t('editorMaterial.ui.center')
        },
        value: 'center',
      },
      {
        get label() {
          return t('editorMaterial.ui.rightAlign')
        },
        value: 'right',
      },
    ],
    default: 'left',
    get group() {
      return t('editorMaterial.ui.font')
    },
  },
  {
    key: 'lineHeight',
    get label() {
      return t('editorMaterial.ui.rowHeight')
    },
    type: 'slider',
    min: 1,
    max: 3,
    step: 0.1,
    default: 1.5,
    get group() {
      return t('editorMaterial.ui.font')
    },
  },
]
