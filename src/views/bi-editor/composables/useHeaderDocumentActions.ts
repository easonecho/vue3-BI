import { ElMessage, ElMessageBox } from 'element-plus'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import type { useBiEditorStore } from '@/stores/bi-editor'
import type { DashboardLayout } from '@/views/bi-editor/types'
import i18n from '@/i18n'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

export interface HeaderDocumentActionsDeps {
  store: BiEditorStore
  route: RouteLocationNormalizedLoaded
  router: Router
  /** 模板模式保存时打开元数据对话框 */
  openTemplateDialog: () => void
}

export interface HeaderDocumentActionsApi {
  handleSave: () => Promise<void>
  handleSaveAs: () => Promise<void>
  handlePreview: () => void
  handleExportJson: () => void
  onImportJsonFile: (e: Event) => Promise<void>
}

/**
 * 🔑 顶栏「文档级操作」：保存 / 另存为 / 预览 / 布局 JSON 导入导出。
 *
 * 从 HeaderToolbar 抽出，依赖注入 route/router 便于单测。
 */
export function useHeaderDocumentActions(
  deps: HeaderDocumentActionsDeps,
): HeaderDocumentActionsApi {
  const { store, route, router, openTemplateDialog } = deps
  const t = i18n.global.t

  async function handleSave() {
    // 🔑 模板编辑模式：打开元数据对话框走 saveTemplate
    if (store.isTemplateMode) {
      openTemplateDialog()
      return
    }
    try {
      await store.saveDashboard()
      // 🔑 新建保存后 URL 还停留在 /bi-editor(无 id)，用 replace 补上 id
      if (route.params.id == null && store.currentDashboardId != null) {
        router.replace(`/bi-editor/${store.currentDashboardId}`)
      }
    } catch {
      // 错误提示由 request 拦截器统一处理，这里吞掉避免 unhandled rejection
    }
  }

  /** 🔑 另存为：reset currentDashboardId 后重新保存（后端会生成新看板） */
  async function handleSaveAs() {
    // 🔑 模板模式下另存为已禁用（按钮隐藏），快捷键触发时直接忽略
    if (store.isTemplateMode) return
    try {
      store.setDashboardId(null)
      store.setDashboardName(
        t('editorUi.header.copySuffix', {
          name: store.dashboardName || t('editorUi.header.untitledDashboard'),
        }),
      )
      await store.saveDashboard()
      if (store.currentDashboardId != null) {
        router.replace(`/bi-editor/${store.currentDashboardId}`)
        ElMessage.success(t('editorUi.header.saveAsSuccess'))
      }
    } catch {
      // 同上
    }
  }

  function handlePreview() {
    // 🔑 未保存的看板没有 id，无法预览
    if (store.currentDashboardId == null) {
      ElMessage.warning(t('editorUi.header.previewNeedsSave'))
      return
    }
    // 🔑 有未保存改动时提示，但仍允许预览
    if (store.isDirty) {
      ElMessage.info(t('editorUi.header.previewDirtyHint'))
    }
    router.push(`/preview/${store.currentDashboardId}`)
  }

  function handleExportJson() {
    const layout = store.serializeLayout()
    const blob = new Blob([JSON.stringify(layout, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const safe = (store.dashboardName || t('editorUi.header.jsonExportFileName')).replace(
      /[\\/:*?"<>|]/g,
      '_',
    )
    const ts = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}`
    a.href = url
    a.download = `${safe}_${stamp}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success(t('editorUi.header.exportJsonSuccess'))
  }

  /**
   * 🔑 校验导入的 JSON 是否为合法 DashboardLayout。
   *   只做结构性最小校验（components 为数组 + canvas 为对象），
   *   在进入 store.applyLayout 前把 unknown 收窄成具体类型。
   */
  function isDashboardLayout(v: unknown): v is DashboardLayout {
    if (!v || typeof v !== 'object') return false
    const o = v as Record<string, unknown>
    return Array.isArray(o.components) && !!o.canvas && typeof o.canvas === 'object'
  }

  async function onImportJsonFile(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = '' // 重置，保证下一次选同文件也会触发
    if (!file) return
    try {
      await ElMessageBox.confirm(
        t('editorUi.header.importConfirmMessage'),
        t('editorUi.header.importConfirmTitle'),
        {
          confirmButtonText: t('editorUi.header.confirmOverwriteImport'),
          cancelButtonText: t('common.cancel'),
          type: 'warning',
        },
      )
    } catch {
      return
    }
    try {
      const text = await file.text()
      const layout: unknown = JSON.parse(text)
      if (!isDashboardLayout(layout)) throw new Error(t('editorUi.header.jsonInvalid'))
      store.applyLayout(layout)
      // 🔑 导入后另存为新看板：currentDashboardId = null，下次 save 会产生新记录
      store.setDashboardId(null)
      store.setDashboardName(
        t('editorUi.header.importedSuffix', {
          name: store.dashboardName || t('editorUi.header.untitled'),
        }),
      )
      ElMessage.success(t('editorUi.header.importSuccess', { file: file.name }))
    } catch (err) {
      console.error('[HeaderToolbar] import JSON failed', err)
      ElMessage.error(
        t('editorUi.header.importFailed', {
          message: (err as Error).message || t('editorUi.header.jsonParseError'),
        }),
      )
    }
  }

  return { handleSave, handleSaveAs, handlePreview, handleExportJson, onImportJsonFile }
}
