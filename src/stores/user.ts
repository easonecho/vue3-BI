/**
 * 用户状态管理 Store
 *
 * 负责:
 * - 登录/登出
 * - 会话恢复 (access token 仅存内存, 刷新后靠 HttpOnly Cookie 静默刷新)
 * - 获取/缓存当前用户信息
 * - 路由/权限不在此 store, 统一由 stores/menu.ts 独立拉取
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  login as loginApi,
  getProfile,
  logout as logoutApi,
  register as registerApi,
  refreshToken as refreshApi,
} from '@/api/auth'
import { getToken, setToken, removeToken, hasSessionCookie } from '@/utils/request'
import type { User } from '@/api/types'
import { useMenuStore } from '@/stores/menu'

export const useUserStore = defineStore(
  'user',
  () => {
    // ========== 状态 ==========
    const token = ref<string>(getToken())
    const userInfo = ref<User | null>(null)
    /** 本次页面生命周期内是否已尝试用 Cookie 恢复会话 (避免守卫重复刷新) */
    let sessionChecked = false

    // ========== 计算属性 ==========
    const isLoggedIn = computed(() => !!token.value)
    const username = computed(() => userInfo.value?.nickname || userInfo.value?.username || '')

    // ========== 方法 ==========
    /** 登录: 仅保存 access token + 用户信息; refresh token 由服务端写入 HttpOnly Cookie */
    async function login(username: string, password: string) {
      const res = await loginApi({ username, password })
      token.value = res.data.accessToken
      setToken(res.data.accessToken)
      userInfo.value = res.data.user
      sessionChecked = true
      return res.data
    }

    /** 注册 */
    async function register(params: {
      username: string
      password: string
      email?: string
      nickname?: string
    }) {
      const res = await registerApi(params)
      token.value = res.data.accessToken
      setToken(res.data.accessToken)
      userInfo.value = res.data.user
      sessionChecked = true
      return res.data
    }

    /** 获取当前用户信息 */
    async function fetchProfile() {
      if (!token.value) return null
      const res = await getProfile()
      userInfo.value = res.data
      return res.data
    }

    /**
     * 恢复会话: 页面刷新后内存中的 access token 丢失,
     * 若存在 bi_csrf Cookie (说明 refresh Cookie 有效) 则静默刷新换取新 access token
     */
    async function ensureSession(): Promise<boolean> {
      if (sessionChecked) return !!token.value
      sessionChecked = true
      if (token.value) return true
      if (!hasSessionCookie()) return false
      try {
        const res = await refreshApi()
        if (res.code === 0 && res.data) {
          token.value = res.data.accessToken
          setToken(res.data.accessToken)
          if (!userInfo.value) await fetchProfile().catch(() => null)
          return true
        }
        return false
      } catch {
        return false
      }
    }

    /** 登出 */
    async function logout() {
      try {
        // refresh token 在 Cookie 中, 服务端负责拉黑并清除 Cookie
        await logoutApi()
      } catch {
        /* 忽略, 即使服务端失败也要本地清理 */
      }
      token.value = ''
      userInfo.value = null
      removeToken()
      sessionChecked = true
      useMenuStore().reset()
    }

    return {
      token,
      userInfo,
      isLoggedIn,
      username,
      login,
      register,
      fetchProfile,
      ensureSession,
      logout,
    }
  },
  {
    // 仅持久化用户信息; access token 只存内存, 避免 XSS 读取
    persist: { pick: ['userInfo'] },
  },
)

/** 绑定全局认证事件 (过期跳转 / 静默刷新后同步内存 token) */
function bindGlobalAuthEvents(): void {
  if (typeof window === 'undefined') return
  let bound = false
  window.addEventListener('bi-auth:refreshed', () => {
    useUserStore().token = getToken()
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
