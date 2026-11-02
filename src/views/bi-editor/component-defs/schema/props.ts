import type { Component } from 'vue'
import type { ComponentCategory, ComponentType } from '@/views/bi-editor/types'

/**
 * 🔑 属性字段 Schema —— 每个组件自声明可配置字段，RightPanel 根据 Schema 自动生成表单。
 */
export type PropFieldType =
  | 'input' // 文本输入
  | 'textarea' // 多行文本
  | 'number' // 数字输入
  | 'slider' // 滑块
  | 'colorpicker' // 颜色选择
  | 'select' // 下拉选择
  | 'switch' // 开关
  | 'checkbox' // 复选框
  | 'table' // 表格（列配置）
  | 'json' // JSON 编辑器
  | 'asset' // 🔑 素材选择器（从素材库选择 video/image/decor 素材）

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

/** 下拉选项（select 的 label 显示中文，value 是真实值） */
export interface SelectOption {
  label: string
  value: string | number | boolean
}

/** table 类型字段的列定义（每一列的编辑方式） */
export interface TableColumnSchema {
  key: string
  label: string
  /** 单元格渲染类型 */
  type: 'input' | 'number' | 'colorpicker' | 'select' | 'switch'
  /** select 列的选项 */
  options?: SelectOption[]
  /** number 列的 min/max/step */
  min?: number
  max?: number
  step?: number
  /** 列宽 */
  width?: number
  /** 占位提示 */
  placeholder?: string
}

/** 🔑 数据绑定字段槽位定义 —— 声明组件需要从数据集映射哪些字段 */
export interface DataBindingField {
  /** dataConfig 中的 key,如 categoryField / valueFields */
  key: string
  /** UI 显示标签,如"类目字段"/"数值字段" */
  label: string
  /** 字段语义类型:category=维度(类目),value=度量(数值),name=名称(饼图用) */
  type: 'category' | 'value' | 'name'
  /** 是否多选(如柱状图的 valueFields 可选多个数值列) */
  multiple?: boolean
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
  /** select 的选项列表（中文 label + 真实 value） */
  options?: SelectOption[]
  /** 分组标题（相同 group 的字段在同一个 section） */
  group?: string
  /** 是否只读 */
  readonly?: boolean
  /** 额外的提示文本 */
  tip?: string
  /** 🔑 条件显隐：满足条件时才渲染此字段 */
  visibleWhen?: VisibleWhen
  /** table 类型字段的列定义 */
  columns?: TableColumnSchema[]
  /** 🔑 asset 类型字段：素材分类（video/image/decor），决定 AssetPicker 只展示哪类素材 */
  assetType?: 'video' | 'image' | 'decor'
  /** 🔑 asset 类型字段：是否多选（如轮播图选多张图片），单选返回 string（url），多选返回 string[] */
  multiple?: boolean
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
  /** 🔑 数据绑定字段槽位 —— 声明组件需要从数据集映射哪些字段,RightPanel 据此生成字段映射 UI */
  dataBindingSchema?: DataBindingField[]
}
