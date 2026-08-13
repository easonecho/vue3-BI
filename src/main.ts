import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
// vxe-table：全局注册一次，TableWidget 等组件直接使用 <vxe-table> / <vxe-column>
import VxeUITable from 'vxe-table'
import 'vxe-table/lib/style.css'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useThemeStore } from './stores/theme'
import ErrorBoundary from './components/ErrorBoundary.vue'
import './styles/global.less'
import './styles/theme.css'

NProgress.configure({ showSpinner: false })

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.use(VxeUITable)
app.use(i18n)

// 全局错误处理
app.config.errorHandler = (err, _instance, info) => {
  console.error('[Global Error]', err, info)
}

// 注册全局 ErrorBoundary 组件
app.component('ErrorBoundary', ErrorBoundary)

// 初始化主题（需要在 pinia 安装之后调用）
useThemeStore().initTheme()

app.mount('#app')
