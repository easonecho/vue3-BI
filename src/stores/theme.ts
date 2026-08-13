/**
 * 主题状态管理 Store
 *
 * 负责:
 * - light/dark 主题切换
 * - 持久化主题到 localStorage
 * - 初始化时从 localStorage 或 prefers-color-scheme 读取
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

type Theme = 'light' | 'dark'

const THEME_KEY = 'bi_theme'

export const useThemeStore = defineStore('theme', () => {
  // ========== 状态 ==========
  const theme = ref<Theme>('light')

  // ========== 私有方法 ==========

  /** 将主题应用到 document.documentElement */
  function applyTheme(t: Theme): void {
    document.documentElement.setAttribute('data-theme', t)
  }

  // ========== 方法 ==========

  /** 设置主题并持久化 */
  function setTheme(t: Theme): void {
    theme.value = t
    applyTheme(t)
    localStorage.setItem(THEME_KEY, t)
  }

  /** 切换主题 */
  function toggleTheme(): void {
    setTheme(theme.value === 'light' ? 'dark' : 'light')
  }

  /** 初始化主题：localStorage → prefers-color-scheme → light */
  function initTheme(): void {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
      return
    }
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? 'dark' : 'light')
  }

  return {
    theme,
    setTheme,
    toggleTheme,
    initTheme,
  }
})
