/**
 * 用户状态管理 Store
 *
 * 负责:
 * - 登录/登出
 * - 持久化 Token
 * - 获取/缓存当前用户信息
 * - 角色与权限判断
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getProfile, logout as logoutApi, register as registerApi } from '@/api/auth'
import { getToken, getRefreshToken, setTokenPair, removeToken } from '@/utils/request'
import type { User } from '@/api/types'
import { useMenuStore } from '@/stores/menu'

export const useUserStore = defineStore(
  'user',
  () => {
    // ========== 状态 ==========
    const token = ref<string>(getToken())
    const refreshToken = ref<string>(getRefreshToken())
    const userInfo = ref<User | null>(null)
    /** 角色代码列表 (如 ['ADMIN', 'EDITOR']) */
    const roles = ref<string[]>([])
    /** 权限代码列表 (如 ['dashboard:view', 'chart:edit']) */
    const permissions = ref<string[]>([])

    // ========== 计算属性 ==========
    const isLoggedIn = computed(() => !!token.value || !!refreshToken.value)
    const username = computed(() => userInfo.value?.nickname || userInfo.value?.username || '')
    const isAdmin = computed(() => roles.value.includes('ADMIN'))

    // ========== 方法 ==========
    /** 登录 */
    async function login(username: string, password: string) {
      const res = await loginApi({ username, password })
      token.value = res.data.accessToken
      refreshToken.value = res.data.refreshToken
      userInfo.value = res.data.user
      setTokenPair(res.data.accessToken, res.data.refreshToken)
      // 同步菜单树和权限码到 menu store
      const menuStore = useMenuStore()
      if (res.data.routers) {
        menuStore.syncFromLogin(res.data.routers, res.data.perms || [])
      }
      // 登录响应里可能带 permissions
      if (res.data.user?.permissions) {
        try {
          const p = res.data.user.permissions
          const arr = typeof p === 'string' ? JSON.parse(p) : p
          if (Array.isArray(arr)) permissions.value = arr
        } catch (e) { console.warn('[user] ignored error', e) }
      }
      return res.data
    }

    /** 注册 */
    async function register(params: { username: string; password: string; email?: string; nickname?: string }) {
      const res = await registerApi(params)
      token.value = res.data.accessToken
      refreshToken.value = res.data.refreshToken
      userInfo.value = res.data.user
      setTokenPair(res.data.accessToken, res.data.refreshToken)
      return res.data
    }

    /** 获取当前用户信息 */
    async function fetchProfile() {
      if (!token.value) return null
      const res = await getProfile()
      userInfo.value = res.data
      return res.data
    }

    /** 登出 */
    async function logout() {
      try {
        await logoutApi({ refreshToken: refreshToken.value || undefined })
      } catch { /* 忽略, 即使服务端失败也要本地清理 */ }
      token.value = ''
      refreshToken.value = ''
      userInfo.value = null
      roles.value = []
      permissions.value = []
      removeToken()
      useMenuStore().reset()
    }

    /**
     * 接收静默刷新后派发的新 token (request.ts 拦截器内部直接 setTokenPair,
     * 但 store 响应式也要同步, 故监听 bi-auth:refreshed 事件)
     */
    function syncTokensFromStorage() {
      token.value = getToken()
      refreshToken.value = getRefreshToken()
    }

    /** 判断是否拥有指定权限码 */
    function hasPermission(code: string): boolean {
      return permissions.value.includes(code)
    }

    /** 设置角色代码列表 */
    function setRoles(codes: string[]) {
      roles.value = codes
    }

    /** 设置权限代码列表 */
    function setPermissions(codes: string[]) {
      permissions.value = codes
    }

    return {
      token,
      refreshToken,
      userInfo,
      roles,
      permissions,
      isLoggedIn,
      username,
      isAdmin,
      login,
      register,
      fetchProfile,
      logout,
      hasPermission,
      setRoles,
      setPermissions,
      syncTokensFromStorage,
    }
  },
  {
    persist: true,
  },
)

/** 绑定全局认证事件 (过期跳转 / 刷新同步 token) */
function bindGlobalAuthEvents(): void {
  if (typeof window === 'undefined') return
  let bound = false
  window.addEventListener('storage', (e) => {
    // 跨 tab token 同步: 外部 setItem 触发
    if (e.key === 'bi_token' || e.key === 'bi_refresh_token') {
      useUserStore().syncTokensFromStorage()
    }
  })
  window.addEventListener('bi-auth:expired', async () => {
    if (bound) return
    bound = true
    try {
      const store = useUserStore()
      await store.logout().catch(() => {})
    } finally {
      bound = false
    }
    const to = '/login'
    if (location.pathname !== to) {
      location.href = to
    }
  })
}

// 仅绑定一次
if (typeof window !== 'undefined') {
  // 延迟到 defineStore 可用后再执行 (模块加载顺序下直接调用是 OK 的)
  Promise.resolve()
    .then(bindGlobalAuthEvents)
    .catch((e) => console.warn('[user] bindGlobalAuthEvents failed', e))
}

