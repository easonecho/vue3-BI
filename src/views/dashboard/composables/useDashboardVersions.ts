/**
 * 看板版本管理弹窗逻辑
 *
 * 负责版本列表分页/搜索、保存快照、查看详情、恢复与删除，
 * 通过依赖注入 dashboardId 与 restored 回调，便于单测。
 */
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createDashboardVersion,
  deleteDashboardVersion,
  getDashboardVersion,
  getDashboardVersions,
  restoreDashboardVersion,
  type DashboardVersion,
} from '@/api/dashboard-version'

export interface DashboardVersionsDeps {
  getDashboardId: () => number | null
  /** 恢复成功后通知外层刷新看板 */
  onRestored: () => void
}

export const VERSION_PAGE_SIZE = 10

export function useDashboardVersions(deps: DashboardVersionsDeps) {
  const versions = ref<DashboardVersion[]>([])
  const loading = ref(false)
  const page = ref(1)
  const pageSize = VERSION_PAGE_SIZE
  const total = ref(0)
  const keyword = ref('')

  const saveVisible = ref(false)
  const saving = ref(false)
  const remark = ref('')

  const detailVisible = ref(false)
  const detailLoading = ref(false)
  const detail = ref<DashboardVersion | null>(null)

  /** 打开弹窗时重置分页/搜索并加载 */
  function handleOpen() {
    page.value = 1
    keyword.value = ''
    void loadVersions()
  }

  function handleClosed() {
    versions.value = []
    total.value = 0
    page.value = 1
    saveVisible.value = false
    detailVisible.value = false
    detail.value = null
  }

  async function loadVersions() {
    const dashboardId = deps.getDashboardId()
    if (dashboardId === null || dashboardId === undefined) return
    loading.value = true
    try {
      const res = await getDashboardVersions(dashboardId, {
        page: page.value,
        pageSize,
        keyword: keyword.value.trim() || undefined,
      })
      versions.value = res.data.list
      total.value = res.data.total
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '加载版本列表失败')
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    page.value = 1
    void loadVersions()
  }

  function openSaveDialog() {
    remark.value = ''
    saveVisible.value = true
  }

  async function confirmSave() {
    const dashboardId = deps.getDashboardId()
    if (dashboardId === null || dashboardId === undefined) return
    saving.value = true
    try {
      await createDashboardVersion(dashboardId, remark.value.trim() || undefined)
      ElMessage.success('版本已保存')
      saveVisible.value = false
      page.value = 1
      await loadVersions()
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '保存版本失败')
    } finally {
      saving.value = false
    }
  }

  async function openDetail(row: DashboardVersion) {
    const dashboardId = deps.getDashboardId()
    if (dashboardId === null || dashboardId === undefined) return
    detail.value = null
    detailVisible.value = true
    detailLoading.value = true
    try {
      const res = await getDashboardVersion(dashboardId, row.id)
      detail.value = res.data
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '加载版本详情失败')
    } finally {
      detailLoading.value = false
    }
  }

  async function handleRestore(row: DashboardVersion) {
    const dashboardId = deps.getDashboardId()
    if (dashboardId === null || dashboardId === undefined) return
    try {
      await ElMessageBox.confirm(
        `确定恢复到 v${row.versionNo} 吗? 当前配置会先自动备份为新版本，恢复后需刷新编辑器查看。`,
        '恢复版本',
        { type: 'warning', confirmButtonText: '恢复', cancelButtonText: '取消' },
      )
    } catch {
      return // 用户取消
    }
    try {
      const res = await restoreDashboardVersion(dashboardId, row.id)
      ElMessage.success(`已恢复 v${row.versionNo}，当前配置已备份为 v${res.data.backupVersionNo}`)
      detailVisible.value = false
      deps.onRestored()
      page.value = 1
      await loadVersions()
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '恢复版本失败')
    }
  }

  async function handleDelete(row: DashboardVersion) {
    const dashboardId = deps.getDashboardId()
    if (dashboardId === null || dashboardId === undefined) return
    try {
      await deleteDashboardVersion(dashboardId, row.id)
      ElMessage.success('版本已删除')
      if (versions.value.length === 1 && page.value > 1) page.value -= 1
      await loadVersions()
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '删除版本失败')
    }
  }

  return {
    versions,
    loading,
    page,
    pageSize,
    total,
    keyword,
    saveVisible,
    saving,
    remark,
    detailVisible,
    detailLoading,
    detail,
    handleOpen,
    handleClosed,
    loadVersions,
    handleSearch,
    openSaveDialog,
    confirmSave,
    openDetail,
    handleRestore,
    handleDelete,
  }
}
