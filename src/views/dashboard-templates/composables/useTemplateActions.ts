import { ElMessage, ElMessageBox } from 'element-plus'
import type { Router } from 'vue-router'
import {
  createDashboardTemplate,
  deleteDashboardTemplate,
  updateDashboardTemplate,
  type DashboardTemplate,
} from '@/api/dashboard-template'

/** i18n 翻译函数的最小签名，便于注入与单测 */
export type TemplateTranslate = (key: string, named?: Record<string, unknown>) => string

export interface TemplateActionsDeps {
  router: Router
  t: TemplateTranslate
  reload: () => void | Promise<void>
  openApply: (item: DashboardTemplate) => void
}

/**
 * 🔑 模板管理页的卡片操作：新建/编辑跳转、复制、公开切换、删除。
 *
 * 从 dashboard-templates/index.vue 抽出，依赖注入 router/t/reload/openApply。
 */
export function useTemplateActions(deps: TemplateActionsDeps) {
  const { router, t, reload, openApply } = deps

  /** 🔑 走编辑器可视化创建模板 */
  function openCreate() {
    router.push('/bi-editor-template')
  }

  /** 🔑 走编辑器可视化编辑模板 */
  function openEdit(item: DashboardTemplate) {
    router.push(`/bi-editor-template/${item.id}`)
  }

  async function copyTemplate(item: DashboardTemplate) {
    try {
      await createDashboardTemplate({
        name: `${item.name}_copy`,
        description: item.description || undefined,
        category: item.category || undefined,
        thumbnail: item.thumbnail || undefined,
        isPublic: false,
        layout: item.layout || undefined,
      })
      ElMessage.success(t('templateManage.copySuccess'))
      await reload()
    } catch {
      // 错误提示由 request 拦截器统一处理
    }
  }

  async function togglePublic(item: DashboardTemplate) {
    try {
      await updateDashboardTemplate(item.id, { isPublic: !item.isPublic })
      ElMessage.success(
        item.isPublic ? t('dashboard.setPrivateDone') : t('dashboard.setPublicDone'),
      )
      await reload()
    } catch {
      // 错误提示由 request 拦截器统一处理
    }
  }

  async function deleteTemplate(item: DashboardTemplate) {
    try {
      await ElMessageBox.confirm(
        t('dashboard.deleteTemplateConfirm', { name: item.name }),
        t('dashboard.deleteTitle'),
        {
          type: 'warning',
          confirmButtonText: t('dashboard.deleteBtn'),
          cancelButtonText: t('common.cancel'),
        },
      )
      await deleteDashboardTemplate(item.id)
      ElMessage.success(t('dashboard.deleteSuccess'))
      await reload()
    } catch {
      // 用户取消或请求失败
    }
  }

  function handleCommand(cmd: string, item: DashboardTemplate) {
    if (cmd === 'apply') openApply(item)
    else if (cmd === 'preview') router.push(`/preview-template/${item.id}`)
    else if (cmd === 'edit') openEdit(item)
    else if (cmd === 'copy') void copyTemplate(item)
    else if (cmd === 'togglePublic') void togglePublic(item)
    else if (cmd === 'delete') void deleteTemplate(item)
  }

  return {
    openCreate,
    openEdit,
    copyTemplate,
    togglePublic,
    deleteTemplate,
    handleCommand,
  }
}
