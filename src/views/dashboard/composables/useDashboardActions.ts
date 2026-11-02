import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Router } from 'vue-router'
import { copyDashboard, deleteDashboard, updateDashboard } from '@/api/dashboard'
import type { Dashboard } from '@/api/types'

export interface DashboardActionsDeps {
  router: Router
  reload: () => void | Promise<void>
  /** 删除成功后由列表层执行页码回退与刷新 */
  onDeleted: () => void | Promise<void>
  loadGroups: () => void | Promise<void>
}

/**
 * 🔑 看板卡片操作与各类弹窗状态。
 *
 * 从 dashboard/index.vue 抽出：导航、重命名/复制/发布/公开/删除，
 * 分组管理、移动分组、存为模板、分享、定时报表、版本管理弹窗。
 */
export function useDashboardActions(deps: DashboardActionsDeps) {
  const { router, reload, onDeleted, loadGroups } = deps

  // 定时报表订阅
  const reportVisible = ref(false)
  const reportTarget = ref<Dashboard | null>(null)

  // 版本管理
  const versionVisible = ref(false)
  const versionTarget = ref<Dashboard | null>(null)

  // 重命名对话框
  const renameVisible = ref(false)
  const renameValue = ref('')
  const renameTarget = ref<Dashboard | null>(null)
  const renaming = ref(false)

  // 新建对话框
  const createVisible = ref(false)

  // 分享对话框
  const shareVisible = ref(false)
  const shareTarget = ref<Dashboard | null>(null)

  // P2-3: 分组管理
  const groupDialogVisible = ref(false)
  const moveGroupVisible = ref(false)
  const moveGroupTarget = ref<Dashboard | null>(null)

  // P2-3: 存为模板
  const saveTplVisible = ref(false)
  const saveTplTarget = ref<Dashboard | null>(null)

  // P2-3: 数据血缘 (按看板聚焦)
  const lineageVisible = ref(false)
  const lineageTarget = ref<Dashboard | null>(null)

  function handleEdit(id: number) {
    router.push(`/bi-editor/${id}`)
  }

  function handlePreview(id: number) {
    router.push(`/preview/${id}`)
  }

  function openCreateDialog() {
    createVisible.value = true
  }

  function openGroupDialog() {
    groupDialogVisible.value = true
    void loadGroups()
  }

  function handleCommand(cmd: string, item: Dashboard) {
    if (cmd === 'rename') {
      renameTarget.value = item
      renameValue.value = item.name
      renameVisible.value = true
    } else if (cmd === 'copy') {
      void handleCopy(item)
    } else if (cmd === 'moveGroup') {
      moveGroupTarget.value = item
      moveGroupVisible.value = true
    } else if (cmd === 'saveAsTemplate') {
      saveTplTarget.value = item
      saveTplVisible.value = true
    } else if (cmd === 'share') {
      shareTarget.value = item
      shareVisible.value = true
    } else if (cmd === 'report') {
      reportTarget.value = item
      reportVisible.value = true
    } else if (cmd === 'versions') {
      versionTarget.value = item
      versionVisible.value = true
    } else if (cmd === 'lineage') {
      lineageTarget.value = item
      lineageVisible.value = true
    } else if (cmd === 'delete') {
      void handleDelete(item)
    } else if (cmd === 'toggleStatus') {
      void handleToggleStatus(item)
    } else if (cmd === 'togglePublic') {
      void handleTogglePublic(item)
    }
  }

  async function confirmRename() {
    if (!renameTarget.value) return
    const name = renameValue.value.trim()
    if (!name) {
      ElMessage.warning('看板名称不能为空')
      return
    }
    renaming.value = true
    try {
      await updateDashboard(renameTarget.value.id, { name })
      ElMessage.success('重命名成功')
      renameVisible.value = false
      void reload()
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      renaming.value = false
    }
  }

  async function handleCopy(item: Dashboard) {
    try {
      await ElMessageBox.confirm(`确定复制看板「${item.name}」吗? 副本将作为草稿创建。`, '复制看板', {
        type: 'info',
        confirmButtonText: '复制',
        cancelButtonText: '取消',
      })
      await copyDashboard(item.id)
      ElMessage.success('复制成功')
      void reload()
    } catch {
      // 用户取消或请求失败
    }
  }

  async function handleToggleStatus(item: Dashboard) {
    const next = item.status === 1 ? 0 : 1
    const label = next === 1 ? '发布' : '转为草稿'
    try {
      await updateDashboard(item.id, { status: next })
      ElMessage.success(`已${label}`)
      void reload()
    } catch {
      // 错误提示由 request 拦截器统一处理
    }
  }

  async function handleTogglePublic(item: Dashboard) {
    const next = !item.isPublic
    const label = next ? '公开' : '私有'
    try {
      await updateDashboard(item.id, { isPublic: next })
      ElMessage.success(`已设为${label}`)
      void reload()
    } catch {
      // 错误提示由 request 拦截器统一处理
    }
  }

  async function handleDelete(item: Dashboard) {
    try {
      await ElMessageBox.confirm(`确定删除看板「${item.name}」吗?此操作不可恢复。`, '提示', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      })
      await deleteDashboard(item.id)
      ElMessage.success('删除成功')
      void onDeleted()
    } catch {
      // 用户取消删除,无需处理
    }
  }

  return {
    reportVisible,
    reportTarget,
    versionVisible,
    versionTarget,
    renameVisible,
    renameValue,
    renameTarget,
    renaming,
    createVisible,
    shareVisible,
    shareTarget,
    groupDialogVisible,
    moveGroupVisible,
    moveGroupTarget,
    saveTplVisible,
    saveTplTarget,
    lineageVisible,
    lineageTarget,
    handleEdit,
    handlePreview,
    openCreateDialog,
    openGroupDialog,
    handleCommand,
    confirmRename,
    handleCopy,
    handleToggleStatus,
    handleTogglePublic,
    handleDelete,
  }
}
