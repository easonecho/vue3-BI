/**
 * 全局筛选器组件定义
 * 下拉选择器, 选中后广播值到其他图表组件
 */
import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const filterDefinition: ComponentDefinition = {
  type: 'filter',
  meta: {
    get name() {
      return t('editorMaterial.meta.filter')
    },
    category: 'data',
    icon: 'Filter',
    defaultWidth: 240,
    defaultHeight: 60,
  },
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    {
      key: 'title',
      get label() {
        return t('editorMaterial.ui.title')
      },
      type: 'input',
      default: t('editorMaterial.ui.pleaseSelect'),
      get group() {
        return t('editorMaterial.ui.basic')
      },
    },
    {
      key: 'filterKey',
      get label() {
        return t('editorMaterial.ui.filterFieldManualWhenNoDataset')
      },
      type: 'input',
      default: 'region',
      get group() {
        return t('editorMaterial.ui.basic')
      },
    },
    {
      key: 'filterType',
      get label() {
        return t('editorMaterial.ui.type')
      },
      type: 'select',
      default: 'select',
      get group() {
        return t('editorMaterial.ui.basic')
      },
      options: [
        {
          get label() {
            return t('editorMaterial.ui.dropdownSingle')
          },
          value: 'select',
        },
        {
          get label() {
            return t('editorMaterial.ui.dropdownMulti')
          },
          value: 'multi-select',
        },
        {
          get label() {
            return t('editorMaterial.ui.date')
          },
          value: 'date',
        },
        {
          get label() {
            return t('editorMaterial.ui.dateRange')
          },
          value: 'date-range',
        },
      ],
    },
    {
      key: 'placeholder',
      get label() {
        return t('editorMaterial.ui.placeholderText')
      },
      type: 'input',
      default: t('editorMaterial.ui.pleaseSelect'),
      get group() {
        return t('editorMaterial.ui.basic')
      },
    },
    {
      key: 'defaultRelative',
      get label() {
        return t('editorMaterial.ui.defaultRelativeDateRangeRollsWithTodayOnOpen')
      },
      type: 'select',
      default: 'none',
      get group() {
        return t('editorMaterial.ui.basic')
      },
      options: [
        {
          get label() {
            return t('editorMaterial.ui.notSet')
          },
          value: 'none',
        },
        {
          get label() {
            return t('editorMaterial.ui.today')
          },
          value: 'today',
        },
        {
          get label() {
            return t('editorMaterial.ui.yesterday')
          },
          value: 'yesterday',
        },
        {
          get label() {
            return t('editorMaterial.ui.last7Days')
          },
          value: 'last7days',
        },
        {
          get label() {
            return t('editorMaterial.ui.last30Days')
          },
          value: 'last30days',
        },
        {
          get label() {
            return t('editorMaterial.ui.thisMonth')
          },
          value: 'thisMonth',
        },
        {
          get label() {
            return t('editorMaterial.ui.lastMonth')
          },
          value: 'lastMonth',
        },
      ],
    },
    {
      key: 'options',
      get label() {
        return t('editorMaterial.ui.staticOptionsUsedWithoutADatasetOneLabelValuePerLine')
      },
      type: 'textarea',
      get default() {
        return t('demoData.filter.defaultOptions')
      },
      get group() {
        return t('editorMaterial.ui.options')
      },
    },
    {
      key: 'cascade',
      get label() {
        return t('editorMaterial.ui.cascadingFilterNarrowCandidatesWithOtherFilterValues')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.options')
      },
    },
    {
      key: 'cascadeKeys',
      get label() {
        return t('editorMaterial.ui.cascadingParentFieldsCommaSeparatedEmptyAllOtherFilters')
      },
      type: 'input',
      default: '',
      get group() {
        return t('editorMaterial.ui.options')
      },
    },
    {
      key: 'allowSelectAll',
      get label() {
        return t('editorMaterial.ui.multiSelectSupportsSelectAllInvert')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.options')
      },
    },
  ],
  dataBindingSchema: [
    {
      key: 'field',
      get label() {
        return t('editorMaterial.ui.filterField')
      },
      type: 'category',
      multiple: false,
    },
  ],
  extraDefaults: {},
  supportsDataBinding: true,
}

export default filterDefinition
