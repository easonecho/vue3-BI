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

export const LOCALE_KEY = 'bi_locale'

/**
 * 解析初始语言：用户已保存 → 部署默认(VITE_DEFAULT_LANG) → 浏览器语言 → zh-CN
 *
 * 导出为纯函数便于单测；自动识别让英文浏览器首次访问即可看到英文界面。
 */
export function resolveInitialLocale(
  saved: string | null,
  envDefault: string | undefined,
  browserLang: string | undefined,
): AppLocale {
  if (saved === 'zh-CN' || saved === 'en-US') return saved
  if (envDefault === 'zh-CN' || envDefault === 'en-US') return envDefault
  if (browserLang?.toLowerCase().startsWith('en')) return 'en-US'
  return 'zh-CN'
}

function getDefaultLocale(): AppLocale {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_KEY) : null
  const browser = typeof navigator !== 'undefined' ? navigator.language : undefined
  return resolveInitialLocale(saved, import.meta.env.VITE_DEFAULT_LANG, browser)
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

// 跨标签页同步：其他标签切换语言后，本页无需刷新即跟随
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== LOCALE_KEY || !event.newValue) return
    if (event.newValue === i18n.global.locale.value) return
    i18n.global.locale.value = event.newValue as AppLocale
    if (typeof document !== 'undefined') {
      document.documentElement.lang = event.newValue
    }
  })
}

export default i18n
