import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

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
    data: [
      {
        time: '2024-05-20 10:23:15',
        level: '严重',
        source: 'DB-Server',
        message: '数据库连接数超过阈值',
      },
      {
        time: '2024-05-20 10:21:08',
        level: '警告',
        source: 'App-Server',
        message: 'CPU 使用率 85%',
      },
      { time: '2024-05-20 10:18:42', level: '严重', source: 'Redis', message: '内存溢出风险' },
      { time: '2024-05-20 10:15:30', level: '提示', source: 'Nginx', message: '配置文件已更新' },
      { time: '2024-05-20 10:12:11', level: '警告', source: 'MQ', message: '消息积压 1000+' },
      {
        time: '2024-05-20 10:08:55',
        level: '严重',
        source: 'Storage',
        message: '磁盘剩余空间 < 10%',
      },
      {
        time: '2024-05-20 10:05:20',
        level: '提示',
        source: 'Monitor',
        message: '监控 agent 已重启',
      },
    ],
  },
  defaultStyle: {},
  supportsDataBinding: true,
}

export default scrollTableDefinition
