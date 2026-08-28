import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMyMenuTree, getMyPerms, type MenuTreeNode } from '@/api/menu'

export const useMenuStore = defineStore(
  'menu',
  () => {
    const menuTree = ref<MenuTreeNode[]>([])
    const perms = ref<string[]>([])
    const loaded = ref(false)

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
      if (loaded.value && menuTree.value.length > 0) return
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
      menuTree,
      perms,
      loaded,
      fetchMenuTree,
      fetchPerms,
      init,
      hasPerm,
      hasAnyPerms,
      reset,
    }
  },
  {
    persist: false,
  },
)
