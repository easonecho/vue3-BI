import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const treeTableDefinition: ComponentDefinition = {
  type: 'tree-table',
  meta: {
    get name() {
      return t('editorMaterial.meta.treeTable')
    },
    category: 'data',
    icon: 'Grid',
    defaultWidth: 500,
    defaultHeight: 320,
  },
  widget: Widget,
  propsSchema: [
    // ============ 样式 ============
    {
      key: 'showIndex',
      get label() {
        return t('editorMaterial.ui.showIndex')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'bordered',
      get label() {
        return t('editorMaterial.ui.showBorder')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'striped',
      get label() {
        return t('editorMaterial.ui.zebraStripes')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'headerColor',
      get label() {
        return t('editorMaterial.ui.headerTextColor')
      },
      type: 'colorpicker',
      default: '#1f2937',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'headerBgColor',
      get label() {
        return t('editorMaterial.ui.headerBackgroundColor')
      },
      type: 'colorpicker',
      default: '#f3f4f6',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'rowColor',
      get label() {
        return t('editorMaterial.ui.rowTextColor')
      },
      type: 'colorpicker',
      default: '#1f2937',
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'borderColor',
      get label() {
        return t('editorMaterial.ui.borderColor')
      },
      type: 'colorpicker',
      default: '#e5e7eb',
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
      max: 18,
      default: 13,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'rowHeight',
      get label() {
        return t('editorMaterial.ui.rowHeight')
      },
      type: 'number',
      min: 28,
      max: 60,
      default: 36,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'expandAll',
      get label() {
        return t('editorMaterial.ui.expandAllByDefault')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
    {
      key: 'indentSize',
      get label() {
        return t('editorMaterial.ui.indentPixels')
      },
      type: 'number',
      min: 8,
      max: 40,
      default: 16,
      get group() {
        return t('editorMaterial.ui.style')
      },
    },
  ],
  extraDefaults: {
    columns: [
      {
        key: 'name',
        get label() {
          return t('editorMaterial.ui.name')
        },
      },
      {
        key: 'count',
        get label() {
          return t('editorMaterial.ui.count2')
        },
      },
      {
        key: 'status',
        get label() {
          return t('editorMaterial.ui.status')
        },
      },
    ],
    data: [
      {
        id: 1,
        name: '总部',
        count: 100,
        status: '正常',
        children: [
          { id: 2, name: '技术部', count: 50, status: '正常' },
          {
            id: 3,
            name: '市场部',
            count: 30,
            status: '正常',
            children: [
              { id: 4, name: '国内组', count: 18, status: '正常' },
              { id: 5, name: '海外组', count: 12, status: '停用' },
            ],
          },
          { id: 6, name: '财务部', count: 20, status: '正常' },
        ],
      },
    ],
  },
  defaultStyle: {},
  supportsDataBinding: false,
}

export default treeTableDefinition
