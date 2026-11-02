import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { Router } from 'vue-router'
import { applyTemplate, type DashboardTemplate } from '@/api/dashboard-template'
import type { TemplateTranslate } from './useTemplateActions'

export interface ApplyTemplateInput {
  name: string
  description: string
  isPublic: boolean
}

export interface TemplateApplyDeps {
  router: Router
  t: TemplateTranslate
}

/**
 * 🔑「应用模板创建看板」状态与提交逻辑。
 *
 * 从 dashboard-templates/index.vue 抽出：
 *   - 打开对话框时记录目标模板
 *   - 校验名称、调用 applyTemplate、成功后跳转编辑器
 */
export function useTemplateApply(deps: TemplateApplyDeps) {
  const { router, t } = deps

  const applyVisible = ref(false)
  const applying = ref(false)
  const applyTarget = ref<DashboardTemplate | null>(null)

  function openApply(item: DashboardTemplate) {
    applyTarget.value = item
    applyVisible.value = true
  }

  async function confirmApply(input: ApplyTemplateInput) {
    if (!applyTarget.value) return
    const name = input.name.trim()
    if (!name) {
      ElMessage.warning(t('dashboard.nameRequired'))
      return
    }
    applying.value = true
    try {
      const res = await applyTemplate(applyTarget.value.id, {
        name,
        description: input.description.trim() || undefined,
        isPublic: input.isPublic,
      })
      ElMessage.success(t('dashboard.applySuccess'))
      applyVisible.value = false
      router.push(`/bi-editor/${res.data.id}`)
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      applying.value = false
    }
  }

  return { applyVisible, applying, applyTarget, openApply, confirmApply }
}
