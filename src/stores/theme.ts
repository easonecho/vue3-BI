/**
 * 主题 Store —— 管理全局主题切换
 * 支持 dark / light 两种主题，持久化到 localStorage
 */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'bi-theme'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeMode>(loadTheme())

  function loadTheme(): ThemeMode {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved
    return 'dark'
  }

  function applyTheme(mode: ThemeMode) {
    document.documentElement.setAttribute('data-theme', mode)
  }

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(mode: ThemeMode) {
    theme.value = mode
  }

  watch(
    theme,
    (val) => {
      localStorage.setItem(STORAGE_KEY, val)
      applyTheme(val)
    },
    { immediate: true },
  )

  return { theme, toggle, setTheme }
})
