import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export interface UsePreviewToolbarOptions {
  /** 预览页根节点（全屏目标） */
  rootRef: Ref<HTMLElement | null>
  /** 手动/自动刷新回调 */
  onRefresh: (silent?: boolean) => void | Promise<void>
}

/**
 * 🔑 预览工具栏行为：hover 显隐、纯净模式、全屏、自动刷新、键盘快捷键。
 *   所有定时器与全局监听在卸载时自动清理。
 */
export function usePreviewToolbar({ rootRef, onRefresh }: UsePreviewToolbarOptions) {
  const showToolbar = ref(true)
  const pureMode = ref(false)
  const isFullscreen = ref(false)
  const autoRefreshInterval = ref(0)

  let hideTimer: ReturnType<typeof setTimeout> | null = null
  let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

  function scheduleHideToolbar() {
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      if (pureMode.value) showToolbar.value = false
    }, 2500)
  }

  function handleMouseMove() {
    showToolbar.value = true
    scheduleHideToolbar()
  }

  function hideToolbar() {
    if (pureMode.value) showToolbar.value = false
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await rootRef.value?.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (e) {
      console.warn('[Preview] 全屏切换失败:', e)
    }
  }

  function handleFullscreenChange() {
    isFullscreen.value = !!document.fullscreenElement
  }

  function togglePureMode() {
    pureMode.value = !pureMode.value
    if (pureMode.value) {
      showToolbar.value = true
      scheduleHideToolbar()
    } else {
      showToolbar.value = true
      if (hideTimer) clearTimeout(hideTimer)
    }
  }

  function resetAutoRefresh() {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer)
      autoRefreshTimer = null
    }
    if (autoRefreshInterval.value > 0) {
      autoRefreshTimer = setInterval(() => {
        onRefresh(true)
      }, autoRefreshInterval.value * 1000)
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

    switch (e.key.toLowerCase()) {
      case 'f':
        e.preventDefault()
        toggleFullscreen()
        break
      case 'h':
        e.preventDefault()
        togglePureMode()
        break
      case 'r':
        e.preventDefault()
        onRefresh()
        break
      case 'escape':
        if (pureMode.value) {
          pureMode.value = false
          showToolbar.value = true
        }
        break
    }
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    window.removeEventListener('keydown', handleKeydown)
    if (autoRefreshTimer) clearInterval(autoRefreshTimer)
    if (hideTimer) clearTimeout(hideTimer)
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  })

  return {
    showToolbar,
    pureMode,
    isFullscreen,
    autoRefreshInterval,
    handleMouseMove,
    hideToolbar,
    toggleFullscreen,
    togglePureMode,
    resetAutoRefresh,
  }
}
