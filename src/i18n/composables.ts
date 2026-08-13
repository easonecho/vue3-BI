/**
 * 语言切换 composable
 *
 * 提供 reactive locale ref + setter，切换语言时同步到 localStorage 和 i18n.global
 */
import { computed } from 'vue'
import i18n from './index'

const LOCALE_KEY = 'bi_locale'

export function useLang() {
  const locale = computed<string>({
    get: () => i18n.global.locale.value,
    set: (val: string) => {
      i18n.global.locale.value = val as 'zh-CN' | 'en-US'
      localStorage.setItem(LOCALE_KEY, val)
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
