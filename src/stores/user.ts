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
import { login as loginApi, getProfile } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/request'
import type { User } from '@/api/types'

export const useUserStore = defineStore(
  'user',
  () => {
    // ========== 状态 ==========
    const token = ref<string>(getToken())
    const userInfo = ref<User | null>(null)
    /** 角色代码列表 (如 ['ADMIN', 'EDITOR']) */
    const roles = ref<string[]>([])
    /** 权限代码列表 (如 ['dashboard:view', 'chart:edit']) */
    const permissions = ref<string[]>([])

    // ========== 计算属性 ==========
    const isLoggedIn = computed(() => !!token.value)
    const username = computed(() => userInfo.value?.nickname || userInfo.value?.username || '')
    const isAdmin = computed(() => roles.value.includes('ADMIN'))

    // ========== 方法 ==========
    /** 登录 */
    async function login(username: string, password: string) {
      const res = await loginApi({ username, password })
      token.value = res.data.token
      userInfo.value = res.data.user
      setToken(res.data.token)
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
    function logout() {
      token.value = ''
      userInfo.value = null
      roles.value = []
      permissions.value = []
      removeToken()
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
      userInfo,
      roles,
      permissions,
      isLoggedIn,
      username,
      isAdmin,
      login,
      fetchProfile,
      logout,
      hasPermission,
      setRoles,
      setPermissions,
    }
  },
  {
    persist: true,
  },
)
