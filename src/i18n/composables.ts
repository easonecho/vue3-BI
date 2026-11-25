/**
 * 语言切换 composable
 *
 * 提供 reactive locale ref + setter，切换语言时同步到 localStorage 和 i18n.global
 */
import { computed } from 'vue'
import i18n, { LOCALE_KEY } from './index'

export function useLang() {
  const locale = computed<string>({
    get: () => i18n.global.locale.value,
    set: (val: string) => {
      i18n.global.locale.value = val as 'zh-CN' | 'en-US'
      localStorage.setItem(LOCALE_KEY, val)
      // 🔑 同步 <html lang>，便于无障碍读屏与搜索引擎识别页面语言
      if (typeof document !== 'undefined') {
        document.documentElement.lang = val
      }
    },
  })

  /** 切换语言并持久化 */
  function setLocale(lang: string): void {
    locale.value = lang
  }

  return {
    locale,
    setLocale,
  }
}
