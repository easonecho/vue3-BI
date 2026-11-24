import type { PropField } from '../props'

import i18n from '@/i18n'

const t = (key: string) => i18n.global.t(key)

/** 🔑 图表画布内边距配置 Schema（chartCommonSchema 的「画布内边距」分组） */
export const chartGridSchema: PropField[] = [
  // ============ Grid 画布内边距 ============
  {
    key: 'gridLeft',
    get label() {
      return t('editorMaterial.ui.leftMargin')
    },
    type: 'slider',
    min: 0,
    max: 120,
    default: 40,
    get group() {
      return t('editorMaterial.ui.canvasPadding')
    },
  },
  {
    key: 'gridRight',
    get label() {
      return t('editorMaterial.ui.rightMargin')
    },
    type: 'slider',
    min: 0,
    max: 120,
    default: 20,
    get group() {
      return t('editorMaterial.ui.canvasPadding')
    },
  },
  {
    key: 'gridTop',
    get label() {
      return t('editorMaterial.ui.topMargin')
    },
    type: 'slider',
    min: 0,
    max: 120,
    default: 40,
    get group() {
      return t('editorMaterial.ui.canvasPadding')
    },
  },
  {
    key: 'gridBottom',
    get label() {
      return t('editorMaterial.ui.bottomMargin')
    },
    type: 'slider',
    min: 0,
    max: 120,
    default: 30,
    get group() {
      return t('editorMaterial.ui.canvasPadding')
    },
  },
  {
    key: 'gridContainLabel',
    get label() {
      return t('editorMaterial.ui.includeTickLabels')
    },
    type: 'switch',
    default: true,
    get group() {
      return t('editorMaterial.ui.canvasPadding')
    },
  },
]
