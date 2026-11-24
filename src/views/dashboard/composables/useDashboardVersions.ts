/**
 * 看板版本管理弹窗逻辑
 *
 * 负责版本列表分页/搜索、保存快照、查看详情、恢复与删除，
 * 通过依赖注入 dashboardId 与 restored 回调，便于单测。
 */
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import i18n from '@/i18n'
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
      ElMessage.error(e instanceof Error ? e.message : i18n.global.t('dashboard.versionLoadFailed'))
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
      ElMessage.success(i18n.global.t('dashboard.versionSaved'))
      saveVisible.value = false
      page.value = 1
      await loadVersions()
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : i18n.global.t('dashboard.versionSaveFailed'))
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
      ElMessage.error(
        e instanceof Error ? e.message : i18n.global.t('dashboard.versionDetailLoadFailed'),
      )
    } finally {
      detailLoading.value = false
    }
  }

  async function handleRestore(row: DashboardVersion) {
    const dashboardId = deps.getDashboardId()
    if (dashboardId === null || dashboardId === undefined) return
    try {
      await ElMessageBox.confirm(
        i18n.global.t('dashboard.versionRestoreConfirm', { versionNo: row.versionNo }),
        i18n.global.t('dashboard.versionRestoreTitle'),
        {
          type: 'warning',
          confirmButtonText: i18n.global.t('dashboard.versionRestoreBtn'),
          cancelButtonText: i18n.global.t('common.cancel'),
        },
      )
    } catch {
      return // 用户取消
    }
    try {
      const res = await restoreDashboardVersion(dashboardId, row.id)
      ElMessage.success(
        i18n.global.t('dashboard.versionRestored', {
          versionNo: row.versionNo,
          backupVersionNo: res.data.backupVersionNo,
        }),
      )
      detailVisible.value = false
      deps.onRestored()
      page.value = 1
      await loadVersions()
    } catch (e) {
      ElMessage.error(
        e instanceof Error ? e.message : i18n.global.t('dashboard.versionRestoreFailed'),
      )
    }
  }

  async function handleDelete(row: DashboardVersion) {
    const dashboardId = deps.getDashboardId()
    if (dashboardId === null || dashboardId === undefined) return
    try {
      await deleteDashboardVersion(dashboardId, row.id)
      ElMessage.success(i18n.global.t('dashboard.versionDeleted'))
      if (versions.value.length === 1 && page.value > 1) page.value -= 1
      await loadVersions()
    } catch (e) {
      ElMessage.error(
        e instanceof Error ? e.message : i18n.global.t('dashboard.versionDeleteFailed'),
      )
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
