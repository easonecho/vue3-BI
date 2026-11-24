import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../types'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

export const tableDefinition: ComponentDefinition = {
  type: 'table',
  meta: {
    get name() {
      return t('editorMaterial.meta.table')
    },
    category: 'data',
    icon: 'Grid',
    defaultWidth: 500,
    defaultHeight: 240,
  },
  // 🔑 异步加载：表格依赖 vxe-table（体积较大），改为懒加载，避免进入首屏入口包
  widget: defineAsyncComponent(() => import('./Widget.vue')),
  propsSchema: [
    {
      key: 'border',
      get label() {
        return t('editorMaterial.ui.showBorder')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.appearance')
      },
    },
    {
      key: 'stripe',
      get label() {
        return t('editorMaterial.ui.zebraStripes')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.appearance')
      },
    },
    {
      key: 'showHeader',
      get label() {
        return t('editorMaterial.ui.showHeader')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.appearance')
      },
    },
    {
      key: 'round',
      get label() {
        return t('editorMaterial.ui.cornerRadius')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.appearance')
      },
    },
    {
      key: 'fontSize',
      get label() {
        return t('editorMaterial.ui.fontSize')
      },
      type: 'slider',
      min: 10,
      max: 20,
      default: 12,
      get group() {
        return t('editorMaterial.ui.appearance')
      },
    },
    {
      key: 'headerBg',
      get label() {
        return t('editorMaterial.ui.headerBackground')
      },
      type: 'colorpicker',
      default: '#f9fafb',
      get group() {
        return t('editorMaterial.ui.tableHeader')
      },
    },
    {
      key: 'headerColor',
      get label() {
        return t('editorMaterial.ui.headerText')
      },
      type: 'colorpicker',
      default: '#374151',
      get group() {
        return t('editorMaterial.ui.tableHeader')
      },
    },
    {
      key: 'color',
      get label() {
        return t('editorMaterial.ui.cellText')
      },
      type: 'colorpicker',
      default: '#374151',
      get group() {
        return t('editorMaterial.ui.appearance')
      },
    },
    {
      key: 'sortable',
      get label() {
        return t('editorMaterial.ui.columnSorting')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.interaction')
      },
    },
    {
      key: 'pageSize',
      get label() {
        return t('editorMaterial.ui.rowsPerPage')
      },
      type: 'select',
      default: 20,
      get group() {
        return t('editorMaterial.ui.interaction')
      },
      options: [
        {
          get label() {
            return t('editorMaterial.ui.noPagination')
          },
          value: 0,
        },
        {
          get label() {
            return t('editorMaterial.ui.10Rows')
          },
          value: 10,
        },
        {
          get label() {
            return t('editorMaterial.ui.20Rows')
          },
          value: 20,
        },
        {
          get label() {
            return t('editorMaterial.ui.50Rows')
          },
          value: 50,
        },
        {
          get label() {
            return t('editorMaterial.ui.100Rows')
          },
          value: 100,
        },
      ],
    },
    {
      key: 'showSummary',
      get label() {
        return t('editorMaterial.ui.totalRowCurrentPage')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.interaction')
      },
    },
    // ========== 条件格式 ==========
    {
      key: 'conditionalRuleShow',
      get label() {
        return t('editorMaterial.ui.thresholdRules')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.conditionalFormat')
      },
    },
    {
      key: 'conditionalRules',
      get label() {
        return t('editorMaterial.ui.ruleList')
      },
      type: 'table',
      default: [],
      get group() {
        return t('editorMaterial.ui.conditionalFormat')
      },
      visibleWhen: { field: 'conditionalRuleShow', truthy: true },
      get tip() {
        return t(
          'editorMaterial.ui.setCellBackgroundTextColorWhenAFieldMatchesRulesApplyTopToBottom',
        )
      },
      columns: [
        {
          key: 'field',
          get label() {
            return t('editorMaterial.ui.field')
          },
          type: 'input',
          width: 90,
          get placeholder() {
            return t('editorMaterial.ui.columnFieldName')
          },
        },
        {
          key: 'operator',
          get label() {
            return t('editorMaterial.ui.condition')
          },
          type: 'select',
          width: 76,
          options: [
            {
              get label() {
                return t('editorMaterial.ui.greaterThan')
              },
              value: 'gt',
            },
            {
              get label() {
                return t('editorMaterial.ui.greaterThanOrEqual')
              },
              value: 'gte',
            },
            {
              get label() {
                return t('editorMaterial.ui.lessThan')
              },
              value: 'lt',
            },
            {
              get label() {
                return t('editorMaterial.ui.lessThanOrEqual')
              },
              value: 'lte',
            },
            {
              get label() {
                return t('editorMaterial.ui.equal')
              },
              value: 'eq',
            },
            {
              get label() {
                return t('editorMaterial.ui.notEqual')
              },
              value: 'ne',
            },
            {
              get label() {
                return t('editorMaterial.ui.between')
              },
              value: 'between',
            },
            {
              get label() {
                return t('editorMaterial.ui.contains')
              },
              value: 'contains',
            },
          ],
        },
        {
          key: 'value',
          get label() {
            return t('editorMaterial.ui.value2')
          },
          type: 'input',
          width: 64,
        },
        {
          key: 'value2',
          get label() {
            return t('editorMaterial.ui.value22')
          },
          type: 'input',
          width: 64,
          get placeholder() {
            return t('editorMaterial.ui.between')
          },
        },
        {
          key: 'backgroundColor',
          get label() {
            return t('editorMaterial.ui.background')
          },
          type: 'colorpicker',
          width: 64,
        },
        {
          key: 'textColor',
          get label() {
            return t('editorMaterial.ui.text2')
          },
          type: 'colorpicker',
          width: 64,
        },
        {
          key: 'bold',
          get label() {
            return t('editorMaterial.ui.bold2')
          },
          type: 'switch',
          width: 52,
        },
      ],
    },
    {
      key: 'colorScaleShow',
      get label() {
        return t('editorMaterial.ui.colorScale')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.conditionalFormat')
      },
    },
    {
      key: 'colorScales',
      get label() {
        return t('editorMaterial.ui.colorScaleList')
      },
      type: 'table',
      default: [],
      get group() {
        return t('editorMaterial.ui.conditionalFormat')
      },
      visibleWhen: { field: 'colorScaleShow', truthy: true },
      get tip() {
        return t(
          'editorMaterial.ui.interpolateBackgroundColorByTheMinMaxOfThisFieldOnTheCurrentPage',
        )
      },
      columns: [
        {
          key: 'field',
          get label() {
            return t('editorMaterial.ui.field')
          },
          type: 'input',
          width: 100,
          get placeholder() {
            return t('editorMaterial.ui.columnFieldName')
          },
        },
        {
          key: 'minColor',
          get label() {
            return t('editorMaterial.ui.minColor')
          },
          type: 'colorpicker',
          width: 80,
        },
        {
          key: 'maxColor',
          get label() {
            return t('editorMaterial.ui.maxColor')
          },
          type: 'colorpicker',
          width: 80,
        },
      ],
    },
    {
      key: 'dataBarShow',
      get label() {
        return t('editorMaterial.ui.dataBar')
      },
      type: 'switch',
      default: false,
      get group() {
        return t('editorMaterial.ui.conditionalFormat')
      },
    },
    {
      key: 'dataBars',
      get label() {
        return t('editorMaterial.ui.dataBarList')
      },
      type: 'table',
      default: [],
      get group() {
        return t('editorMaterial.ui.conditionalFormat')
      },
      visibleWhen: { field: 'dataBarShow', truthy: true },
      get tip() {
        return t('editorMaterial.ui.drawADataBarInTheCellWithLengthProportionalToTheValue')
      },
      columns: [
        {
          key: 'field',
          get label() {
            return t('editorMaterial.ui.field')
          },
          type: 'input',
          width: 100,
          get placeholder() {
            return t('editorMaterial.ui.columnFieldName')
          },
        },
        {
          key: 'color',
          get label() {
            return t('editorMaterial.ui.color')
          },
          type: 'colorpicker',
          width: 72,
        },
        {
          key: 'maxValue',
          get label() {
            return t('editorMaterial.ui.range')
          },
          type: 'number',
          width: 68,
          min: 0,
          step: 1,
          get placeholder() {
            return t('editorMaterial.ui.0Auto')
          },
        },
      ],
    },
  ],
  extraDefaults: {
    columns: [
      { key: 'name', title: t('editorMaterial.ui.name'), width: 120 },
      { key: 'value', title: t('editorMaterial.ui.value'), width: 100, align: 'right' },
      { key: 'ratio', title: t('editorMaterial.ui.ratioLabel'), width: 100, align: 'right' },
    ],
    data: [
      { name: '指标 A', value: 1280, ratio: '32%' },
      { name: '指标 B', value: 960, ratio: '24%' },
      { name: '指标 C', value: 720, ratio: '18%' },
      { name: '指标 D', value: 540, ratio: '14%' },
      { name: '指标 E', value: 480, ratio: '12%' },
    ],
  },
  defaultStyle: {},
  supportsDataBinding: true,
}

export default tableDefinition
