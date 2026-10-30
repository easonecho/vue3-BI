import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
// 🔑 Element Plus 组件按需注册：只引入项目模板实际用到的组件，
//   避免 app.use(ElementPlus) 把整个组件库打进首屏。主题样式仍全量引入，
//   保证 ElMessage / ElMessageBox 等程序化调用与暗色主题样式完整。
import {
  ElAlert,
  ElAvatar,
  ElBadge,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElButtonGroup,
  ElCard,
  ElCheckbox,
  ElCol,
  ElCollapse,
  ElCollapseItem,
  ElColorPicker,
  ElDatePicker,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElDivider,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElLoading,
  ElMenu,
  ElMenuItem,
  ElOption,
  ElPagination,
  ElPopconfirm,
  ElProgress,
  ElRadio,
  ElRadioButton,
  ElRadioGroup,
  ElResult,
  ElRow,
  ElSelect,
  ElSlider,
  ElSubMenu,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTooltip,
  ElTree,
  ElTreeSelect,
  ElUpload,
} from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useThemeStore } from './stores/theme'
import ErrorBoundary from './components/ErrorBoundary.vue'
import { vPermission } from './directives/permission'
import { installPluginSdk } from './plugins/plugin-sdk'
import { loadExternalPlugins } from './plugins/plugin-loader'
import './styles/global.less'
import './styles/theme.css'

NProgress.configure({ showSpinner: false })

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
// v-loading 指令（Element Plus 组件已改为按需引入，指令需显式安装）
app.use(ElLoading)
app.use(i18n)

// 🔑 按需注册 Element Plus 组件（与模板中实际使用的 el-* 组件一一对应）
const elementPlusComponents = [
  ElAlert, ElAvatar, ElBadge, ElBreadcrumb, ElBreadcrumbItem, ElButton, ElButtonGroup,
  ElCard, ElCheckbox, ElCol, ElCollapse, ElCollapseItem, ElColorPicker, ElDatePicker,
  ElDescriptions, ElDescriptionsItem, ElDialog, ElDivider, ElDropdown, ElDropdownItem,
  ElDropdownMenu, ElEmpty, ElForm, ElFormItem, ElIcon, ElInput, ElInputNumber, ElMenu,
  ElMenuItem, ElOption, ElPagination, ElPopconfirm, ElProgress, ElRadio, ElRadioButton,
  ElRadioGroup, ElResult, ElRow, ElSelect, ElSlider, ElSubMenu, ElSwitch, ElTable,
  ElTableColumn, ElTabPane, ElTabs, ElTag, ElTooltip, ElTree, ElTreeSelect, ElUpload,
]
elementPlusComponents.forEach((comp) => {
  if (comp.name) app.component(comp.name, comp)
})

// 全局错误处理
app.config.errorHandler = (err, _instance, info) => {
  console.error('[Global Error]', err, info)
}

// 注册全局 ErrorBoundary 组件
app.component('ErrorBoundary', ErrorBoundary)
app.directive('permission', vPermission)

// 初始化主题（需要在 pinia 安装之后调用，触发 watch 立即应用主题）
useThemeStore()

// 🔑 P2-2 插件: 先安装 SDK 并加载外部插件脚本 (组件必须在 mount 前注册)
installPluginSdk()
loadExternalPlugins().finally(() => {
  app.mount('#app')
})
