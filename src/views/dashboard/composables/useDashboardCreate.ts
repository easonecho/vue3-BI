/**
 * 新建看板对话框逻辑
 *
 * 负责「选择模板 → 填写信息 → 创建」流程、用户模板库加载与创建后的跳转，
 * 通过依赖注入解耦 router/i18n，便于单测。
 */
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { Router } from 'vue-router'
import { createDashboard, moveDashboardToGroup } from '@/api/dashboard'
import { applyTemplate, getDashboardTemplateList } from '@/api/dashboard-template'
import type { DashboardTemplate } from '@/api/types'

export interface DashboardCreateFormState {
  name: string
  description: string
  isPublic: boolean
  groupId: number | null | undefined
}

export interface DashboardCreateDeps {
  router: Pick<Router, 'push'>
  t: (key: string) => string
  /** 创建成功后关闭对话框 */
  close: () => void
}

export function useDashboardCreate(deps: DashboardCreateDeps) {
  const { router, t, close } = deps

  const creating = ref(false)
  const createForm = reactive<DashboardCreateFormState>({
    name: '',
    description: '',
    isPublic: false,
    groupId: null,
  })
  /** 模板选择步骤：1=选模板，2=填信息 */
  const createStep = ref<1 | 2>(1)
  const selectedUserTplId = ref<number | null>(null)
  const userTemplates = ref<DashboardTemplate[]>([])
  const userTemplatesLoading = ref(false)

  /** 打开对话框时重置表单并加载用户模板 */
  function onOpen() {
    createStep.value = 1
    selectedUserTplId.value = null
    createForm.name = ''
    createForm.description = ''
    createForm.isPublic = false
    createForm.groupId = null
    loadUserTemplatesForCreate()
  }

  /** 加载用户模板库（新建对话框 Tab 用） */
  async function loadUserTemplatesForCreate() {
    userTemplatesLoading.value = true
    try {
      const res = await getDashboardTemplateList()
      userTemplates.value = res.data
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      userTemplatesLoading.value = false
    }
  }

  function selectUserTemplate(id: number) {
    selectedUserTplId.value = id
  }

  function goToTemplateManage() {
    router.push('/dashboard-templates')
  }

  /** 步骤 1 → 2：预填看板名称（用模板名作为默认值） */
  function goToCreateStep2() {
    if (selectedUserTplId.value !== null) {
      const tpl = userTemplates.value.find((x) => x.id === selectedUserTplId.value)
      if (tpl && !createForm.name) {
        createForm.name = `${tpl.name}_${t('dashboard.title')}`
      }
    }
    createStep.value = 2
  }

  async function confirmCreate() {
    const name = createForm.name.trim()
    if (!name) {
      ElMessage.warning(t('dashboard.nameRequired'))
      return
    }
    creating.value = true
    try {
      if (selectedUserTplId.value !== null) {
        // 🔑 选了模板：调用 applyTemplate API，由后端复制 layout
        const res = await applyTemplate(selectedUserTplId.value, {
          name,
          description: createForm.description?.trim() || undefined,
          isPublic: createForm.isPublic,
        })
        // 如果用户选了分组，则再更新一次 groupId
        if (createForm.groupId !== null && createForm.groupId !== undefined) {
          try {
            await moveDashboardToGroup(res.data.id, createForm.groupId)
          } catch {
            // 分组归属更新失败不阻塞创建流程
          }
        }
        ElMessage.success(t('dashboard.createSuccess'))
        close()
        router.push(`/bi-editor/${res.data.id}`)
      } else {
        // 🔑 未选模板：创建空白看板
        const res = await createDashboard({
          name,
          description: createForm.description?.trim() || undefined,
          isPublic: createForm.isPublic,
          groupId: createForm.groupId ?? undefined,
        })
        ElMessage.success(t('dashboard.createSuccess'))
        close()
        router.push(`/bi-editor/${res.data.id}`)
      }
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      creating.value = false
    }
  }

  return {
    creating,
    createForm,
    createStep,
    selectedUserTplId,
    userTemplates,
    userTemplatesLoading,
    onOpen,
    loadUserTemplatesForCreate,
    selectUserTemplate,
    goToTemplateManage,
    goToCreateStep2,
    confirmCreate,
  }
}
