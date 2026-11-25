import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

function getScrollTableDefaultData() {
  const critical = t('demoData.scrollTable.critical')
  const warning = t('demoData.scrollTable.warning')
  const info = t('demoData.scrollTable.info')
  return [
    {
      time: '2024-05-20 10:23:15',
      level: critical,
      source: 'DB-Server',
      message: t('demoData.scrollTable.dbConnectionExceeded'),
    },
    {
      time: '2024-05-20 10:21:08',
      level: warning,
      source: 'App-Server',
      message: t('demoData.scrollTable.cpuUsageHigh'),
    },
    {
      time: '2024-05-20 10:18:42',
      level: critical,
      source: 'Redis',
      message: t('demoData.scrollTable.memoryOverflowRisk'),
    },
    {
      time: '2024-05-20 10:15:30',
      level: info,
      source: 'Nginx',
      message: t('demoData.scrollTable.configUpdated'),
    },
    {
      time: '2024-05-20 10:12:11',
      level: warning,
      source: 'MQ',
      message: t('demoData.scrollTable.messageBacklog'),
    },
    {
      time: '2024-05-20 10:08:55',
      level: critical,
      source: 'Storage',
      message: t('demoData.scrollTable.diskSpaceLow'),
    },
    {
      time: '2024-05-20 10:05:20',
      level: info,
      source: 'Monitor',
      message: t('demoData.scrollTable.agentRestarted'),
    },
  ]
}

export const scrollTableDefinition: ComponentDefinition = {
  type: 'scroll-table',
  meta: {
    get name() {
      return t('editorMaterial.meta.scrollingTable')
    },
    category: 'data',
    icon: 'List',
    defaultWidth: 500,
    defaultHeight: 280,
  },
  widget: Widget,
  propsSchema: [
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
      key: 'fontSize',
      get label() {
        return t('editorMaterial.ui.fontSize')
      },
      type: 'slider',
      min: 10,
      max: 18,
      default: 12,
      get group() {
        return t('editorMaterial.ui.font')
      },
    },
    {
      key: 'headerBg',
      get label() {
        return t('editorMaterial.ui.headerBackground')
      },
      type: 'colorpicker',
      default: '#1e293b',
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
      default: '#67e8f9',
      get group() {
        return t('editorMaterial.ui.tableHeader')
      },
    },
    {
      key: 'rowColor',
      get label() {
        return t('editorMaterial.ui.rowText')
      },
      type: 'colorpicker',
      default: '#e2e8f0',
      get group() {
        return t('editorMaterial.ui.row')
      },
    },
    {
      key: 'rowBgColor',
      get label() {
        return t('editorMaterial.ui.rowBackground')
      },
      type: 'colorpicker',
      default: 'rgba(15,23,42,0.6)',
      get group() {
        return t('editorMaterial.ui.row')
      },
    },
    {
      key: 'rowHoverBg',
      get label() {
        return t('editorMaterial.ui.rowHoverBackground')
      },
      type: 'colorpicker',
      default: 'rgba(34,211,238,0.15)',
      get group() {
        return t('editorMaterial.ui.row')
      },
    },
    {
      key: 'autoScroll',
      get label() {
        return t('editorMaterial.ui.autoScroll')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.carousel')
      },
      get tip() {
        return t('editorMaterial.ui.autoScroll')
      },
    },
    {
      key: 'interval',
      get label() {
        return t('editorMaterial.ui.scrollInterval')
      },
      type: 'slider',
      min: 1000,
      max: 10000,
      step: 500,
      default: 2000,
      get group() {
        return t('editorMaterial.ui.carousel')
      },
      get tip() {
        return t('editorMaterial.ui.scrollIntervalMs')
      },
    },
    {
      key: 'step',
      get label() {
        return t('editorMaterial.ui.scrollRows')
      },
      type: 'slider',
      min: 1,
      max: 5,
      default: 1,
      get group() {
        return t('editorMaterial.ui.carousel')
      },
      get tip() {
        return t('editorMaterial.ui.rowsPerScroll')
      },
    },
    {
      key: 'pauseOnHover',
      get label() {
        return t('editorMaterial.ui.pauseOnHover2')
      },
      type: 'switch',
      default: true,
      get group() {
        return t('editorMaterial.ui.carousel')
      },
      get tip() {
        return t('editorMaterial.ui.pauseOnHover')
      },
    },
  ],
  extraDefaults: {
    columns: [
      { key: 'time', title: t('editorMaterial.ui.time'), width: 160 },
      { key: 'level', title: t('editorMaterial.ui.level'), width: 80 },
      { key: 'source', title: t('editorMaterial.ui.sourceLabel'), width: 120 },
      { key: 'message', title: t('editorMaterial.ui.alertMessage') },
    ],
    get data() {
      return getScrollTableDefaultData()
    },
  },
  defaultStyle: {},
  supportsDataBinding: true,
}

export default scrollTableDefinition
