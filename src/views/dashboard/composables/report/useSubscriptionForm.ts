import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import i18n from '@/i18n'
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
    { label: i18n.global.t('dashboard.reportCronHourly'), value: '0 * * * *' },
    { label: i18n.global.t('dashboard.reportCronDaily8'), value: '0 8 * * *' },
    { label: i18n.global.t('dashboard.reportCronDaily9'), value: '0 9 * * *' },
    { label: i18n.global.t('dashboard.reportCronWeeklyMon9'), value: '0 9 * * 1' },
    { label: i18n.global.t('dashboard.reportCronMonthly1'), value: '0 9 1 * *' },
  ]

  /** 机器人/回调地址校验：仅对 webhook / 企业微信 / 钉钉渠道生效 */
  function validateWebhookUrl(): string | null {
    if (!isRobotChannel(form.channel)) return null
    const url = form.webhookUrl.trim()
    if (!url) {
      const requiredMessage =
        form.channel === 'wecom'
          ? i18n.global.t('dashboard.reportWecomRequired')
          : form.channel === 'dingtalk'
            ? i18n.global.t('dashboard.reportDingtalkRequired')
            : i18n.global.t('dashboard.reportWebhookRequired')
      return requiredMessage
    }
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return i18n.global.t('dashboard.reportUrlProtocol')
      }
    } catch {
      return i18n.global.t('dashboard.reportUrlInvalid')
    }
    return null
  }

  /** 邮件渠道必须至少有一个合法收件邮箱 */
  function validateEmailRecipients(): string | null {
    if (form.channel !== 'email') return null
    const { valid, invalid } = parseRecipientEmails(form.recipients)
    if (valid.length === 0) return i18n.global.t('dashboard.reportEmailRequired')
    if (invalid.length > 0)
      return i18n.global.t('dashboard.reportEmailInvalid', {
        list: invalid.slice(0, 3).join(', '),
      })
    return null
  }

  const formRules: FormRules = {
    name: [
      { required: true, message: i18n.global.t('dashboard.reportNameRequired'), trigger: 'blur' },
    ],
    cron: [
      { required: true, message: i18n.global.t('dashboard.reportCronRequired'), trigger: 'change' },
    ],
    channel: [
      {
        required: true,
        message: i18n.global.t('dashboard.reportChannelRequired'),
        trigger: 'change',
      },
    ],
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
        ElMessage.success(i18n.global.t('dashboard.reportUpdated'))
      } else {
        await createReportSubscription({ ...payload, dashboardId })
        ElMessage.success(i18n.global.t('dashboard.reportCreated'))
      }
      await deps.onSaved()
      return true
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : i18n.global.t('dashboard.reportSaveFailed'))
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
