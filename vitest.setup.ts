/**
 * 单元测试全局初始化
 *
 * 组件统一通过 vue-i18n 的 useI18n 取文案, 但测试大多直接 mount 组件、
 * 未安装 i18n 插件。这里全局把 useI18n 替换为基于真实中文语言包的实现,
 * 让测试断言仍能看到默认中文文案; 单个用例仍可按需自行 mock 覆盖。
 */
import { vi } from 'vitest'

// 统一测试基线语言: 避免语言自动识别受测试环境 navigator.language 影响
if (typeof localStorage !== 'undefined') {
  localStorage.setItem('bi_locale', 'zh-CN')
}

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  const { default: zhCN } = await import('@/i18n/locales/zh-CN')
  const i18n = actual.createI18n({
    legacy: false,
    locale: 'zh-CN',
    fallbackLocale: 'zh-CN',
    messages: { 'zh-CN': zhCN },
  })
  const composer = i18n.global
  const useI18nMock = (() => ({
    t: composer.t,
    te: composer.te,
    locale: composer.locale,
    availableLocales: composer.availableLocales,
  })) as unknown as typeof actual.useI18n
  return { ...actual, useI18n: useI18nMock }
})
