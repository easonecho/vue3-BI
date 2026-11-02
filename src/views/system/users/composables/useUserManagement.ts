import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserList, deleteUser, getRoles } from '@/api/user'
import type { User, Role } from '@/api/types'

/**
 * 🔑 用户管理列表逻辑：筛选、分页、角色选项、删除。
 *   新增/编辑/改角色/重置密码由各自的对话框组件处理。
 */
export function useUserManagement() {
  const loading = ref(false)
  const list = ref<User[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)

  const filters = reactive<{ keyword?: string; roleId?: number; status?: number }>({
    keyword: '',
    roleId: undefined,
    status: undefined,
  })

  async function loadList() {
    loading.value = true
    try {
      const res = await getUserList({
        page: page.value,
        pageSize: pageSize.value,
        keyword: filters.keyword || undefined,
        roleId: filters.roleId,
        status: filters.status,
      })
      list.value = res.data.list
      total.value = res.data.total
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    page.value = 1
    loadList()
  }

  function handleReset() {
    filters.keyword = ''
    filters.roleId = undefined
    filters.status = undefined
    handleSearch()
  }

  /** 角色选项（失败时保持空列表，不阻断用户列表） */
  const roleOptions = ref<Role[]>([])
  async function loadRoles() {
    try {
      const res = await getRoles()
      roleOptions.value = res.data || []
    } catch {
      /* noop */
    }
  }

  async function handleDelete(row: User) {
    try {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      if (list.value.length === 1 && page.value > 1) page.value -= 1
      loadList()
    } catch {
      /* noop */
    }
  }

  onMounted(() => {
    loadRoles()
    loadList()
  })

  return {
    loading,
    list,
    total,
    page,
    pageSize,
    filters,
    roleOptions,
    loadList,
    loadRoles,
    handleSearch,
    handleReset,
    handleDelete,
  }
}
