import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  createReportSubscription,
  updateReportSubscription,
  type ReportChannel,
  type ReportSubscription,
} from '@/api/report'
import { isRobotChannel, showRecipients } from '../../utils/report-channel'
import { parseRecipientEmails } from '../../utils/report-utils'

export interface SubscriptionFormDeps {
  getDashboardId: () => number | null
  onSaved: () => void | Promise<void>
}

/**
 * 🔑 报表订阅新增/编辑表单。
 *
 * 从 ReportSubscriptionDialog.vue 抽出：表单模型、校验规则、cron 选项与保存逻辑。
 * 渠道变化时隐藏字段会被清空，避免站内/邮件订阅残留机器人地址或密钥。
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
    webhookSecret: '',
    enabled: true,
  })

  const cronOptions = [
    { label: '每小时整点', value: '0 * * * *' },
    { label: '每天 08:00', value: '0 8 * * *' },
    { label: '每天 09:00', value: '0 9 * * *' },
    { label: '每周一 09:00', value: '0 9 * * 1' },
    { label: '每月 1 日 09:00', value: '0 9 1 * *' },
  ]

  /** 机器人/回调地址校验：仅对 webhook / 企业微信 / 钉钉渠道生效 */
  function validateWebhookUrl(): string | null {
    if (!isRobotChannel(form.channel)) return null
    const url = form.webhookUrl.trim()
    if (!url) {
      const requiredMessage =
        form.channel === 'wecom'
          ? '请填写企业微信机器人地址'
          : form.channel === 'dingtalk'
            ? '请填写钉钉机器人地址'
            : '请填写 Webhook 回调地址'
      return requiredMessage
    }
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '地址仅支持 http/https'
      }
    } catch {
      return '地址格式不正确，请填写完整的 URL'
    }
    return null
  }

  /** 邮件渠道必须至少有一个合法收件邮箱 */
  function validateEmailRecipients(): string | null {
    if (form.channel !== 'email') return null
    const { valid, invalid } = parseRecipientEmails(form.recipients)
    if (valid.length === 0) return '请填写至少一个收件邮箱'
    if (invalid.length > 0) return `收件邮箱格式不正确: ${invalid.slice(0, 3).join(', ')}`
    return null
  }

  const formRules: FormRules = {
    name: [{ required: true, message: '请输入订阅名称', trigger: 'blur' }],
    cron: [{ required: true, message: '请选择或输入 cron 表达式', trigger: 'change' }],
    channel: [{ required: true, message: '请选择投递渠道', trigger: 'change' }],
    webhookUrl: [
      {
        validator: (_rule, _value, callback) => {
          const message = validateWebhookUrl()
          if (message) callback(new Error(message))
          else callback()
        },
        trigger: 'blur',
      },
    ],
    recipients: [
      {
        validator: (_rule, _value, callback) => {
          const message = validateEmailRecipients()
          if (message) callback(new Error(message))
          else callback()
        },
        trigger: 'blur',
      },
    ],
  }

  function resetForm() {
    form.name = ''
    form.cron = '0 9 * * *'
    form.channel = 'inbox'
    form.recipients = ''
    form.webhookUrl = ''
    form.webhookSecret = ''
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
    form.webhookSecret = row.webhookSecret ?? ''
    form.enabled = row.enabled
  }

  /** 切换渠道时清理不再展示的字段，避免提交残留配置 */
  function handleChannelChange() {
    if (!isRobotChannel(form.channel)) {
      form.webhookUrl = ''
    }
    if (form.channel !== 'dingtalk') {
      form.webhookSecret = ''
    }
    if (!showRecipients(form.channel)) {
      form.recipients = ''
    }
    formRef.value?.clearValidate?.(['webhookUrl', 'recipients', 'webhookSecret'])
  }

  /** 保存成功返回 true，由对话框负责关闭 */
  async function saveForm(): Promise<boolean> {
    const dashboardId = deps.getDashboardId()
    if (!formRef.value || !dashboardId) return false

    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return false

    // 隐藏字段不会参与 el-form 校验，这里按渠道补充校验
    const webhookMessage = validateWebhookUrl()
    if (webhookMessage) {
      ElMessage.warning(webhookMessage)
      return false
    }
    const emailMessage = validateEmailRecipients()
    if (emailMessage) {
      ElMessage.warning(emailMessage)
      return false
    }

    saving.value = true
    try {
      const payload = {
        name: form.name.trim(),
        cron: form.cron.trim(),
        channel: form.channel,
        recipients: form.recipients.trim() || null,
        webhookUrl: isRobotChannel(form.channel) ? form.webhookUrl.trim() || null : null,
        webhookSecret: form.channel === 'dingtalk' ? form.webhookSecret.trim() || null : null,
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
    handleChannelChange,
    saveForm,
  }
}
