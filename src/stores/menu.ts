import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMyMenuTree, getMyPerms, type MenuTreeNode } from '@/api/menu'

export const useMenuStore = defineStore('menu', () => {
  const menuTree = ref<MenuTreeNode[]>([])
  const perms = ref<string[]>([])
  const loaded = ref(false)

  /** 从登录响应同步 */
  function syncFromLogin(routers: unknown[], permCodes: string[]) {
    menuTree.value = routers as MenuTreeNode[]
    perms.value = permCodes || []
    loaded.value = true
  }

  /** 从后端拉取 */
  async function fetchMenuTree() {
    const res = await getMyMenuTree()
    menuTree.value = res.data || []
    return menuTree.value
  }

  async function fetchPerms() {
    const res = await getMyPerms()
    perms.value = res.data || []
    return perms.value
  }

  async function init() {
    if (loaded.value) return
    await Promise.all([fetchMenuTree(), fetchPerms()])
    loaded.value = true
  }

  /** 判断是否有某个权限码 */
  function hasPerm(code: string): boolean {
    if (perms.value.includes('*')) return true
    return perms.value.includes(code)
  }

  /** 判断是否有任一权限码 */
  function hasAnyPerms(codes: string[]): boolean {
    if (perms.value.includes('*')) return true
    return codes.some((c) => perms.value.includes(c))
  }

  function reset() {
    menuTree.value = []
    perms.value = []
    loaded.value = false
  }

  return {
    menuTree, perms, loaded,
    syncFromLogin, fetchMenuTree, fetchPerms, init,
    hasPerm, hasAnyPerms, reset,
  }
}, {
  persist: true,
})
