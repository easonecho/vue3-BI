import type { Component } from 'vue'
import type { ComponentCategory, ComponentType } from '@/views/bi-editor/types'

/**
 * 🔑 属性字段 Schema —— 每个组件自声明可配置字段，RightPanel 根据 Schema 自动生成表单。
 */
export type PropFieldType =
  | 'input'       // 文本输入
  | 'textarea'    // 多行文本
  | 'number'      // 数字输入
  | 'slider'      // 滑块
  | 'colorpicker' // 颜色选择
  | 'select'      // 下拉选择
  | 'switch'      // 开关
  | 'checkbox'    // 复选框
  | 'table'       // 表格（列配置）
  | 'json'        // JSON 编辑器

/** 🔑 条件显隐：根据其他 props 字段的值决定当前字段是否显示 */
export interface VisibleWhen {
  /** 依赖的字段 key */
  field: string
  /** 当依赖字段值 === value 时显示（单个值） */
  equals?: any
  /** 当依赖字段值 ∈ values 时显示（多值任一匹配） */
  in?: any[]
  /** 当依赖字段值为 truthy 时显示 */
  truthy?: boolean
}

export interface PropField {
  /** 属性 key，对应 comp.props[key] */
  key: string
  /** 在面板中显示的标签 */
  label: string
  /** 控件类型，决定 RightPanel 渲染什么组件 */
  type: PropFieldType
  /** 默认值 — 🔑 唯一真相源，defaultProps 从此自动派生 */
  default: any
  /** 占位提示 */
  placeholder?: string
  /** 最小值 (number/slider) */
  min?: number
  /** 最大值 (number/slider) */
  max?: number
  /** 步长 (number/slider) */
  step?: number
  /** select 的选项列表 */
  options?: string[]
  /** 分组标题（相同 group 的字段在同一个 section） */
  group?: string
  /** 是否只读 */
  readonly?: boolean
  /** 额外的提示文本 */
  tip?: string
  /** 🔑 条件显隐：满足条件时才渲染此字段 */
  visibleWhen?: VisibleWhen
}

/**
 * 🔑 组件定义 — 每个组件类型的单一真相源。
 *   新增组件只需：创建 definition + 创建 widget，然后在 index.ts 注册。
 */
export interface ComponentDefinition {
  /** 唯一类型标识 */
  type: ComponentType
  /** 元信息（名称、分类、图标、默认尺寸） */
  meta: {
    name: string
    category: ComponentCategory
    icon: string
    defaultWidth: number
    defaultHeight: number
  }
  /** 渲染组件 */
  widget: Component
  /** 属性面板 Schema — 声明后 RightPanel 自动生成表单 */
  propsSchema: PropField[]
  /** 🔑 默认 props 值 — 从 propsSchema[].default 自动派生，无需手写 */
  /** 额外的非 Schema 属性默认值（如 data 数组、columns 等不适合表单编辑的复杂数据） */
  extraDefaults?: Record<string, any>
  /** 默认 style 值 */
  defaultStyle?: Record<string, any>
  /** 是否支持数据绑定（数据面板） */
  supportsDataBinding?: boolean
}

/**
 * 🔑 从 propsSchema 自动派生 defaultProps。
 *   遍历 schema 中每个字段的 default 值，合并 extraDefaults。
 *   这样默认值只在 schema 的 field.default 中声明一次，消除重复。
 */
export function deriveDefaultProps(schema: PropField[], extra?: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const field of schema) {
    result[field.key] = field.default
  }
  return { ...result, ...extra }
}

/**
 * 🔑 评估 visibleWhen 条件，决定字段是否应该显示。
 */
export function isFieldVisible(field: PropField, props: Record<string, any>): boolean {
  if (!field.visibleWhen) return true
  const { field: depKey, equals, in: inValues, truthy } = field.visibleWhen
  const depValue = props?.[depKey]
  if (equals !== undefined) return depValue === equals
  if (inValues !== undefined) return inValues.includes(depValue)
  if (truthy !== undefined) return !!depValue === truthy
  return true
}

/** 图表组件的通用 props Schema（可被继承/组合） */
export const chartBaseSchema: PropField[] = [
  { key: 'title', label: '标题', type: 'input', default: '' },
  { key: 'titleFontSize', label: '标题字号', type: 'slider', min: 10, max: 32, default: 14, group: '标题' },
  { key: 'legend', label: '显示图例', type: 'switch', default: true, group: '图例' },
  {
    key: 'legendPosition',
    label: '图例位置',
    type: 'select',
    options: ['top', 'bottom', 'left', 'right'],
    default: 'bottom',
    group: '图例',
    visibleWhen: { field: 'legend', truthy: true },
  },
  { key: 'animation', label: '开启动画', type: 'switch', default: true, group: '动画' },
]

/** 基础文本 Schema（可被其他文本类组件复用） */
export const textBaseSchema: PropField[] = [
  { key: 'text', label: '文本内容', type: 'textarea', default: '文本内容' },
  { key: 'fontSize', label: '字号', type: 'slider', min: 10, max: 72, default: 14, group: '字体' },
  { key: 'fontWeight', label: '字重', type: 'select', options: ['normal', 'bold'], default: 'normal', group: '字体' },
  { key: 'color', label: '颜色', type: 'colorpicker', default: '#333333', group: '字体' },
  { key: 'textAlign', label: '对齐', type: 'select', options: ['left', 'center', 'right'], default: 'left', group: '字体' },
  { key: 'lineHeight', label: '行高', type: 'slider', min: 1, max: 3, step: 0.1, default: 1.5, group: '字体' },
]
