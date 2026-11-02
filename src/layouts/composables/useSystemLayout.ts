/**
 * 系统布局逻辑
 *
 * 负责移动端抽屉、路由切换收起、面包屑、实时时钟与用户下拉命令，
 * 通过依赖注入解耦 vue-router / pinia，便于单测。
 */
import { computed, ref, watch } from 'vue'
import type { BreadcrumbItem } from '../layout-menu-utils'
import { buildBreadcrumbs } from '../layout-menu-utils'

export interface SystemLayoutDeps {
  /** 当前路由 path */
  getPath: () => string
  /** 退出登录（清理 token 等） */
  logout: () => Promise<void>
  /** 登录失效后跳转 */
  replace: (path: string) => unknown
  /** 普通跳转 */
  push: (path: string) => unknown
  /** 时钟时间来源，测试可注入 */
  now?: () => Date
}

export function useSystemLayout(deps: SystemLayoutDeps) {
  const activeMenu = computed(() => deps.getPath())

  // 🔑 移动端适配: 窄屏下侧边栏切换为抽屉
  const isMobile = ref(false)
  const asideVisible = ref(false)
  let mediaQuery: MediaQueryList | null = null
  let clockTimer: number | undefined

  function handleMediaChange(event: { matches: boolean }) {
    isMobile.value = event.matches
    if (!event.matches) asideVisible.value = false
  }

  const clockText = ref('')
  function updateClock() {
    const now = (deps.now ?? (() => new Date()))()
    const pad = (n: number) => String(n).padStart(2, '0')
    clockText.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  }

  /** 组件挂载后启动媒体查询监听与时钟 */
  function attach() {
    if (typeof window === 'undefined' || !window.matchMedia) return
    mediaQuery = window.matchMedia('(max-width: 900px)')
    isMobile.value = mediaQuery.matches
    mediaQuery.addEventListener('change', handleMediaChange)
    updateClock()
    clockTimer = window.setInterval(updateClock, 1000)
  }

  /** 组件卸载时清理监听与定时器 */
  function detach() {
    if (clockTimer !== undefined) {
      window.clearInterval(clockTimer)
      clockTimer = undefined
    }
    mediaQuery?.removeEventListener('change', handleMediaChange)
    mediaQuery = null
  }

  // 路由变化后自动收起移动端菜单
  watch(activeMenu, () => {
    asideVisible.value = false
  })

  // 点击菜单项立即收起 (同一路由不会触发 watch)
  function handleMenuSelect() {
    asideVisible.value = false
  }

  function toggleAside() {
    asideVisible.value = !asideVisible.value
  }

  function closeAside() {
    asideVisible.value = false
  }

  const breadcrumbs = computed<BreadcrumbItem[]>(() => buildBreadcrumbs(deps.getPath()))

  async function handleUserCmd(cmd: string) {
    if (cmd === 'logout') {
      await deps.logout()
      deps.replace('/login')
    } else if (cmd === 'editor') {
      deps.push('/bi-editor')
    } else if (cmd === 'screen') {
      deps.push('/screen/demo')
    }
  }

  return {
    activeMenu,
    isMobile,
    asideVisible,
    breadcrumbs,
    clockText,
    handleMediaChange,
    updateClock,
    attach,
    detach,
    handleMenuSelect,
    toggleAside,
    closeAside,
    handleUserCmd,
  }
}
