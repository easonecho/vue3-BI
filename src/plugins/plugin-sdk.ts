/**
 * 🔑 P2-2 插件 SDK
 *
 * 外部插件脚本通过全局对象 `window.BI` 注册自定义组件:
 *
 *   <script src="/plugins/my-plugin.js"></script>
 *   // my-plugin.js
 *   const { h } = window.BI.Vue
 *   window.BI.registerComponent({
 *     type: 'my-widget',
 *     meta: { name: '我的组件', category: 'basic', icon: 'Star', defaultWidth: 240, defaultHeight: 120 },
 *     widget: { props: ['comp'], setup(props) { return () => h('div', {}, props.comp.props.text) } },
 *     propsSchema: [{ key: 'text', label: '文本', type: 'input', default: 'Hello' }],
 *   })
 *
 * 约束:
 *   - 必须在 app.mount 之前完成注册 (plugin-loader 在 main.ts 中先行加载)
 *   - category 仅支持 basic / chart / data / info
 *   - type 不得与内置组件重复
 */
import * as Vue from 'vue'
import type { ComponentDefinition } from '@/views/bi-editor/component-defs/types'
import { registerExternalDefinition } from '@/views/bi-editor/component-defs'

export interface BiPluginSdk {
  version: string
  /** 暴露 Vue 运行时, 供外部插件用 h()/defineComponent() 编写 widget */
  Vue: typeof Vue
  /** 注册自定义组件 (幂等: 同 type 重复注册会被忽略) */
  registerComponent: (def: ComponentDefinition) => boolean
}

declare global {
  interface Window {
    BI?: BiPluginSdk
  }
}

export function installPluginSdk(): void {
  window.BI = {
    version: '1.0.0',
    Vue,
    registerComponent: (def: ComponentDefinition) => registerExternalDefinition(def),
  }
}
