import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useSystemLayout } from './useSystemLayout'

const { logoutMock, replaceMock, pushMock } = vi.hoisted(() => ({
  logoutMock: vi.fn<() => Promise<void>>(),
  replaceMock: vi.fn<(path: string) => unknown>(),
  pushMock: vi.fn<(path: string) => unknown>(),
}))

function setup(overrides: { now?: () => Date } = {}) {
  const path = ref('/dashboard')
  const scope = effectScope()
  const api = scope.run(() =>
    useSystemLayout({
      getPath: () => path.value,
      logout: logoutMock,
      replace: replaceMock,
      push: pushMock,
      ...overrides,
    }),
  )!
  return { api, path, scope }
}

type MediaListener = (event: { matches: boolean }) => void

function stubMatchMedia(matches = false) {
  const listeners: MediaListener[] = []
  const media = {
    matches,
    addEventListener: vi.fn((type: string, cb: MediaListener) => {
      if (type === 'change') listeners.push(cb)
    }),
    removeEventListener: vi.fn((type: string, cb: MediaListener) => {
      const index = listeners.indexOf(cb)
      if (type === 'change' && index >= 0) listeners.splice(index, 1)
    }),
  }
  const matchMediaMock = vi.fn(() => media as unknown as MediaQueryList)
  vi.stubGlobal('matchMedia', matchMediaMock)
  return { media, listeners, matchMediaMock }
}

beforeEach(() => {
  vi.clearAllMocks()
  logoutMock.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('useSystemLayout 面包屑与菜单', () => {
  it('activeMenu 跟随路由，面包屑随路径更新', async () => {
    const { api, path, scope } = setup()
    expect(api.activeMenu.value).toBe('/dashboard')
    expect(api.breadcrumbs.value).toEqual([{ title: '首页', path: '/dashboard' }])

    path.value = '/system/users'
    await nextTick()

    expect(api.activeMenu.value).toBe('/system/users')
    expect(api.breadcrumbs.value).toHaveLength(2)
    expect(api.breadcrumbs.value[1]).toEqual({ title: '用户管理', path: '/system/users' })
    scope.stop()
  })

  it('路由变化与点击菜单都会收起抽屉', async () => {
    const { api, path, scope } = setup()
    api.asideVisible.value = true

    path.value = '/system/roles'
    await nextTick()
    expect(api.asideVisible.value).toBe(false)

    api.asideVisible.value = true
    api.handleMenuSelect()
    expect(api.asideVisible.value).toBe(false)
    scope.stop()
  })

  it('toggleAside/closeAside 控制抽屉开合', () => {
    const { api, scope } = setup()
    expect(api.asideVisible.value).toBe(false)

    api.toggleAside()
    expect(api.asideVisible.value).toBe(true)
    api.toggleAside()
    expect(api.asideVisible.value).toBe(false)

    api.asideVisible.value = true
    api.closeAside()
    expect(api.asideVisible.value).toBe(false)
    scope.stop()
  })
})

describe('useSystemLayout 用户命令', () => {
  it('editor/screen 分别跳转对应页面', () => {
    const { api, scope } = setup()
    api.handleUserCmd('editor')
    api.handleUserCmd('screen')

    expect(pushMock).toHaveBeenNthCalledWith(1, '/bi-editor')
    expect(pushMock).toHaveBeenNthCalledWith(2, '/screen/demo')
    expect(logoutMock).not.toHaveBeenCalled()
    scope.stop()
  })

  it('logout 先退出登录再跳转登录页', async () => {
    const { api, scope } = setup()
    await api.handleUserCmd('logout')

    expect(logoutMock).toHaveBeenCalledTimes(1)
    expect(replaceMock).toHaveBeenCalledWith('/login')
    scope.stop()
  })

  it('未知命令不触发任何跳转', () => {
    const { api, scope } = setup()
    api.handleUserCmd('unknown')

    expect(logoutMock).not.toHaveBeenCalled()
    expect(replaceMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
    scope.stop()
  })
})

describe('useSystemLayout 移动端与时钟', () => {
  it('attach 读取 matchMedia 初始状态并响应变化', () => {
    const { media, listeners, matchMediaMock } = stubMatchMedia(true)
    const { api, scope } = setup()

    api.attach()
    expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 900px)')
    expect(api.isMobile.value).toBe(true)

    api.asideVisible.value = true
    listeners[0]({ matches: false })
    expect(api.isMobile.value).toBe(false)
    expect(api.asideVisible.value).toBe(false)

    api.detach()
    expect(media.removeEventListener).toHaveBeenCalled()
    scope.stop()
  })

  it('attach 启动时钟，detach 清理监听与定时器', () => {
    vi.useFakeTimers()
    const now = vi.fn(() => new Date(2024, 0, 2, 3, 4, 5))
    const { media, matchMediaMock } = stubMatchMedia(false)
    const { api, scope } = setup({ now })
    const clearSpy = vi.spyOn(window, 'clearInterval')

    api.attach()
    expect(api.clockText.value).toBe('03:04:05')
    expect(vi.getTimerCount()).toBe(1)

    now.mockReturnValue(new Date(2024, 0, 2, 3, 4, 6))
    vi.advanceTimersByTime(1000)
    expect(api.clockText.value).toBe('03:04:06')

    api.detach()
    expect(clearSpy).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    expect(media.removeEventListener).toHaveBeenCalled()
    expect(matchMediaMock).toHaveBeenCalled()
    scope.stop()
  })
})
