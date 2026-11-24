import type { PropField } from '../props'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/**
 * 🔑 图表条件格式（预警色）：按数值阈值覆盖数据点颜色。
 *
 *   - 规则按顺序匹配，命中第一条即生效；
 *   - 系列为空作用于全部系列，填写后仅作用于同名系列；
 *   - 未选择颜色或阈值非法的规则不生效；
 *   - 折线图仅拐点变色（ECharts 数据点粒度限制）。
 */
export const chartConditionalFormatSchema: PropField[] = [
  {
    key: 'conditionalColorShow',
    get label() {
      return t('editorMaterial.ui.conditionalColoring')
    },
    type: 'switch',
    default: false,
    get group() {
      return t('editorMaterial.ui.conditionalFormat')
    },
    get tip() {
      return t('editorMaterial.ui.colorDataPointsByNumericThresholdForAlertsAnomalies')
    },
  },
  {
    key: 'conditionalColorRules',
    get label() {
      return t('editorMaterial.ui.coloringRules')
    },
    type: 'table',
    default: [],
    get group() {
      return t('editorMaterial.ui.conditionalFormat')
    },
    visibleWhen: { field: 'conditionalColorShow', truthy: true },
    get tip() {
      return t(
        'editorMaterial.ui.rulesApplyTopToBottomEmptySeriesMeansAllRulesWithoutColorAreIgnored',
      )
    },
    columns: [
      {
        key: 'seriesName',
        get label() {
          return t('editorMaterial.ui.series')
        },
        type: 'input',
        width: 84,
        get placeholder() {
          return t('editorMaterial.ui.all')
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
        width: 62,
      },
      {
        key: 'value2',
        get label() {
          return t('editorMaterial.ui.value22')
        },
        type: 'input',
        width: 62,
        get placeholder() {
          return t('editorMaterial.ui.between')
        },
      },
      {
        key: 'color',
        get label() {
          return t('editorMaterial.ui.color')
        },
        type: 'colorpicker',
        width: 62,
      },
    ],
  },
]
