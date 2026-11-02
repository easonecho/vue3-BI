import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  type RowPermission,
  type RowPermissionOptions,
  getRowPermissions,
  getRowPermissionOptions,
  updateRowPermission,
  deleteRowPermission,
} from '@/api/dataset'

export interface UseDatasetRowPermissionsOptions {
  /** 当前数据集（对话框关闭时为 null） */
  dataset: () => { id: number; name: string } | null
  /** 对话框是否打开，打开时自动拉取规则与选择器数据 */
  visible: () => boolean
  /** 数据变更后通知父级刷新 */
  onSaved: () => void
}

/**
 * 🔑 行级权限列表逻辑：加载规则/选择器、启用切换、删除。
 *   新增/编辑表单由 DatasetRowPermissionFormDialog 自行处理。
 */
export function useDatasetRowPermissions(deps: UseDatasetRowPermissionsOptions) {
  const rules = ref<RowPermission[]>([])
  const loading = ref(false)
  const options = ref<RowPermissionOptions>({ roles: [], users: [], departments: [] })

  async function loadRules() {
    const dataset = deps.dataset()
    if (!dataset) return
    loading.value = true
    try {
      const res = await getRowPermissions(dataset.id)
      rules.value = (res.data || []).map((r) => ({
        ...r,
        conditions: Array.isArray(r.conditions) ? r.conditions : [],
      }))
    } catch (e: any) {
      ElMessage.error(e?.message || '加载行级权限失败')
    } finally {
      loading.value = false
    }
  }

  async function loadOptions() {
    try {
      const res = await getRowPermissionOptions()
      options.value = res.data || { roles: [], users: [], departments: [] }
    } catch {
      options.value = { roles: [], users: [], departments: [] }
    }
  }

  watch(
    () => deps.visible(),
    (v) => {
      if (v) {
        loadRules()
        loadOptions()
      }
    },
    { immediate: true },
  )

  function handleClosed() {
    rules.value = []
  }

  async function toggleEnabled(rule: RowPermission) {
    const dataset = deps.dataset()
    if (!dataset) return
    try {
      await updateRowPermission(dataset.id, rule.id, {
        name: rule.name,
        subjectType: rule.subjectType,
        subjectId: rule.subjectId,
        conditions: rule.conditions,
        priority: rule.priority,
        enabled: rule.enabled,
      })
      deps.onSaved()
    } catch (e: any) {
      rule.enabled = !rule.enabled
      ElMessage.error(e?.message || '更新失败')
    }
  }

  async function handleDelete(rule: RowPermission) {
    const dataset = deps.dataset()
    if (!dataset) return
    try {
      await deleteRowPermission(dataset.id, rule.id)
      ElMessage.success('规则已删除')
      await loadRules()
      deps.onSaved()
    } catch (e: any) {
      ElMessage.error(e?.message || '删除失败')
    }
  }

  return {
    rules,
    loading,
    options,
    loadRules,
    loadOptions,
    handleClosed,
    toggleEnabled,
    handleDelete,
  }
}
