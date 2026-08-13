/**
 * vue-i18n 实例
 *
 * 使用 Composition API 模式 (legacy: false)
 * 语言从 localStorage 读取，回退到 VITE_DEFAULT_LANG 环境变量，最终回退到 zh-CN
 */
import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

export type AppLocale = 'zh-CN' | 'en-US'

const LOCALE_KEY = 'bi_locale'

/** 获取默认语言：localStorage → 环境变量 → zh-CN */
function getDefaultLocale(): string {
  const saved = localStorage.getItem(LOCALE_KEY)
  if (saved) return saved
  return import.meta.env.VITE_DEFAULT_LANG || 'zh-CN'
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getDefaultLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

export default i18n
