import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  createReportSubscription,
  updateReportSubscription,
  type ReportChannel,
  type ReportSubscription,
} from '@/api/report'

export interface SubscriptionFormDeps {
  getDashboardId: () => number | null
  onSaved: () => void | Promise<void>
}

/**
 * 🔑 报表订阅新增/编辑表单。
 *
 * 从 ReportSubscriptionDialog.vue 抽出：表单模型、校验规则、cron 选项与保存逻辑。
 */
export function useSubscriptionForm(deps: SubscriptionFormDeps) {
  const formRef = ref<FormInstance>()
  const editingId = ref<number | null>(null)
  const saving = ref(false)

  const form = reactive({
    name: '',
    cron: '0 9 * * *',
    channel: 'inbox' as ReportChannel,
    recipients: '',
    webhookUrl: '',
    enabled: true,
  })

  const cronOptions = [
    { label: '每小时整点', value: '0 * * * *' },
    { label: '每天 08:00', value: '0 8 * * *' },
    { label: '每天 09:00', value: '0 9 * * *' },
    { label: '每周一 09:00', value: '0 9 * * 1' },
    { label: '每月 1 日 09:00', value: '0 9 1 * *' },
  ]

  const formRules: FormRules = {
    name: [{ required: true, message: '请输入订阅名称', trigger: 'blur' }],
    cron: [{ required: true, message: '请选择或输入 cron 表达式', trigger: 'change' }],
    channel: [{ required: true, message: '请选择投递渠道', trigger: 'change' }],
    webhookUrl: [{ required: true, message: '请填写 Webhook 回调地址', trigger: 'blur' }],
  }

  function resetForm() {
    form.name = ''
    form.cron = '0 9 * * *'
    form.channel = 'inbox'
    form.recipients = ''
    form.webhookUrl = ''
    form.enabled = true
  }

  /** 打开表单前初始化：传 null 表示新增，否则回填订阅 */
  function initForm(row: ReportSubscription | null) {
    if (!row) {
      editingId.value = null
      resetForm()
      return
    }
    editingId.value = row.id
    form.name = row.name
    form.cron = row.cron
    form.channel = row.channel
    form.recipients = row.recipients ?? ''
    form.webhookUrl = row.webhookUrl ?? ''
    form.enabled = row.enabled
  }

  /** 保存成功返回 true，由对话框负责关闭 */
  async function saveForm(): Promise<boolean> {
    const dashboardId = deps.getDashboardId()
    if (!formRef.value || !dashboardId) return false

    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return false
    if (form.channel === 'webhook' && !form.webhookUrl.trim()) {
      ElMessage.warning('请填写 Webhook 回调地址')
      return false
    }

    saving.value = true
    try {
      const payload = {
        name: form.name.trim(),
        cron: form.cron.trim(),
        channel: form.channel,
        recipients: form.recipients.trim() || null,
        webhookUrl: form.channel === 'webhook' ? form.webhookUrl.trim() || null : null,
        enabled: form.enabled,
      }
      if (editingId.value) {
        await updateReportSubscription(editingId.value, payload)
        ElMessage.success('订阅已更新')
      } else {
        await createReportSubscription({ ...payload, dashboardId })
        ElMessage.success('订阅已创建')
      }
      await deps.onSaved()
      return true
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '保存失败')
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    formRef,
    editingId,
    saving,
    form,
    cronOptions,
    formRules,
    resetForm,
    initForm,
    saveForm,
  }
}
