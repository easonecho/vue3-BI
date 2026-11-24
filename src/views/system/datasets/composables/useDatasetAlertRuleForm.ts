/**
 * 告警规则表单逻辑
 *
 * 负责表单初始化、校验与新增/更新，依赖注入 datasetId 便于单测。
 */
import { computed, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import i18n from '@/i18n'
import {
  createAlertRule,
  updateAlertRule,
  type AlertAggregate,
  type AlertOperator,
  type AlertRule,
} from '@/api/alert'

export interface DatasetAlertRuleFormDeps {
  getDatasetId: () => number | null
}

export const DEFAULT_ALERT_CRON = '0 * * * *'

export interface DatasetAlertRuleFormState {
  name: string
  field: string
  aggregate: AlertAggregate
  operator: AlertOperator
  threshold: number
  cron: string
  webhookUrl: string
  enabled: boolean
}

export function useDatasetAlertRuleForm(deps: DatasetAlertRuleFormDeps) {
  const formRef = ref<FormInstance>()
  const editingId = ref<number | null>(null)
  const saving = ref(false)

  const form = reactive<DatasetAlertRuleFormState>({
    name: '',
    field: '',
    aggregate: 'count',
    operator: 'gt',
    threshold: 0,
    cron: DEFAULT_ALERT_CRON,
    webhookUrl: '',
    enabled: true,
  })

  const formRules = computed<FormRules>(() => ({
    name: [
      {
        required: true,
        message: i18n.global.t('datasetPage.alertForm.nameRequired'),
        trigger: 'blur',
      },
    ],
    aggregate: [
      {
        required: true,
        message: i18n.global.t('datasetPage.alertForm.aggregateRequired'),
        trigger: 'change',
      },
    ],
    threshold: [
      {
        required: true,
        message: i18n.global.t('datasetPage.alertForm.thresholdRequired'),
        trigger: 'blur',
      },
    ],
    cron: [
      {
        required: true,
        message: i18n.global.t('datasetPage.alertForm.cronRequired'),
        trigger: 'change',
      },
    ],
  }))

  function resetForm() {
    form.name = ''
    form.field = ''
    form.aggregate = 'count'
    form.operator = 'gt'
    form.threshold = 0
    form.cron = DEFAULT_ALERT_CRON
    form.webhookUrl = ''
    form.enabled = true
  }

  /** 打开表单：row 为空表示新增 */
  function initForm(row: AlertRule | null) {
    editingId.value = row?.id ?? null
    if (!row) {
      resetForm()
      return
    }
    form.name = row.name
    form.field = row.field ?? ''
    form.aggregate = row.aggregate
    form.operator = row.operator
    form.threshold = row.threshold
    form.cron = row.cron
    form.webhookUrl = row.webhookUrl ?? ''
    form.enabled = row.enabled
  }

  /** 保存成功返回 true，由调用方关闭弹窗并通知刷新 */
  async function saveForm(): Promise<boolean> {
    const datasetId = deps.getDatasetId()
    if (!formRef.value || datasetId === null || datasetId === undefined) return false
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return false
    if (form.aggregate !== 'count' && !form.field) {
      ElMessage.warning(i18n.global.t('datasetPage.alertForm.fieldRequired'))
      return false
    }
    saving.value = true
    try {
      const payload = {
        name: form.name.trim(),
        field: form.field || null,
        aggregate: form.aggregate,
        operator: form.operator,
        threshold: form.threshold,
        cron: form.cron,
        webhookUrl: form.webhookUrl.trim() || null,
        enabled: form.enabled,
      }
      if (editingId.value) {
        await updateAlertRule(editingId.value, payload)
        ElMessage.success(i18n.global.t('datasetPage.alertForm.updated'))
      } else {
        await createAlertRule({ ...payload, datasetId })
        ElMessage.success(i18n.global.t('datasetPage.alertForm.created'))
      }
      return true
    } catch (e) {
      ElMessage.error(
        e instanceof Error ? e.message : i18n.global.t('datasetPage.alertForm.saveFailed'),
      )
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
    formRules,
    resetForm,
    initForm,
    saveForm,
  }
}
